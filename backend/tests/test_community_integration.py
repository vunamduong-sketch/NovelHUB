"""Community API integration tests for a disposable PostgreSQL database."""
import os
import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select, text

if not os.getenv("NOVELHUB_TEST_DATABASE_URL"):
    pytest.skip(
        "Set NOVELHUB_TEST_DATABASE_URL to run PostgreSQL integration tests",
        allow_module_level=True,
    )

os.environ["DATABASE_URL"] = os.environ["NOVELHUB_TEST_DATABASE_URL"]

import app.models  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.database.base import Base  # noqa: E402
from app.database.session import SessionLocal  # noqa: E402
from app.models.chapter import Chapter  # noqa: E402
from app.models.novel import Novel  # noqa: E402
from app.models.role import Role  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.user_role import UserRole  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture(autouse=True)
def ensure_test_database():
    try:
        engine = SessionLocal.kw["bind"]
        with engine.connect() as connection:
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
            connection.commit()
        Base.metadata.create_all(bind=engine, checkfirst=True)
        with SessionLocal() as session:
            for code, name in (("reader", "Reader"), ("author", "Author")):
                if session.scalar(select(Role).where(Role.code == code)) is None:
                    session.add(Role(code=code, name=name))
            session.commit()
    except Exception as exc:  # pragma: no cover
        pytest.skip(f"PostgreSQL integration test skipped: {exc}")


def _create_user(*, is_author: bool = False) -> User:
    with SessionLocal() as session:
        user = User(
            email=f"community-{uuid.uuid4().hex}@example.com",
            username=f"community{uuid.uuid4().hex[:12]}",
            password_hash="unused",
            status="active",
        )
        session.add(user)
        session.flush()
        reader = session.scalar(select(Role).where(Role.code == "reader"))
        assert reader is not None
        session.add(UserRole(user_id=user.id, role_id=reader.id))
        if is_author:
            author = session.scalar(select(Role).where(Role.code == "author"))
            assert author is not None
            session.add(UserRole(user_id=user.id, role_id=author.id))
        session.commit()
        session.refresh(user)
        return user


def _headers(user: User) -> dict[str, str]:
    token, _ = create_access_token(str(user.id), ["reader"], settings)
    return {"Authorization": f"Bearer {token}"}


def test_comment_reply_rating_and_follow_workflow():
    author = _create_user(is_author=True)
    reader = _create_user()
    non_author = None
    try:
        with SessionLocal() as session:
            novel = Novel(
                author_id=author.id,
                title="Community integration novel",
                slug=f"community-{uuid.uuid4().hex}",
                status="ongoing",
                visibility="public",
                moderation_status="approved",
                published_at=datetime.now(timezone.utc),
            )
            session.add(novel)
            session.flush()
            chapter = Chapter(
                novel_id=novel.id,
                title="Community chapter",
                slug=f"chapter-{uuid.uuid4().hex}",
                chapter_number=1,
                content="Published content",
                word_count=2,
                status="published",
                published_at=datetime.now(timezone.utc),
            )
            session.add(chapter)
            session.commit()
            novel_id, chapter_id = novel.id, chapter.id

        with TestClient(app) as client:
            headers = _headers(reader)
            comment = client.post(
                f"/api/v1/chapters/{chapter_id}/comments",
                headers=headers,
                json={"content": "A useful comment"},
            )
            assert comment.status_code == 201
            reply = client.post(
                f"/api/v1/comments/{comment.json()['id']}/replies",
                headers=headers,
                json={"content": "A useful reply"},
            )
            assert reply.status_code == 201
            listed = client.get(f"/api/v1/chapters/{chapter_id}/comments")
            assert listed.status_code == 200
            assert listed.json()[0]["replies"][0]["content"] == "A useful reply"

            rating = client.put(
                f"/api/v1/novels/{novel_id}/rating",
                headers=headers,
                json={"score": 5, "review_text": "Excellent"},
            )
            assert rating.status_code == 200
            assert rating.json()["rating_count"] == 1

            novel_follow = client.put(
                f"/api/v1/novels/{novel_id}/follow",
                headers=headers,
                json={"notifications_enabled": True},
            )
            assert novel_follow.status_code == 200
            author_follow = client.put(
                f"/api/v1/authors/{author.id}/follow",
                headers=headers,
                json={"notifications_enabled": True},
            )
            assert author_follow.status_code == 200
            assert author_follow.json()["follower_count"] == 1
            assert len(client.get("/api/v1/me/followed-novels", headers=headers).json()) == 1
            assert len(client.get("/api/v1/me/followed-authors", headers=headers).json()) == 1

            assert client.put(
                f"/api/v1/novels/{novel_id}/follow",
                headers=_headers(author),
                json={"notifications_enabled": True},
            ).status_code == 409

            non_author = _create_user()
            assert client.put(
                f"/api/v1/authors/{non_author.id}/follow",
                headers=headers,
                json={"notifications_enabled": True},
            ).status_code == 404
    finally:
        with SessionLocal() as session:
            user_ids = [author.id, reader.id]
            if non_author is not None:
                user_ids.append(non_author.id)
            session.execute(delete(Novel).where(Novel.author_id == author.id))
            session.execute(delete(User).where(User.id.in_(user_ids)))
            session.commit()
