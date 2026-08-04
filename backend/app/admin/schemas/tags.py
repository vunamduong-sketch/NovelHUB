import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

_SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class AdminTagCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=60)
    slug: str | None = Field(default=None, min_length=1, max_length=80)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Tag name must not be empty")
        return normalized

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().lower()
        if not _SLUG_PATTERN.fullmatch(normalized):
            raise ValueError("Slug must contain lowercase letters, numbers, and hyphens only")
        return normalized


class AdminTagUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=60)
    slug: str | None = Field(default=None, min_length=1, max_length=80)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("Tag name must not be empty")
        return normalized

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str | None) -> str | None:
        return AdminTagCreateRequest.normalize_slug(value)

    @model_validator(mode="after")
    def validate_has_updatable_field(self):
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self


class AdminTagResponse(BaseModel):
    id: int
    name: str
    slug: str
    created_at: datetime
