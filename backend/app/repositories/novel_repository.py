import uuid

from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.novel import Novel
from app.models.novel_tag import NovelTag
from app.models.tag import Tag
from app.models.user import User


class NovelRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, novel_id: uuid.UUID) -> Novel | None:
        return self.session.get(Novel, novel_id)

    def get_active_by_id(self, novel_id: uuid.UUID) -> Novel | None:
        return self.session.scalar(
            select(Novel).where(
                Novel.id == novel_id,
                Novel.deleted_at.is_(None),
            )
        )

    def get_author_novel(self, novel_id: uuid.UUID, author_id: uuid.UUID) -> Novel | None:
        statement = (
            select(Novel, User.display_name, User.username)
            .outerjoin(User, User.id == Novel.author_id)
            .where(
                Novel.id == novel_id,
                Novel.author_id == author_id,
                Novel.deleted_at.is_(None),
            )
        )
        row = self.session.execute(statement).first()
        if not row:
            return None
        novel, display_name, username = row[0], row[1], row[2]
        novel.author_name = display_name or username
        return novel

    def get_author_novels(
        self,
        author_id: uuid.UUID,
        visibility: str | None = None,
        status: str | None = None,
    ) -> list[tuple[Novel, str | None]]:
        statement = (
            select(Novel, User.display_name, User.username)
            .outerjoin(User, User.id == Novel.author_id)
            .where(
                Novel.author_id == author_id,
                Novel.deleted_at.is_(None),
            )
        )
        if visibility is not None:
            statement = statement.where(Novel.visibility == visibility)
        if status is not None:
            statement = statement.where(Novel.status == status)
        statement = statement.order_by(Novel.updated_at.desc())

        results = []
        for row in self.session.execute(statement):
            novel, display_name, username = row[0], row[1], row[2]
            results.append((novel, display_name or username))
        return results

    def get_public_novels(
        self,
        *,
        search: str | None = None,
        category_id: int | None = None,
        status: str | None = None,
    ) -> list[tuple[Novel, str | None]]:
        statement = (
            select(Novel, User.display_name, User.username)
            .outerjoin(User, User.id == Novel.author_id)
            .where(
                Novel.visibility == "public",
                Novel.deleted_at.is_(None),
            )
        )
        if category_id is not None:
            statement = statement.where(Novel.category_id == category_id)
        if status is not None:
            statement = statement.where(Novel.status == status)
        if search and search.strip():
            search_pattern = f"%{search.strip()}%"
            statement = statement.where(
                or_(
                    Novel.title.ilike(search_pattern),
                    Novel.description.ilike(search_pattern),
                )
            )
        statement = statement.order_by(Novel.published_at.desc().nulls_last(), Novel.updated_at.desc())

        results = []
        for row in self.session.execute(statement):
            novel, display_name, username = row[0], row[1], row[2]
            results.append((novel, display_name or username))
        return results

    def get_public_novel(self, novel_id: uuid.UUID) -> tuple[Novel, str | None] | None:
        statement = (
            select(Novel, User.display_name, User.username)
            .outerjoin(User, User.id == Novel.author_id)
            .where(
                Novel.id == novel_id,
                Novel.visibility == "public",
                Novel.deleted_at.is_(None),
            )
        )
        row = self.session.execute(statement).first()
        if not row:
            return None
        novel, display_name, username = row[0], row[1], row[2]
        return novel, display_name or username

    def get_active_category_by_id(self, category_id: int) -> Category | None:
        return self.session.scalar(
            select(Category).where(
                Category.id == category_id,
                Category.is_active.is_(True),
            )
        )

    def get_active_categories(self) -> list[Category]:
        return list(
            self.session.scalars(
                select(Category)
                .where(Category.is_active.is_(True))
                .order_by(Category.name)
            )
        )

    def get_all_tags(self) -> list[Tag]:
        return list(self.session.scalars(select(Tag).order_by(Tag.name)))

    def get_tags_by_ids(self, tag_ids: list[int]) -> list[Tag]:
        if not tag_ids:
            return []
        return list(self.session.scalars(select(Tag).where(Tag.id.in_(tag_ids))))

    def get_tags_for_novel(self, novel_id: uuid.UUID) -> list[Tag]:
        return list(
            self.session.scalars(
                select(Tag)
                .join(NovelTag, NovelTag.tag_id == Tag.id)
                .where(NovelTag.novel_id == novel_id)
                .order_by(Tag.name)
            )
        )

    def replace_novel_tags(self, novel_id: uuid.UUID, tag_ids: list[int]) -> None:
        self.session.execute(delete(NovelTag).where(NovelTag.novel_id == novel_id))
        for tag_id in tag_ids:
            self.session.add(NovelTag(novel_id=novel_id, tag_id=tag_id))

    def slug_exists(self, slug: str, exclude_novel_id: uuid.UUID | None = None) -> bool:
        statement = select(Novel.id).where(Novel.slug == slug)
        if exclude_novel_id is not None:
            statement = statement.where(Novel.id != exclude_novel_id)
        return self.session.scalar(statement) is not None

    def add(self, novel: Novel) -> None:
        self.session.add(novel)

    def flush(self) -> None:
        self.session.flush()

    def save(self) -> None:
        self.session.commit()

    def rollback(self) -> None:
        self.session.rollback()

    def refresh(self, novel: Novel) -> None:
        self.session.refresh(novel)
