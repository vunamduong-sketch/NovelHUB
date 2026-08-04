import re
import unicodedata

from sqlalchemy.exc import IntegrityError

from app.admin.repositories.categories_repository import AdminCategoriesRepository
from app.models.category import Category


class AdminCategoryNotFoundError(Exception):
    pass


class AdminCategoryConflictError(Exception):
    pass


class AdminCategoriesService:
    def __init__(self, repository: AdminCategoriesRepository) -> None:
        self.repository = repository

    def list_categories(self) -> list[Category]:
        return self.repository.list_categories()

    def create_category(
        self,
        *,
        name: str,
        slug: str | None,
        description: str | None,
        is_active: bool,
    ) -> Category:
        resolved_slug = slug or _slugify(name, fallback="category", max_length=120)
        self._ensure_unique(name=name, slug=resolved_slug)
        category = Category(
            name=name,
            slug=resolved_slug,
            description=description,
            is_active=is_active,
        )
        self.repository.add(category)
        self._save_or_raise_conflict()
        self.repository.refresh(category)
        return category

    def update_category(
        self,
        category_id: int,
        *,
        fields: set[str],
        name: str | None,
        slug: str | None,
        description: str | None,
        is_active: bool | None,
    ) -> Category:
        category = self._get_category(category_id)
        candidate_name = name if "name" in fields and name is not None else category.name
        candidate_slug = slug if "slug" in fields and slug is not None else category.slug
        self._ensure_unique(
            name=candidate_name, slug=candidate_slug, exclude_id=category.id
        )
        if "name" in fields and name is not None:
            category.name = name
        if "slug" in fields and slug is not None:
            category.slug = slug
        if "description" in fields:
            category.description = description
        if "is_active" in fields and is_active is not None:
            category.is_active = is_active
        self._save_or_raise_conflict()
        self.repository.refresh(category)
        return category

    def delete_category(self, category_id: int) -> None:
        category = self._get_category(category_id)
        self.repository.delete(category)
        self._save_or_raise_conflict()

    def _get_category(self, category_id: int) -> Category:
        category = self.repository.get_category(category_id)
        if category is None:
            raise AdminCategoryNotFoundError("Category not found")
        return category

    def _ensure_unique(
        self, *, name: str, slug: str, exclude_id: int | None = None
    ) -> None:
        if self.repository.name_exists(name, exclude_id):
            raise AdminCategoryConflictError("Category name already exists")
        if self.repository.slug_exists(slug, exclude_id):
            raise AdminCategoryConflictError("Category slug already exists")

    def _save_or_raise_conflict(self) -> None:
        try:
            self.repository.save()
        except IntegrityError as exc:
            self.repository.rollback()
            raise AdminCategoryConflictError("Category name or slug already exists") from exc


def _slugify(value: str, *, fallback: str, max_length: int) -> str:
    vietnamese_safe_value = value.replace("Đ", "D").replace("đ", "d")
    ascii_text = (
        unicodedata.normalize("NFKD", vietnamese_safe_value)
        .encode("ascii", "ignore")
        .decode()
    )
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")
    return (slug or fallback)[:max_length].rstrip("-")
