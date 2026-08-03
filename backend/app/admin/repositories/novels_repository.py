import uuid
from dataclasses import dataclass

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.novel import Novel
from app.models.user import User


@dataclass
class AdminNovelRecord:
    novel: Novel
    author_name: str | None
    category_name: str | None


class AdminNovelsRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

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
        filters = [Novel.deleted_at.is_(None)]
        if search:
            pattern = f"%{search}%"
            filters.append(
                or_(Novel.title.ilike(pattern), Novel.description.ilike(pattern))
            )
        if status:
            filters.append(Novel.status == status)
        if visibility:
            filters.append(Novel.visibility == visibility)
        if moderation_status:
            filters.append(Novel.moderation_status == moderation_status)

        total = self.session.scalar(
            select(func.count()).select_from(Novel).where(*filters)
        ) or 0
        statement = (
            select(Novel, User.display_name, User.username, Category.name)
            .outerjoin(User, User.id == Novel.author_id)
            .outerjoin(Category, Category.id == Novel.category_id)
            .where(*filters)
            .order_by(Novel.updated_at.desc(), Novel.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        records = [
            AdminNovelRecord(
                novel=row[0],
                author_name=row[1] or row[2],
                category_name=row[3],
            )
            for row in self.session.execute(statement)
        ]
        return records, int(total)

    def get_novel(self, novel_id: uuid.UUID) -> AdminNovelRecord | None:
        row = self.session.execute(
            select(Novel, User.display_name, User.username, Category.name)
            .outerjoin(User, User.id == Novel.author_id)
            .outerjoin(Category, Category.id == Novel.category_id)
            .where(Novel.id == novel_id, Novel.deleted_at.is_(None))
        ).first()
        if row is None:
            return None
        return AdminNovelRecord(
            novel=row[0],
            author_name=row[1] or row[2],
            category_name=row[3],
        )
