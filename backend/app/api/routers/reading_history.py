import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.chapter import Chapter
from app.models.novel import Novel
from app.models.reading_history import ReadingHistory
from app.models.user import User
from app.repositories.chapter_repository import ChapterRepository
from app.repositories.novel_repository import NovelRepository
from app.repositories.reading_history_repository import ReadingHistoryRepository
from app.schemas.reading_history import (
    ReadingHistoryResponse,
    ReadingProgressRequest,
)
from app.services.reading_history_service import (
    ReadingHistoryChapterNotAvailableError,
    ReadingHistoryService,
)

router = APIRouter(tags=["reading history"])


def get_reading_history_service(
    db: Session = Depends(get_db),
) -> ReadingHistoryService:
    return ReadingHistoryService(
        ReadingHistoryRepository(db),
        ChapterRepository(db),
        NovelRepository(db),
    )


def _history_response(
    history: ReadingHistory,
    novel: Novel,
    chapter: Chapter | None,
) -> ReadingHistoryResponse:
    return ReadingHistoryResponse(
        novel_id=novel.id,
        novel_title=novel.title,
        cover_url=novel.cover_url,
        chapter_id=chapter.id if chapter else None,
        chapter_title=chapter.title if chapter else None,
        chapter_number=chapter.chapter_number if chapter else None,
        position_offset=history.position_offset,
        progress_percent=history.progress_percent,
        first_read_at=history.first_read_at,
        last_read_at=history.last_read_at,
    )


@router.put(
    "/chapters/{chapter_id}/reading-progress",
    response_model=ReadingHistoryResponse,
)
def record_reading_progress(
    chapter_id: uuid.UUID,
    payload: ReadingProgressRequest,
    current_user: User = Depends(get_current_user),
    service: ReadingHistoryService = Depends(
        get_reading_history_service,
    ),
) -> ReadingHistoryResponse:
    try:
        history, novel, chapter = service.record_progress(
            current_user,
            chapter_id,
            position_offset=payload.position_offset,
            progress_percent=payload.progress_percent,
        )
    except ReadingHistoryChapterNotAvailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return _history_response(
        history,
        novel,
        chapter,
    )


@router.get(
    "/reading-history",
    response_model=list[ReadingHistoryResponse],
)
def list_reading_history(
    current_user: User = Depends(get_current_user),
    service: ReadingHistoryService = Depends(
        get_reading_history_service,
    ),
) -> list[ReadingHistoryResponse]:
    return [
        _history_response(history, novel, chapter)
        for history, novel, chapter in service.list_history(
            current_user,
        )
    ]