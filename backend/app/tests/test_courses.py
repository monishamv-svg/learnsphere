"""Course management API tests."""

import pytest


class TestCoursesCRUD:
    def test_create_course(self, client, admin_headers, sample_course_payload):
        response = client.post(
            "/courses/",
            json=sample_course_payload,
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["course_code"] == sample_course_payload["course_code"]
        assert data["title"] == sample_course_payload["title"]

    def test_create_course_forbidden_for_student(
        self, client, student_headers, sample_course_payload
    ):
        response = client.post(
            "/courses/",
            json=sample_course_payload,
            headers=student_headers,
        )

        assert response.status_code == 403

    def test_list_courses(self, client, admin_headers, sample_course_payload):
        client.post(
            "/courses/",
            json=sample_course_payload,
            headers=admin_headers,
        )

        response = client.get("/courses/")

        assert response.status_code == 200
        assert response.json()["total_count"] >= 1

    def test_get_course_by_id(
        self, client, admin_headers, sample_course_payload
    ):
        create_res = client.post(
            "/courses/",
            json=sample_course_payload,
            headers=admin_headers,
        )
        course_id = create_res.json()["id"]

        response = client.get(f"/courses/{course_id}")

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert body["data"]["id"] == course_id

    def test_update_course(
        self, client, admin_headers, sample_course_payload
    ):
        create_res = client.post(
            "/courses/",
            json=sample_course_payload,
            headers=admin_headers,
        )
        course_id = create_res.json()["id"]

        response = client.patch(
            f"/courses/{course_id}",
            json={"title": "Updated Course Title"},
            headers=admin_headers,
        )

        assert response.status_code == 200
        assert response.json()["title"] == "Updated Course Title"

    def test_delete_course(
        self, client, admin_headers, sample_course_payload
    ):
        payload = {
            **sample_course_payload,
            "course_code": "DEL101",
        }
        create_res = client.post(
            "/courses/",
            json=payload,
            headers=admin_headers,
        )
        course_id = create_res.json()["id"]

        response = client.delete(
            f"/courses/{course_id}",
            headers=admin_headers,
        )

        assert response.status_code == 200

    def test_get_course_not_found(self, client):
        response = client.get("/courses/99999")

        assert response.status_code == 404
