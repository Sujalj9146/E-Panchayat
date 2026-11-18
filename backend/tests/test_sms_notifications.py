"""Phone at sign-in, and SMS feedback on a complaint's registration,
acceptance and resolution."""

import httpx
import pytest
from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.models import SmsNotification, User
from app.services import sms

from tests.conftest import API, PASSWORD


def _login(client, email: str, phone: str | None = None):
    body = {"email": email, "password": PASSWORD}
    if phone is not None:
        body["phone"] = phone
    return client.post(f"{API}/auth/login", json=body)


def _headers(resp) -> dict[str, str]:
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['accessToken']}"}


def _sms_for(grievance_id: str) -> list[SmsNotification]:
    with SessionLocal() as db:
        return list(db.scalars(
            select(SmsNotification)
            .where(SmsNotification.grievance_id == grievance_id)
            .order_by(SmsNotification.created_at)
        ))


# ── Phone numbers ────────────────────────────────────────────────────────────

@pytest.mark.parametrize("typed, expected", [
    ("9876543210", "+919876543210"),
    ("98765 43210", "+919876543210"),
    ("098765-43210", "+919876543210"),
    ("919876543210", "+919876543210"),
    ("+91 98765 43210", "+919876543210"),
    ("0091 9876543210", "+919876543210"),
    ("+1 415 555 0100", "+14155550100"),
])
def test_phone_numbers_are_normalised_to_e164(typed, expected):
    assert sms.normalise_phone(typed) == expected


@pytest.mark.parametrize("typed", ["", "12345", "0201234567", "5876543210", "+91 5876543210", "abc"])
def test_numbers_that_cannot_receive_sms_are_refused(typed):
    assert sms.normalise_phone(typed) is None


def test_masking_keeps_only_the_last_four_digits():
    assert sms.mask_phone("+919876543210") == "******3210"


# ── Sign-in takes the phone number ───────────────────────────────────────────

def test_sign_in_stores_the_phone_number_on_the_account(client):
    headers = _headers(_login(client, "officer@panchayat.gov.in", "98220 11111"))
    me = client.get(f"{API}/auth/me", headers=headers).json()
    assert me["phone"] == "+919822011111"


def test_sign_in_without_a_phone_keeps_the_one_on_record(client):
    _headers(_login(client, "officer@panchayat.gov.in", "9822011111"))
    headers = _headers(_login(client, "officer@panchayat.gov.in"))
    assert client.get(f"{API}/auth/me", headers=headers).json()["phone"] == "+919822011111"


def test_an_invalid_phone_is_rejected_at_sign_in(client):
    resp = _login(client, "officer@panchayat.gov.in", "12345")
    assert resp.status_code == 422
    assert "mobile number" in resp.text


def test_a_wrong_password_does_not_change_the_phone(client):
    _headers(_login(client, "officer@panchayat.gov.in", "9822011111"))
    client.post(f"{API}/auth/login", json={
        "email": "officer@panchayat.gov.in", "password": "wrong-password", "phone": "9000099999",
    })
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == "officer@panchayat.gov.in"))
        assert user.phone == "+919822011111"


