from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.admin.repositories.tags_repository import AdminTagsRepository
from app.admin.schemas.tags import (
    AdminTagCreateRequest,
    AdminTagResponse,
    AdminTagUpdateRequest,
)
from app.admin.services.tags_service import (
    AdminTagConflictError,
    AdminTagNotFoundError,
    AdminTagsService,
)
from app.api.dependencies import require_admin
from app.database.session import get_db
from app.models.tag import Tag
from app.models.user import User
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/admin/tags", tags=["admin-tags"])


def get_admin_tags_service(db: Session = Depends(get_db)) -> AdminTagsService:
    return AdminTagsService(AdminTagsRepository(db))


def _tag_response(tag: Tag) -> AdminTagResponse:
    return AdminTagResponse(
        id=tag.id,
        name=tag.name,
        slug=tag.slug,
        created_at=tag.created_at,
    )


@router.get("", response_model=list[AdminTagResponse])
def list_tags(
    _: User = Depends(require_admin),
    service: AdminTagsService = Depends(get_admin_tags_service),
) -> list[AdminTagResponse]:
    return [_tag_response(item) for item in service.list_tags()]


@router.post("", response_model=AdminTagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(
    payload: AdminTagCreateRequest,
    _: User = Depends(require_admin),
    service: AdminTagsService = Depends(get_admin_tags_service),
) -> AdminTagResponse:
    try:
        tag = service.create_tag(name=payload.name, slug=payload.slug)
    except AdminTagConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return _tag_response(tag)


@router.patch("/{tag_id}", response_model=AdminTagResponse)
def update_tag(
    tag_id: int,
    payload: AdminTagUpdateRequest,
    _: User = Depends(require_admin),
    service: AdminTagsService = Depends(get_admin_tags_service),
) -> AdminTagResponse:
    try:
        tag = service.update_tag(
            tag_id,
            fields=payload.model_fields_set,
            name=payload.name,
            slug=payload.slug,
        )
    except AdminTagNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except AdminTagConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return _tag_response(tag)


@router.delete("/{tag_id}", response_model=MessageResponse)
def delete_tag(
    tag_id: int,
    _: User = Depends(require_admin),
    service: AdminTagsService = Depends(get_admin_tags_service),
) -> MessageResponse:
    try:
        service.delete_tag(tag_id)
    except AdminTagNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except AdminTagConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return MessageResponse(message="Tag deleted successfully.")
