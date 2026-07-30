import pytest
from pydantic import ValidationError

from app.schemas.user import ChangePasswordRequest, UpdateProfileRequest


def test_update_profile_requires_at_least_one_field() -> None:
    with pytest.raises(ValidationError):
        UpdateProfileRequest()


def test_update_profile_normalizes_and_validates_fields() -> None:
    request = UpdateProfileRequest(display_name="  Reader One  ", bio="  I love stories.  ", username="Reader01")
    assert request.display_name == "Reader One"
    assert request.bio == "I love stories."
    assert request.username == "reader01"


def test_change_password_rejects_same_or_weak_password() -> None:
    with pytest.raises(ValidationError):
        ChangePasswordRequest(current_password="StrongPassword1!", new_password="StrongPassword1!")

    with pytest.raises(ValidationError):
        ChangePasswordRequest(current_password="StrongPassword1!", new_password="weakpass")
