import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.author_follow import AuthorFollow
from app.models.chapter import Chapter
from app.models.comment import Comment
from app.models.novel import Novel
from app.models.novel_follow import NovelFollow
from app.models.rating import Rating
from app.models.user import User


class CommunityRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_active_user(self, user_id: uuid.UUID) -> User | None:
        return self.session.scalar(
            select(User).where(
                User.id == user_id,
                User.status == "active",
                User.deleted_at.is_(None),
            )
        )

    def get_public_novel(self, novel_id: uuid.UUID) -> Novel | None:
        return self.session.scalar(
            select(Novel).where(
                Novel.id == novel_id,
                Novel.deleted_at.is_(None),
                Novel.visibility == "public",
                Novel.moderation_status == "approved",
            )
        )

    def get_public_chapter(self, chapter_id: uuid.UUID) -> Chapter | None:
        return self.session.scalar(
            select(Chapter)
            .join(Novel, Novel.id == Chapter.novel_id)
            .where(
                Chapter.id == chapter_id,
                Chapter.deleted_at.is_(None),
                Chapter.status == "published",
                Novel.deleted_at.is_(None),
                Novel.visibility == "public",
                Novel.moderation_status == "approved",
            )
        )

    def get_visible_comment(self, comment_id: uuid.UUID) -> Comment | None:
        return self.session.scalar(
            select(Comment).where(
                Comment.id == comment_id,
                Comment.deleted_at.is_(None),
                Comment.status == "visible",
            )
        )

    def add_comment(
        self,
        *,
        chapter_id: uuid.UUID,
        user_id: uuid.UUID,
        content: str,
        parent_id: uuid.UUID | None = None,
    ) -> Comment:
        comment = Comment(
            chapter_id=chapter_id,
            user_id=user_id,
            parent_id=parent_id,
            content=content,
            status="visible",
        )
        self.session.add(comment)
        self.session.commit()
        self.session.refresh(comment)
        return comment

    def list_chapter_comments(
        self,
        chapter_id: uuid.UUID,
    ) -> list[tuple[Comment, User]]:
        statement = (
            select(Comment, User)
            .join(User, User.id == Comment.user_id)
            .where(
                Comment.chapter_id == chapter_id,
                Comment.deleted_at.is_(None),
                Comment.status == "visible",
            )
            .order_by(Comment.created_at.asc())
        )
        return [(row[0], row[1]) for row in self.session.execute(statement)]

    def get_rating(
        self,
        user_id: uuid.UUID,
        novel_id: uuid.UUID,
    ) -> Rating | None:
        return self.session.get(Rating, (user_id, novel_id))

    def upsert_rating(
        self,
        *,
        user_id: uuid.UUID,
        novel: Novel,
        score: int,
        review_text: str | None,
    ) -> Rating:
        rating = self.get_rating(user_id, novel.id)
        if rating is None:
            rating = Rating(
                user_id=user_id,
                novel_id=novel.id,
                score=score,
                review_text=review_text,
            )
            self.session.add(rating)
        else:
            rating.score = score
            rating.review_text = review_text

        self.session.flush()
        self.refresh_novel_rating_stats(novel)
        self.session.commit()
        self.session.refresh(rating)
        self.session.refresh(novel)
        return rating

    def refresh_novel_rating_stats(self, novel: Novel) -> None:
        rating_count, rating_average = self.session.execute(
            select(
                func.count(Rating.user_id),
                func.coalesce(func.avg(Rating.score), 0),
            ).where(Rating.novel_id == novel.id)
        ).one()
        novel.rating_count = int(rating_count or 0)
        novel.rating_average = Decimal(str(rating_average or 0)).quantize(
            Decimal("0.01")
        )

    def get_novel_follow(
        self,
        user_id: uuid.UUID,
        novel_id: uuid.UUID,
    ) -> NovelFollow | None:
        return self.session.get(NovelFollow, (user_id, novel_id))

    def upsert_novel_follow(
        self,
        *,
        user_id: uuid.UUID,
        novel: Novel,
        notifications_enabled: bool,
    ) -> NovelFollow:
        follow = self.get_novel_follow(user_id, novel.id)
        if follow is None:
            follow = NovelFollow(
                user_id=user_id,
                novel_id=novel.id,
                notifications_enabled=notifications_enabled,
            )
            self.session.add(follow)
            novel.follower_count = int(novel.follower_count or 0) + 1
        else:
            follow.notifications_enabled = notifications_enabled

        self.session.commit()
        self.session.refresh(follow)
        self.session.refresh(novel)
        return follow

    def delete_novel_follow(self, follow: NovelFollow, novel: Novel) -> None:
        self.session.delete(follow)
        novel.follower_count = max(0, int(novel.follower_count or 0) - 1)
        self.session.commit()

    def list_followed_novels(
        self,
        user_id: uuid.UUID,
    ) -> list[tuple[NovelFollow, Novel, User]]:
        statement = (
            select(NovelFollow, Novel, User)
            .join(Novel, Novel.id == NovelFollow.novel_id)
            .join(User, User.id == Novel.author_id)
            .where(
                NovelFollow.user_id == user_id,
                Novel.deleted_at.is_(None),
                Novel.visibility == "public",
                Novel.moderation_status == "approved",
            )
            .order_by(NovelFollow.created_at.desc())
        )
        return [(row[0], row[1], row[2]) for row in self.session.execute(statement)]

    def get_author_follow(
        self,
        follower_id: uuid.UUID,
        author_id: uuid.UUID,
    ) -> AuthorFollow | None:
        return self.session.get(AuthorFollow, (follower_id, author_id))

    def upsert_author_follow(
        self,
        *,
        follower_id: uuid.UUID,
        author: User,
        notifications_enabled: bool,
    ) -> AuthorFollow:
        follow = self.get_author_follow(follower_id, author.id)
        if follow is None:
            follow = AuthorFollow(
                follower_id=follower_id,
                author_id=author.id,
                notifications_enabled=notifications_enabled,
            )
            self.session.add(follow)
        else:
            follow.notifications_enabled = notifications_enabled

        self.session.commit()
        self.session.refresh(follow)
        return follow

    def delete_author_follow(self, follow: AuthorFollow) -> None:
        self.session.delete(follow)
        self.session.commit()

    def list_followed_authors(
        self,
        follower_id: uuid.UUID,
    ) -> list[tuple[AuthorFollow, User]]:
        statement = (
            select(AuthorFollow, User)
            .join(User, User.id == AuthorFollow.author_id)
            .where(
                AuthorFollow.follower_id == follower_id,
                User.status == "active",
                User.deleted_at.is_(None),
            )
            .order_by(AuthorFollow.created_at.desc())
        )
        return [(row[0], row[1]) for row in self.session.execute(statement)]
