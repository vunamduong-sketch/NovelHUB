import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


class CommentCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1, max_length=5000)

    @field_validator("content")
    @classmethod
    def normalize_content(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Comment content must not be empty")
        return normalized


class CommentResponse(BaseModel):
    id: uuid.UUID
    chapter_id: uuid.UUID
    user_id: uuid.UUID
    username: str
    display_name: str | None = None
    parent_id: uuid.UUID | None = None
    content: str
    status: str
    created_at: datetime
    updated_at: datetime
    edited_at: datetime | None = None
    replies: list["CommentResponse"] = Field(default_factory=list)


class RatingUpsertRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    score: int = Field(ge=1, le=5)
    review_text: str | None = Field(default=None, max_length=5000)

    @field_validator("review_text")
    @classmethod
    def normalize_review_text(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)


class RatingResponse(BaseModel):
    user_id: uuid.UUID
    novel_id: uuid.UUID
    score: int
    review_text: str | None = None
    created_at: datetime
    updated_at: datetime


class RatingStatusResponse(BaseModel):
    rating_average: Decimal
    rating_count: int
    my_rating: RatingResponse | None = None


class FollowToggleRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    notifications_enabled: bool = True


class NovelFollowResponse(BaseModel):
    novel_id: uuid.UUID
    title: str
    slug: str
    cover_url: str | None = None
    author_id: uuid.UUID
    author_name: str | None = None
    notifications_enabled: bool
    followed_at: datetime


class AuthorFollowResponse(BaseModel):
    author_id: uuid.UUID
    username: str
    display_name: str | None = None
    avatar_url: str | None = None
    notifications_enabled: bool
    followed_at: datetime

