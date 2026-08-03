import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.admin.repositories.novels_repository import (
    AdminNovelRecord,
    AdminNovelsRepository,
)
from app.admin.schemas.novels import AdminNovelListResponse, AdminNovelResponse
from app.admin.services.novels_service import (
    AdminNovelNotFoundError,
    AdminNovelsService,
)
from app.api.dependencies import require_admin
from app.database.session import get_db
from app.models.user import User

router = APIRouter(prefix="/admin/novels", tags=["admin-novels"])


def get_admin_novels_service(db: Session = Depends(get_db)) -> AdminNovelsService:
    return AdminNovelsService(AdminNovelsRepository(db))


def _novel_response(record: AdminNovelRecord) -> AdminNovelResponse:
    novel = record.novel
    return AdminNovelResponse(
        id=str(novel.id),
        author_id=str(novel.author_id),
        author_name=record.author_name,
        category_id=novel.category_id,
        category_name=record.category_name,
        title=novel.title,
        slug=novel.slug,
        description=novel.description,
        cover_url=novel.cover_url,
        language_code=novel.language_code,
        status=novel.status,
        visibility=novel.visibility,
        moderation_status=novel.moderation_status,
        published_at=novel.published_at,
        completed_at=novel.completed_at,
        view_count=novel.view_count,
        follower_count=novel.follower_count,
        rating_count=novel.rating_count,
        rating_average=novel.rating_average,
        created_at=novel.created_at,
        updated_at=novel.updated_at,
    )


@router.get("", response_model=AdminNovelListResponse)
def list_novels(
    search: str | None = Query(default=None, max_length=250),
    status_filter: Literal["draft", "ongoing", "hiatus", "completed"] | None = Query(
        default=None, alias="status"
    ),
    visibility: Literal["public", "private"] | None = Query(default=None),
    moderation_status: Literal["pending", "approved", "rejected", "hidden"]
    | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_admin),
    service: AdminNovelsService = Depends(get_admin_novels_service),
) -> AdminNovelListResponse:
    novels, total = service.list_novels(
        search=search,
        status=status_filter,
        visibility=visibility,
        moderation_status=moderation_status,
        page=page,
        page_size=page_size,
    )
    return AdminNovelListResponse(
        items=[_novel_response(novel) for novel in novels],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{novel_id}", response_model=AdminNovelResponse)
def get_novel_detail(
    novel_id: uuid.UUID,
    _: User = Depends(require_admin),
    service: AdminNovelsService = Depends(get_admin_novels_service),
) -> AdminNovelResponse:
    try:
        novel = service.get_novel(novel_id)
    except AdminNovelNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return _novel_response(novel)
