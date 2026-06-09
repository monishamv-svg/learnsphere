"""Attendance management API tests."""

from datetime import date

import pytest


@pytest.fixture()
def course_and_timetable(
    client,
    admin_headers,
    student_profile,
    sample_course_payload,
    sample_timetable_payload,
):
    course_res = client.post(
        "/courses/",
        json=sample_course_payload,
        headers=admin_headers,
    )
    course_id = course_res.json()["id"]

    timetable_res = client.post(
        "/timetables/",
        json=sample_timetable_payload(course_id),
        headers=admin_headers,
    )
    timetable_id = timetable_res.json()["id"]

    client.post(
        "/enrollments/",
        json={
            "student_id": student_profile.id,
            "course_id": course_id,
            "timetable_id": timetable_id,
        },
        headers=admin_headers,
    )

    return {
        "course_id": course_id,
        "timetable_id": timetable_id,
        "attendance_date": date.today().isoformat(),
    }


class TestAttendanceCRUD:
    def test_mark_attendance(
        self,
        client,
        admin_headers,
        student_profile,
        course_and_timetable,
    ):
        payload = {
            "student_id": student_profile.id,
            "timetable_id": course_and_timetable["timetable_id"],
            "attendance_date": course_and_timetable["attendance_date"],
            "status": "Present",
        }

        response = client.post(
            "/attendance/",
            json=payload,
            headers=admin_headers,
        )

        assert response.status_code == 200
        assert response.json()["status"] == "Present"

    def test_mark_attendance_forbidden_for_student(
        self,
        client,
        student_headers,
        student_profile,
        course_and_timetable,
    ):
        payload = {
            "student_id": student_profile.id,
            "timetable_id": course_and_timetable["timetable_id"],
            "attendance_date": course_and_timetable["attendance_date"],
            "status": "Present",
        }

        response = client.post(
            "/attendance/",
            json=payload,
            headers=student_headers,
        )

        assert response.status_code == 403

    def test_list_attendance(
        self,
        client,
        admin_headers,
        student_profile,
        course_and_timetable,
    ):
        payload = {
            "student_id": student_profile.id,
            "timetable_id": course_and_timetable["timetable_id"],
            "attendance_date": course_and_timetable["attendance_date"],
            "status": "Present",
        }
        client.post("/attendance/", json=payload, headers=admin_headers)

        response = client.get("/attendance/")

        assert response.status_code == 200
        assert len(response.json()) >= 1

    def test_attendance_percentage(
        self,
        client,
        admin_headers,
        student_profile,
        course_and_timetable,
    ):
        payload = {
            "student_id": student_profile.id,
            "timetable_id": course_and_timetable["timetable_id"],
            "attendance_date": course_and_timetable["attendance_date"],
            "status": "Present",
        }
        client.post("/attendance/", json=payload, headers=admin_headers)

        response = client.get(
            f"/attendance/percentage/{student_profile.id}"
        )

        assert response.status_code == 200
        data = response.json()
        assert "attendance_percentage" in data
        assert data["attendance_percentage"] >= 0

    def test_update_attendance(
        self,
        client,
        admin_headers,
        student_profile,
        course_and_timetable,
    ):
        payload = {
            "student_id": student_profile.id,
            "timetable_id": course_and_timetable["timetable_id"],
            "attendance_date": course_and_timetable["attendance_date"],
            "status": "Present",
        }
        create_res = client.post(
            "/attendance/",
            json=payload,
            headers=admin_headers,
        )
        attendance_id = create_res.json()["id"]

        response = client.patch(
            f"/attendance/{attendance_id}",
            json={"status": "Late"},
            headers=admin_headers,
        )

        assert response.status_code == 200
        assert response.json()["status"] == "Late"

    def test_delete_attendance(
        self,
        client,
        admin_headers,
        student_profile,
        course_and_timetable,
    ):
        payload = {
            "student_id": student_profile.id,
            "timetable_id": course_and_timetable["timetable_id"],
            "attendance_date": date.today().isoformat(),
            "status": "Absent",
        }
        create_res = client.post(
            "/attendance/",
            json=payload,
            headers=admin_headers,
        )
        attendance_id = create_res.json()["id"]

        response = client.delete(
            f"/attendance/{attendance_id}",
            headers=admin_headers,
        )

        assert response.status_code == 200
