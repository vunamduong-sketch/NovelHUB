from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


NovelStatus = Literal["draft", "ongoing", "hiatus", "completed"]
NovelVisibility = Literal["public", "private"]
NovelModerationStatus = Literal["pending", "approved", "rejected", "hidden"]


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return value
    normalized = value.strip()
    return normalized or None


class NovelCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=250)
    description: str | None = Field(default=None, max_length=10000)
    category_id: int | None = Field(default=None, gt=0)
    tag_ids: list[int] = Field(default_factory=list, max_length=20)
    cover_url: str | None = Field(default=None, max_length=2048)
    language_code: str = Field(default="vi", min_length=2, max_length=10)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Title must not be empty")
        return normalized

    @field_validator("description", "cover_url")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)

    @field_validator("language_code")
    @classmethod
    def normalize_language_code(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("tag_ids")
    @classmethod
    def normalize_tag_ids(cls, value: list[int]) -> list[int]:
        return _normalize_tag_ids(value)


class NovelUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=250)
    description: str | None = Field(default=None, max_length=10000)
    category_id: int | None = Field(default=None, gt=0)
    tag_ids: list[int] | None = Field(default=None, max_length=20)
    cover_url: str | None = Field(default=None, max_length=2048)
    status: NovelStatus | None = None

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            raise ValueError("Title must not be empty")
        return normalized

    @field_validator("description", "cover_url")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)

    @field_validator("tag_ids")
    @classmethod
    def normalize_tag_ids(cls, value: list[int] | None) -> list[int] | None:
        if value is None:
            return value
        return _normalize_tag_ids(value)

    @model_validator(mode="after")
    def validate_has_updatable_field(self):
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self


class TagResponse(BaseModel):
    id: int
    name: str
    slug: str


class NovelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    author_id: str
    category_id: int | None
    tags: list[TagResponse]
    title: str
    slug: str
    description: str | None
    cover_url: str | None
    language_code: str
    status: NovelStatus
    visibility: NovelVisibility
    moderation_status: NovelModerationStatus
    published_at: datetime | None
    view_count: int
    follower_count: int
    rating_count: int
    rating_average: Decimal


def _normalize_tag_ids(value: list[int]) -> list[int]:
    normalized: list[int] = []
    seen: set[int] = set()
    for tag_id in value:
        if tag_id <= 0:
            raise ValueError("Tag ids must be positive")
        if tag_id not in seen:
            normalized.append(tag_id)
            seen.add(tag_id)
    return normalized
