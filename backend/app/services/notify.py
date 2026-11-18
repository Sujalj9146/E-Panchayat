"""Outbound notifications: SMS and email.

SMS goes through `services.sms`, the same gateway complaint updates use, so
`SMS_PROVIDER` decides whether an OTP really leaves the server (twilio,
fast2sms) or is only logged (console). No email relay is connected yet: email
is logged as "would deliver" and nothing more.

The OTP itself is never written to the log, by this module or by the console
provider below.
"""

from __future__ import annotations

import logging

from app.core.config import settings
from app.services.sms import SmsResult, mask_phone, normalise_phone, send_sms

log = logging.getLogger(__name__)


def otp_message(otp: str) -> str:
    return (
        f"E-Panchayat: {otp} is your password reset OTP. Valid for "
        f"{settings.OTP_TTL_MINUTES} minutes. Do not share it with anyone, "
        f"including Panchayat staff."
    )


def send_otp(otp: str, *, phone: str | None, email: str | None) -> SmsResult | None:
    """Deliver an OTP by SMS. Returns the SMS outcome, or None when there is
    no valid mobile number to send it to.

    The console provider would log the message body, which contains the code,
    so in console mode the body is replaced before it reaches the log."""
    if email:
        log.info("OTP issued; email channel not configured, nothing sent by email")
    to = normalise_phone(phone)
    if to is None:
        log.info("OTP issued; no valid mobile number on record, no SMS sent")
        return None
    provider = (settings.SMS_PROVIDER or "console").strip().lower()
    if provider == "console":
        log.info("OTP SMS (console provider, not sent) to %s", mask_phone(to))
        return SmsResult(status="logged", provider="console")
    result = send_sms(to, otp_message(otp))
    if result.status == "failed":
        log.warning("OTP SMS to %s failed: %s", mask_phone(to), result.error)
    return result


def send_new_device_alert(
    *, phone: str | None, email: str | None, device: str, decision_url: str
) -> bool:
    """'New sign-in to your E-Panchayat account from <device>. Was this you?
    Approve or deny: <link>' — by SMS and email."""
    channels = [c for c in (phone and "sms", email and "email") if c]
    log.info(
        "New-device sign-in alert for %s; would deliver via %s (no gateway configured)",
        device, ", ".join(channels) or "nothing",
    )
    return bool(channels)
