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

from app.core.config import settings  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
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

        Base.metadata.create_all(
            bind=SessionLocal.kw["bind"],
            checkfirst=True,
        )

        with SessionLocal() as session:
            if session.scalar(
                select(Role).where(Role.code == "reader")
            ) is None:
                session.add(Role(code="reader", name="Reader"))
                session.commit()

    except Exception as exc:
        pytest.skip(f"PostgreSQL integration test skipped: {exc}")


def test_bookmark_and_reading_history_workflow() -> None:
    email = f"reader-activity-{uuid.uuid4().hex}@example.com"

    with SessionLocal() as session:
        reader_role = session.scalar(
            select(Role).where(Role.code == "reader")
        )
        assert reader_role is not None

        user = User(
            email=email,
            username=f"reader{uuid.uuid4().hex[:12]}",
            password_hash="hashed_dummy",
            status="active",
        )

        session.add(user)
        session.flush()

        session.add(
            UserRole(
                user_id=user.id,
                role_id=reader_role.id,
            )
        )

        novel = Novel(
            author_id=user.id,
            title="Reader activity test novel",
            slug=f"reader-activity-{uuid.uuid4().hex[:12]}",
            status="ongoing",
            visibility="public",
            moderation_status="approved",
        )

        session.add(novel)
        session.flush()

        chapter = Chapter(
            novel_id=novel.id,
            title="Published test chapter",
            slug="published-test-chapter",
            chapter_number=1,
            content="A public chapter used to test reader activity.",
            word_count=9,
            status="published",
            view_count=0,
        )

        session.add(chapter)
        session.commit()

        user_id = user.id
        novel_id = novel.id
        chapter_id = chapter.id

    token, _ = create_access_token(
        str(user_id),
        ["reader"],
        settings,
    )

    headers = {
        "Authorization": f"Bearer {token}",
    }

    with TestClient(app) as client:
        saved = client.put(
            f"/api/v1/chapters/{chapter_id}/bookmark",
            json={
                "position_offset": 125,
                "note": "Đọc lại đoạn này",
            },
            headers=headers,
        )

        assert saved.status_code == 200
        assert saved.json()["position_offset"] == 125

        status_response = client.get(
            f"/api/v1/chapters/{chapter_id}/bookmark",
            headers=headers,
        )

        assert status_response.status_code == 200
        assert status_response.json()["is_bookmarked"] is True

        novel_bookmarks = client.get(
            f"/api/v1/novels/{novel_id}/bookmarks",
            headers=headers,
        )

        assert novel_bookmarks.status_code == 200
        assert [
            item["chapter_id"]
            for item in novel_bookmarks.json()
        ] == [str(chapter_id)]

        progress = client.put(
            f"/api/v1/chapters/{chapter_id}/reading-progress",
            json={
                "position_offset": 300,
                "progress_percent": 64.5,
            },
            headers=headers,
        )

        assert progress.status_code == 200
        assert progress.json()["chapter_id"] == str(chapter_id)

        history = client.get(
            "/api/v1/reading-history",
            headers=headers,
        )

        assert history.status_code == 200
        assert history.json()[0]["novel_id"] == str(novel_id)
        assert float(history.json()[0]["progress_percent"]) == 64.5

        removed = client.delete(
            f"/api/v1/chapters/{chapter_id}/bookmark",
            headers=headers,
        )

        assert removed.status_code == 200

        status_after_delete = client.get(
            f"/api/v1/chapters/{chapter_id}/bookmark",
            headers=headers,
        )

        assert status_after_delete.status_code == 200
        assert status_after_delete.json() == {
            "is_bookmarked": False,
            "bookmark": None,
        }

    with SessionLocal() as session:
        session.execute(
            delete(Novel).where(Novel.id == novel_id)
        )
        session.execute(
            delete(UserRole).where(UserRole.user_id == user_id)
        )
        session.execute(
            delete(User).where(User.id == user_id)
        )
        session.commit()