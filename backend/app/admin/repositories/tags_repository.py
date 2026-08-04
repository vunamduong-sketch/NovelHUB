from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.tag import Tag


class AdminTagsRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_tags(self) -> list[Tag]:
        return list(self.session.scalars(select(Tag).order_by(Tag.name)))

    def get_tag(self, tag_id: int) -> Tag | None:
        return self.session.get(Tag, tag_id)

    def name_exists(self, name: str, exclude_id: int | None = None) -> bool:
        statement = select(Tag.id).where(func.lower(Tag.name) == name.lower())
        if exclude_id is not None:
            statement = statement.where(Tag.id != exclude_id)
        return self.session.scalar(statement) is not None

    def slug_exists(self, slug: str, exclude_id: int | None = None) -> bool:
        statement = select(Tag.id).where(Tag.slug == slug)
        if exclude_id is not None:
            statement = statement.where(Tag.id != exclude_id)
        return self.session.scalar(statement) is not None

    def add(self, tag: Tag) -> None:
        self.session.add(tag)

    def delete(self, tag: Tag) -> None:
        self.session.delete(tag)

    def save(self) -> None:
        self.session.commit()

    def rollback(self) -> None:
        self.session.rollback()

    def refresh(self, tag: Tag) -> None:
        self.session.refresh(tag)
