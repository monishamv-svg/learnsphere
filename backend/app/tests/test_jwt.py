"""JWT utility and token validation tests."""

from datetime import timedelta

import pytest
from jose import jwt, JWTError

from app.core.config import settings
from app.utils.jwt import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES


class TestCreateAccessToken:
    def test_token_contains_subject_and_role(self):
        token = create_access_token(
            data={"sub": "user@test.com", "role": "admin"}
        )

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        assert payload["sub"] == "user@test.com"
        assert payload["role"] == "admin"
        assert "exp" in payload

    def test_custom_expiry(self):
        token = create_access_token(
            data={"sub": "user@test.com"},
            expires_delta=timedelta(minutes=5),
        )

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        assert payload["sub"] == "user@test.com"

    def test_token_rejects_wrong_secret(self):
        token = create_access_token(data={"sub": "user@test.com"})

        with pytest.raises(JWTError):
            jwt.decode(
                token,
                "wrong-secret-key",
                algorithms=[settings.ALGORITHM],
            )

    def test_expired_token_is_invalid(self):
        token = create_access_token(
            data={"sub": "user@test.com"},
            expires_delta=timedelta(seconds=-1),
        )

        with pytest.raises(JWTError):
            jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )

    def test_default_expiry_minutes(self):
        assert ACCESS_TOKEN_EXPIRE_MINUTES == 60
