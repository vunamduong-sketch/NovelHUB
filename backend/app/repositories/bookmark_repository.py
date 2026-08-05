import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.bookmark import Bookmark
from app.models.chapter import Chapter
from app.models.novel import Novel

class BookmarkRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(
        self,
        user_id: uuid.UUID,
        chapter_id: uuid.UUID,
    ) -> Bookmark | None:
        return self.session.get(
            Bookmark,
            (user_id, chapter_id),
        )

    def upsert(
        self,
        user_id: uuid.UUID,
        chapter_id: uuid.UUID,
        *,
        position_offset: int,
        note: str | None,
    ) -> Bookmark:
        bookmark = self.get(user_id, chapter_id)

        if bookmark is None:
            bookmark = Bookmark(
                user_id=user_id,
                chapter_id=chapter_id,
                position_offset=position_offset,
                note=note,
            )
            self.session.add(bookmark)
        else:
            bookmark.position_offset = position_offset
            bookmark.note = note

        self.session.commit()
        self.session.refresh(bookmark)

        return bookmark

    def delete(self, bookmark: Bookmark) -> None:
        self.session.delete(bookmark)
        self.session.commit()

    def list_by_novel(
        self,
        user_id: uuid.UUID,
        novel_id: uuid.UUID,
    ) -> list[tuple[Bookmark, Chapter, Novel]]:
        statement = (
            select(Bookmark, Chapter, Novel)
            .join(
                Chapter,
                Chapter.id == Bookmark.chapter_id,
            )
            .join(
                Novel,
                Novel.id == Chapter.novel_id,
            )
            .where(
                Bookmark.user_id == user_id,
                Chapter.novel_id == novel_id,
                Chapter.deleted_at.is_(None),
                Chapter.status == "published",
                Novel.deleted_at.is_(None),
                Novel.visibility == "public",
                Novel.moderation_status == "approved",
            )
            .order_by(Chapter.chapter_number.asc())
        )

        rows = self.session.execute(statement).all()

        return [
            (row[0], row[1], row[2])
            for row in rows
        ]