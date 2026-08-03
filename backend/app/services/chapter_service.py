import re
import unicodedata
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.exc import IntegrityError

from app.models.chapter import Chapter
from app.models.novel import Novel
from app.models.user import User
from app.repositories.chapter_repository import ChapterRepository
from app.repositories.novel_repository import NovelRepository


class ChapterNotFoundError(Exception):
    pass


class ChapterConflictError(Exception):
    pass


class ChapterPublishError(Exception):
    pass


class NovelNotFoundError(Exception):
    pass


class PermissionDeniedError(Exception):
    pass


class ChapterService:
    def __init__(self, repository: ChapterRepository, novel_repository: NovelRepository) -> None:
        self.repository = repository
        self.novel_repository = novel_repository

    def create_chapter(
        self,
        current_user: User,
        novel_id: uuid.UUID,
        *,
        title: str,
        chapter_number: Decimal,
        content: str,
        summary: str | None,
        status: str,
    ) -> Chapter:
        novel = self._get_author_novel(current_user, novel_id)

        if self.repository.number_exists(novel_id, chapter_number):
            raise ChapterConflictError(f"Chapter number {chapter_number} already exists for this novel")

        slug = self._generate_unique_slug(novel_id, title)
        word_count = self._calculate_word_count(content)

        published_at = None
        if status == "published":
            published_at = datetime.now(timezone.utc)

        chapter = Chapter(
            novel_id=novel_id,
            title=title,
            slug=slug,
            chapter_number=chapter_number,
            content=content,
            summary=summary,
            word_count=word_count,
            status=status,
            published_at=published_at,
            view_count=0
        )
        self.repository.add(chapter)
        self._save_or_raise_conflict("Failed to create chapter")
        self.repository.refresh(chapter)
        return chapter

    def update_chapter(
        self,
        current_user: User,
        chapter_id: uuid.UUID,
        *,
        fields: set[str],
        title: str | None,
        chapter_number: Decimal | None,
        content: str | None,
        summary: str | None,
        status: str | None,
    ) -> Chapter:
        chapter = self._get_author_chapter(current_user, chapter_id)

        if "title" in fields and title is not None and title != chapter.title:
            chapter.title = title
            chapter.slug = self._generate_unique_slug(chapter.novel_id, title, exclude_chapter_id=chapter.id)

        if "chapter_number" in fields and chapter_number is not None and chapter_number != chapter.chapter_number:
            if self.repository.number_exists(chapter.novel_id, chapter_number, exclude_chapter_id=chapter.id):
                raise ChapterConflictError(f"Chapter number {chapter_number} already exists for this novel")
            chapter.chapter_number = chapter_number

        if "content" in fields and content is not None:
            chapter.content = content
            chapter.word_count = self._calculate_word_count(content)

        if "summary" in fields:
            chapter.summary = summary

        if "status" in fields and status is not None and status != chapter.status:
            chapter.status = status
            if status == "published" and chapter.published_at is None:
                chapter.published_at = datetime.now(timezone.utc)
            elif status != "published":
                chapter.published_at = None

        self._save_or_raise_conflict("Failed to update chapter")
        self.repository.refresh(chapter)
        return chapter

    def delete_chapter(self, current_user: User, chapter_id: uuid.UUID) -> None:
        chapter = self._get_author_chapter(current_user, chapter_id)
        chapter.deleted_at = datetime.now(timezone.utc)
        self.repository.save()

    def publish_chapter(self, current_user: User, chapter_id: uuid.UUID) -> Chapter:
        chapter = self._get_author_chapter(current_user, chapter_id)
        if chapter.status == "published":
            raise ChapterPublishError("Chapter is already published")
        if not chapter.title.strip():
            raise ChapterPublishError("Chapter title is required before publishing")

        chapter.status = "published"
        if chapter.published_at is None:
            chapter.published_at = datetime.now(timezone.utc)

        self.repository.save()
        self.repository.refresh(chapter)
        return chapter

    def get_public_chapters(self, novel_id: uuid.UUID) -> list[Chapter]:
        novel = self.novel_repository.get_active_by_id(novel_id)
        if novel is None or novel.visibility != "public" or novel.moderation_status != "approved":
            raise NovelNotFoundError("Novel is not available")
        return self.repository.get_chapters_by_novel(novel_id, status_filter="published")

    def get_author_chapters(self, current_user: User, novel_id: uuid.UUID) -> list[Chapter]:
        self._get_author_novel(current_user, novel_id)
        return self.repository.get_chapters_by_novel(novel_id)

    def get_public_chapter_detail(self, chapter_id: uuid.UUID) -> Chapter:
        chapter = self.repository.get_active_by_id(chapter_id)
        if chapter is None or chapter.status != "published":
            raise ChapterNotFoundError("Chapter is not available")

        novel = self.novel_repository.get_active_by_id(chapter.novel_id)
        if novel is None or novel.visibility != "public" or novel.moderation_status != "approved":
            raise NovelNotFoundError("Novel is not available")

        chapter.view_count += 1
        self.repository.save()
        return chapter

    def get_author_chapter_detail(self, current_user: User, chapter_id: uuid.UUID) -> Chapter:
        chapter = self._get_author_chapter(current_user, chapter_id)
        return chapter

    def _get_author_novel(self, current_user: User, novel_id: uuid.UUID) -> Novel:
        novel = self.novel_repository.get_active_by_id(novel_id)
        if novel is None:
            raise NovelNotFoundError("Novel is not available")
        if novel.author_id != current_user.id:
            raise PermissionDeniedError("Permission denied")
        return novel

    def _get_author_chapter(self, current_user: User, chapter_id: uuid.UUID) -> Chapter:
        chapter = self.repository.get_active_by_id(chapter_id)
        if chapter is None:
            raise ChapterNotFoundError("Chapter is not available")
        self._get_author_novel(current_user, chapter.novel_id)
        return chapter

    def _calculate_word_count(self, content: str) -> int:
        if not content:
            return 0
        return len(content.strip().split())

    def _generate_unique_slug(self, novel_id: uuid.UUID, title: str, exclude_chapter_id: uuid.UUID | None = None) -> str:
        base_slug = _slugify(title)
        slug = base_slug
        suffix = 2
        while self.repository.slug_exists(novel_id, slug, exclude_chapter_id=exclude_chapter_id):
            suffix_text = f"-{suffix}"
            slug = f"{base_slug[:280 - len(suffix_text)]}{suffix_text}"
            suffix += 1
            if suffix > 50:
                random_suffix = uuid.uuid4().hex[:12]
                slug = f"{base_slug[:267]}-{random_suffix}"
                if not self.repository.slug_exists(novel_id, slug, exclude_chapter_id=exclude_chapter_id):
                    break
        return slug

    def _save_or_raise_conflict(self, message: str) -> None:
        try:
            self.repository.save()
        except IntegrityError as exc:
            self.repository.rollback()
            raise ChapterConflictError(message) from exc


def _slugify(value: str) -> str:
    normalized = value.strip().lower().replace("đ", "d")
    normalized = unicodedata.normalize("NFKD", normalized)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text).strip("-")
    return (slug or "chapter")[:280]
