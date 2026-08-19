"""Seed a deterministic demo dataset for NovelHub presentations.

Run from the repository root:

    python backend/scripts/seed_demo_data.py

The script is idempotent: re-running it updates or reuses the same demo
records instead of creating duplicates.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path


BACKEND = Path(__file__).resolve().parents[1]
ROOT = BACKEND.parent
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

# Settings on main load `.env` relative to the process working directory.
# Make host execution behave the same as running from the backend directory.
os.chdir(BACKEND)

try:
    from sqlalchemy import inspect, select  # noqa: E402
    from sqlalchemy.exc import OperationalError  # noqa: E402
except ModuleNotFoundError as exc:  # pragma: no cover - import-time guard
    if exc.name == "sqlalchemy":
        raise SystemExit(
            "Missing Python dependency: sqlalchemy. "
            "Run `python -m pip install -r backend/requirements.txt` "
            "inside the project environment, then rerun the seed script."
        ) from exc
    raise

try:
    from app.core.security import hash_password  # noqa: E402
    from app.database.session import SessionLocal, engine  # noqa: E402
    from app.models.author_follow import AuthorFollow  # noqa: E402
    from app.models.category import Category  # noqa: E402
    from app.models.chapter import Chapter  # noqa: E402
    from app.models.comment import Comment  # noqa: E402
    from app.models.novel import Novel  # noqa: E402
    from app.models.novel_follow import NovelFollow  # noqa: E402
    from app.models.novel_tag import NovelTag  # noqa: E402
    from app.models.rating import Rating  # noqa: E402
    from app.models.role import Role  # noqa: E402
    from app.models.tag import Tag  # noqa: E402
    from app.models.user import User  # noqa: E402
    from app.models.user_role import UserRole  # noqa: E402
except ModuleNotFoundError as exc:  # pragma: no cover - import-time guard
    missing = exc.name or "a required backend package"
    raise SystemExit(
        f"Missing Python dependency: {missing}. "
        "Run `python -m pip install -r backend/requirements.txt` "
        "inside the project environment, then rerun the seed script."
    ) from exc


def slugify(value: str) -> str:
    cleaned = []
    dash_pending = False
    for char in value.lower():
        if char.isalnum():
            cleaned.append(char)
            dash_pending = False
        else:
            if not dash_pending:
                cleaned.append("-")
                dash_pending = True
    return "".join(cleaned).strip("-")


def ensure_roles(session) -> dict[str, Role]:
    roles = {}
    for code, name in (
        ("reader", "Reader"),
        ("author", "Author"),
        ("admin", "Administrator"),
    ):
        role = session.scalar(select(Role).where(Role.code == code))
        if role is None:
            role = Role(code=code, name=name)
            session.add(role)
            session.flush()
        roles[code] = role
    return roles


def ensure_category(session, name: str) -> Category:
    slug = slugify(name)
    category = session.scalar(select(Category).where(Category.slug == slug))
    if category is None:
        category = Category(name=name, slug=slug, description=f"Demo category: {name}")
        session.add(category)
        session.flush()
    return category


def ensure_tag(session, name: str) -> Tag:
    slug = slugify(name)
    tag = session.scalar(select(Tag).where(Tag.slug == slug))
    if tag is None:
        tag = Tag(name=name, slug=slug)
        session.add(tag)
        session.flush()
    return tag


def ensure_user(session, *, email: str, username: str, display_name: str, password: str, status: str = "active") -> User:
    user = session.scalar(select(User).where(User.email == email))
    if user is None and email.endswith(".com"):
        # Older local demo runs used `.local`, which pydantic[email] rejects.
        legacy_email = email[:-4] + ".local"
        user = session.scalar(select(User).where(User.email == legacy_email))
        if user is not None:
            user.email = email
    if user is None:
        user = User(
            email=email,
            username=username,
            display_name=display_name,
            password_hash=hash_password(password),
            status=status,
            email_verified_at=datetime.now(timezone.utc),
        )
        session.add(user)
        session.flush()
    else:
        user.display_name = display_name
    return user


def ensure_role_link(session, user: User, role: Role) -> None:
    existing = session.get(UserRole, {"user_id": user.id, "role_id": role.id})
    if existing is None:
        session.add(UserRole(user_id=user.id, role_id=role.id))


def ensure_novel(session, *, author: User, category: Category, title: str, description: str, cover_url: str | None = None) -> Novel:
    slug = slugify(title)
    novel = session.scalar(select(Novel).where(Novel.slug == slug))
    if novel is None:
        novel = Novel(
            author_id=author.id,
            category_id=category.id,
            title=title,
            slug=slug,
            description=description,
            cover_url=cover_url,
            language_code="vi",
            status="ongoing",
            visibility="public",
            moderation_status="approved",
            published_at=datetime.now(timezone.utc),
        )
        session.add(novel)
        session.flush()
    else:
        novel.description = description
    return novel


def ensure_chapter(session, *, novel: Novel, chapter_number: int, title: str, content: str) -> Chapter:
    chapter_slug = slugify(title)
    chapter = session.scalar(
        select(Chapter).where(
            Chapter.novel_id == novel.id,
            Chapter.chapter_number == chapter_number,
        )
    )
    if chapter is None:
        chapter = Chapter(
            novel_id=novel.id,
            title=title,
            slug=chapter_slug,
            chapter_number=chapter_number,
            content=content,
            summary=content[:200],
            word_count=max(len(content.split()), 1),
            status="published",
            published_at=datetime.now(timezone.utc),
            view_count=12 if chapter_number == 1 else 4,
        )
        session.add(chapter)
        session.flush()
    return chapter


def seed_demo_dataset() -> None:
    print("Connecting to the NovelHub database configured by backend/main...")
    try:
        existing_tables = set(inspect(engine).get_table_names())
    except OperationalError as exc:
        raise SystemExit(
            "Cannot connect to the NovelHub PostgreSQL database. "
            "Start the main-branch stack with `cd backend` then "
            "`docker compose up --build -d`, and run this script inside the "
            "backend container with `docker compose exec backend python "
            "scripts/seed_demo_data.py`."
        ) from exc

    required_tables = {
        "users",
        "roles",
        "categories",
        "tags",
        "novels",
        "chapters",
        "comments",
        "ratings",
        "novel_follows",
        "author_follows",
    }
    missing_tables = sorted(required_tables - existing_tables)
    if missing_tables:
        raise SystemExit(
            "The NovelHub schema has not been migrated to the main-branch "
            f"version. Missing tables: {', '.join(missing_tables)}. Run "
            "`alembic upgrade head` before seeding."
        )

    with SessionLocal() as session:
        roles = ensure_roles(session)

        category = ensure_category(session, "Fantasy")
        tag_magic = ensure_tag(session, "Magic")
        tag_adventure = ensure_tag(session, "Adventure")
        tag_romance = ensure_tag(session, "Romance")

        reader = ensure_user(
            session,
            email="reader.demo@novelhub.com",
            username="reader_demo",
            display_name="Độc giả NovelHub",
            password="DemoPass123!",
        )
        author = ensure_user(
            session,
            email="author.demo@novelhub.com",
            username="author_demo",
            display_name="Minh An",
            password="DemoPass123!",
        )
        admin = ensure_user(
            session,
            email="admin.demo@novelhub.com",
            username="admin_demo",
            display_name="Quản trị NovelHub",
            password="DemoPass123!",
        )

        ensure_role_link(session, reader, roles["reader"])
        ensure_role_link(session, author, roles["reader"])
        ensure_role_link(session, author, roles["author"])
        ensure_role_link(session, admin, roles["reader"])
        ensure_role_link(session, admin, roles["admin"])

        novel = ensure_novel(
            session,
            author=author,
            category=category,
            title="The Ember Library",
            description="Một thư viện bí mật thức giấc giữa thành phố phủ tro, mở ra hành trình tìm kiếm ký ức và những ngọn lửa đã thất truyền.",
            cover_url=None,
        )

        session.flush()

        chapter_1 = ensure_chapter(
            session,
            novel=novel,
            chapter_number=1,
            title="Ashes at Dawn",
            content="The city wakes beneath an ember sky.\nA hidden archive opens for the first time in a century.",
        )
        chapter_2 = ensure_chapter(
            session,
            novel=novel,
            chapter_number=2,
            title="The First Key",
            content="A small brass key changes the shape of the entire morning.",
        )

        for tag in (tag_magic, tag_adventure, tag_romance):
            if session.get(NovelTag, {"novel_id": novel.id, "tag_id": tag.id}) is None:
                session.add(NovelTag(novel_id=novel.id, tag_id=tag.id))

        if session.scalar(select(Comment).where(Comment.chapter_id == chapter_1.id)) is None:
            top_comment = Comment(
                chapter_id=chapter_1.id,
                user_id=reader.id,
                content="Chuong mo dau rat cuon. Phan mo dau khien minh muon doc tiep ngay.",
                status="visible",
            )
            session.add(top_comment)
            session.flush()
            session.add(
                Comment(
                    chapter_id=chapter_1.id,
                    user_id=author.id,
                    parent_id=top_comment.id,
                    content="Cam on ban da doc va chia se cam nhan!",
                    status="visible",
                )
            )

        if session.get(Rating, {"user_id": reader.id, "novel_id": novel.id}) is None:
            session.add(
                Rating(
                    user_id=reader.id,
                    novel_id=novel.id,
                    score=5,
                    review_text="Mở đầu cuốn hút, không khí bí ẩn và có nhiều chi tiết đáng chờ đợi.",
                )
            )
            novel.rating_count = 1
            novel.rating_average = 5
        else:
            existing_rating = session.get(Rating, {"user_id": reader.id, "novel_id": novel.id})
            existing_rating.review_text = "Mở đầu cuốn hút, không khí bí ẩn và có nhiều chi tiết đáng chờ đợi."

        if session.get(NovelFollow, {"user_id": reader.id, "novel_id": novel.id}) is None:
            session.add(
                NovelFollow(
                    user_id=reader.id,
                    novel_id=novel.id,
                    notifications_enabled=True,
                )
            )
            novel.follower_count = 1

        if session.get(AuthorFollow, {"follower_id": reader.id, "author_id": author.id}) is None:
            session.add(
                AuthorFollow(
                    follower_id=reader.id,
                    author_id=author.id,
                    notifications_enabled=True,
                )
            )

        novel.view_count = max(int(novel.view_count or 0), 48)
        chapter_1.view_count = max(int(chapter_1.view_count or 0), 24)
        chapter_2.view_count = max(int(chapter_2.view_count or 0), 8)

        session.commit()

        print("Seeded demo data successfully.")
        print("Reader login : reader.demo@novelhub.com / DemoPass123!")
        print("Author login : author.demo@novelhub.com / DemoPass123!")
        print("Admin login  : admin.demo@novelhub.com / DemoPass123!")
        print(f"Novel title  : {novel.title}")
        print(f"Chapter ids  : {chapter_1.id} , {chapter_2.id}")


if __name__ == "__main__":
    seed_demo_dataset()
