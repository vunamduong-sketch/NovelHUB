import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.core.security import (create_access_token, create_reset_token, decode_token,
                               hash_password, verify_password)
from app.schemas.auth import RegisterRequest


SETTINGS = Settings(jwt_secret_key="test-secret-that-is-at-least-thirty-two-characters-long")


def test_password_hash_and_access_token_round_trip() -> None:
    password_hash = hash_password("StrongPassword1!")
    assert password_hash != "StrongPassword1!"
    assert verify_password("StrongPassword1!", password_hash)
    assert not verify_password("WrongPassword1!", password_hash)
    token, _ = create_access_token("user-id", ["reader"], SETTINGS)
    assert decode_token(token, "access", SETTINGS)["roles"] == ["reader"]


def test_reset_token_cannot_be_used_as_an_access_token() -> None:
    token = create_reset_token("user-id", SETTINGS)
    with pytest.raises(ValueError):
        decode_token(token, "access", SETTINGS)


def test_password_policy_requires_ten_characters_a_letter_and_a_number() -> None:
    request = RegisterRequest(email="reader@example.com", username="reader_01", password="novelhub10")
    assert request.password == "novelhub10"
    for password in ("short123", "abcdefghij", "1234567890"):
        with pytest.raises(ValidationError):
            RegisterRequest(email="reader@example.com", username="reader_01", password=password)
