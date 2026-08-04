"""Runs against an explicitly supplied disposable PostgreSQL database."""
import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select, text

if not os.getenv("NOVELHUB_TEST_DATABASE_URL"):
    pytest.skip(
        "Set NOVELHUB_TEST_DATABASE_URL to run PostgreSQL integration tests",
        allow_module_level=True,
    )

os.environ["DATABASE_URL"] = os.environ["NOVELHUB_TEST_DATABASE_URL"]

from app.database.base import Base  # noqa: E402
from app.database.session import SessionLocal  # noqa: E402
from app.models.novel import Novel  # noqa: E402
from app.models.refresh_token import RefreshToken  # noqa: E402
from app.models.role import Role  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.user_role import UserRole  # noqa: E402
import app.models  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture(autouse=True)
def _ensure_database_ready():
    try:
        with SessionLocal.kw["bind"].connect() as connection:
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
            connection.commit()
        Base.metadata.create_all(bind=SessionLocal.kw["bind"], checkfirst=True)
        with SessionLocal() as session:
            for code, name in (
                ("reader", "Reader"),
                ("author", "Author"),
                ("admin", "Administrator"),
            ):
                if session.scalar(select(Role).where(Role.code == code)) is None:
                    session.add(Role(code=code, name=name))
            session.commit()
    except Exception as exc:  # pragma: no cover
        pytest.skip(f"PostgreSQL integration test skipped: {exc}")


@pytest.fixture
def api():
    emails: list[str] = []
    with TestClient(app) as client:
        yield client, emails
    with SessionLocal() as session:
        user_ids = list(session.scalars(select(User.id).where(User.email.in_(emails))))
        if user_ids:
            session.execute(delete(Novel).where(Novel.author_id.in_(user_ids)))
            session.execute(delete(RefreshToken).where(RefreshToken.user_id.in_(user_ids)))
            session.execute(delete(UserRole).where(UserRole.user_id.in_(user_ids)))
            session.execute(delete(User).where(User.id.in_(user_ids)))
            session.commit()


def _register_and_login(
    client: TestClient, emails: list[str], prefix: str
) -> tuple[str, str, str]:
    email = f"{prefix}-{uuid.uuid4().hex}@example.com"
    username = f"{prefix}{uuid.uuid4().hex[:12]}"
    password = "StrongPassword1!"
    emails.append(email)
    registered = client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": password},
    )
    assert registered.status_code == 201
    logged_in = client.post(
        "/api/v1/auth/login", json={"identity": email, "password": password}
    )
    assert logged_in.status_code == 200
    return email, username, logged_in.json()["access_token"]


def _grant_role(email: str, role_code: str) -> None:
    with SessionLocal() as session:
        user = session.scalar(select(User).where(User.email == email))
        role = session.scalar(select(Role).where(Role.code == role_code))
        assert user is not None and role is not None
        if session.get(UserRole, {"user_id": user.id, "role_id": role.id}) is None:
            session.add(UserRole(user_id=user.id, role_id=role.id))
            session.commit()


