"""Runs against a PostgreSQL database, using a local fallback when no explicit test URL is provided."""
import os
import tempfile
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

_test_database_url = os.getenv("NOVELHUB_TEST_DATABASE_URL") or os.getenv("DATABASE_URL")
if not _test_database_url:
    pytest.skip(
        "Set NOVELHUB_TEST_DATABASE_URL or DATABASE_URL to run PostgreSQL integration tests",
        allow_module_level=True,
    )
os.environ["DATABASE_URL"] = _test_database_url
os.environ["NOVELHUB_TEST_DATABASE_URL"] = _test_database_url

_avatar_root = Path(tempfile.mkdtemp(prefix="novelhub-avatar-test-"))
os.environ["AVATAR_UPLOAD_DIR"] = str(_avatar_root)
os.environ["AVATAR_PUBLIC_URL_PREFIX"] = "/uploads/avatars"
os.environ["AVATAR_MAX_SIZE_BYTES"] = "2097152"

from app.database.base import Base  # noqa: E402
from app.database.session import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402
import app.models  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture(autouse=True)
def _ensure_database_ready():
    try:
        Base.metadata.create_all(bind=SessionLocal.kw["bind"], checkfirst=True)
    except Exception as exc:  # pragma: no cover - exercised when database unavailable
        pytest.skip(f"PostgreSQL integration test skipped: {exc}")


@pytest.fixture
def api():
    email = f"user-{uuid.uuid4().hex}@example.com"
    username = f"reader{uuid.uuid4().hex[:12]}"
    with TestClient(app) as test_client:
        yield test_client, email, username
    with SessionLocal() as session:
        session.execute(delete(User).where(User.email == email))
        session.commit()
    if _avatar_root.exists():
        for path in _avatar_root.glob("*"):
            if path.is_file():
                path.unlink()
        _avatar_root.rmdir()


def _register_and_login(client: TestClient, email: str, username: str, password: str = "StrongPassword1!") -> tuple[str, str]:
    register = client.post("/api/v1/auth/register", json={"email": email, "username": username, "password": password})
    assert register.status_code == 201

    login = client.post("/api/v1/auth/login", json={"identity": email, "password": password})
    assert login.status_code == 200
    token_payload = login.json()
    return token_payload["access_token"], token_payload["refresh_token"]


def test_user_profile_password_and_avatar_flow(api) -> None:
    client, email, username = api
    access_token, refresh_token = _register_and_login(client, email, username)
    headers = {"Authorization": f"Bearer {access_token}"}

    me = client.get("/api/v1/users/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["roles"] == ["reader"]
    assert me.json()["username"] == username

    updated = client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={"display_name": "Reader One", "bio": "I love fantasy novels.", "username": f"{username}x"},
    )
    assert updated.status_code == 200
    assert updated.json()["display_name"] == "Reader One"
    assert updated.json()["bio"] == "I love fantasy novels."
    assert updated.json()["username"] == f"{username}x"

    change_password = client.post(
        "/api/v1/users/me/change-password",
        headers=headers,
        json={"current_password": "StrongPassword1!", "new_password": "ChangedPassword1!"},
    )
    assert change_password.status_code == 200

    assert client.post("/api/v1/auth/login", json={"identity": email, "password": "StrongPassword1!"}).status_code == 401

    relogin = client.post("/api/v1/auth/login", json={"identity": email, "password": "ChangedPassword1!"})
    assert relogin.status_code == 200
    new_access_token = relogin.json()["access_token"]
    new_refresh_token = relogin.json()["refresh_token"]
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token}).status_code == 401

    avatar_one = client.put(
        "/api/v1/users/me/avatar",
        headers={"Authorization": f"Bearer {new_access_token}"},
        files={"file": ("avatar-one.png", b"avatar-one-bytes", "image/png")},
    )
    assert avatar_one.status_code == 200
    first_avatar_url = avatar_one.json()["avatar_url"]
    assert first_avatar_url.startswith("/uploads/avatars/")
    first_avatar_path = _avatar_root / first_avatar_url.rsplit("/", 1)[-1]
    assert first_avatar_path.exists()

    avatar_two = client.put(
        "/api/v1/users/me/avatar",
        headers={"Authorization": f"Bearer {new_access_token}"},
        files={"file": ("avatar-two.jpg", b"avatar-two-bytes", "image/jpeg")},
    )
    assert avatar_two.status_code == 200
    second_avatar_url = avatar_two.json()["avatar_url"]
    assert second_avatar_url.startswith("/uploads/avatars/")
    second_avatar_path = _avatar_root / second_avatar_url.rsplit("/", 1)[-1]
    assert second_avatar_path.exists()
    assert not first_avatar_path.exists()

    refresh_after_password_change = client.post("/api/v1/auth/refresh", json={"refresh_token": new_refresh_token})
    assert refresh_after_password_change.status_code == 200


def test_user_profile_conflict_and_avatar_validation(api) -> None:
    client, email, username = api
    access_token, _ = _register_and_login(client, email, username)
    headers = {"Authorization": f"Bearer {access_token}"}

    other_email = f"other-{uuid.uuid4().hex}@example.com"
    other_username = f"other{uuid.uuid4().hex[:12]}"
    _register_and_login(client, other_email, other_username)

    conflict = client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={"username": other_username},
    )
    assert conflict.status_code == 409

    invalid_avatar = client.put(
        "/api/v1/users/me/avatar",
        headers=headers,
        files={"file": ("avatar.txt", b"not-an-image", "text/plain")},
    )
    assert invalid_avatar.status_code == 415
