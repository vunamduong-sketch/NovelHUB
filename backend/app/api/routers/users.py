from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.database.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import MessageResponse
from app.schemas.user import (AvatarUpdateResponse, ChangePasswordRequest,
                              UpdateProfileRequest, UserProfileResponse)
from app.services.user_service import (AvatarUpdateError, PasswordChangeError,
                                       ProfileConflictError, UserNotFoundError,
                                       UserService)
from app.utils.avatar_storage import (AvatarStorage, AvatarStorageError,
                                      AvatarTooLargeError,
                                      AvatarValidationError,
                                      UnsupportedAvatarTypeError)

router = APIRouter(prefix="/users", tags=["users"])


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


def get_avatar_storage() -> AvatarStorage:
    return AvatarStorage(settings)


def _profile_response(user: User, roles: list[str]) -> UserProfileResponse:
    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        avatar_url=user.avatar_url,
        status=user.status,
        roles=roles,
    )


@router.get("/me", response_model=UserProfileResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
) -> UserProfileResponse:
    try:
        user, roles = service.get_my_profile(current_user)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return _profile_response(user, roles)


@router.patch("/me", response_model=UserProfileResponse)
def update_me(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
) -> UserProfileResponse:
    try:
        user, roles = service.update_my_profile(
            current_user,
            display_name=payload.display_name,
            bio=payload.bio,
            username=payload.username,
        )
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    except ProfileConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return _profile_response(user, roles)


@router.post("/me/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
) -> MessageResponse:
    try:
        service.change_my_password(current_user, payload.current_password, payload.new_password)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    except PasswordChangeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return MessageResponse(message="Password changed successfully. Please sign in again.")


@router.put("/me/avatar", response_model=AvatarUpdateResponse)
def update_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
    storage: AvatarStorage = Depends(get_avatar_storage),
) -> AvatarUpdateResponse:
    try:
        user = service.update_my_avatar(current_user, file, storage)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    except UnsupportedAvatarTypeError as exc:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=str(exc)) from exc
    except AvatarTooLargeError as exc:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(exc)) from exc
    except AvatarValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except (AvatarStorageError, AvatarUpdateError) as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
    return AvatarUpdateResponse(message="Avatar updated successfully", avatar_url=user.avatar_url or "")
