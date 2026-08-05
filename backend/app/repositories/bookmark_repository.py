import uuid

from sqlalchemy.orm import Session

from app.models.bookmark import Bookmark


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