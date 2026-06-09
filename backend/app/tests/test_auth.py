"""Authentication endpoint tests."""

import pytest


class TestAuthRegister:
    def test_register_success(self, client):
        payload = {
            "full_name": "New User",
            "email": "newuser@test.com",
            "password": "secret12",
            "role": "admin",
        }

        response = client.post("/auth/register", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == payload["email"]
        assert data["role"] == "admin"
        assert "id" in data

    def test_register_duplicate_email(self, client, admin_user):
        payload = {
            "full_name": "Duplicate",
            "email": admin_user.email,
            "password": "secret12",
            "role": "student",
        }

        response = client.post("/auth/register", json=payload)

        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()


class TestAuthLogin:
    def test_login_success(self, client, admin_user):
        response = client.post(
            "/auth/token",
            data={"username": admin_user.email, "password": "secret12"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["token_type"] == "bearer"
        assert "access_token" in data

    def test_login_wrong_password(self, client, admin_user):
        response = client.post(
            "/auth/token",
            data={"username": admin_user.email, "password": "wrongpass"},
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid credentials"

    def test_login_unknown_email(self, client):
        response = client.post(
            "/auth/token",
            data={"username": "ghost@test.com", "password": "secret12"},
        )

        assert response.status_code == 401


class TestAuthMe:
    def test_me_with_valid_token(self, client, admin_headers, admin_user):
        response = client.get("/auth/me", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == admin_user.email
        assert data["role"] == "admin"

    def test_me_without_token(self, client):
        response = client.get("/auth/me")

        assert response.status_code == 401

    def test_me_with_invalid_token(self, client):
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer not-a-real-token"},
        )

        assert response.status_code == 401
