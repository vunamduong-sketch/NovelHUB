import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.bookmark import Bookmark
from app.models.chapter import Chapter
from app.models.novel import Novel
from app.models.user import User
from app.repositories.bookmark_repository import BookmarkRepository
from app.repositories.chapter_repository import ChapterRepository
from app.repositories.novel_repository import NovelRepository
from app.schemas.auth import MessageResponse
from app.schemas.bookmark import (
    BookmarkResponse,
    BookmarkStatusResponse,
    BookmarkUpsertRequest,
)
from app.services.bookmark_service import (
    BookmarkChapterNotAvailableError,
    BookmarkNotFoundError,
    BookmarkService,
)


router = APIRouter(tags=["bookmarks"])


def get_bookmark_service(
    db: Session = Depends(get_db),
) -> BookmarkService:
    return BookmarkService(
        BookmarkRepository(db),
        ChapterRepository(db),
        NovelRepository(db),
    )


def _bookmark_response(
    bookmark: Bookmark,
    chapter: Chapter,
    novel: Novel,
) -> BookmarkResponse:
    return BookmarkResponse(
        chapter_id=chapter.id,
        novel_id=novel.id,
        novel_title=novel.title,
        chapter_title=chapter.title,
        chapter_number=chapter.chapter_number,
        position_offset=bookmark.position_offset,
        note=bookmark.note,
        created_at=bookmark.created_at,
        updated_at=bookmark.updated_at,
    )


@router.put(
    "/chapters/{chapter_id}/bookmark",
    response_model=BookmarkResponse,
)
def save_chapter_bookmark(
    chapter_id: uuid.UUID,
    payload: BookmarkUpsertRequest,
    current_user: User = Depends(get_current_user),
    service: BookmarkService = Depends(
        get_bookmark_service
    ),
) -> BookmarkResponse:
    try:
        bookmark, chapter, novel = service.save_bookmark(
            current_user,
            chapter_id,
            position_offset=payload.position_offset,
            note=payload.note,
        )
    except BookmarkChapterNotAvailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return _bookmark_response(
        bookmark,
        chapter,
        novel,
    )


@router.get(
    "/chapters/{chapter_id}/bookmark",
    response_model=BookmarkStatusResponse,
)
def get_chapter_bookmark(
    chapter_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: BookmarkService = Depends(
        get_bookmark_service
    ),
) -> BookmarkStatusResponse:
    try:
        bookmark, chapter, novel = service.get_bookmark(
            current_user,
            chapter_id,
        )
    except BookmarkChapterNotAvailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    if bookmark is None:
        return BookmarkStatusResponse(
            is_bookmarked=False,
            bookmark=None,
        )

    return BookmarkStatusResponse(
        is_bookmarked=True,
        bookmark=_bookmark_response(
            bookmark,
            chapter,
            novel,
        ),
    )


@router.delete(
    "/chapters/{chapter_id}/bookmark",
    response_model=MessageResponse,
)
def remove_chapter_bookmark(
    chapter_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: BookmarkService = Depends(
        get_bookmark_service
    ),
) -> MessageResponse:
    try:
        service.remove_bookmark(
            current_user,
            chapter_id,
        )
    except BookmarkChapterNotAvailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except BookmarkNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return MessageResponse(
        message="Bookmark removed successfully."
    )