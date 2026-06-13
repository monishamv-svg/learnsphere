import logging
import os

from app.core.config import settings

handlers: list[logging.Handler] = [logging.StreamHandler()]

if settings.APP_ENV != "production":
    os.makedirs("logs", exist_ok=True)
    handlers.append(logging.FileHandler("logs/app.log"))

logging.basicConfig(
    level=logging.INFO,
    format=(
        "%(asctime)s | "
        "%(levelname)s | "
        "%(name)s | "
        "%(message)s"
    ),
    handlers=handlers,
)

logger = logging.getLogger("learnsphere")
