import re
import unicodedata

from sqlalchemy.exc import IntegrityError

from app.admin.repositories.tags_repository import AdminTagsRepository
from app.models.tag import Tag


class AdminTagNotFoundError(Exception):
    pass


class AdminTagConflictError(Exception):
    pass


class AdminTagsService:
    def __init__(self, repository: AdminTagsRepository) -> None:
        self.repository = repository

    def list_tags(self) -> list[Tag]:
        return self.repository.list_tags()

    def create_tag(self, *, name: str, slug: str | None) -> Tag:
        resolved_slug = slug or _slugify(name, fallback="tag", max_length=80)
        self._ensure_unique(name=name, slug=resolved_slug)
        tag = Tag(name=name, slug=resolved_slug)
        self.repository.add(tag)
        self._save_or_raise_conflict()
        self.repository.refresh(tag)
        return tag

    def update_tag(
        self,
        tag_id: int,
        *,
        fields: set[str],
        name: str | None,
        slug: str | None,
    ) -> Tag:
        tag = self._get_tag(tag_id)
        candidate_name = name if "name" in fields and name is not None else tag.name
        candidate_slug = slug if "slug" in fields and slug is not None else tag.slug
        self._ensure_unique(name=candidate_name, slug=candidate_slug, exclude_id=tag.id)
        if "name" in fields and name is not None:
            tag.name = name
        if "slug" in fields and slug is not None:
            tag.slug = slug
        self._save_or_raise_conflict()
        self.repository.refresh(tag)
        return tag

    def delete_tag(self, tag_id: int) -> None:
        tag = self._get_tag(tag_id)
        self.repository.delete(tag)
        self._save_or_raise_conflict()

    def _get_tag(self, tag_id: int) -> Tag:
        tag = self.repository.get_tag(tag_id)
        if tag is None:
            raise AdminTagNotFoundError("Tag not found")
        return tag

    def _ensure_unique(
        self, *, name: str, slug: str, exclude_id: int | None = None
    ) -> None:
        if self.repository.name_exists(name, exclude_id):
            raise AdminTagConflictError("Tag name already exists")
        if self.repository.slug_exists(slug, exclude_id):
            raise AdminTagConflictError("Tag slug already exists")

    def _save_or_raise_conflict(self) -> None:
        try:
            self.repository.save()
        except IntegrityError as exc:
            self.repository.rollback()
            raise AdminTagConflictError("Tag name or slug already exists") from exc


def _slugify(value: str, *, fallback: str, max_length: int) -> str:
    ascii_text = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")
    return (slug or fallback)[:max_length].rstrip("-")
