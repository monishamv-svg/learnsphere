"""Pydantic schema validation tests (negative cases)."""

import pytest
from pydantic import ValidationError

from app.schemas.user import UserCreate
from app.schemas.student import StudentCreate
from app.schemas.course import CourseCreate


class TestUserValidation:
    def test_password_too_short(self):
        with pytest.raises(ValidationError):
            UserCreate(
                full_name="Test User",
                email="test@test.com",
                password="12345",
                role="admin",
            )

    def test_invalid_email(self):
        with pytest.raises(ValidationError):
            UserCreate(
                full_name="Test User",
                email="not-an-email",
                password="secret12",
                role="admin",
            )


class TestStudentValidation:
    def test_invalid_phone_number(self):
        with pytest.raises(ValidationError):
            StudentCreate(
                full_name="Test Student",
                email="student@test.com",
                password="secret12",
                student_code="STU001",
                department="CS",
                semester=1,
                phone_number="12345",
            )

    def test_semester_out_of_range(self):
        with pytest.raises(ValidationError):
            StudentCreate(
                full_name="Test Student",
                email="student@test.com",
                password="secret12",
                student_code="STU001",
                department="CS",
                semester=9,
                phone_number="9876543210",
            )


class TestCourseValidation:
    def test_invalid_credits(self):
        with pytest.raises(ValidationError):
            CourseCreate(
                course_code="CS101",
                title="Intro",
                credits=2,
                semester=1,
                department="CS",
                max_capacity=40,
            )


class TestAPIValidationErrors:
    def test_register_missing_fields(self, client):
        response = client.post("/auth/register", json={})

        assert response.status_code == 422
        body = response.json()
        assert body["success"] is False
        assert body["message"] == "Validation error"
        assert "errors" in body

    def test_create_student_invalid_phone_via_api(
        self, client, admin_headers
    ):
        response = client.post(
            "/students/",
            json={
                "full_name": "Bad Phone",
                "email": "badphone@test.com",
                "password": "secret12",
                "student_code": "STU003",
                "department": "CS",
                "semester": 1,
                "phone_number": "12345",
            },
            headers=admin_headers,
        )

        assert response.status_code == 422
