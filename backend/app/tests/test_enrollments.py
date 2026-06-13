"""Enrollment management API tests."""

import pytest


@pytest.fixture()
def course_id(client, admin_headers, sample_course_payload):
    response = client.post(
        "/courses/",
        json=sample_course_payload,
        headers=admin_headers,
    )
    return response.json()["id"]


@pytest.fixture()
def timetable_id(
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
    return response.json()["id"]


@pytest.fixture()
def enrollment_payload(student_profile, course_id, timetable_id):
    return {
        "student_id": student_profile.id,
        "course_id": course_id,
        "timetable_id": timetable_id,
    }


class TestEnrollmentsCRUD:
    def test_admin_create_enrollment(
        self,
        client,
        admin_headers,
        enrollment_payload,
    ):
        response = client.post(
            "/enrollments/",
            json=enrollment_payload,
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["student_id"] == enrollment_payload["student_id"]
        assert data["course_id"] == enrollment_payload["course_id"]
        assert data["timetable_id"] == enrollment_payload["timetable_id"]

    def test_student_self_enroll(
        self,
        client,
        student_headers,
        course_id,
        timetable_id,
        student_profile,
    ):
        response = client.post(
            "/enrollments/",
            json={
                "student_id": 0,
                "course_id": course_id,
                "timetable_id": timetable_id,
            },
            headers=student_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["student_id"] == student_profile.id
        assert data["course_id"] == course_id

    def test_list_enrollments_as_admin(
        self,
        client,
        admin_headers,
        enrollment_payload,
    ):
        client.post(
            "/enrollments/",
            json=enrollment_payload,
            headers=admin_headers,
        )

        response = client.get(
            "/enrollments/",
            headers=admin_headers,
        )

        assert response.status_code == 200
        assert len(response.json()) >= 1

    def test_list_enrollments_as_student(
        self,
        client,
        admin_headers,
        student_headers,
        enrollment_payload,
    ):
        client.post(
            "/enrollments/",
            json=enrollment_payload,
            headers=admin_headers,
        )

        response = client.get(
            "/enrollments/",
            headers=student_headers,
        )

        assert response.status_code == 200
        enrollments = response.json()
        assert len(enrollments) >= 1
        assert all(
            item["student_id"] == enrollment_payload["student_id"]
            for item in enrollments
        )

    def test_update_enrollment(
        self,
        client,
        admin_headers,
        enrollment_payload,
        course_id,
        timetable_id,
    ):
        create_res = client.post(
            "/enrollments/",
            json=enrollment_payload,
            headers=admin_headers,
        )
        enrollment_id = create_res.json()["id"]

        response = client.patch(
            f"/enrollments/{enrollment_id}",
            json={"timetable_id": timetable_id},
            headers=admin_headers,
        )

        assert response.status_code == 200
        assert response.json()["timetable_id"] == timetable_id

    def test_replace_enrollment(
        self,
        client,
        admin_headers,
        enrollment_payload,
    ):
        create_res = client.post(
            "/enrollments/",
            json=enrollment_payload,
            headers=admin_headers,
        )
        enrollment_id = create_res.json()["id"]

        response = client.put(
            f"/enrollments/{enrollment_id}",
            json=enrollment_payload,
            headers=admin_headers,
        )

        assert response.status_code == 200
        assert response.json()["id"] == enrollment_id

    def test_delete_enrollment(
        self,
        client,
        admin_headers,
        enrollment_payload,
    ):
        create_res = client.post(
            "/enrollments/",
            json=enrollment_payload,
            headers=admin_headers,
        )
        enrollment_id = create_res.json()["id"]

        response = client.delete(
            f"/enrollments/{enrollment_id}",
            headers=admin_headers,
        )

        assert response.status_code == 200

        list_res = client.get(
            "/enrollments/",
            headers=admin_headers,
        )
        ids = [item["id"] for item in list_res.json()]
        assert enrollment_id not in ids

    def test_create_enrollment_unauthenticated(
        self,
        client,
        enrollment_payload,
    ):
        response = client.post(
            "/enrollments/",
            json=enrollment_payload,
        )

        assert response.status_code == 401

    def test_update_enrollment_forbidden_for_student(
        self,
        client,
        admin_headers,
        student_headers,
        enrollment_payload,
    ):
        create_res = client.post(
            "/enrollments/",
            json=enrollment_payload,
            headers=admin_headers,
        )
        enrollment_id = create_res.json()["id"]

        response = client.patch(
            f"/enrollments/{enrollment_id}",
            json={"timetable_id": enrollment_payload["timetable_id"]},
            headers=student_headers,
        )

        assert response.status_code == 403

    def test_create_duplicate_enrollment_rejected(
        self,
        client,
        admin_headers,
        enrollment_payload,
    ):
        client.post(
            "/enrollments/",
            json=enrollment_payload,
            headers=admin_headers,
        )

        response = client.post(
            "/enrollments/",
            json=enrollment_payload,
            headers=admin_headers,
        )

        assert response.status_code == 400
