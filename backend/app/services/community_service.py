import uuid

from app.models.author_follow import AuthorFollow
from app.models.comment import Comment
from app.models.novel import Novel
from app.models.novel_follow import NovelFollow
from app.models.rating import Rating
from app.models.user import User
from app.repositories.community_repository import CommunityRepository


class CommunityError(Exception):
    pass


class CommunityNotFoundError(CommunityError):
    pass


class CommunityConflictError(CommunityError):
    pass


class CommunityService:
    def __init__(self, repository: CommunityRepository) -> None:
        self.repository = repository

    def create_comment(
        self,
        current_user: User,
        chapter_id: uuid.UUID,
        *,
        content: str,
    ) -> tuple[Comment, User]:
        chapter = self.repository.get_public_chapter(chapter_id)
        if chapter is None:
            raise CommunityNotFoundError("Chapter is not available")

        comment = self.repository.add_comment(
            chapter_id=chapter.id,
            user_id=current_user.id,
            content=content,
        )
        return comment, current_user

    def reply_comment(
        self,
        current_user: User,
        comment_id: uuid.UUID,
        *,
        content: str,
    ) -> tuple[Comment, User]:
        parent = self.repository.get_visible_comment(comment_id)
        if parent is None:
            raise CommunityNotFoundError("Comment is not available")

        if parent.parent_id is not None:
            raise CommunityConflictError(
                "Replies can only be added to top-level comments"
            )

        chapter = self.repository.get_public_chapter(parent.chapter_id)
        if chapter is None:
            raise CommunityNotFoundError("Chapter is not available")

        reply = self.repository.add_comment(
            chapter_id=parent.chapter_id,
            user_id=current_user.id,
            parent_id=parent.id,
            content=content,
        )
        return reply, current_user

    def list_chapter_comments(
        self,
        chapter_id: uuid.UUID,
    ) -> list[tuple[Comment, User]]:
        if self.repository.get_public_chapter(chapter_id) is None:
            raise CommunityNotFoundError("Chapter is not available")
        return self.repository.list_chapter_comments(chapter_id)

    def rate_novel(
        self,
        current_user: User,
        novel_id: uuid.UUID,
        *,
        score: int,
        review_text: str | None,
    ) -> tuple[Rating, Novel]:
        novel = self.repository.get_public_novel(novel_id)
        if novel is None:
            raise CommunityNotFoundError("Novel is not available")

        rating = self.repository.upsert_rating(
            user_id=current_user.id,
            novel=novel,
            score=score,
            review_text=review_text,
        )
        return rating, novel

    def get_novel_rating_status(
        self,
        current_user: User,
        novel_id: uuid.UUID,
    ) -> tuple[Rating | None, Novel]:
        novel = self.repository.get_public_novel(novel_id)
        if novel is None:
            raise CommunityNotFoundError("Novel is not available")
        return self.repository.get_rating(current_user.id, novel.id), novel

    def follow_novel(
        self,
        current_user: User,
        novel_id: uuid.UUID,
        *,
        notifications_enabled: bool,
    ) -> tuple[NovelFollow, Novel, User]:
        novel = self.repository.get_public_novel(novel_id)
        if novel is None:
            raise CommunityNotFoundError("Novel is not available")
        author = self.repository.get_active_user(novel.author_id)
        if author is None:
            raise CommunityNotFoundError("Author is not available")

        follow = self.repository.upsert_novel_follow(
            user_id=current_user.id,
            novel=novel,
            notifications_enabled=notifications_enabled,
        )
        return follow, novel, author

    def unfollow_novel(
        self,
        current_user: User,
        novel_id: uuid.UUID,
    ) -> None:
        novel = self.repository.get_public_novel(novel_id)
        if novel is None:
            raise CommunityNotFoundError("Novel is not available")
        follow = self.repository.get_novel_follow(current_user.id, novel.id)
        if follow is None:
            raise CommunityNotFoundError("Novel follow does not exist")
        self.repository.delete_novel_follow(follow, novel)

    def list_followed_novels(
        self,
        current_user: User,
    ) -> list[tuple[NovelFollow, Novel, User]]:
        return self.repository.list_followed_novels(current_user.id)

    def follow_author(
        self,
        current_user: User,
        author_id: uuid.UUID,
        *,
        notifications_enabled: bool,
    ) -> tuple[AuthorFollow, User]:
        if current_user.id == author_id:
            raise CommunityConflictError("You cannot follow yourself")

        author = self.repository.get_active_user(author_id)
        if author is None:
            raise CommunityNotFoundError("Author is not available")

        follow = self.repository.upsert_author_follow(
            follower_id=current_user.id,
            author=author,
            notifications_enabled=notifications_enabled,
        )
        return follow, author

    def unfollow_author(
        self,
        current_user: User,
        author_id: uuid.UUID,
    ) -> None:
        follow = self.repository.get_author_follow(current_user.id, author_id)
        if follow is None:
            raise CommunityNotFoundError("Author follow does not exist")
        self.repository.delete_author_follow(follow)

    def list_followed_authors(
        self,
        current_user: User,
    ) -> list[tuple[AuthorFollow, User]]:
        return self.repository.list_followed_authors(current_user.id)

