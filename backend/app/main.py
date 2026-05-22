from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="Student Management System API",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}"
    }