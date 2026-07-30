import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database.session import get_db
from app.models.user import User
from app.repositories.auth_repository import AuthRepository

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    from app.core.config import settings
    try:
        payload = decode_token(credentials.credentials, "access", settings)
        user_id = uuid.UUID(payload["sub"])
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token") from exc
    user = AuthRepository(db).get_user_by_id(user_id)
    if user is None or user.status != "active" or user.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is not available")
    return user


def require_author(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    roles = AuthRepository(db).get_role_codes(current_user.id)
    if "author" not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Author role required")
    return current_user
