from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.db.database import Base, engine

import app.models

from app.api import auth
from app.api import students
from app.api import courses
from app.api import enrollments
from app.api import timetables
from app.api import attendance
from app.api import dashboard
from app.api import users
from app.core.logger import logger

from app.exceptions.handlers import (
    validation_exception_handler,
    database_exception_handler,
    generic_exception_handler
)

##Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="""
    LearnSphere Student Management Platform API

    Features:
    - JWT Authentication
    - Role Based Access Control
    - Student Management
    - Course Management
    - Attendance Tracking
    - Smart Timetable Scheduling
    """,
    version="1.0.0"
)


app.add_exception_handler(
    RequestValidationError,
    validation_exception_handler
)

app.add_exception_handler(
    SQLAlchemyError,
    database_exception_handler
)

app.add_exception_handler(
    Exception,
    generic_exception_handler
)


app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

app.include_router(
    students.router,
    prefix="/students",
    tags=["Students"]
)

app.include_router(
    courses.router,
    prefix="/courses",
    tags=["Courses"]
)

app.include_router(
    enrollments.router,
    prefix="/enrollments",
    tags=["Enrollments"]
)

app.include_router(
    timetables.router,
    prefix="/timetables",
    tags=["Timetables"]
)

app.include_router(
    attendance.router,
    prefix="/attendance",
    tags=["Attendance"]
)

app.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["Dashboard"]
)

app.include_router(
    users.router
)

logger.info("LearnSphere application started successfully")

@app.get("/")
def root():
    logger.info("Root endpoint accessed")

    return {
        "success": True,
        "message": f"Welcome to {settings.APP_NAME}"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
