import os
import uuid
from decimal import Decimal

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
from app.models.chapter import Chapter  # noqa: E402
from app.models.novel import Novel  # noqa: E402
from app.models.role import Role  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.user_role import UserRole  # noqa: E402
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
    except Exception as exc:
        pytest.skip(f"PostgreSQL integration test skipped: {exc}")


@pytest.fixture
def api():
    emails: list[str] = []
    with TestClient(app) as test_client:
        yield test_client, emails
    with SessionLocal() as session:
        user_ids = list(session.scalars(select(User.id).where(User.email.in_(emails)))) if emails else []
        if user_ids:
            # ON DELETE CASCADE on chapters.novel_id will clean up the chapters of these novels automatically.
            session.execute(delete(Novel).where(Novel.author_id.in_(user_ids)))
            session.execute(delete(UserRole).where(UserRole.user_id.in_(user_ids)))
            session.execute(delete(User).where(User.id.in_(user_ids)))
            session.commit()




def test_chapter_crud_workflow(api):
    client, emails = api
    from app.core.config import settings
    from app.core.security import create_access_token

    # 1. Seed Author & Role & Novel directly in the DB
    with SessionLocal() as session:
        role = session.scalar(select(Role).where(Role.code == "author"))
        assert role is not None
        email = f"author-{uuid.uuid4().hex}@example.com"
        emails.append(email)
        user = User(
            email=email,
            username=f"author{uuid.uuid4().hex[:12]}",
            password_hash="hashed_dummy",
            status="active"
        )
        session.add(user)
        session.flush()

        user_role = UserRole(user_id=user.id, role_id=role.id)
        session.add(user_role)

        novel = Novel(
            author_id=user.id,
            title="Test Novel for Chapters",
            slug=f"test-novel-{uuid.uuid4().hex[:6]}",
            status="ongoing",
            visibility="public",
            moderation_status="approved"
        )
        session.add(novel)
        session.commit()

        token, _ = create_access_token(str(user.id), ["author"], settings)
        novel_id = novel.id

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create Chapter (Draft)
    chapter_payload = {
        "title": "Chapter 1: The Beginning",
        "chapter_number": 1.0,
        "content": "This is the content of the first chapter.",
        "summary": "Intro to main character.",
        "status": "draft",
    }
    create_resp = client.post(f"/api/v1/novels/{novel_id}/chapters", json=chapter_payload, headers=headers)
    assert create_resp.status_code == 201
    chapter_id = create_resp.json()["id"]
    assert create_resp.json()["title"] == "Chapter 1: The Beginning"
    assert create_resp.json()["status"] == "draft"
    assert create_resp.json()["word_count"] == 8  # "This is the content of the first chapter."

    # 4. Check author chapter listing (should show draft)
    list_resp = client.get(f"/api/v1/novels/{novel_id}/chapters/me", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1
    assert list_resp.json()[0]["id"] == chapter_id

    # 5. Check public chapter listing (should be empty as chapter is still draft)
    pub_list_resp = client.get(f"/api/v1/novels/{novel_id}/chapters")
    assert pub_list_resp.status_code == 200
    assert len(pub_list_resp.json()) == 0

    # 6. Read chapter detail (author can read draft)
    detail_resp = client.get(f"/api/v1/chapters/{chapter_id}/author", headers=headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["content"] == "This is the content of the first chapter."

    # 7. Read chapter detail (anonymous cannot read draft, returns 404)
    anon_resp = client.get(f"/api/v1/chapters/{chapter_id}")
    assert anon_resp.status_code == 404

    # 8. Update Chapter
    update_payload = {
        "title": "Chapter 1: The True Beginning",
        "content": "This is updated content of the first chapter. More words here.",
    }
    update_resp = client.patch(f"/api/v1/chapters/{chapter_id}", json=update_payload, headers=headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == "Chapter 1: The True Beginning"
    assert update_resp.json()["word_count"] == 11

    # 9. Publish Chapter
    publish_resp = client.post(f"/api/v1/chapters/{chapter_id}/publish", headers=headers)
    assert publish_resp.status_code == 200
    assert publish_resp.json()["status"] == "published"

    # 10. Check public list and detail (should work now)
    pub_list_resp = client.get(f"/api/v1/novels/{novel_id}/chapters")
    assert pub_list_resp.status_code == 200
    assert len(pub_list_resp.json()) == 1

    anon_resp = client.get(f"/api/v1/chapters/{chapter_id}")
    assert anon_resp.status_code == 200
    assert anon_resp.json()["title"] == "Chapter 1: The True Beginning"

    # 11. Delete Chapter
    delete_resp = client.delete(f"/api/v1/chapters/{chapter_id}", headers=headers)
    assert delete_resp.status_code == 200

    # 12. Verify deleted
    verify_resp = client.get(f"/api/v1/chapters/{chapter_id}")
    assert verify_resp.status_code == 404
