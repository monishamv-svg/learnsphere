"""Dashboard API tests."""

import pytest


class TestAdminDashboard:
    def test_admin_stats(self, client, admin_headers):
        response = client.get("/dashboard/stats", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert "students" in data
        assert "courses" in data
        assert "enrollments" in data
        assert "attendance_records" in data
        assert "timetable_entries" in data
        assert "classes_by_weekday" in data
        assert "course_breakdown" in data
        assert "students_by_department" in data
        assert "students_by_semester" in data
        assert "students_by_department_semester" in data
        assert isinstance(data["classes_by_weekday"], list)
        assert isinstance(data["students_by_department"], list)
        assert isinstance(data["students_by_semester"], list)
        assert isinstance(data["students_by_department_semester"], list)

    def test_admin_stats_forbidden_for_student(
        self, client, student_headers
    ):
        response = client.get("/dashboard/stats", headers=student_headers)

        assert response.status_code == 403


class TestStudentDashboard:
    def test_student_dashboard(self, client, student_headers, student_profile):
        response = client.get("/dashboard/me", headers=student_headers)

        assert response.status_code == 200
        data = response.json()
        assert "student" in data
        assert data["student"]["id"] == student_profile.id
        assert "attendance_summary" in data
        assert "present" in data["attendance_summary"]
        assert "absent" in data["attendance_summary"]

    def test_student_dashboard_forbidden_for_admin(
        self, client, admin_headers
    ):
        response = client.get("/dashboard/me", headers=admin_headers)

        assert response.status_code == 403

    def test_student_dashboard_without_profile(self, client, admin_headers):
        """Admin has no linked student profile."""
        response = client.get("/dashboard/me", headers=admin_headers)

        assert response.status_code == 403
