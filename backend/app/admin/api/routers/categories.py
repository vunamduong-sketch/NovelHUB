from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.admin.repositories.categories_repository import AdminCategoriesRepository
from app.admin.schemas.categories import (
    AdminCategoryCreateRequest,
    AdminCategoryResponse,
    AdminCategoryUpdateRequest,
)
from app.admin.services.categories_service import (
    AdminCategoriesService,
    AdminCategoryConflictError,
    AdminCategoryNotFoundError,
)
from app.api.dependencies import require_admin
from app.database.session import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/admin/categories", tags=["admin-categories"])


def get_admin_categories_service(
    db: Session = Depends(get_db),
) -> AdminCategoriesService:
    return AdminCategoriesService(AdminCategoriesRepository(db))


def _category_response(category: Category) -> AdminCategoryResponse:
    return AdminCategoryResponse(
        id=category.id,
        name=category.name,
        slug=category.slug,
        description=category.description,
        is_active=category.is_active,
        created_at=category.created_at,
        updated_at=category.updated_at,
    )


@router.get("", response_model=list[AdminCategoryResponse])
def list_categories(
    _: User = Depends(require_admin),
    service: AdminCategoriesService = Depends(get_admin_categories_service),
) -> list[AdminCategoryResponse]:
    return [_category_response(item) for item in service.list_categories()]


@router.post("", response_model=AdminCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: AdminCategoryCreateRequest,
    _: User = Depends(require_admin),
    service: AdminCategoriesService = Depends(get_admin_categories_service),
) -> AdminCategoryResponse:
    try:
        category = service.create_category(
            name=payload.name,
            slug=payload.slug,
            description=payload.description,
            is_active=payload.is_active,
        )
    except AdminCategoryConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return _category_response(category)


@router.patch("/{category_id}", response_model=AdminCategoryResponse)
def update_category(
    category_id: int,
    payload: AdminCategoryUpdateRequest,
    _: User = Depends(require_admin),
    service: AdminCategoriesService = Depends(get_admin_categories_service),
) -> AdminCategoryResponse:
    try:
        category = service.update_category(
            category_id,
            fields=payload.model_fields_set,
            name=payload.name,
            slug=payload.slug,
            description=payload.description,
            is_active=payload.is_active,
        )
    except AdminCategoryNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except AdminCategoryConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return _category_response(category)


@router.delete("/{category_id}", response_model=MessageResponse)
def delete_category(
    category_id: int,
    _: User = Depends(require_admin),
    service: AdminCategoriesService = Depends(get_admin_categories_service),
) -> MessageResponse:
    try:
        service.delete_category(category_id)
    except AdminCategoryNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except AdminCategoryConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return MessageResponse(message="Category deleted successfully.")
