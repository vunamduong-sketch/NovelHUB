import uuid

from app.models.bookmark import Bookmark
from app.models.chapter import Chapter
from app.models.novel import Novel
from app.models.user import User
from app.repositories.bookmark_repository import BookmarkRepository
from app.repositories.chapter_repository import ChapterRepository
from app.repositories.novel_repository import NovelRepository


class BookmarkError(Exception):
    pass


class BookmarkChapterNotAvailableError(BookmarkError):
    pass

class BookmarkNovelNotAvailableError(BookmarkError):
    pass

class BookmarkNotFoundError(BookmarkError):
    pass


class BookmarkService:
    def __init__(
        self,
        repository: BookmarkRepository,
        chapter_repository: ChapterRepository,
        novel_repository: NovelRepository,
    ) -> None:
        self.repository = repository
        self.chapter_repository = chapter_repository
        self.novel_repository = novel_repository

    def save_bookmark(
        self,
        current_user: User,
        chapter_id: uuid.UUID,
        *,
        position_offset: int,
        note: str | None,
    ) -> tuple[Bookmark, Chapter, Novel]:
        chapter, novel = self._get_public_chapter(chapter_id)

        bookmark = self.repository.upsert(
            current_user.id,
            chapter.id,
            position_offset=position_offset,
            note=note,
        )

        return bookmark, chapter, novel

    def get_bookmark(
        self,
        current_user: User,
        chapter_id: uuid.UUID,
    ) -> tuple[Bookmark | None, Chapter, Novel]:
        chapter, novel = self._get_public_chapter(chapter_id)

        bookmark = self.repository.get(
            current_user.id,
            chapter.id,
        )

        return bookmark, chapter, novel

    def remove_bookmark(
        self,
        current_user: User,
        chapter_id: uuid.UUID,
    ) -> None:
        chapter, _ = self._get_public_chapter(chapter_id)

        bookmark = self.repository.get(
            current_user.id,
            chapter.id,
        )

        if bookmark is None:
            raise BookmarkNotFoundError(
                "Bookmark does not exist"
            )

        self.repository.delete(bookmark)

    def list_novel_bookmarks(
        self,
        current_user: User,
        novel_id: uuid.UUID,
    ) -> list[tuple[Bookmark, Chapter, Novel]]:
        self._get_public_novel(novel_id)

        return self.repository.list_by_novel(
            current_user.id,
            novel_id,
        )

    def _get_public_chapter(
        self,
        chapter_id: uuid.UUID,
    ) -> tuple[Chapter, Novel]:
        chapter = self.chapter_repository.get_active_by_id(
            chapter_id
        )

        if chapter is None or chapter.status != "published":
            raise BookmarkChapterNotAvailableError(
                "Chapter is not available"
            )

        novel = self.novel_repository.get_active_by_id(
            chapter.novel_id
        )

        if (
            novel is None
            or novel.visibility != "public"
            or novel.moderation_status != "approved"
        ):
            raise BookmarkChapterNotAvailableError(
                "Chapter is not available"
            )

        return chapter, novel
    
    def _get_public_novel(
        self,
        novel_id: uuid.UUID,
    ) -> Novel:
        novel = self.novel_repository.get_active_by_id(
            novel_id,
        )

        if (
            novel is None
            or novel.visibility != "public"
            or novel.moderation_status != "approved"
        ):
            raise BookmarkNovelNotAvailableError(
                "Novel is not available",
            )

        return novel