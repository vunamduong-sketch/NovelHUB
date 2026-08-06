import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ReadingProgressRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position_offset: int = Field(default=0, ge=0)
    progress_percent: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        le=100,
    )


class ReadingHistoryResponse(BaseModel):
    novel_id: uuid.UUID
    novel_title: str
    cover_url: str | None = None
    chapter_id: uuid.UUID | None = None
    chapter_title: str | None = None
    chapter_number: Decimal | None = None
    position_offset: int
    progress_percent: Decimal
    first_read_at: datetime
    last_read_at: datetime