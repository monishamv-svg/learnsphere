"""Timetable scheduling API tests."""

from datetime import date

import pytest


@pytest.fixture()
def course_id(client, admin_headers, sample_course_payload):
    response = client.post(
        "/courses/",
        json=sample_course_payload,
        headers=admin_headers,
    )
    return response.json()["id"]


class TestTimetablesCRUD:
    def test_create_timetable(
        self,
        client,
        admin_headers,
        course_id,
        sample_timetable_payload,
    ):
        response = client.post(
            "/timetables/",
            json=sample_timetable_payload(course_id),
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["course_id"] == course_id
        assert data["day_of_week"] == date.today().strftime("%A")

    def test_create_timetable_forbidden_for_student(
        self,
        client,
        student_headers,
        course_id,
        sample_timetable_payload,
    ):
        response = client.post(
            "/timetables/",
            json=sample_timetable_payload(course_id),
            headers=student_headers,
        )

        assert response.status_code == 403

    def test_list_timetables(
        self,
        client,
        admin_headers,
        course_id,
        sample_timetable_payload,
    ):
        client.post(
            "/timetables/",
            json=sample_timetable_payload(course_id),
            headers=admin_headers,
        )

        response = client.get("/timetables/")

        assert response.status_code == 200
        assert response.json()["total_count"] >= 1

    def test_update_timetable(
        self,
        client,
        admin_headers,
        course_id,
        sample_timetable_payload,
    ):
        create_res = client.post(
            "/timetables/",
            json=sample_timetable_payload(course_id),
            headers=admin_headers,
        )
        timetable_id = create_res.json()["id"]

        response = client.patch(
            f"/timetables/{timetable_id}",
            json={"room_number": "B202"},
            headers=admin_headers,
        )

        assert response.status_code == 200
        assert response.json()["room_number"] == "B202"

    def test_delete_timetable(
        self,
        client,
        admin_headers,
        course_id,
        sample_timetable_payload,
    ):
        create_res = client.post(
            "/timetables/",
            json=sample_timetable_payload(course_id),
            headers=admin_headers,
        )
        timetable_id = create_res.json()["id"]

        response = client.delete(
            f"/timetables/{timetable_id}",
            headers=admin_headers,
        )

        assert response.status_code == 200


class TestStudentTimetable:
    def test_student_timetable_requires_auth(self, client):
        response = client.get("/timetables/me")

        assert response.status_code == 401

    def test_student_timetable_empty_when_not_enrolled(
        self, client, student_headers
    ):
        response = client.get("/timetables/me", headers=student_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["entries"] == []


class TestSemesterSchedules:
    def test_list_schedules(self, client, admin_headers):
        response = client.get(
            "/timetables/schedules",
            headers=admin_headers,
        )

        assert response.status_code == 200
        assert "schedules" in response.json()
