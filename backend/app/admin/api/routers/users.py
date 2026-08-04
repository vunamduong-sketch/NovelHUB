import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.admin.repositories.users_repository import AdminUsersRepository
from app.admin.schemas.users import (
    AdminUserListResponse,
    AdminUserResponse,
    AdminUserRoleUpdateRequest,
)
from app.admin.services.users_service import (
    AdminRoleNotFoundError,
    AdminSelfRoleChangeError,
    AdminUserNotFoundError,
    AdminUsersService,
)
from app.api.dependencies import require_admin
from app.database.session import get_db
from app.models.user import User

router = APIRouter(prefix="/admin/users", tags=["admin-users"])


def get_admin_users_service(db: Session = Depends(get_db)) -> AdminUsersService:
    return AdminUsersService(AdminUsersRepository(db))


def _user_response(user: User, roles: list[str]) -> AdminUserResponse:
    return AdminUserResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        avatar_url=user.avatar_url,
        status=user.status,
        roles=roles,
        email_verified_at=user.email_verified_at,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.get("", response_model=AdminUserListResponse)
def list_users(
    search: str | None = Query(default=None, max_length=320),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_admin),
    service: AdminUsersService = Depends(get_admin_users_service),
) -> AdminUserListResponse:
    users, total = service.list_users(search=search, page=page, page_size=page_size)
    return AdminUserListResponse(
        items=[_user_response(user, roles) for user, roles in users],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{user_id}", response_model=AdminUserResponse)
def get_user_detail(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    service: AdminUsersService = Depends(get_admin_users_service),
) -> AdminUserResponse:
    try:
        user, roles = service.get_user(user_id)
    except AdminUserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return _user_response(user, roles)


@router.patch("/{user_id}/roles", response_model=AdminUserResponse)
def update_user_roles(
    user_id: uuid.UUID,
    payload: AdminUserRoleUpdateRequest,
    current_admin: User = Depends(require_admin),
    service: AdminUsersService = Depends(get_admin_users_service),
) -> AdminUserResponse:
    try:
        user, roles = service.update_user_roles(
            user_id=user_id,
            role_codes=payload.roles,
            current_admin=current_admin,
        )
    except AdminUserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except AdminRoleNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    except AdminSelfRoleChangeError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return _user_response(user, roles)
