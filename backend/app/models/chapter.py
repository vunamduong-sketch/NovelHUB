import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.common import TimestampMixin, UUIDPrimaryKeyMixin


class Chapter(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "chapters"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'scheduled', 'published')",
            name="status",
        ),
        CheckConstraint("chapter_number > 0", name="number"),
        CheckConstraint("word_count >= 0 AND view_count >= 0", name="metrics"),
        Index(
            "uq_chapters_novel_number",
            "novel_id",
            "chapter_number",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "uq_chapters_novel_slug",
            "novel_id",
            "slug",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "ix_chapters_public_order",
            "novel_id",
            "chapter_number",
            postgresql_where=text(
                "deleted_at IS NULL AND status = 'published'"
            ),
        ),
    )

    novel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("novels.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    slug: Mapped[str] = mapped_column(String(280), nullable=False)
    chapter_number: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default=text("''"),
    )
    summary: Mapped[str | None] = mapped_column(Text)
    word_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("0"),
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("'draft'"),
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    view_count: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        server_default=text("0"),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
