import os

from dotenv import load_dotenv

load_dotenv()

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

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./learnsphere.db"
    )

settings = Settings()