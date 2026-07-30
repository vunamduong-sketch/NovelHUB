import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

_USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9]{3,50}$")


def _validate_password(value: str) -> str:
    if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
        raise ValueError("Password must include at least one letter and one number")
    return value


class UserProfileResponse(BaseModel):
    id: str
    email: EmailStr
    username: str
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    status: str
    roles: list[str]


class UpdateProfileRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str | None = Field(default=None, min_length=1, max_length=100)
    bio: str | None = Field(default=None, max_length=1000)
    username: str | None = Field(default=None, min_length=3, max_length=50)

    @field_validator("display_name")
    @classmethod
    def normalize_display_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            raise ValueError("Display name must not be empty")
        return normalized

    @field_validator("bio")
    @classmethod
    def normalize_bio(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        return normalized or None

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip().lower()
        if not _USERNAME_PATTERN.fullmatch(normalized):
            raise ValueError("Username must use 3-50 letters or numbers only")
        return normalized

    @model_validator(mode="after")
    def validate_has_updatable_field(self):
        if all(getattr(self, field_name) is None for field_name in ("display_name", "bio", "username")):
            raise ValueError("At least one field must be provided")
        return self


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=10, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return _validate_password(value)

    @model_validator(mode="after")
    def validate_not_same_password(self):
        if self.current_password == self.new_password:
            raise ValueError("New password must be different from current password")
        return self


class AvatarUpdateResponse(BaseModel):
    message: str
    avatar_url: str
