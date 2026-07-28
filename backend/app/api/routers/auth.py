import ipaddress

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.repositories.auth_repository import AuthRepository
from app.schemas.auth import (LoginRequest, MessageResponse, PasswordResetConfirmRequest,
                              PasswordResetRequest, PasswordResetRequestResponse,
                              RefreshRequest, RegisterRequest, TokenResponse, UserResponse)
from app.services.auth_service import (AuthService, AuthenticationError, ConflictError,
                                       ResetTokenError)

router = APIRouter(prefix="/auth", tags=["authentication"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(AuthRepository(db), settings)


def _client_context(request: Request) -> tuple[str | None, str | None]:
    ip_address = request.client.host if request.client else None
    try:
        ip_address = str(ipaddress.ip_address(ip_address)) if ip_address else None
    except ValueError:
        ip_address = None
    return request.headers.get("user-agent"), ip_address


def _user_response(user, roles: list[str]) -> UserResponse:
    return UserResponse(id=str(user.id), email=user.email, username=user.username, status=user.status, roles=roles)


def _token_response(access_token: str, refresh_token: str, expires_at, user, roles: list[str]) -> TokenResponse:
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, expires_at=expires_at, user=_user_response(user, roles))


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, service: AuthService = Depends(get_auth_service)) -> UserResponse:
    try:
        user = service.register(payload.email, payload.username, payload.password)
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return _user_response(user, ["reader"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, service: AuthService = Depends(get_auth_service)) -> TokenResponse:
    try:
        access_token, refresh_token, expires_at, user, roles = service.login(payload.identity, payload.password, *_client_context(request))
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials") from exc
    return _token_response(access_token, refresh_token, expires_at, user, roles)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, request: Request, service: AuthService = Depends(get_auth_service)) -> TokenResponse:
    try:
        access_token, refresh_token, expires_at, user, roles = service.refresh(payload.refresh_token, *_client_context(request))
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token") from exc
    return _token_response(access_token, refresh_token, expires_at, user, roles)


@router.post("/logout", response_model=MessageResponse)
def logout(payload: RefreshRequest, service: AuthService = Depends(get_auth_service)) -> MessageResponse:
    service.logout(payload.refresh_token)
    return MessageResponse(message="Logged out. The refresh token was revoked; any existing access token remains valid until it expires.")


@router.post("/password-reset/request", response_model=PasswordResetRequestResponse, status_code=status.HTTP_202_ACCEPTED)
def request_password_reset(payload: PasswordResetRequest, service: AuthService = Depends(get_auth_service)) -> PasswordResetRequestResponse:
    token = service.request_password_reset(payload.email)
    return PasswordResetRequestResponse(
        message="If the account exists, password reset instructions have been sent.",
        debug_reset_token=token if settings.environment.lower() == "development" else None,
    )


@router.post("/password-reset/confirm", response_model=MessageResponse)
def confirm_password_reset(payload: PasswordResetConfirmRequest, service: AuthService = Depends(get_auth_service)) -> MessageResponse:
    try:
        service.confirm_password_reset(payload.token, payload.new_password)
    except ResetTokenError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return MessageResponse(message="Password has been reset successfully.")
