import pytest

from app.core.config import Settings
from app.core.security import (create_access_token, create_reset_token, decode_token,
                               hash_password, verify_password)


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
