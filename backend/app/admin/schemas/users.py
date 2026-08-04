from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    username: str
    display_name: str | None
    bio: str | None
    avatar_url: str | None
    status: str
    roles: list[str]
    email_verified_at: datetime | None
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime


class AdminUserListResponse(BaseModel):
    items: list[AdminUserResponse]
    total: int
    page: int
    page_size: int


class AdminUserRoleUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    roles: list[str] = Field(min_length=1, max_length=10)

    @field_validator("roles")
    @classmethod
    def normalize_roles(cls, value: list[str]) -> list[str]:
        normalized: list[str] = []
        seen: set[str] = set()
        for role in value:
            code = role.strip().lower()
            if not code:
                raise ValueError("Role code must not be empty")
            if code not in seen:
                normalized.append(code)
                seen.add(code)
        if not normalized:
            raise ValueError("At least one role must be provided")
        return normalized
