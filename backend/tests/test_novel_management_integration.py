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
from app.models.role import Role  # noqa: E402
from app.models.tag import Tag  # noqa: E402
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
    except Exception as exc:  # pragma: no cover - exercised when database unavailable
        pytest.skip(f"PostgreSQL integration test skipped: {exc}")


@pytest.fixture
def api():
    emails: list[str] = []
    tag_slugs: list[str] = []
    with TestClient(app) as test_client:
        yield test_client, emails, tag_slugs
    with SessionLocal() as session:
        user_ids = list(session.scalars(select(User.id).where(User.email.in_(emails)))) if emails else []
        if user_ids:
            session.execute(delete(Novel).where(Novel.author_id.in_(user_ids)))
            session.execute(delete(UserRole).where(UserRole.user_id.in_(user_ids)))
            session.execute(delete(User).where(User.id.in_(user_ids)))
        if tag_slugs:
            session.execute(delete(Tag).where(Tag.slug.in_(tag_slugs)))
        if user_ids or tag_slugs:
            session.commit()


def _register_and_login(client: TestClient, emails: list[str], username_prefix: str) -> tuple[str, str]:
    email = f"{username_prefix}-{uuid.uuid4().hex}@example.com"
    username = f"{username_prefix}{uuid.uuid4().hex[:12]}"
    password = "StrongPassword1!"
    emails.append(email)

    register = client.post("/api/v1/auth/register", json={"email": email, "username": username, "password": password})
    assert register.status_code == 201

    login = client.post("/api/v1/auth/login", json={"identity": email, "password": password})
    assert login.status_code == 200
    return email, login.json()["access_token"]


def _grant_author_role(email: str) -> None:
    with SessionLocal() as session:
        user = session.scalar(select(User).where(User.email == email))
        author_role = session.scalar(select(Role).where(Role.code == "author"))
        assert user is not None
        assert author_role is not None
        if session.get(UserRole, {"user_id": user.id, "role_id": author_role.id}) is None:
            session.add(UserRole(user_id=user.id, role_id=author_role.id))
            session.commit()


def _create_tags(tag_slugs: list[str], count: int = 2) -> list[int]:
    with SessionLocal() as session:
        tags: list[Tag] = []
        for index in range(count):
            slug = f"novel-test-{uuid.uuid4().hex[:12]}"
            tag_slugs.append(slug)
            tag = Tag(name=f"Novel Test Tag {index} {uuid.uuid4().hex[:6]}", slug=slug)
            session.add(tag)
            tags.append(tag)
        session.commit()
        for tag in tags:
            session.refresh(tag)
        return [tag.id for tag in tags]


def test_author_can_create_update_publish_delete_and_reader_can_view_public_novel(api) -> None:
    client, emails, tag_slugs = api
    author_email, author_token = _register_and_login(client, emails, "author")
    _grant_author_role(author_email)
    first_tag_id, second_tag_id = _create_tags(tag_slugs)
    author_headers = {"Authorization": f"Bearer {author_token}"}

    created = client.post(
        "/api/v1/novels/",
        headers=author_headers,
        json={"title": "  Demo Novel  ", "description": "First draft", "tag_ids": [first_tag_id, second_tag_id]},
    )
    assert created.status_code == 201
    novel = created.json()
    assert novel["title"] == "Demo Novel"
    assert novel["status"] == "draft"
    assert novel["visibility"] == "private"
    assert [tag["id"] for tag in novel["tags"]] == [first_tag_id, second_tag_id]

    private_detail = client.get(f"/api/v1/novels/{novel['id']}")
    assert private_detail.status_code == 404

    updated = client.patch(
        f"/api/v1/novels/{novel['id']}",
        headers=author_headers,
        json={"title": "Demo Novel Revised", "description": None, "tag_ids": [second_tag_id]},
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Demo Novel Revised"
    assert updated.json()["description"] is None
    assert [tag["id"] for tag in updated.json()["tags"]] == [second_tag_id]

    published = client.post(f"/api/v1/novels/{novel['id']}/publish", headers=author_headers)
    assert published.status_code == 200
    assert published.json()["status"] == "ongoing"
    assert published.json()["visibility"] == "public"
    assert published.json()["published_at"] is not None

    public_detail = client.get(f"/api/v1/novels/{novel['id']}")
    assert public_detail.status_code == 200
    assert public_detail.json()["id"] == novel["id"]
    assert [tag["id"] for tag in public_detail.json()["tags"]] == [second_tag_id]

    deleted = client.delete(f"/api/v1/novels/{novel['id']}", headers=author_headers)
    assert deleted.status_code == 200

    deleted_detail = client.get(f"/api/v1/novels/{novel['id']}")
    assert deleted_detail.status_code == 404


def test_reader_cannot_create_novel(api) -> None:
    client, emails, _ = api
    _, reader_token = _register_and_login(client, emails, "reader")

    response = client.post(
        "/api/v1/novels/",
        headers={"Authorization": f"Bearer {reader_token}"},
        json={"title": "Reader Draft"},
    )

    assert response.status_code == 403


def test_author_cannot_update_another_authors_novel(api) -> None:
    client, emails, _ = api
    first_email, first_token = _register_and_login(client, emails, "authora")
    second_email, second_token = _register_and_login(client, emails, "authorb")
    _grant_author_role(first_email)
    _grant_author_role(second_email)

    created = client.post(
        "/api/v1/novels/",
        headers={"Authorization": f"Bearer {first_token}"},
        json={"title": "Private Draft"},
    )
    assert created.status_code == 201

    response = client.patch(
        f"/api/v1/novels/{created.json()['id']}",
        headers={"Authorization": f"Bearer {second_token}"},
        json={"title": "Taken Over"},
    )

    assert response.status_code == 404
