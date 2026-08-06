import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BookmarkUpsertRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position_offset: int = Field(default=0, ge=0)
    note: str | None = Field(default=None, max_length=500)

    @field_validator("note")
    @classmethod
    def normalize_note(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        return normalized or None


class BookmarkResponse(BaseModel):
    chapter_id: uuid.UUID
    novel_id: uuid.UUID
    novel_title: str
    chapter_title: str
    chapter_number: Decimal
    position_offset: int
    note: str | None = None
    created_at: datetime
    updated_at: datetime


class BookmarkStatusResponse(BaseModel):
    is_bookmarked: bool
    bookmark: BookmarkResponse | None = None