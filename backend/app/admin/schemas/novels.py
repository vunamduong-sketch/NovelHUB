from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class AdminNovelResponse(BaseModel):
    id: str
    author_id: str
    author_name: str | None
    category_id: int | None
    category_name: str | None
    title: str
    slug: str
    description: str | None
    cover_url: str | None
    language_code: str
    status: str
    visibility: str
    moderation_status: str
    published_at: datetime | None
    completed_at: datetime | None
    view_count: int
    follower_count: int
    rating_count: int
    rating_average: Decimal
    created_at: datetime
    updated_at: datetime


class AdminNovelListResponse(BaseModel):
    items: list[AdminNovelResponse]
    total: int
    page: int
    page_size: int
