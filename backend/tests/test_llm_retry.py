"""Retrying the language model when the service is merely busy.

A free-tier flash model answers 503 "currently experiencing high demand" often
enough that one attempt is a coin toss at a busy hour, and the failure is close
to invisible: the assistant degrades politely to records-only and says so in
small text. During a live demo that reads as "the AI stopped working".

The distinction these tests protect is between busy and gone. A 503 is worth
another try; a 404 from a retired model name never recovers, and retrying it
only makes the wrong answer slower.
"""

import asyncio

import httpx
import pytest

from app.core.config import settings
from app.services import llm


class _FakeResponse:
    def __init__(self, status_code: int, payload: dict | None = None):
        self.status_code = status_code
        self._payload = payload or {}
        self.text = str(self._payload)

    def json(self):
        return self._payload


_OK = {"candidates": [{"content": {"parts": [{"text": "an answer"}]}}]}
_BUSY = {"error": {"code": 503, "message": "This model is currently experiencing high demand."}}
_RETIRED = {"error": {"code": 404, "message": "This model is no longer available to new users."}}


@pytest.fixture
def instant_retries(monkeypatch):
    """Keep the retry logic, drop the waiting."""
    async def no_sleep(_seconds):
        return None

    monkeypatch.setattr(llm.asyncio, "sleep", no_sleep)
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key-not-used")


def _client_returning(*responses, models=None):
    """An httpx.AsyncClient stand-in that hands back the given responses in
    order, and records how many calls it saw."""
    calls = {"count": 0}
    queue = list(responses)

    class _Client:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def get(self, *args, **kwargs):
            # The model list used to find fallbacks: none by default.
            return _FakeResponse(200, {"models": models or []})

        async def post(self, *args, **kwargs):
            calls["count"] += 1
            nxt = queue.pop(0) if queue else responses[-1]
            if isinstance(nxt, Exception):
                raise nxt
            return nxt

    return _Client, calls


def test_a_busy_model_is_retried_and_the_answer_still_arrives(monkeypatch, instant_retries):
    client_cls, calls = _client_returning(
        _FakeResponse(503, _BUSY), _FakeResponse(200, _OK)
    )
    monkeypatch.setattr(llm.httpx, "AsyncClient", lambda **kw: client_cls())

    answer = asyncio.run(llm.generate("a question"))

    assert answer == "an answer"
    assert calls["count"] == 2, "the 503 was not retried"


def test_retries_are_bounded(monkeypatch, instant_retries):
    """A service that is down stays down. One retry per model, then give up
    and let the assistant fall back to the records."""
    monkeypatch.setattr(llm, "_fallback_cache", None)
    client_cls, calls = _client_returning(_FakeResponse(503, _BUSY))
    monkeypatch.setattr(llm.httpx, "AsyncClient", lambda **kw: client_cls())

    with pytest.raises(llm.LLMUnavailable):
        asyncio.run(llm.generate("a question"))

    assert calls["count"] == 2


def test_a_busy_model_hands_over_to_a_fallback(monkeypatch, instant_retries):
    """The free tier sheds load per model, so a different Flash model usually
    answers when the configured one is saturated."""
    monkeypatch.setattr(llm, "_fallback_cache", None)
    client_cls, calls = _client_returning(
        _FakeResponse(503, _BUSY), _FakeResponse(503, _BUSY), _FakeResponse(200, _OK),
        models=[{"name": "models/gemini-9.9-flash", "supportedGenerationMethods": ["generateContent"]},
                {"name": "models/gemini-9.9-flash-image", "supportedGenerationMethods": ["generateContent"]}],
    )
    monkeypatch.setattr(llm.httpx, "AsyncClient", lambda **kw: client_cls())

    assert asyncio.run(llm.generate("a question")) == "an answer"
    assert calls["count"] == 3
    assert llm._fallback_cache[1] == ["gemini-9.9-flash"]  # image model excluded


