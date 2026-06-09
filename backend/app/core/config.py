import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parents[2]


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
    password = os.getenv("POSTGRES_PASSWORD", "learnsphere")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    db = os.getenv("POSTGRES_DB", "learnsphere")

    safe_password = quote_plus(password)
    return f"postgresql://{user}:{safe_password}@{host}:{port}/{db}"


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
        "supersecretkey"
    )

    ALGORITHM: str = os.getenv(
        "ALGORITHM",
        "HS256"
    )

    DATABASE_URL: str = build_database_url()

    # Connection pool settings (used for PostgreSQL in database.py)
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "3600"))


settings = Settings()