def test_admin_can_manage_users_and_view_all_novels(api) -> None:
    client, emails = api
    admin_email, _, admin_token = _register_and_login(client, emails, "adminapi")
    target_email, target_username, _ = _register_and_login(client, emails, "targetapi")
    author_email, _, author_token = _register_and_login(client, emails, "authorapi")
    _grant_role(admin_email, "admin")
    _grant_role(author_email, "author")

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    author_headers = {"Authorization": f"Bearer {author_token}"}

    denied = client.get("/api/v1/admin/users", headers=author_headers)
    assert denied.status_code == 403

    users = client.get(
        "/api/v1/admin/users",
        params={"search": target_username, "page": 1, "page_size": 10},
        headers=admin_headers,
    )
    assert users.status_code == 200
    assert users.json()["total"] == 1
    target = users.json()["items"][0]
    assert target["email"] == target_email
    assert target["roles"] == ["reader"]

    detail = client.get(f"/api/v1/admin/users/{target['id']}", headers=admin_headers)
    assert detail.status_code == 200
    assert detail.json()["username"] == target_username

    changed = client.patch(
        f"/api/v1/admin/users/{target['id']}/roles",
        json={"roles": ["reader", "author", "author"]},
        headers=admin_headers,
    )
    assert changed.status_code == 200
    assert changed.json()["roles"] == ["reader", "author"]

    created = client.post(
        "/api/v1/novels/",
        json={"title": f"Private Admin Search {uuid.uuid4().hex}"},
        headers=author_headers,
    )
    assert created.status_code == 201
    novel = created.json()
    assert novel["visibility"] == "private"

    novels = client.get(
        "/api/v1/admin/novels",
        params={"search": "Private Admin Search", "visibility": "private"},
        headers=admin_headers,
    )
    assert novels.status_code == 200
    assert any(item["id"] == novel["id"] for item in novels.json()["items"])

    novel_detail = client.get(
        f"/api/v1/admin/novels/{novel['id']}", headers=admin_headers
    )
    assert novel_detail.status_code == 200
    assert novel_detail.json()["title"] == novel["title"]
    assert novel_detail.json()["author_name"] is not None


def test_admin_can_create_update_and_delete_categories_and_tags(api) -> None:
    client, emails = api
    admin_email, _, admin_token = _register_and_login(client, emails, "taxonomyadmin")
    _grant_role(admin_email, "admin")
    headers = {"Authorization": f"Bearer {admin_token}"}
    unique = uuid.uuid4().hex[:12]

    category_created = client.post(
        "/api/v1/admin/categories",
        json={
            "name": f"Thể loại {unique}",
            "description": "Mô tả ban đầu",
            "is_active": True,
        },
        headers=headers,
    )
    assert category_created.status_code == 201
    category = category_created.json()
    assert category["slug"] == f"the-loai-{unique}"

    duplicate_category = client.post(
        "/api/v1/admin/categories",
        json={"name": category["name"], "slug": f"another-{unique}"},
        headers=headers,
    )
    assert duplicate_category.status_code == 409

    category_updated = client.patch(
        f"/api/v1/admin/categories/{category['id']}",
        json={"description": "Mô tả đã sửa", "is_active": False},
        headers=headers,
    )
    assert category_updated.status_code == 200
    assert category_updated.json()["description"] == "Mô tả đã sửa"
    assert category_updated.json()["is_active"] is False

    categories = client.get("/api/v1/admin/categories", headers=headers)
    assert categories.status_code == 200
    assert any(item["id"] == category["id"] for item in categories.json())

    tag_created = client.post(
        "/api/v1/admin/tags",
        json={"name": f"Nhãn {unique}"},
        headers=headers,
    )
    assert tag_created.status_code == 201
    tag = tag_created.json()
    assert tag["slug"] == f"nhan-{unique}"

    duplicate_tag = client.post(
        "/api/v1/admin/tags",
        json={"name": tag["name"].upper(), "slug": f"different-{unique}"},
        headers=headers,
    )
    assert duplicate_tag.status_code == 409

    tag_updated = client.patch(
        f"/api/v1/admin/tags/{tag['id']}",
        json={"name": f"Nhãn cập nhật {unique}", "slug": f"updated-{unique}"},
        headers=headers,
    )
    assert tag_updated.status_code == 200
    assert tag_updated.json()["slug"] == f"updated-{unique}"

    tags = client.get("/api/v1/admin/tags", headers=headers)
    assert tags.status_code == 200
    assert any(item["id"] == tag["id"] for item in tags.json())

    tag_deleted = client.delete(f"/api/v1/admin/tags/{tag['id']}", headers=headers)
    assert tag_deleted.status_code == 200
    assert client.delete(f"/api/v1/admin/tags/{tag['id']}", headers=headers).status_code == 404

    category_deleted = client.delete(
        f"/api/v1/admin/categories/{category['id']}", headers=headers
    )
    assert category_deleted.status_code == 200
    assert client.delete(
        f"/api/v1/admin/categories/{category['id']}", headers=headers
    ).status_code == 404