def test_the_phone_can_be_changed_after_sign_in(client):
    headers = _headers(_login(client, "officer@panchayat.gov.in"))
    resp = client.put(f"{API}/auth/me/phone", headers=headers, json={"phone": "9822022222"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["phone"] == "+919822022222"
    bad = client.put(f"{API}/auth/me/phone", headers=headers, json={"phone": "1234"})
    assert bad.status_code == 422


# ── The SMS themselves ──────────────────────────────────────────────────────

def test_messages_say_what_happened():
    common = dict(grievance_id="griev_x", title="Street light broken", department="Electrical", village="Loni Kalbhor")
    assert "registered with Loni Kalbhor Gram Panchayat" in sms.build_message("registered", **common)
    assert "accepted" in sms.build_message("accepted", **common)
    resolved = sms.build_message("resolved", note="Bulb replaced on 12 Nov", **common)
    assert "resolved" in resolved and "Bulb replaced on 12 Nov" in resolved
    assert "griev_x" in resolved


@pytest.mark.parametrize("previous, new, event", [
    ("Pending", "In Progress", "accepted"),
    ("Pending", "Resolved", "resolved"),
    ("In Progress", "Resolved", "resolved"),
    ("Resolved", "Pending", "reopened"),
    ("Pending", "Pending", None),
])
def test_which_status_changes_send_an_sms(previous, new, event):
    assert sms.event_for_status(previous, new) == event


def test_full_lifecycle_registered_accepted_resolved(client, officer):
    # The resident signs in with their phone, then files without typing one.
    resident = _headers(_login(client, "savita@citizen.panchayat.gov.in", "9876501234"))
    filed = client.post(f"{API}/grievances", headers=resident, json={
        "title": "Water pipe leaking near temple", "description": "Leaking for two days", "ward": 3,
    })
    assert filed.status_code == 201, filed.text
    grievance = filed.json()
    assert grievance["phone"] == "+919876501234"

    [registered] = _sms_for(grievance["id"])
    assert registered.event == "registered"
    assert registered.status == "logged"  # console provider in tests
    assert registered.phone_masked == "******1234"
    assert grievance["id"] in registered.message

    # The officer accepts it…
    accepted = client.patch(f"{API}/grievances/{grievance['id']}", headers=officer,
                            json={"status": "In Progress"})
    assert accepted.status_code == 200, accepted.text
    # …and resolves it with a note.
    resolved = client.patch(f"{API}/grievances/{grievance['id']}", headers=officer,
                            json={"status": "Resolved", "officerNotes": "Pipe joint replaced"})
    assert resolved.status_code == 200, resolved.text

    events = [n.event for n in _sms_for(grievance["id"])]
    assert events == ["registered", "accepted", "resolved"]
    assert "Pipe joint replaced" in _sms_for(grievance["id"])[-1].message

    # Both sides can see the delivery log on the complaint.
    for headers in (resident, officer):
        detail = client.get(f"{API}/grievances/{grievance['id']}", headers=headers).json()
        assert [n["event"] for n in detail["smsNotifications"]] == events


def test_a_note_alone_sends_no_sms(client, officer):
    resident = _headers(_login(client, "savita@citizen.panchayat.gov.in", "9876501234"))
    gid = client.post(f"{API}/grievances", headers=resident, json={
        "title": "Garbage not collected", "description": "Ward 3 lane", "ward": 3,
    }).json()["id"]
    client.patch(f"{API}/grievances/{gid}", headers=officer, json={"officerNotes": "Seen"})
    assert [n.event for n in _sms_for(gid)] == ["registered"]


def test_a_number_typed_on_the_form_wins(client):
    resident = _headers(_login(client, "savita@citizen.panchayat.gov.in", "9876501234"))
    resp = client.post(f"{API}/grievances", headers=resident, json={
        "title": "Road pothole", "description": "Near bus stop", "ward": 3, "phone": "+91 99887 76655",
    })
    assert resp.json()["phone"] == "+919988776655"
    assert _sms_for(resp.json()["id"])[0].phone_masked == "******6655"


def test_an_invalid_number_on_the_form_is_rejected(client, citizen):
    resp = client.post(f"{API}/grievances", headers=citizen, json={
        "title": "Road pothole", "description": "x", "ward": 3, "phone": "123",
    })
    assert resp.status_code == 422


def test_walk_in_complaint_never_texts_the_officer(client):
    officer = _headers(_login(client, "officer@panchayat.gov.in", "9822011111"))
    resp = client.post(f"{API}/grievances", headers=officer, json={
        "title": "Drain blocked", "description": "Walk-in", "ward": 2, "citizenName": "Walk-in",
    })
    assert resp.status_code == 201
    assert resp.json()["phone"] is None
    [note] = _sms_for(resp.json()["id"])
    assert note.status == "skipped"


def test_a_failing_gateway_is_recorded_and_does_not_break_the_save(client, officer, monkeypatch):
    monkeypatch.setattr(settings, "SMS_PROVIDER", "twilio")
    monkeypatch.setattr(settings, "TWILIO_ACCOUNT_SID", "AC_test")
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "token")
    monkeypatch.setattr(settings, "TWILIO_FROM_NUMBER", "+15005550006")

    def unreachable(*args, **kwargs):
        raise httpx.ConnectError("down")

    monkeypatch.setattr(sms.httpx, "post", unreachable)
    resp = client.post(f"{API}/grievances", headers=officer, json={
        "title": "Hand pump broken", "description": "x", "ward": 2, "phone": "9811122233",
    })
    assert resp.status_code == 201
    [note] = _sms_for(resp.json()["id"])
    assert note.status == "failed" and note.provider == "twilio"
    assert "unreachable" in note.error


def test_twilio_is_called_with_the_e164_number(monkeypatch):
    monkeypatch.setattr(settings, "SMS_PROVIDER", "twilio")
    monkeypatch.setattr(settings, "TWILIO_ACCOUNT_SID", "AC_test")
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "token")
    monkeypatch.setattr(settings, "TWILIO_FROM_NUMBER", "+15005550006")
    seen = {}

    def fake_post(url, data=None, auth=None, timeout=None, **_):
        seen.update(url=url, data=data, auth=auth)
        return httpx.Response(201, json={"sid": "SM123"})

    monkeypatch.setattr(sms.httpx, "post", fake_post)
    result = sms.send_sms("+919876543210", "hello")
    assert result.status == "sent" and result.message_id == "SM123"
    assert seen["data"] == {"To": "+919876543210", "From": "+15005550006", "Body": "hello"}
    assert seen["url"].endswith("/Accounts/AC_test/Messages.json")


