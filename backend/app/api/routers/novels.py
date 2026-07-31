import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_author
from app.database.session import get_db
from app.models.novel import Novel
from app.models.tag import Tag
from app.models.user import User
from app.repositories.novel_repository import NovelRepository
from app.schemas.auth import MessageResponse
from app.schemas.novel import CategoryResponse, NovelCreateRequest, NovelResponse, NovelUpdateRequest, TagResponse
from app.services.novel_service import (
    CategoryNotFoundError,
    NovelConflictError,
    NovelNotFoundError,
    NovelPublishError,
    NovelService,
    TagNotFoundError,
)

router = APIRouter(prefix="/novels", tags=["novels"])


def get_novel_service(db: Session = Depends(get_db)) -> NovelService:
    return NovelService(NovelRepository(db))


def _tag_response(tag: Tag) -> TagResponse:
    return TagResponse(id=tag.id, name=tag.name, slug=tag.slug)


def _novel_response(novel: Novel, tags: list[Tag], author_name: str | None = None) -> NovelResponse:
    resolved_author_name = author_name or getattr(novel, "author_name", None)
    if not resolved_author_name and hasattr(novel, "author") and novel.author:
        resolved_author_name = novel.author.display_name or novel.author.username

    return NovelResponse(
        id=str(novel.id),
        author_id=str(novel.author_id),
        author_name=resolved_author_name,
        category_id=novel.category_id,
        tags=[_tag_response(tag) for tag in tags],
        title=novel.title,
        slug=novel.slug,
        description=novel.description,
        cover_url=novel.cover_url,
        language_code=novel.language_code,
        status=novel.status,
        visibility=novel.visibility,
        moderation_status=novel.moderation_status,
        published_at=novel.published_at,
        view_count=novel.view_count,
        follower_count=novel.follower_count,
        rating_count=novel.rating_count,
        rating_average=novel.rating_average,
    )


@router.post("/", response_model=NovelResponse, status_code=status.HTTP_201_CREATED)
def create_novel(
    payload: NovelCreateRequest,
    current_user: User = Depends(require_author),
    service: NovelService = Depends(get_novel_service),
) -> NovelResponse:
    try:
        novel, tags, author_name = service.create_novel(
            current_user,
            title=payload.title,
            description=payload.description,
            category_id=payload.category_id,
            tag_ids=payload.tag_ids,
            cover_url=payload.cover_url,
            language_code=payload.language_code,
        )
    except (CategoryNotFoundError, TagNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except NovelConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return _novel_response(novel, tags, author_name=author_name)


@router.patch("/{novel_id}", response_model=NovelResponse)
def update_novel(
    novel_id: uuid.UUID,
    payload: NovelUpdateRequest,
    current_user: User = Depends(require_author),
    service: NovelService = Depends(get_novel_service),
) -> NovelResponse:
    try:
        novel, tags, author_name = service.update_novel(
            current_user,
            novel_id,
            fields=payload.model_fields_set,
            title=payload.title,
            description=payload.description,
            category_id=payload.category_id,
            tag_ids=payload.tag_ids,
            cover_url=payload.cover_url,
            status=payload.status,
        )
    except (NovelNotFoundError, CategoryNotFoundError, TagNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except NovelConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return _novel_response(novel, tags, author_name=author_name)


@router.delete("/{novel_id}", response_model=MessageResponse)
def delete_novel(
    novel_id: uuid.UUID,
    current_user: User = Depends(require_author),
    service: NovelService = Depends(get_novel_service),
) -> MessageResponse:
    try:
        service.delete_novel(current_user, novel_id)
    except NovelNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return MessageResponse(message="Novel deleted successfully.")


@router.post("/{novel_id}/publish", response_model=NovelResponse)
def publish_novel(
    novel_id: uuid.UUID,
    current_user: User = Depends(require_author),
    service: NovelService = Depends(get_novel_service),
) -> NovelResponse:
    try:
        novel, tags, author_name = service.publish_novel(current_user, novel_id)
    except NovelNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except NovelPublishError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _novel_response(novel, tags, author_name=author_name)


@router.get("/", response_model=list[NovelResponse])
def get_public_novels(
    search: str | None = None,
    category_id: int | None = None,
    status_filter: str | None = None,
    service: NovelService = Depends(get_novel_service),
) -> list[NovelResponse]:
    items = service.get_public_novels(search=search, category_id=category_id, status=status_filter)
    return [_novel_response(novel, tags, author_name=author_name) for novel, tags, author_name in items]


@router.get("/me", response_model=list[NovelResponse])
def get_my_novels(
    visibility: str | None = None,
    status_filter: str | None = None,
    current_user: User = Depends(require_author),
    service: NovelService = Depends(get_novel_service),
) -> list[NovelResponse]:
    items = service.get_author_novels(current_user, visibility=visibility, status=status_filter)
    return [_novel_response(novel, tags, author_name=author_name) for novel, tags, author_name in items]


@router.get("/categories", response_model=list[CategoryResponse])
def get_categories(
    service: NovelService = Depends(get_novel_service),
) -> list[CategoryResponse]:
    categories = service.get_categories()
    return [CategoryResponse(id=c.id, name=c.name, slug=c.slug, description=c.description) for c in categories]


@router.get("/tags", response_model=list[TagResponse])
def get_tags(
    service: NovelService = Depends(get_novel_service),
) -> list[TagResponse]:
    tags = service.get_tags()
    return [_tag_response(t) for t in tags]


@router.get("/{novel_id}", response_model=NovelResponse)
def get_novel_detail(
    novel_id: uuid.UUID,
    service: NovelService = Depends(get_novel_service),
) -> NovelResponse:
    try:
        novel, tags, author_name = service.get_public_novel(novel_id)
    except NovelNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return _novel_response(novel, tags, author_name=author_name)
