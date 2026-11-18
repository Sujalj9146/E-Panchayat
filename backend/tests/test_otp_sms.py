"""Password-reset OTPs are delivered by SMS."""

import httpx
import pytest
from sqlalchemy import delete, select

from app.core.config import settings
from app.db.session import SessionLocal
from app.models import AuthAttempt, Citizen, PasswordReset, User
from app.services import notify, sms
from tests.test_password_reset import API, _restore

EMAIL = "anandrao@citizen.panchayat.gov.in"


def _set_phones(register: str | None, signin: str | None) -> tuple[str | None, str | None]:
    """Set the register and sign-in numbers; return what they were."""
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == EMAIL))
        citizen = db.get(Citizen, user.citizen_id)
        before = (citizen.phone, user.phone)
        citizen.phone, user.phone = register, signin
        db.commit()
    return before


@pytest.fixture(autouse=True)
def clean():
    def clear():
        with SessionLocal() as db:
            db.execute(delete(AuthAttempt).where(AuthAttempt.email == EMAIL))
            db.commit()

    clear()
    before = _set_phones("9860112301", None)
    yield
    _set_phones(*before)
    clear()
    _restore(EMAIL)


@pytest.fixture
def twilio(monkeypatch):
    monkeypatch.setattr(settings, "SMS_PROVIDER", "twilio")
    monkeypatch.setattr(settings, "TWILIO_ACCOUNT_SID", "AC_test")
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "token")
    monkeypatch.setattr(settings, "TWILIO_FROM_NUMBER", "+15005550006")
    sent: list[dict] = []

    def fake_post(url, data=None, **_):
        sent.append(data)
        return httpx.Response(201, json={"sid": "SM1"})

    monkeypatch.setattr(sms.httpx, "post", fake_post)
    return sent


def _request(client):
    return client.post(f"{API}/auth/forgot-password", json={"email": EMAIL})


def test_otp_is_sent_by_sms_to_the_register_number(client, twilio):
    r = _request(client)
    assert r.status_code == 200, r.text
    [message] = twilio
    assert message["To"] == "+919860112301"
    assert "password reset OTP" in message["Body"]
    assert r.json()["sentTo"][0] == "SMS to ******2301"


def test_a_real_sms_hides_the_demo_code(client, twilio, monkeypatch):
    monkeypatch.setattr(settings, "OTP_DEMO_MODE", True)
    body = _request(client).json()
    assert body["demoOtp"] is None
    # …and the code in the SMS is the one that works.
    otp = next(w for w in twilio[0]["Body"].split() if w.isdigit() and len(w) == 6)
    ok = client.post(f"{API}/auth/forgot-password/verify",
                     json={"email": EMAIL, "otp": otp, "newPassword": "Fresh@20261"})
    assert ok.status_code == 204, ok.text


def test_falls_back_to_the_sign_in_number(client, twilio):
    _set_phones(None, "+919822033333")
    assert _request(client).status_code == 200
    assert twilio[0]["To"] == "+919822033333"


def test_no_number_means_no_sms_and_says_so(client, twilio):
    _set_phones(None, None)
    r = _request(client)
    assert r.status_code == 200
    assert twilio == []
    assert not any(s.startswith("SMS") for s in r.json()["sentTo"])


def test_a_failed_send_voids_the_code_and_does_not_use_up_the_hour(client, twilio, monkeypatch):
    monkeypatch.setattr(settings, "OTP_DEMO_MODE", False)

    def down(*a, **k):
        raise httpx.ConnectError("down")

    monkeypatch.setattr(sms.httpx, "post", down)
    for _ in range(settings.OTP_MAX_PER_HOUR + 1):
        r = _request(client)
        assert r.status_code == 503
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == EMAIL))
        live = db.scalars(select(PasswordReset).where(
            PasswordReset.user_id == user.id, PasswordReset.used_at.is_(None))).all()
        assert live == []


def test_console_mode_never_logs_the_code(client, caplog, monkeypatch):
    monkeypatch.setattr(settings, "SMS_PROVIDER", "console")
    caplog.set_level("INFO")
    body = _request(client).json()
    assert body["demoOtp"]  # demo mode, nothing really sent
    assert body["demoOtp"] not in caplog.text


def test_message_states_validity():
    assert f"{settings.OTP_TTL_MINUTES} minutes" in notify.otp_message("123456")


def test_in_demo_mode_a_failed_sms_still_shows_the_code(client, twilio, monkeypatch):
    monkeypatch.setattr(settings, "OTP_DEMO_MODE", True)
    monkeypatch.setattr(sms.httpx, "post", lambda *a, **k: httpx.Response(
        400, json={"message": "Trial accounts can only use predefined SMS templates."}))
    r = _request(client)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["demoOtp"]
    assert not any(s.startswith("SMS") for s in body["sentTo"])
