import uuid
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.chapter import Chapter


class ChapterRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, chapter_id: uuid.UUID) -> Chapter | None:
        return self.session.get(Chapter, chapter_id)

    def get_active_by_id(self, chapter_id: uuid.UUID) -> Chapter | None:
        return self.session.scalar(
            select(Chapter).where(
                Chapter.id == chapter_id,
                Chapter.deleted_at.is_(None),
            )
        )

    def get_novel_chapter_by_number(self, novel_id: uuid.UUID, chapter_number: Decimal) -> Chapter | None:
        return self.session.scalar(
            select(Chapter).where(
                Chapter.novel_id == novel_id,
                Chapter.chapter_number == chapter_number,
                Chapter.deleted_at.is_(None),
            )
        )

    def get_novel_chapter_by_slug(self, novel_id: uuid.UUID, slug: str) -> Chapter | None:
        return self.session.scalar(
            select(Chapter).where(
                Chapter.novel_id == novel_id,
                Chapter.slug == slug,
                Chapter.deleted_at.is_(None),
            )
        )

    def get_chapters_by_novel(
        self,
        novel_id: uuid.UUID,
        status_filter: str | None = None,
    ) -> list[Chapter]:
        statement = select(Chapter).where(
            Chapter.novel_id == novel_id,
            Chapter.deleted_at.is_(None),
        )
        if status_filter is not None:
            statement = statement.where(Chapter.status == status_filter)
        statement = statement.order_by(Chapter.chapter_number.asc())
        return list(self.session.scalars(statement).all())

    def slug_exists(self, novel_id: uuid.UUID, slug: str, exclude_chapter_id: uuid.UUID | None = None) -> bool:
        statement = select(Chapter).where(
            Chapter.novel_id == novel_id,
            Chapter.slug == slug,
            Chapter.deleted_at.is_(None)
        )
        if exclude_chapter_id is not None:
            statement = statement.where(Chapter.id != exclude_chapter_id)
        return self.session.scalar(statement) is not None

    def number_exists(self, novel_id: uuid.UUID, chapter_number: Decimal, exclude_chapter_id: uuid.UUID | None = None) -> bool:
        statement = select(Chapter).where(
            Chapter.novel_id == novel_id,
            Chapter.chapter_number == chapter_number,
            Chapter.deleted_at.is_(None)
        )
        if exclude_chapter_id is not None:
            statement = statement.where(Chapter.id != exclude_chapter_id)
        return self.session.scalar(statement) is not None

    def add(self, chapter: Chapter) -> None:
        self.session.add(chapter)

    def flush(self) -> None:
        self.session.flush()

    def save(self) -> None:
        self.session.commit()

    def rollback(self) -> None:
        self.session.rollback()

    def refresh(self, chapter: Chapter) -> None:
        self.session.refresh(chapter)
