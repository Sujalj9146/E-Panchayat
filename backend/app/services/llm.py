"""Gemini client.

The key lives here, server-side, and nowhere else. The old frontend gated its
LLM calls on a VITE_ prefixed variable, which meant the feature only worked if
the key was compiled into the browser bundle — so the secure configuration and
the working configuration were mutually exclusive. The browser now asks the
server whether AI is available; it never holds a key.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
import time
from typing import Any

import httpx

from app.core.config import settings

log = logging.getLogger(__name__)

BASE = "https://generativelanguage.googleapis.com/v1beta"

# Worth trying again: the model is there, the key is fine, the service is busy.
# A free-tier flash model answers 503 "currently experiencing high demand" often
# enough that a single attempt is a coin toss at a busy hour — and the failure
# is invisible in the UI, because the assistant degrades politely to records
# only. Retrying is the difference between a demo that works and one that
# quietly stops using its model halfway through.
#
# 404 is deliberately absent: a retired model name never recovers, and retrying
# it just makes the wrong answer slower.
TRANSIENT_STATUSES = frozenset({429, 500, 502, 503, 504})

# Two extra attempts, ~0.6s then ~1.8s. Long enough to clear a spike, short
# enough that a person waiting on an answer does not give up first.
RETRY_DELAYS = (0.6, 1.8)

# Requested explicitly rather than taking the model's default, so a model
# change cannot silently alter the vector width and invalidate every stored
# embedding against the ones written before it.
EMBED_DIMENSIONS = 768


def _api_error(what: str, resp: "httpx.Response") -> str:
    """Include what the API actually said.

    A bare "returned status 404" sends you looking at your key when the real
    problem is a retired model name. Google's body says which it is.
    """
    detail = ""
    try:
        body = resp.json()
        detail = body.get("error", {}).get("message") or str(body)[:300]
    except Exception:
        detail = (resp.text or "")[:300]
    hint = ""
    if resp.status_code == 404:
        hint = (
            " A 404 here usually means the configured model name no longer "
            "exists — check GEMINI_MODEL and GEMINI_EMBED_MODEL against "
            "https://ai.google.dev/gemini-api/docs/models"
        )
    elif resp.status_code in (401, 403):
        hint = " Check GEMINI_API_KEY."
    return f"{what} returned status {resp.status_code}. {detail}{hint}"


def _auth_headers() -> dict[str, str]:
    """Authenticate with the documented header rather than a query parameter.

    Google's REST documentation uses `x-goog-api-key`. The older `?key=` form
    still works for legacy `AIza...` keys, but AI Studio now issues keys
    prefixed `AQ.` — a different credential type — and those are reported to
    return 401 through the query-parameter path. The header works for both, so
    there is no reason to keep the older form.

    It also keeps the key out of the request URL, which matters because URLs
    end up in proxy logs and error traces in a way that headers do not.
    """
    return {"x-goog-api-key": settings.GEMINI_API_KEY}


class LLMUnavailable(RuntimeError):
    """Raised when no key is configured or the upstream call fails."""


# Discovered fallback models, cached per process: (fetched_at, [names]).
_fallback_cache: tuple[float, list[str]] | None = None


async def _fallback_models(client: httpx.AsyncClient) -> list[str]:
    """Other Gemini Flash models this key can use, newest first.

    Free-tier models shed load with 503 "high demand" for minutes at a time,
    and which one is busy changes from hour to hour. Rather than pin a second
    name that will itself be retired, ask the API which generateContent models
    exist and keep the plain text Flash ones. GEMINI_FALLBACK_MODELS overrides
    the discovery with a fixed, comma-separated list.
    """
    global _fallback_cache
    if settings.GEMINI_FALLBACK_MODELS.strip():
        return [m.strip() for m in settings.GEMINI_FALLBACK_MODELS.split(",") if m.strip()]
    now = time.monotonic()
    if _fallback_cache and now - _fallback_cache[0] < 3600:
        return _fallback_cache[1]
    names: list[str] = []
    try:
        resp = await client.get(f"{BASE}/models", headers=_auth_headers(), params={"pageSize": 200})
        if resp.status_code == 200:
            for m in resp.json().get("models", []):
                name = m.get("name", "").removeprefix("models/")
                if "generateContent" not in m.get("supportedGenerationMethods", []):
                    continue
                if "flash" not in name or any(
                    bad in name for bad in ("image", "tts", "audio", "live", "embedding", "exp", "think")
                ):
                    continue
                names.append(name)
    except httpx.HTTPError:
        pass

    def version(n: str) -> tuple:
        nums = re.findall(r"\d+(?:\.\d+)?", n)
        # Prefer numbered, non-preview, non-lite models; newest version first.
        return ("preview" in n, "lite" in n, -float(nums[0]) if nums else 0.0, n)

    names = sorted(set(names) - {settings.GEMINI_MODEL}, key=version)[:3]
    _fallback_cache = (now, names)
    return names


async def generate(
    prompt: str,
    system: str | None = None,
    *,
    json_schema: dict[str, Any] | None = None,
    temperature: float = 0.2,
    timeout: float = 25.0,
) -> str:
    """Generate text, falling back across models when one is busy.

    Each model gets one quick retry; a model that is overloaded, unreachable
    or retired (404) hands over to the next instead of making the person wait
    through every retry. Total wait stays well under a minute.
    """
    if not settings.ai_enabled:
        raise LLMUnavailable("GEMINI_API_KEY is not configured on the server.")

    body: dict[str, Any] = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": temperature},
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}
    if json_schema:
        body["generationConfig"]["responseMimeType"] = "application/json"
        body["generationConfig"]["responseSchema"] = json_schema

    last_error = "Could not reach the language model."
    started = time.monotonic()
    async with httpx.AsyncClient(timeout=timeout) as client:
        models = [settings.GEMINI_MODEL]
        tried_fallbacks = False
        i = 0
        while i < len(models):
            model = models[i]
            i += 1
            url = f"{BASE}/models/{model}:generateContent"
            resp: httpx.Response | None = None
            for attempt in range(2):
                if time.monotonic() - started > 50:
                    raise LLMUnavailable(last_error)
                try:
                    resp = await client.post(url, headers=_auth_headers(), json=body)
                except httpx.HTTPError as exc:
                    log.warning("Gemini %s request failed: %s", model, exc)
                    last_error = "Could not reach the language model."
                    resp = None
                    # A dropped connection is worth one more try; a timeout
                    # will just repeat, so hand over to the next model.
                    if attempt == 0 and not isinstance(exc, httpx.TimeoutException):
                        await asyncio.sleep(RETRY_DELAYS[0])
                        continue
                    break
                if resp.status_code in TRANSIENT_STATUSES and attempt == 0:
                    await asyncio.sleep(RETRY_DELAYS[0])
                    continue
                break

            if resp is not None and resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates") or []
                parts = candidates[0].get("content", {}).get("parts", []) if candidates else []
                text = "".join(p.get("text", "") for p in parts).strip()
                if text:
                    if model != settings.GEMINI_MODEL:
                        log.info("Answered by fallback model %s", model)
                    return text
                last_error = "The language model returned an empty answer."
            elif resp is not None:
                log.warning("Gemini %s returned %s: %s", model, resp.status_code, resp.text[:300])
                last_error = _api_error("The language model", resp)
                if resp.status_code in (400, 401, 403):
                    raise LLMUnavailable(last_error)  # a bad key or request: no model will help

            if not tried_fallbacks:
                tried_fallbacks = True
                models += await _fallback_models(client)

    raise LLMUnavailable(last_error)


async def generate_json(
    prompt: str, schema: dict[str, Any], system: str | None = None
) -> Any:
    raw = await generate(prompt, system, json_schema=schema, temperature=0.1)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        log.warning("Gemini returned unparseable JSON: %s", raw[:500])
        raise LLMUnavailable("The language model returned malformed data.") from exc


async def embed(texts: list[str], timeout: float = 60.0) -> list[list[float]]:
    """Embed a batch of texts for the retrieval index.

    Two calls, not one, because Google retires embedding endpoints faster than
    it retires generation ones. `batchEmbedContents` is tried first — one round
    trip for the whole batch — and if the model does not offer it, each text is
    embedded individually through `embedContent`. Slower, but it keeps working
    through an API change instead of failing the whole index build.

    That fallback exists because `text-embedding-004` was the default here until
    it started returning 404: it has been retired in favour of
    `gemini-embedding-001` and `gemini-embedding-2`.
    """
    if not settings.ai_enabled:
        raise LLMUnavailable("GEMINI_API_KEY is not configured on the server.")
    if not texts:
        return []

    model = f"models/{settings.GEMINI_EMBED_MODEL}"

    # 768 rather than the 3072 default: cosine similarity over a hundred chunks
    # is unaffected by the extra dimensions, and each vector is stored as JSON,
    # so four times the floats is four times the database row for nothing.
    config = {"outputDimensionality": EMBED_DIMENSIONS}

    async with httpx.AsyncClient(timeout=timeout) as client:
        batch_body = {
            "requests": [
                {"model": model, "content": {"parts": [{"text": t}]}, **config}
                for t in texts
            ]
        }
        resp = await client.post(
            f"{BASE}/{model}:batchEmbedContents", headers=_auth_headers(), json=batch_body
        )

        if resp.status_code == 200:
            values = [e["values"] for e in resp.json().get("embeddings", [])]
            if len(values) == len(texts):
                return values
            raise LLMUnavailable(
                f"Asked for {len(texts)} embeddings and got {len(values)} back."
            )

        # 404 means this model has no batch endpoint; anything else is a real
        # failure worth reporting rather than retrying a slower way.
        if resp.status_code != 404:
            raise LLMUnavailable(_api_error("Embedding request", resp))

        out: list[list[float]] = []
        for text in texts:
            single = await client.post(
                f"{BASE}/{model}:embedContent",
                headers=_auth_headers(),
                json={"model": model, "content": {"parts": [{"text": text}]}, **config},
            )
            if single.status_code != 200:
                raise LLMUnavailable(_api_error("Embedding request", single))
            out.append(single.json()["embedding"]["values"])
        return out