def test_lite_models_are_among_the_fallbacks(monkeypatch, instant_retries):
    monkeypatch.setattr(llm, "_fallback_cache", None)
    names = ["gemini-9.9-flash", "gemini-9.8-flash", "gemini-9.7-flash", "gemini-9.9-flash-lite"]
    client_cls, _ = _client_returning(_FakeResponse(503, _BUSY), models=[
        {"name": f"models/{n}", "supportedGenerationMethods": ["generateContent"]} for n in names])
    monkeypatch.setattr(llm.httpx, "AsyncClient", lambda **kw: client_cls())
    with pytest.raises(llm.LLMUnavailable):
        asyncio.run(llm.generate("q"))
    assert "gemini-9.9-flash-lite" in llm._fallback_cache[1][:2]


def test_a_retired_model_is_not_retried(monkeypatch, instant_retries):
    """404 means the name is gone, not busy. Retrying only makes the wrong
    answer slower, and the error text is what tells you to repin."""
    client_cls, calls = _client_returning(_FakeResponse(404, _RETIRED))
    monkeypatch.setattr(llm.httpx, "AsyncClient", lambda **kw: client_cls())

    with pytest.raises(llm.LLMUnavailable) as raised:
        asyncio.run(llm.generate("a question"))

    assert calls["count"] == 1, "a retired model name was retried"
    assert "GEMINI_MODEL" in str(raised.value), "the error does not say how to fix it"


def test_a_bad_key_is_not_retried(monkeypatch, instant_retries):
    """403 is a configuration error. Retrying it wastes a demo's time."""
    client_cls, calls = _client_returning(
        _FakeResponse(403, {"error": {"code": 403, "message": "API key not valid"}})
    )
    monkeypatch.setattr(llm.httpx, "AsyncClient", lambda **kw: client_cls())

    with pytest.raises(llm.LLMUnavailable) as raised:
        asyncio.run(llm.generate("a question"))

    assert calls["count"] == 1
    assert "GEMINI_API_KEY" in str(raised.value)


def test_a_dropped_connection_is_retried(monkeypatch, instant_retries):
    """A transport failure is as transient as a 503."""
    client_cls, calls = _client_returning(
        httpx.ConnectError("connection reset"), _FakeResponse(200, _OK)
    )
    monkeypatch.setattr(llm.httpx, "AsyncClient", lambda **kw: client_cls())

    assert asyncio.run(llm.generate("a question")) == "an answer"
    assert calls["count"] == 2


def test_the_model_check_reports_a_retired_model_rather_than_hiding_it(
    client, officer, monkeypatch, instant_retries
):
    """The failure this endpoint exists for. /health said aiEnabled: true for
    days while every generation 404'd, because a key was configured and that is
    all it checks."""
    client_cls, _ = _client_returning(_FakeResponse(404, _RETIRED))
    monkeypatch.setattr(llm.httpx, "AsyncClient", lambda **kw: client_cls())

    body = client.get("/api/v1/assistant/model-check", headers=officer).json()
    assert body["ok"] is False
    assert "GEMINI_MODEL" in body["detail"], "the fix is not in the message"


def test_the_model_check_confirms_a_working_model(
    client, officer, monkeypatch, instant_retries
):
    client_cls, _ = _client_returning(_FakeResponse(200, _OK))
    monkeypatch.setattr(llm.httpx, "AsyncClient", lambda **kw: client_cls())

    body = client.get("/api/v1/assistant/model-check", headers=officer).json()
    assert body["ok"] is True
    assert body["model"]


def test_the_model_check_says_so_when_no_key_is_set(client, officer, monkeypatch):
    """Distinguished from a broken model, because the remedies differ."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    body = client.get("/api/v1/assistant/model-check", headers=officer).json()
    assert body["ok"] is False
    assert "GEMINI_API_KEY" in body["detail"]


def test_the_model_check_is_not_public(client):
    """It spends quota and names the configured model."""
    assert client.get("/api/v1/assistant/model-check").status_code == 401


def test_no_key_configured_never_calls_out(monkeypatch):
    """The one case that must not reach the network at all."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")

    def explode(**kw):  # pragma: no cover - reaching this is the failure
        raise AssertionError("called the API with no key configured")

    monkeypatch.setattr(llm.httpx, "AsyncClient", explode)

    with pytest.raises(llm.LLMUnavailable):
        asyncio.run(llm.generate("a question"))
