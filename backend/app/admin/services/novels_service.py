import uuid

from app.admin.repositories.novels_repository import (
    AdminNovelRecord,
    AdminNovelsRepository,
)


class AdminNovelNotFoundError(Exception):
    pass


class AdminNovelsService:
    def __init__(self, repository: AdminNovelsRepository) -> None:
        self.repository = repository

    def list_novels(
        self,
        *,
        search: str | None,
        status: str | None,
        visibility: str | None,
        moderation_status: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[AdminNovelRecord], int]:
        return self.repository.list_novels(
            search=self._normalize_search(search),
            status=status,
            visibility=visibility,
            moderation_status=moderation_status,
            page=page,
            page_size=page_size,
        )

    def get_novel(self, novel_id: uuid.UUID) -> AdminNovelRecord:
        novel = self.repository.get_novel(novel_id)
        if novel is None:
            raise AdminNovelNotFoundError("Novel not found")
        return novel

    @staticmethod
    def _normalize_search(search: str | None) -> str | None:
        if search is None:
            return None
        normalized = search.strip()
        return normalized or None
