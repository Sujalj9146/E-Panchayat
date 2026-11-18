"""Application settings, loaded from environment / .env file."""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# The live website on Render. Always permitted by CORS in addition to
# CORS_ORIGINS — see Settings.cors_origin_list.
DEPLOYED_FRONTEND_ORIGINS = ("https://e-panchayat-ai.onrender.com",)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    PROJECT_NAME: str = "E-Panchayat AI"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str

    @field_validator("DATABASE_URL")
    @classmethod
    def _use_psycopg3(cls, value: str) -> str:
        """Accept the connection string exactly as Supabase or Render show it.

        Those start postgresql:// (or postgres://), which SQLAlchemy maps to
        psycopg2 — a driver this project does not install. Rewrite to the
        psycopg 3 driver that requirements.txt does install."""
        value = value.strip()
        for prefix in ("postgres://", "postgresql://"):
            if value.startswith(prefix):
                return "postgresql+psycopg://" + value[len(prefix):]
        return value

    # Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AI
    GEMINI_API_KEY: str = ""
    # gemini-2.5-flash was here until it started returning 404 "no longer
    # available to new users". Note that the models list endpoint still
    # advertises it — only a real generateContent call reveals the retirement,
    # which is why `llm._api_error` spells the fix out in the error text.
    #
    # Measured on a free key with a realistic prompt (a system instruction plus
    # a dozen retrieved facts), three calls each:
    #
    #   gemini-3.7-flash      3/3 ok, 3-4s     <- this
    #   gemini-3.6-flash      3/3 ok, 27-42s
    #   gemini-3.8-flash      0/3, all 503
    #   gemini-flash-latest   0/3, all 503
    #
    # Two things that reads are worth keeping in mind. The alias is not the
    # safe option: it resolves to whatever is newest, which is exactly what is
    # saturated. And a two-word probe is not a test — every one of these
    # answered "reply with ok" happily while shedding real requests, because
    # size is what gets dropped under load.
    GEMINI_MODEL: str = "gemini-3.7-flash"
    GEMINI_EMBED_MODEL: str = "gemini-embedding-001"

    # ── Sign-in throttling ──────────────────────────────────────────────────
    #
    # Two limits over the same window, because they stop different attacks.
    # The per-email limit stops one account being ground through a password
    # list. The per-IP limit stops one source spraying a common password across
    # many accounts, which the per-email limit never sees.
    #
    # The per-email limit means someone who knows an officer's address can lock
    # it for the window by failing five sign-ins. That is a real cost and it is
    # the accepted trade: the alternative is leaving an unmetered password
    # oracle open. Keeping the window short is what makes it bearable, and a
    # deployment that cares would add a CAPTCHA or an out-of-band unlock rather
    # than raise these numbers.
    LOGIN_WINDOW_MINUTES: int = 15
    LOGIN_MAX_FAILURES_PER_EMAIL: int = 5
    LOGIN_MAX_FAILURES_PER_IP: int = 20
    # Applications are cheap to file and land in an officer's queue, so this
    # caps how much noise one source can put there.
    REGISTER_MAX_PER_IP_PER_HOUR: int = 5

    # A reset code is handed over at the Panchayat counter, so it has to outlive
    # the walk home — but a code that never expires is a spare key to the
    # account left lying in the officer's browser history.
    PASSWORD_RESET_TTL_HOURS: int = 24
    # Redeeming is a guessing oracle like signing in, so it is metered the same
    # way, keyed on the account the code belongs to.
    RESET_MAX_FAILURES_PER_EMAIL: int = 5

    # Self-service recovery: a six-digit OTP sent to the phone and email on
    # record. Short-lived because it travels over a channel, and capped per hour
    # so the endpoint cannot be used to flood a resident's phone.
    OTP_TTL_MINUTES: int = 10
    OTP_MAX_PER_HOUR: int = 3
    # The OTP is sent by SMS through SMS_PROVIDER (see services/sms.py). In demo
    # mode it is also returned in the API response so the flow can be shown
    # without a gateway — but never once a real SMS has carried it. Set false
    # in any deployment holding real residents.
    OTP_DEMO_MODE: bool = True

    # A sign-in from a device the account has not used before waits this long
    # for the owner to approve it from the SMS/email alert.
    LOGIN_APPROVAL_TTL_MINUTES: int = 10
    # Off for now: sign-in is email (or Aadhaar) and password only. Set true to
    # hold sign-ins from unrecognised devices for the owner's approval.
    NEW_DEVICE_APPROVAL: bool = False
    # Shared demo accounts are used from many laptops at once during a
    # presentation, so they skip the new-device approval. Comma separated.
    # Empty this in any deployment holding real residents.
    DEVICE_CHECK_EXEMPT_EMAILS: str = (
        "admin@panchayat.gov.in,officer@panchayat.gov.in,"
        "officer.theur@panchayat.gov.in,savita@citizen.panchayat.gov.in"
    )

    @property
    def device_check_exempt(self) -> set[str]:
        return {e.strip().lower() for e in self.DEVICE_CHECK_EXEMPT_EMAILS.split(",") if e.strip()}

    # ── SMS notifications ───────────────────────────────────────────────────
    #
    # A complainant gets an SMS when their complaint is registered, when an
    # officer accepts it, and when it is resolved (see services/sms.py).
    #
    #   console   — no gateway: the message is logged and recorded as 'logged'.
    #               The default, so nothing is sent by accident from a laptop.
    #   twilio    — needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.
    #   fast2sms  — Indian gateway; needs FAST2SMS_API_KEY. Indian numbers only.
    SMS_PROVIDER: str = "console"
    # Master switch for complaint SMS. Off means no attempt is made at all.
    GRIEVANCE_SMS_ENABLED: bool = True
    # Prefixed to a bare 10-digit mobile number to make it E.164.
    SMS_DEFAULT_COUNTRY_CODE: str = "91"
    SMS_TIMEOUT_SECONDS: float = 10.0
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    FAST2SMS_API_KEY: str = ""

    # CORS — comma separated in the environment
    CORS_ORIGINS: str = "http://localhost:5173"

    # Seeding
    SEED_DEFAULT_PASSWORD: str = "Panchayat@2026"

    @property
    def cors_origin_list(self) -> list[str]:
        """CORS_ORIGINS plus the deployed website, which is always allowed so
        a Render setting that omits it cannot lock the live site out."""
        origins = [o.strip().rstrip("/") for o in self.CORS_ORIGINS.split(",") if o.strip()]
        for origin in DEPLOYED_FRONTEND_ORIGINS:
            if origin not in origins:
                origins.append(origin)
        return origins

    @property
    def ai_enabled(self) -> bool:
        """The server, not the browser, decides whether the LLM is available."""
        return bool(self.GEMINI_API_KEY)


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
