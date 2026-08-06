import uuid
from decimal import Decimal

from app.models.chapter import Chapter
from app.models.novel import Novel
from app.models.reading_history import ReadingHistory
from app.models.user import User
from app.repositories.chapter_repository import ChapterRepository
from app.repositories.novel_repository import NovelRepository
from app.repositories.reading_history_repository import ReadingHistoryRepository


class ReadingHistoryChapterNotAvailableError(Exception):
    pass


class ReadingHistoryService:
    def __init__(
        self,
        repository: ReadingHistoryRepository,
        chapter_repository: ChapterRepository,
        novel_repository: NovelRepository,
    ) -> None:
        self.repository = repository
        self.chapter_repository = chapter_repository
        self.novel_repository = novel_repository

    def record_progress(
        self,
        current_user: User,
        chapter_id: uuid.UUID,
        *,
        position_offset: int,
        progress_percent: Decimal,
    ) -> tuple[ReadingHistory, Novel, Chapter]:
        chapter, novel = self._get_public_chapter(chapter_id)

        history = self.repository.upsert(
            current_user.id,
            novel.id,
            chapter.id,
            position_offset=position_offset,
            progress_percent=progress_percent,
        )

        return history, novel, chapter

    def list_history(
        self,
        current_user: User,
    ) -> list[tuple[ReadingHistory, Novel, Chapter | None]]:
        return self.repository.list_recent(current_user.id)

    def _get_public_chapter(
        self,
        chapter_id: uuid.UUID,
    ) -> tuple[Chapter, Novel]:
        chapter = self.chapter_repository.get_active_by_id(chapter_id)

        if chapter is None or chapter.status != "published":
            raise ReadingHistoryChapterNotAvailableError(
                "Chapter is not available",
            )

        novel = self.novel_repository.get_active_by_id(
            chapter.novel_id,
        )

        if (
            novel is None
            or novel.visibility != "public"
            or novel.moderation_status != "approved"
        ):
            raise ReadingHistoryChapterNotAvailableError(
                "Chapter is not available",
            )

        return chapter, novel