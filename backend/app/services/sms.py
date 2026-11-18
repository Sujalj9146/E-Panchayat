"""SMS feedback to complainants.

A resident who files a complaint is told by SMS at each step that matters to
them:

    registered  — the complaint was received and routed to a department
    accepted    — an officer has taken it up (status → In Progress)
    resolved    — the officer has closed it (status → Resolved)
    reopened    — a closed or accepted complaint went back to Pending

Delivery happens in a FastAPI background task, after the response has been
sent, so a slow or unreachable gateway never delays filing a complaint or an
officer's save. Every attempt — sent, failed, or skipped for want of a number —
is recorded in `sms_notifications`, so "was the resident told?" is answered
from the record.

Providers are chosen by `SMS_PROVIDER`:

    console   logs the message and records it as 'logged'. The default.
    twilio    Twilio Programmable Messaging (any country).
    fast2sms  Fast2SMS quick route (Indian numbers only).

Nothing in this module raises into a request: a failure to notify must never
turn a successful save into an error.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from uuid import uuid4

import httpx

from app.core.config import settings

log = logging.getLogger(__name__)

EVENTS = ("registered", "accepted", "resolved", "reopened")


# ─────────────────────────────────────────────────────────────────────────────
# Phone numbers
# ─────────────────────────────────────────────────────────────────────────────

_INDIAN_MOBILE = re.compile(r"^[6-9]\d{9}$")


def normalise_phone(value: str | None) -> str | None:
    """A phone number in E.164 form (+919876543210), or None if it is not one.

    Accepts what people actually type: spaces, dashes, brackets, a leading 0
    (trunk prefix), 91 or +91. A bare ten-digit number must look like an Indian
    mobile (starts 6-9), because landlines cannot receive SMS. A number given
    with an explicit '+' is taken as international and only length-checked.
    """
    if not value:
        return None
    raw = value.strip()
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return None

    country = settings.SMS_DEFAULT_COUNTRY_CODE
    if raw.startswith("+"):
        if digits.startswith(country) and len(digits) == len(country) + 10:
            return f"+{digits}" if _INDIAN_MOBILE.match(digits[len(country):]) else None
        return f"+{digits}" if 8 <= len(digits) <= 15 else None

    if digits.startswith("00"):
        return normalise_phone("+" + digits[2:])
    if len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    elif len(digits) == len(country) + 10 and digits.startswith(country):
        digits = digits[len(country):]

    if _INDIAN_MOBILE.match(digits):
        return f"+{country}{digits}"
    return None


def is_valid_phone(value: str | None) -> bool:
    return normalise_phone(value) is not None


def mask_phone(phone: str | None) -> str | None:
    if not phone:
        return None
    digits = re.sub(r"\D", "", phone)
    return f"******{digits[-4:]}" if len(digits) >= 4 else "******"


# ─────────────────────────────────────────────────────────────────────────────
# Messages
# ─────────────────────────────────────────────────────────────────────────────

def _clip(text: str | None, limit: int) -> str:
    text = " ".join((text or "").split())
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def build_message(
    event: str,
    *,
    grievance_id: str,
    title: str,
    department: str,
    village: str | None,
    note: str | None = None,
) -> str:
    """The SMS text for one event. Plain English, kept short: every 160
    characters is another billed segment, and a Unicode (Marathi) body halves
    that to 70."""
    gp = f"{village} Gram Panchayat" if village else "the Gram Panchayat"
    ref = f"Ref {grievance_id}"
    subject = _clip(title, 40)

    if event == "registered":
        return (
            f"E-Panchayat: Your complaint \"{subject}\" is registered with {gp} "
            f"and sent to {department}. {ref}. You will get an SMS when an officer acts on it."
        )
    if event == "accepted":
        return (
            f"E-Panchayat: Your complaint \"{subject}\" has been accepted by the "
            f"Panchayat officer and work has started. {ref}."
        )
    if event == "resolved":
        remark = f" Officer's note: {_clip(note, 80)}" if note and note.strip() else ""
        return (
            f"E-Panchayat: Your complaint \"{subject}\" has been resolved.{remark} "
            f"{ref}. Thank you for reporting it."
        )
    if event == "reopened":
        return (
            f"E-Panchayat: Your complaint \"{subject}\" has been reopened and is "
            f"pending review. {ref}."
        )
    raise ValueError(f"Unknown SMS event: {event}")


def event_for_status(previous: str | None, new: str) -> str | None:
    """Which SMS, if any, a status change deserves."""
    if new == previous:
        return None
    if new == "In Progress":
        return "accepted"
    if new == "Resolved":
        return "resolved"
    if new == "Pending" and previous in ("In Progress", "Resolved"):
        return "reopened"
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Providers
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class SmsResult:
    status: str  # sent | logged | failed
    provider: str
    message_id: str | None = None
    error: str | None = None


def _send_console(to: str, body: str) -> SmsResult:
    log.info("SMS (console provider, not sent) to %s: %s", mask_phone(to), body)
    return SmsResult(status="logged", provider="console")


def _send_twilio(to: str, body: str) -> SmsResult:
    sid, sender = settings.TWILIO_ACCOUNT_SID, settings.TWILIO_FROM_NUMBER
    # An API key (SK…) and its secret, or the account SID and Auth Token.
    if settings.TWILIO_API_KEY_SID and settings.TWILIO_API_KEY_SECRET:
        auth = (settings.TWILIO_API_KEY_SID, settings.TWILIO_API_KEY_SECRET)
    else:
        auth = (sid, settings.TWILIO_AUTH_TOKEN)
    if not (sid and sid.startswith("AC") and all(auth) and sender):
        return SmsResult(
            status="failed", provider="twilio",
            error=(
                "Twilio needs TWILIO_ACCOUNT_SID (starts AC), TWILIO_FROM_NUMBER, and either "
                "TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET."
            ),
        )
    resp = httpx.post(
        f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
        data={"To": to, "From": sender, "Body": body},
        auth=auth,
        timeout=settings.SMS_TIMEOUT_SECONDS,
    )
    if resp.status_code in (200, 201):
        return SmsResult(status="sent", provider="twilio", message_id=resp.json().get("sid"))
    try:
        detail = resp.json().get("message") or resp.text
    except ValueError:
        detail = resp.text
    return SmsResult(status="failed", provider="twilio", error=f"HTTP {resp.status_code}: {_clip(detail, 300)}")


def _send_fast2sms(to: str, body: str) -> SmsResult:
    if not settings.FAST2SMS_API_KEY:
        return SmsResult(
            status="failed", provider="fast2sms",
            error="Fast2SMS is selected but FAST2SMS_API_KEY is empty.",
        )
    digits = re.sub(r"\D", "", to)
    if not (digits.startswith("91") and len(digits) == 12):
        return SmsResult(status="failed", provider="fast2sms",
                         error="Fast2SMS delivers to Indian (+91) numbers only.")
    resp = httpx.post(
        "https://www.fast2sms.com/dev/bulkV2",
        headers={"authorization": settings.FAST2SMS_API_KEY},
        json={"route": "q", "message": body, "language": "english", "flash": 0, "numbers": digits[2:]},
        timeout=settings.SMS_TIMEOUT_SECONDS,
    )
    try:
        payload = resp.json()
    except ValueError:
        payload = {}
    if resp.status_code == 200 and payload.get("return") is True:
        return SmsResult(status="sent", provider="fast2sms", message_id=str(payload.get("request_id") or "") or None)
    detail = payload.get("message") or resp.text
    if isinstance(detail, list):
        detail = "; ".join(map(str, detail))
    return SmsResult(status="failed", provider="fast2sms", error=f"HTTP {resp.status_code}: {_clip(str(detail), 300)}")


_PROVIDERS = {"console": _send_console, "twilio": _send_twilio, "fast2sms": _send_fast2sms}


def send_sms(to: str, body: str) -> SmsResult:
    """Hand one message to the configured gateway. Never raises."""
    provider = (settings.SMS_PROVIDER or "console").strip().lower()
    sender = _PROVIDERS.get(provider)
    if sender is None:
        return SmsResult(status="failed", provider=provider,
                         error=f"Unknown SMS_PROVIDER '{provider}'. Use console, twilio or fast2sms.")
    try:
        return sender(to, body)
    except httpx.HTTPError as exc:
        return SmsResult(status="failed", provider=provider, error=f"Gateway unreachable: {exc.__class__.__name__}")
    except Exception as exc:  # noqa: BLE001 — a notification must never break the caller
        log.exception("SMS provider %s crashed", provider)
        return SmsResult(status="failed", provider=provider, error=f"{exc.__class__.__name__}: {exc}")


# ─────────────────────────────────────────────────────────────────────────────
# Complaint notifications
# ─────────────────────────────────────────────────────────────────────────────

def notify_grievance(grievance_id: str, event: str, note: str | None = None) -> None:
    """Send the SMS for one complaint event and record the outcome.

    Runs as a background task, after the request's own session has closed, so
    it opens its own. Imported lazily to keep this module free of a hard
    dependency on the database layer for the pure helpers above.
    """
    if not settings.GRIEVANCE_SMS_ENABLED:
        return

    from app.db.session import SessionLocal
    from app.models import Grievance, SmsNotification, Village

    try:
        with SessionLocal() as db:
            grievance = db.get(Grievance, grievance_id)
            if grievance is None:
                return
            village = db.get(Village, grievance.village_id) if grievance.village_id else None
            body = build_message(
                event,
                grievance_id=grievance.id,
                title=grievance.title,
                department=grievance.department,
                village=village.name if village else None,
                note=note,
            )
            to = normalise_phone(grievance.phone)
            if to is None:
                result = SmsResult(
                    status="skipped",
                    provider=(settings.SMS_PROVIDER or "console").lower(),
                    error="No valid mobile number on this complaint.",
                )
            else:
                result = send_sms(to, body)

            if result.status == "failed":
                log.warning("SMS for %s (%s) failed: %s", grievance.id, event, result.error)

            db.add(SmsNotification(
                id=f"sms_{uuid4().hex[:12]}",
                grievance_id=grievance.id,
                event=event,
                phone_masked=mask_phone(to or grievance.phone),
                message=body,
                provider=result.provider,
                status=result.status,
                provider_message_id=result.message_id,
                error=result.error,
            ))
            db.commit()
    except Exception:  # noqa: BLE001
        log.exception("Could not record SMS notification for %s (%s)", grievance_id, event)
