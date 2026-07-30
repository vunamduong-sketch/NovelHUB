import uuid

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.novel import Novel
from app.models.novel_tag import NovelTag
from app.models.tag import Tag


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
        return self.session.scalar(
            select(Novel).where(
                Novel.id == novel_id,
                Novel.author_id == author_id,
                Novel.deleted_at.is_(None),
            )
        )

    def get_public_novel(self, novel_id: uuid.UUID) -> Novel | None:
        return self.session.scalar(
            select(Novel).where(
                Novel.id == novel_id,
                Novel.visibility == "public",
                Novel.moderation_status == "approved",
                Novel.deleted_at.is_(None),
            )
        )

    def get_active_category_by_id(self, category_id: int) -> Category | None:
        return self.session.scalar(
            select(Category).where(
                Category.id == category_id,
                Category.is_active.is_(True),
            )
        )

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
        statement = select(Novel.id).where(
            Novel.slug == slug,
            Novel.deleted_at.is_(None),
        )
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