def test_fast2sms_gets_the_ten_digit_number(monkeypatch):
    monkeypatch.setattr(settings, "SMS_PROVIDER", "fast2sms")
    monkeypatch.setattr(settings, "FAST2SMS_API_KEY", "key")
    seen = {}

    def fake_post(url, headers=None, json=None, timeout=None, **_):
        seen.update(headers=headers, json=json)
        return httpx.Response(200, json={"return": True, "request_id": "r1"})

    monkeypatch.setattr(sms.httpx, "post", fake_post)
    result = sms.send_sms("+919876543210", "hello")
    assert result.status == "sent"
    assert seen["json"]["numbers"] == "9876543210"
    assert seen["headers"] == {"authorization": "key"}


def test_turning_sms_off_sends_nothing(client, officer, monkeypatch):
    monkeypatch.setattr(settings, "GRIEVANCE_SMS_ENABLED", False)
    resp = client.post(f"{API}/grievances", headers=officer, json={
        "title": "Street light", "description": "x", "ward": 2, "phone": "9811122233",
    })
    assert _sms_for(resp.json()["id"]) == []


def test_the_live_website_is_always_allowed_by_cors(client):
    r = client.options(f"{API}/auth/login", headers={
        "Origin": "https://e-panchayat-ai.onrender.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })
    assert r.status_code == 200
    assert r.headers["access-control-allow-origin"] == "https://e-panchayat-ai.onrender.com"


def test_twilio_accepts_an_api_key_instead_of_the_auth_token(monkeypatch):
    monkeypatch.setattr(settings, "SMS_PROVIDER", "twilio")
    monkeypatch.setattr(settings, "TWILIO_ACCOUNT_SID", "AC_test")
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "")
    monkeypatch.setattr(settings, "TWILIO_API_KEY_SID", "SK_test")
    monkeypatch.setattr(settings, "TWILIO_API_KEY_SECRET", "key-secret")
    monkeypatch.setattr(settings, "TWILIO_FROM_NUMBER", "+15005550006")
    seen = {}

    def fake_post(url, data=None, auth=None, **_):
        seen.update(url=url, auth=auth)
        return httpx.Response(201, json={"sid": "SM9"})

    monkeypatch.setattr(sms.httpx, "post", fake_post)
    assert sms.send_sms("+919876543210", "hi").status == "sent"
    assert seen["auth"] == ("SK_test", "key-secret")
    assert "/Accounts/AC_test/" in seen["url"]
