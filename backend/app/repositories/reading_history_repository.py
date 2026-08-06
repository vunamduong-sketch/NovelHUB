import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models.chapter import Chapter
from app.models.novel import Novel
from app.models.reading_history import ReadingHistory


class ReadingHistoryRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def upsert(
        self,
        user_id: uuid.UUID,
        novel_id: uuid.UUID,
        chapter_id: uuid.UUID,
        *,
        position_offset: int,
        progress_percent: Decimal,
    ) -> ReadingHistory:
        history = self.session.get(
            ReadingHistory,
            (user_id, novel_id),
        )
        now = datetime.now(timezone.utc)

        if history is None:
            history = ReadingHistory(
                user_id=user_id,
                novel_id=novel_id,
                chapter_id=chapter_id,
                position_offset=position_offset,
                progress_percent=progress_percent,
                first_read_at=now,
                last_read_at=now,
            )
            self.session.add(history)
        else:
            history.chapter_id = chapter_id
            history.position_offset = position_offset
            history.progress_percent = progress_percent
            history.last_read_at = now

        self.session.commit()
        self.session.refresh(history)
        return history

    def list_recent(
        self,
        user_id: uuid.UUID,
    ) -> list[tuple[ReadingHistory, Novel, Chapter | None]]:
        statement = (
            select(ReadingHistory, Novel, Chapter)
            .join(
                Novel,
                Novel.id == ReadingHistory.novel_id,
            )
            .outerjoin(
                Chapter,
                and_(
                    Chapter.id == ReadingHistory.chapter_id,
                    Chapter.deleted_at.is_(None),
                    Chapter.status == "published",
                ),
            )
            .where(
                ReadingHistory.user_id == user_id,
                Novel.deleted_at.is_(None),
                Novel.visibility == "public",
                Novel.moderation_status == "approved",
            )
            .order_by(
                ReadingHistory.last_read_at.desc(),
            )
        )

        rows = self.session.execute(statement).all()

        return [
            (row[0], row[1], row[2])
            for row in rows
        ]