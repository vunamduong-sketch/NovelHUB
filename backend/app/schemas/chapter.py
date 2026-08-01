from datetime import datetime
from decimal import Decimal
from typing import Literal
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


ChapterStatus = Literal["draft", "scheduled", "published"]


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return value
    normalized = value.strip()
    return normalized or None


class ChapterCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=250)
    chapter_number: Decimal = Field(gt=0)
    content: str = Field(default="")
    summary: str | None = Field(default=None, max_length=5000)
    status: ChapterStatus = Field(default="draft")

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Title must not be empty")
        return normalized

    @field_validator("summary")
    @classmethod
    def normalize_summary(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)


class ChapterUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=250)
    chapter_number: Decimal | None = Field(default=None, gt=0)
    content: str | None = Field(default=None)
    summary: str | None = Field(default=None, max_length=5000)
    status: ChapterStatus | None = None

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            raise ValueError("Title must not be empty")
        return normalized

    @field_validator("summary")
    @classmethod
    def normalize_summary(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)

    @model_validator(mode="after")
    def validate_has_updatable_field(self):
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self


class ChapterResponse(BaseModel):
    id: uuid.UUID
    novel_id: uuid.UUID
    title: str
    slug: str
    chapter_number: Decimal
    summary: str | None = None
    word_count: int
    status: ChapterStatus
    published_at: datetime | None = None
    view_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChapterDetailResponse(ChapterResponse):
    content: str
