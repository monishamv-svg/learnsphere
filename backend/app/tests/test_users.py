"""User management API tests."""

import pytest


class TestUsersCRUD:
    def test_create_user_as_admin(self, client, admin_headers):
        payload = {
            "full_name": "Staff Member",
            "email": "staff@test.com",
            "password": "secret12",
            "role": "admin",
        }

        response = client.post("/users/", json=payload, headers=admin_headers)

        assert response.status_code == 200
        assert response.json()["email"] == payload["email"]

    def test_create_user_forbidden_for_student(
        self, client, student_headers
    ):
        payload = {
            "full_name": "Hacker",
            "email": "hacker@test.com",
            "password": "secret12",
            "role": "admin",
        }

        response = client.post("/users/", json=payload, headers=student_headers)

        assert response.status_code == 403

    def test_list_users(self, client, admin_headers, admin_user):
        response = client.get("/users/", headers=admin_headers)

        assert response.status_code == 200
        emails = [user["email"] for user in response.json()]
        assert admin_user.email in emails

    def test_get_user_by_id(self, client, admin_headers, admin_user):
        response = client.get(
            f"/users/{admin_user.id}",
            headers=admin_headers,
        )

        assert response.status_code == 200
        assert response.json()["id"] == admin_user.id

    def test_update_user(self, client, admin_headers, admin_user):
        response = client.patch(
            f"/users/{admin_user.id}",
            json={"full_name": "Updated Admin"},
            headers=admin_headers,
        )

        assert response.status_code == 200
        assert response.json()["full_name"] == "Updated Admin"

    def test_delete_user(self, client, admin_headers, db_session):
        from app.schemas.user import UserCreate, UserRole
        from app.services.user_service import create_user

        temp_user = create_user(
            db_session,
            UserCreate(
                full_name="Temp User",
                email="temp@test.com",
                password="secret12",
                role=UserRole.STUDENT,
            ),
        )

        response = client.delete(
            f"/users/{temp_user.id}",
            headers=admin_headers,
        )

        assert response.status_code == 200

    def test_get_user_not_found(self, client, admin_headers):
        response = client.get("/users/99999", headers=admin_headers)

        assert response.status_code == 404
