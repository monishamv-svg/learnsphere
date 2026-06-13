import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parents[2]

INSECURE_SECRET_KEY = "supersecretkey"
INSECURE_DB_PASSWORD = "learnsphere"
INSECURE_DB_CREDENTIALS = f"learnsphere:{INSECURE_DB_PASSWORD}@"


def resolve_database_url(url: str) -> str:
    """Resolve relative SQLite paths to absolute paths under backend/."""
    if url.startswith("sqlite:///./"):
        db_name = url.removeprefix("sqlite:///./")
        return f"sqlite:///{BACKEND_DIR / db_name}"

    return url


def build_database_url() -> str:
    """
    Build DATABASE_URL from environment variables.

    Priority:
    1. DATABASE_URL if set explicitly (supports SQLite or PostgreSQL)
    2. POSTGRES_* component variables assembled into a PostgreSQL URL
    """
    explicit_url = os.getenv("DATABASE_URL")
    if explicit_url:
        return resolve_database_url(explicit_url)

    user = os.getenv("POSTGRES_USER", "learnsphere")
    password = os.getenv("POSTGRES_PASSWORD", INSECURE_DB_PASSWORD)
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    db = os.getenv("POSTGRES_DB", "learnsphere")

    safe_password = quote_plus(password)
    return f"postgresql://{user}:{safe_password}@{host}:{port}/{db}"


def parse_cors_origins() -> list[str]:
    raw = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def parse_allow_public_registration() -> bool:
    explicit = os.getenv("ALLOW_PUBLIC_REGISTRATION")
    if explicit is not None:
        return explicit.lower() in ("true", "1", "yes")
    return os.getenv("APP_ENV", "development") != "production"


class Settings:

    APP_NAME: str = os.getenv(
        "APP_NAME",
        "LearnSphere"
    )

    APP_ENV: str = os.getenv(
        "APP_ENV",
        "development"
    )

    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        INSECURE_SECRET_KEY
    )

    ALGORITHM: str = os.getenv(
        "ALGORITHM",
        "HS256"
    )

    DATABASE_URL: str = build_database_url()

    CORS_ORIGINS: list[str] = parse_cors_origins()

    ALLOW_PUBLIC_REGISTRATION: bool = parse_allow_public_registration()

    # Connection pool settings (used for PostgreSQL in database.py)
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "3600"))


def validate_production_settings(settings: Settings) -> None:
    """Refuse to start with insecure defaults when APP_ENV=production."""
    if settings.APP_ENV != "production":
        return

    if (
        settings.SECRET_KEY == INSECURE_SECRET_KEY
        or len(settings.SECRET_KEY) < 32
    ):
        raise RuntimeError(
            "SECRET_KEY must be set to a strong value (32+ characters) "
            "in production"
        )

    db_url = settings.DATABASE_URL

    if db_url.startswith("sqlite"):
        raise RuntimeError(
            "SQLite is not supported in production; configure PostgreSQL"
        )

    if INSECURE_DB_CREDENTIALS in db_url:
        raise RuntimeError(
            "Database credentials must be changed in production"
        )

    password = os.getenv("POSTGRES_PASSWORD", INSECURE_DB_PASSWORD)
    if password == INSECURE_DB_PASSWORD:
        raise RuntimeError(
            "POSTGRES_PASSWORD must be changed in production"
        )


settings = Settings()
validate_production_settings(settings)
