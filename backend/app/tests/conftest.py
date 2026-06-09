"""
Shared pytest fixtures for LearnSphere backend tests.

Uses an in-memory SQLite database with StaticPool so every connection
shares the same in-memory schema (required for FastAPI's thread pool).
"""
import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("SECRET_KEY", "pytest-secret-key-not-for-production")

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.db.database as database_module

TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)

# Ensure API handlers and health checks share one in-memory database.
database_module.engine = test_engine
database_module.SessionLocal = TestingSessionLocal

from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import Base
from app.db.session import get_db
from app.schemas.user import UserCreate, UserRole
from app.schemas.student import StudentCreate
from app.services.user_service import create_user
from app.services.student_service import create_student


@pytest.fixture()
def db_session() -> Session:
    """Create a fresh database schema for each test."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def client(db_session: Session):
    """HTTP client with the test database wired into FastAPI dependencies."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def _register_user(db: Session, email: str, password: str, role: UserRole):
    return create_user(
        db,
        UserCreate(
            full_name=f"Test {role.value.title()}",
            email=email,
            password=password,
            role=role,
        ),
    )


@pytest.fixture()
def admin_user(db_session: Session):
    return _register_user(
        db_session,
        email="admin@test.com",
        password="secret12",
        role=UserRole.ADMIN,
    )


@pytest.fixture()
def student_profile(db_session: Session):
    """Creates a student user account plus linked student profile."""
    return create_student(
        db_session,
        StudentCreate(
            full_name="Test Student",
            email="student@test.com",
            password="secret12",
            student_code="STU001",
            department="Computer Science",
            semester=3,
            phone_number="9876543210",
        ),
    )


def get_token(client: TestClient, email: str, password: str) -> str:
    response = client.post(
        "/auth/token",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture()
def admin_headers(client: TestClient, admin_user):
    token = get_token(client, admin_user.email, "secret12")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def student_headers(client: TestClient, student_profile):
    token = get_token(client, student_profile.email, "secret12")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def sample_course_payload():
    return {
        "course_code": "CS101",
        "title": "Intro to Programming",
        "description": "Basics of programming",
        "credits": 3,
        "semester": 3,
        "department": "Computer Science",
        "instructor_name": "Dr. Smith",
        "max_capacity": 40,
        "is_elective": False,
    }


@pytest.fixture()
def sample_timetable_payload(sample_course_payload):
    """Payload factory – call with course_id after creating a course."""

    def _build(course_id: int):
        return {
            "course_id": course_id,
            "day_of_week": date.today().strftime("%A"),
            "start_time": "09:00",
            "end_time": "10:30",
            "room_number": "A101",
            "instructor_name": "Dr. Smith",
        }

    return _build
