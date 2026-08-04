from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.category import Category


class AdminCategoriesRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_categories(self) -> list[Category]:
        return list(self.session.scalars(select(Category).order_by(Category.name)))

    def get_category(self, category_id: int) -> Category | None:
        return self.session.get(Category, category_id)

    def name_exists(self, name: str, exclude_id: int | None = None) -> bool:
        statement = select(Category.id).where(func.lower(Category.name) == name.lower())
        if exclude_id is not None:
            statement = statement.where(Category.id != exclude_id)
        return self.session.scalar(statement) is not None

    def slug_exists(self, slug: str, exclude_id: int | None = None) -> bool:
        statement = select(Category.id).where(Category.slug == slug)
        if exclude_id is not None:
            statement = statement.where(Category.id != exclude_id)
        return self.session.scalar(statement) is not None

    def add(self, category: Category) -> None:
        self.session.add(category)

    def delete(self, category: Category) -> None:
        self.session.delete(category)

    def save(self) -> None:
        self.session.commit()

    def rollback(self) -> None:
        self.session.rollback()

    def refresh(self, category: Category) -> None:
        self.session.refresh(category)
