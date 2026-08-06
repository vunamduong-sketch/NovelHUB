import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, text


if not os.getenv("NOVELHUB_TEST_DATABASE_URL"):
    pytest.skip(
        "Set NOVELHUB_TEST_DATABASE_URL to run PostgreSQL integration tests",
        allow_module_level=True,
    )


os.environ["DATABASE_URL"] = os.environ[
    "NOVELHUB_TEST_DATABASE_URL"
]


import app.models  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.database.base import Base  # noqa: E402
from app.database.session import SessionLocal  # noqa: E402
from app.models.novel import Novel  # noqa: E402
from app.models.chapter import Chapter  # noqa: E402
from app.models.user import User  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture(autouse=True)
def ensure_test_database():
    try:
        engine = SessionLocal.kw["bind"]

        with engine.connect() as connection:
            connection.execute(
                text(
                    "CREATE EXTENSION IF NOT EXISTS pgcrypto"
                )
            )
            connection.commit()

        Base.metadata.create_all(
            bind=engine,
            checkfirst=True,
        )

    except Exception as exc:
        pytest.skip(
            f"PostgreSQL integration test skipped: {exc}"
        )


def test_bookmark_create_get_delete_workflow():
    user_id = None
    novel_id = None

    try:
        with SessionLocal() as session:
            user = User(
                email=(
                    f"bookmark-{uuid.uuid4().hex}"
                    "@example.com"
                ),
                username=(
                    f"reader{uuid.uuid4().hex[:12]}"
                ),
                password_hash="hashed_dummy",
                status="active",
            )
            session.add(user)
            session.flush()

            novel = Novel(
                author_id=user.id,
                title="Bookmark integration novel",
                slug=(
                    f"bookmark-novel-"
                    f"{uuid.uuid4().hex[:12]}"
                ),
                status="ongoing",
                visibility="public",
                moderation_status="approved",
            )
            session.add(novel)
            session.flush()

            chapter = Chapter(
                novel_id=novel.id,
                title="Published bookmark chapter",
                slug=(
                    f"bookmark-chapter-"
                    f"{uuid.uuid4().hex[:12]}"
                ),
                chapter_number=1,
                content=(
                    "Nội dung dùng để kiểm tra "
                    "chức năng đánh dấu chương."
                ),
                word_count=10,
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
            "Authorization": f"Bearer {token}"
        }

        with TestClient(app) as client:
            create_response = client.put(
                (
                    f"/api/v1/chapters/"
                    f"{chapter_id}/bookmark"
                ),
                json={
                    "position_offset": 125,
                    "note": "Đọc lại đoạn này",
                },
                headers=headers,
            )

            assert create_response.status_code == 200

            created = create_response.json()

            assert created["chapter_id"] == str(
                chapter_id
            )
            assert created["novel_id"] == str(
                novel_id
            )
            assert created["position_offset"] == 125
            assert created["note"] == "Đọc lại đoạn này"

            get_response = client.get(
                (
                    f"/api/v1/chapters/"
                    f"{chapter_id}/bookmark"
                ),
                headers=headers,
            )

            assert get_response.status_code == 200

            bookmark_status = get_response.json()

            assert (
                bookmark_status["is_bookmarked"]
                is True
            )
            assert (
                bookmark_status["bookmark"]
                ["position_offset"]
                == 125
            )

            update_response = client.put(
                (
                    f"/api/v1/chapters/"
                    f"{chapter_id}/bookmark"
                ),
                json={
                    "position_offset": 250,
                    "note": "Vị trí mới",
                },
                headers=headers,
            )

            assert update_response.status_code == 200
            assert (
                update_response.json()
                ["position_offset"]
                == 250
            )
            assert (
                update_response.json()["note"]
                == "Vị trí mới"
            )

            delete_response = client.delete(
                (
                    f"/api/v1/chapters/"
                    f"{chapter_id}/bookmark"
                ),
                headers=headers,
            )

            assert delete_response.status_code == 200
            assert delete_response.json() == {
                "message": (
                    "Bookmark removed successfully."
                )
            }

            get_after_delete = client.get(
                (
                    f"/api/v1/chapters/"
                    f"{chapter_id}/bookmark"
                ),
                headers=headers,
            )

            assert get_after_delete.status_code == 200
            assert get_after_delete.json() == {
                "is_bookmarked": False,
                "bookmark": None,
            }

    finally:
        with SessionLocal() as session:
            if novel_id is not None:
                session.execute(
                    delete(Novel).where(
                        Novel.id == novel_id
                    )
                )

            if user_id is not None:
                session.execute(
                    delete(User).where(
                        User.id == user_id
                    )
                )

            session.commit()