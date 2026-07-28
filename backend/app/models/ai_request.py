import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.common import CreatedAtMixin, UUIDPrimaryKeyMixin


class AIRequest(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "ai_requests"
    __table_args__ = (
        CheckConstraint(
            "feature IN ('writing', 'summary', 'grammar_style', 'title')",
            name="feature",
        ),
        CheckConstraint(
            "status IN ('pending', 'processing', 'succeeded', 'failed')",
            name="status",
        ),
        CheckConstraint(
            "(prompt_tokens IS NULL OR prompt_tokens >= 0) "
            "AND (completion_tokens IS NULL OR completion_tokens >= 0) "
            "AND (latency_ms IS NULL OR latency_ms >= 0)",
            name="token",
        ),
        Index(
            "ix_ai_requests_user_recent",
            "user_id",
            text("created_at DESC"),
        ),
        Index(
            "ix_ai_requests_novel",
            "novel_id",
            postgresql_where=text("novel_id IS NOT NULL"),
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    novel_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("novels.id", ondelete="SET NULL"),
    )
    chapter_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("chapters.id", ondelete="SET NULL"),
    )
    feature: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("'pending'"),
    )
    input_text: Mapped[str] = mapped_column(Text, nullable=False)
    output_text: Mapped[str | None] = mapped_column(Text)
    model_name: Mapped[str | None] = mapped_column(String(100))
    prompt_tokens: Mapped[int | None] = mapped_column(Integer)
    completion_tokens: Mapped[int | None] = mapped_column(Integer)
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    error_message: Mapped[str | None] = mapped_column(Text)
    request_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

