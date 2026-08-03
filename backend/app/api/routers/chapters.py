import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.api.dependencies import require_author
from app.database.session import get_db
from app.models.chapter import Chapter
from app.models.user import User
from app.repositories.chapter_repository import ChapterRepository
from app.repositories.novel_repository import NovelRepository
from app.schemas.auth import MessageResponse
from app.schemas.chapter import (
    ChapterCreateRequest,
    ChapterDetailResponse,
    ChapterResponse,
    ChapterUpdateRequest,
)
from app.services.chapter_service import (
    ChapterConflictError,
    ChapterNotFoundError,
    ChapterPublishError,
    ChapterService,
    NovelNotFoundError,
    PermissionDeniedError,
)

router = APIRouter(tags=["chapters"])


def get_chapter_service(db: Session = Depends(get_db)) -> ChapterService:
    return ChapterService(ChapterRepository(db), NovelRepository(db))


def _chapter_response(chapter: Chapter) -> ChapterResponse:
    return ChapterResponse(
        id=chapter.id,
        novel_id=chapter.novel_id,
        title=chapter.title,
        slug=chapter.slug,
        chapter_number=chapter.chapter_number,
        summary=chapter.summary,
        word_count=chapter.word_count,
        status=chapter.status,
        published_at=chapter.published_at,
        view_count=chapter.view_count,
        created_at=chapter.created_at,
        updated_at=chapter.updated_at,
    )


def _chapter_detail_response(chapter: Chapter) -> ChapterDetailResponse:
    return ChapterDetailResponse(
        id=chapter.id,
        novel_id=chapter.novel_id,
        title=chapter.title,
        slug=chapter.slug,
        chapter_number=chapter.chapter_number,
        summary=chapter.summary,
        word_count=chapter.word_count,
        status=chapter.status,
        published_at=chapter.published_at,
        view_count=chapter.view_count,
        created_at=chapter.created_at,
        updated_at=chapter.updated_at,
        content=chapter.content,
    )


@router.post("/novels/{novel_id}/chapters", response_model=ChapterDetailResponse, status_code=status.HTTP_201_CREATED)
def create_chapter(
    novel_id: uuid.UUID,
    payload: ChapterCreateRequest,
    current_user: User = Depends(require_author),
    service: ChapterService = Depends(get_chapter_service),
) -> ChapterDetailResponse:
    try:
        chapter = service.create_chapter(
            current_user,
            novel_id,
            title=payload.title,
            chapter_number=payload.chapter_number,
            content=payload.content,
            summary=payload.summary,
            status=payload.status,
        )
    except NovelNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionDeniedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ChapterConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return _chapter_detail_response(chapter)


@router.get("/novels/{novel_id}/chapters", response_model=list[ChapterResponse])
def get_chapters(
    novel_id: uuid.UUID,
    service: ChapterService = Depends(get_chapter_service),
) -> list[ChapterResponse]:
    try:
        chapters = service.get_public_chapters(novel_id)
    except NovelNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return [_chapter_response(c) for c in chapters]


@router.get("/novels/{novel_id}/chapters/me", response_model=list[ChapterResponse])
def get_my_chapters(
    novel_id: uuid.UUID,
    current_user: User = Depends(require_author),
    service: ChapterService = Depends(get_chapter_service),
) -> list[ChapterResponse]:
    try:
        chapters = service.get_author_chapters(current_user, novel_id)
    except NovelNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionDeniedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    return [_chapter_response(c) for c in chapters]


@router.get("/chapters/{chapter_id}", response_model=ChapterDetailResponse)
def get_chapter_detail(
    chapter_id: uuid.UUID,
    service: ChapterService = Depends(get_chapter_service),
) -> ChapterDetailResponse:
    try:
        chapter = service.get_public_chapter_detail(chapter_id)
    except (ChapterNotFoundError, NovelNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return _chapter_detail_response(chapter)


@router.get("/chapters/{chapter_id}/author", response_model=ChapterDetailResponse)
def get_author_chapter_detail(
    chapter_id: uuid.UUID,
    current_user: User = Depends(require_author),
    service: ChapterService = Depends(get_chapter_service),
) -> ChapterDetailResponse:
    try:
        chapter = service.get_author_chapter_detail(current_user, chapter_id)
    except (ChapterNotFoundError, NovelNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionDeniedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    return _chapter_detail_response(chapter)


@router.patch("/chapters/{chapter_id}", response_model=ChapterDetailResponse)
def update_chapter(
    chapter_id: uuid.UUID,
    payload: ChapterUpdateRequest,
    current_user: User = Depends(require_author),
    service: ChapterService = Depends(get_chapter_service),
) -> ChapterDetailResponse:
    try:
        chapter = service.update_chapter(
            current_user,
            chapter_id,
            fields=payload.model_fields_set,
            title=payload.title,
            chapter_number=payload.chapter_number,
            content=payload.content,
            summary=payload.summary,
            status=payload.status,
        )
    except (ChapterNotFoundError, NovelNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionDeniedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ChapterConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return _chapter_detail_response(chapter)


@router.delete("/chapters/{chapter_id}", response_model=MessageResponse)
def delete_chapter(
    chapter_id: uuid.UUID,
    current_user: User = Depends(require_author),
    service: ChapterService = Depends(get_chapter_service),
) -> MessageResponse:
    try:
        service.delete_chapter(current_user, chapter_id)
    except (ChapterNotFoundError, NovelNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionDeniedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    return MessageResponse(message="Chapter deleted successfully.")


@router.post("/chapters/{chapter_id}/publish", response_model=ChapterResponse)
def publish_chapter(
    chapter_id: uuid.UUID,
    current_user: User = Depends(require_author),
    service: ChapterService = Depends(get_chapter_service),
) -> ChapterResponse:
    try:
        chapter = service.publish_chapter(current_user, chapter_id)
    except (ChapterNotFoundError, NovelNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionDeniedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ChapterPublishError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _chapter_response(chapter)
