"""Student management API tests."""

import pytest


STUDENT_PAYLOAD = {
    "full_name": "Jane Doe",
    "email": "jane@test.com",
    "password": "secret12",
    "student_code": "STU002",
    "department": "Computer Science",
    "semester": 2,
    "phone_number": "9876543210",
}


class TestStudentsCRUD:
    def test_create_student_as_admin(self, client, admin_headers):
        response = client.post(
            "/students/",
            json=STUDENT_PAYLOAD,
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == STUDENT_PAYLOAD["email"]
        assert data["student_code"] == STUDENT_PAYLOAD["student_code"]

    def test_create_student_forbidden_for_student(
        self, client, student_headers
    ):
        response = client.post(
            "/students/",
            json=STUDENT_PAYLOAD,
            headers=student_headers,
        )

        assert response.status_code == 403

    def test_list_students_public(self, client, admin_headers):
        client.post(
            "/students/",
            json=STUDENT_PAYLOAD,
            headers=admin_headers,
        )

        response = client.get("/students/")

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert data["total_count"] >= 1

    def test_get_student_by_id(self, client, admin_headers):
        create_res = client.post(
            "/students/",
            json=STUDENT_PAYLOAD,
            headers=admin_headers,
        )
        student_id = create_res.json()["id"]

        response = client.get(
            f"/students/{student_id}",
            headers=admin_headers,
        )

        assert response.status_code == 200
        assert response.json()["id"] == student_id

    def test_update_student_as_admin(self, client, admin_headers):
        create_res = client.post(
            "/students/",
            json=STUDENT_PAYLOAD,
            headers=admin_headers,
        )
        student_id = create_res.json()["id"]

        response = client.patch(
            f"/students/{student_id}",
            json={"semester": 4},
            headers=admin_headers,
        )

        assert response.status_code == 200
        assert response.json()["semester"] == 4

    def test_delete_student(self, client, admin_headers):
        create_res = client.post(
            "/students/",
            json={
                **STUDENT_PAYLOAD,
                "email": "delete-me@test.com",
                "student_code": "STU999",
            },
            headers=admin_headers,
        )
        student_id = create_res.json()["id"]

        response = client.delete(
            f"/students/{student_id}",
            headers=admin_headers,
        )

        assert response.status_code == 200

    def test_filter_students_by_department(self, client, admin_headers):
        client.post(
            "/students/",
            json=STUDENT_PAYLOAD,
            headers=admin_headers,
        )

        response = client.get(
            "/students/",
            params={"department": "Computer Science"},
        )

        assert response.status_code == 200
        assert all(
            item["department"] == "Computer Science"
            for item in response.json()["items"]
        )
