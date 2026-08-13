import uuid

from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.novel import Novel
from app.models.novel_tag import NovelTag
from app.models.tag import Tag
from app.models.user import User


class NovelRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def _public_novel_rows(self, statement):
        results = []
        for row in self.session.execute(statement):
            novel, display_name, username = row[0], row[1], row[2]
            results.append((novel, display_name or username))
        return results

    def _public_catalog_statement(self, *, category_id: int | None = None, search: str | None = None):
        statement = (
            select(Novel, User.display_name, User.username)
            .outerjoin(User, User.id == Novel.author_id)
            .where(
                Novel.visibility == "public",
                Novel.deleted_at.is_(None),
                Novel.moderation_status == "approved",
            )
        )
        if category_id is not None:
            statement = statement.where(Novel.category_id == category_id)
        if search and search.strip():
            search_pattern = f"%{search.strip()}%"
            statement = statement.where(
                or_(
                    Novel.title.ilike(search_pattern),
                    Novel.description.ilike(search_pattern),
                )
            )
        return statement

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

        return self._public_novel_rows(statement)

    def get_new_releases(
        self,
        *,
        category_id: int | None = None,
        search: str | None = None,
        limit: int = 30,
    ) -> list[tuple[Novel, str | None]]:
        statement = (
            self._public_catalog_statement(category_id=category_id, search=search)
            .where(Novel.published_at.is_not(None))
            .where(Novel.status != "completed")
            .order_by(
                Novel.published_at.desc().nulls_last(),
                Novel.updated_at.desc(),
                Novel.id.desc(),
            )
            .limit(limit)
        )
        return self._public_novel_rows(statement)

    def get_completed_novels(
        self,
        *,
        category_id: int | None = None,
        search: str | None = None,
    ) -> list[tuple[Novel, str | None]]:
        statement = (
            self._public_catalog_statement(category_id=category_id, search=search)
            .where(Novel.status == "completed")
            .order_by(
                Novel.completed_at.desc().nulls_last(),
                Novel.updated_at.desc(),
                Novel.id.desc(),
            )
        )
        return self._public_novel_rows(statement)

    def get_featured_novels(
        self,
        *,
        category_id: int | None = None,
        search: str | None = None,
        limit: int = 30,
    ) -> list[tuple[Novel, str | None]]:
        # Ranking balances popularity, engagement, rating confidence, and recency.
        freshness = func.exp(
            -(
                func.extract(
                    "epoch",
                    func.now() - func.coalesce(Novel.published_at, Novel.created_at),
                )
                / 86400.0
            )
            / 30.0
        )
        score = (
            0.35 * func.ln(1 + Novel.view_count)
            + 0.35 * func.ln(1 + Novel.follower_count)
            + 0.20 * Novel.rating_average * func.ln(1 + Novel.rating_count)
            + 0.10 * freshness
        )
        statement = (
            self._public_catalog_statement(category_id=category_id, search=search)
            .order_by(score.desc(), Novel.published_at.desc().nulls_last(), Novel.updated_at.desc(), Novel.id.desc())
            .limit(limit)
        )
        return self._public_novel_rows(statement)

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

    def get_tags_for_novels(self, novel_ids: list[uuid.UUID]) -> dict[uuid.UUID, list[Tag]]:
        if not novel_ids:
            return {}
        rows = self.session.execute(
            select(NovelTag.novel_id, Tag)
            .join(Tag, NovelTag.tag_id == Tag.id)
            .where(NovelTag.novel_id.in_(novel_ids))
            .order_by(Tag.name)
        ).all()
        tags_map: dict[uuid.UUID, list[Tag]] = {nid: [] for nid in novel_ids}
        for novel_id, tag in rows:
            tags_map[novel_id].append(tag)
        return tags_map

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
