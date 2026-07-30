import re
import unicodedata
import uuid
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError

from app.models.category import Category
from app.models.novel import Novel
from app.models.tag import Tag
from app.models.user import User
from app.repositories.novel_repository import NovelRepository


class NovelNotFoundError(Exception):
    pass


class CategoryNotFoundError(Exception):
    pass


class TagNotFoundError(Exception):
    pass


class NovelConflictError(Exception):
    pass


class NovelPublishError(Exception):
    pass


class NovelService:
    def __init__(self, repository: NovelRepository) -> None:
        self.repository = repository

    def create_novel(
        self,
        current_user: User,
        *,
        title: str,
        description: str | None,
        category_id: int | None,
        tag_ids: list[int],
        cover_url: str | None,
        language_code: str,
    ) -> tuple[Novel, list[Tag], str | None]:
        if category_id is not None:
            self._ensure_active_category(category_id)
        tags = self._get_existing_tags(tag_ids)

        novel = Novel(
            author_id=current_user.id,
            category_id=category_id,
            title=title,
            slug=self._generate_unique_slug(title),
            description=description,
            cover_url=cover_url,
            language_code=language_code,
            status="draft",
            visibility="private",
            moderation_status="approved",
        )
        self.repository.add(novel)
        self._flush_or_raise_conflict("Failed to create novel")
        self.repository.replace_novel_tags(novel.id, [tag.id for tag in tags])
        self._save_or_raise_conflict("Failed to create novel")
        self.repository.refresh(novel)
        author_name = current_user.display_name or current_user.username
        return novel, tags, author_name

    def update_novel(
        self,
        current_user: User,
        novel_id: uuid.UUID,
        *,
        fields: set[str],
        title: str | None,
        description: str | None,
        category_id: int | None,
        tag_ids: list[int] | None,
        cover_url: str | None,
        status: str | None,
    ) -> tuple[Novel, list[Tag], str | None]:
        novel = self._get_author_novel(current_user, novel_id)
        tags: list[Tag] | None = None

        if "title" in fields and title is not None and title != novel.title:
            novel.title = title
            novel.slug = self._generate_unique_slug(title, exclude_novel_id=novel.id)

        if "description" in fields:
            novel.description = description

        if "category_id" in fields:
            if category_id is not None:
                self._ensure_active_category(category_id)
            novel.category_id = category_id

        if "tag_ids" in fields:
            tags = self._get_existing_tags(tag_ids or [])
            self.repository.replace_novel_tags(novel.id, [tag.id for tag in tags])

        if "cover_url" in fields:
            novel.cover_url = cover_url

        if "status" in fields and status is not None:
            novel.status = status
            if status == "completed" and novel.completed_at is None:
                novel.completed_at = datetime.now(timezone.utc)
            elif status != "completed":
                novel.completed_at = None

        self._save_or_raise_conflict("Failed to update novel")
        self.repository.refresh(novel)
        author_name = current_user.display_name or current_user.username
        return novel, tags if tags is not None else self.repository.get_tags_for_novel(novel.id), author_name

    def delete_novel(self, current_user: User, novel_id: uuid.UUID) -> None:
        novel = self._get_author_novel(current_user, novel_id)
        novel.deleted_at = datetime.now(timezone.utc)
        self.repository.save()

    def publish_novel(self, current_user: User, novel_id: uuid.UUID) -> tuple[Novel, list[Tag], str | None]:
        novel = self._get_author_novel(current_user, novel_id)
        if not novel.title.strip():
            raise NovelPublishError("Novel title is required before publishing")

        now = datetime.now(timezone.utc)
        novel.visibility = "public"
        if novel.status == "draft":
            novel.status = "ongoing"
        if novel.published_at is None:
            novel.published_at = now

        self.repository.save()
        self.repository.refresh(novel)
        author_name = current_user.display_name or current_user.username
        return novel, self.repository.get_tags_for_novel(novel.id), author_name

    def get_public_novels(
        self,
        *,
        search: str | None = None,
        category_id: int | None = None,
        status: str | None = None,
    ) -> list[tuple[Novel, list[Tag], str | None]]:
        items = self.repository.get_public_novels(
            search=search,
            category_id=category_id,
            status=status,
        )
        return [
            (novel, self.repository.get_tags_for_novel(novel.id), author_name)
            for novel, author_name in items
        ]

    def get_public_novel(self, novel_id: uuid.UUID) -> tuple[Novel, list[Tag], str | None]:
        res = self.repository.get_public_novel(novel_id)
        if res is None:
            raise NovelNotFoundError("Novel is not available")
        novel, author_name = res
        return novel, self.repository.get_tags_for_novel(novel.id), author_name

    def get_author_novels(
        self,
        current_user: User,
        *,
        visibility: str | None = None,
        status: str | None = None,
    ) -> list[tuple[Novel, list[Tag], str | None]]:
        items = self.repository.get_author_novels(
            current_user.id,
            visibility=visibility,
            status=status,
        )
        return [
            (novel, self.repository.get_tags_for_novel(novel.id), author_name)
            for novel, author_name in items
        ]

    def get_categories(self) -> list[Category]:
        return self.repository.get_active_categories()

    def get_tags(self) -> list[Tag]:
        return self.repository.get_all_tags()


    def _get_author_novel(self, current_user: User, novel_id: uuid.UUID) -> Novel:
        novel = self.repository.get_author_novel(novel_id, current_user.id)
        if novel is None:
            raise NovelNotFoundError("Novel is not available")
        return novel

    def _ensure_active_category(self, category_id: int) -> None:
        if self.repository.get_active_category_by_id(category_id) is None:
            raise CategoryNotFoundError("Category is not available")

    def _get_existing_tags(self, tag_ids: list[int]) -> list[Tag]:
        tags = self.repository.get_tags_by_ids(tag_ids)
        tags_by_id = {tag.id: tag for tag in tags}
        missing_tag_ids = [tag_id for tag_id in tag_ids if tag_id not in tags_by_id]
        if missing_tag_ids:
            raise TagNotFoundError("One or more tags are not available")
        return [tags_by_id[tag_id] for tag_id in tag_ids]

    def _generate_unique_slug(self, title: str, exclude_novel_id: uuid.UUID | None = None) -> str:
        base_slug = _slugify(title)
        slug = base_slug
        suffix = 2
        while self.repository.slug_exists(slug, exclude_novel_id=exclude_novel_id):
            suffix_text = f"-{suffix}"
            slug = f"{base_slug[:280 - len(suffix_text)]}{suffix_text}"
            suffix += 1
            if suffix > 50:
                random_suffix = uuid.uuid4().hex[:12]
                slug = f"{base_slug[:267]}-{random_suffix}"
                if not self.repository.slug_exists(slug, exclude_novel_id=exclude_novel_id):
                    break
        return slug

    def _save_or_raise_conflict(self, message: str) -> None:
        try:
            self.repository.save()
        except IntegrityError as exc:
            self.repository.rollback()
            raise NovelConflictError(message) from exc

    def _flush_or_raise_conflict(self, message: str) -> None:
        try:
            self.repository.flush()
        except IntegrityError as exc:
            self.repository.rollback()
            raise NovelConflictError(message) from exc


def _slugify(value: str) -> str:
    normalized = value.strip().lower().replace("đ", "d")
    normalized = unicodedata.normalize("NFKD", normalized)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text).strip("-")
    return (slug or "novel")[:280]
