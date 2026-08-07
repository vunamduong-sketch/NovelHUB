import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.author_follow import AuthorFollow
from app.models.comment import Comment
from app.models.novel import Novel
from app.models.novel_follow import NovelFollow
from app.models.rating import Rating
from app.models.user import User
from app.repositories.community_repository import CommunityRepository
from app.schemas.auth import MessageResponse
from app.schemas.community import (
    AuthorFollowResponse,
    CommentCreateRequest,
    CommentResponse,
    FollowToggleRequest,
    NovelFollowResponse,
    RatingResponse,
    RatingStatusResponse,
    RatingUpsertRequest,
)
from app.services.community_service import (
    CommunityConflictError,
    CommunityNotFoundError,
    CommunityService,
)


router = APIRouter(tags=["community"])


def get_community_service(
    db: Session = Depends(get_db),
) -> CommunityService:
    return CommunityService(CommunityRepository(db))


def _comment_response(
    comment: Comment,
    user: User,
    replies: list[CommentResponse] | None = None,
) -> CommentResponse:
    return CommentResponse(
        id=comment.id,
        chapter_id=comment.chapter_id,
        user_id=comment.user_id,
        username=user.username,
        display_name=user.display_name,
        parent_id=comment.parent_id,
        content=comment.content,
        status=comment.status,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        edited_at=comment.edited_at,
        replies=replies or [],
    )


def _rating_response(rating: Rating) -> RatingResponse:
    return RatingResponse(
        user_id=rating.user_id,
        novel_id=rating.novel_id,
        score=rating.score,
        review_text=rating.review_text,
        created_at=rating.created_at,
        updated_at=rating.updated_at,
    )


def _novel_follow_response(
    follow: NovelFollow,
    novel: Novel,
    author: User,
) -> NovelFollowResponse:
    return NovelFollowResponse(
        novel_id=novel.id,
        title=novel.title,
        slug=novel.slug,
        cover_url=novel.cover_url,
        author_id=author.id,
        author_name=author.display_name or author.username,
        notifications_enabled=follow.notifications_enabled,
        followed_at=follow.created_at,
    )


def _author_follow_response(
    follow: AuthorFollow,
    author: User,
) -> AuthorFollowResponse:
    return AuthorFollowResponse(
        author_id=author.id,
        username=author.username,
        display_name=author.display_name,
        avatar_url=author.avatar_url,
        notifications_enabled=follow.notifications_enabled,
        followed_at=follow.created_at,
    )


@router.post(
    "/chapters/{chapter_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_chapter_comment(
    chapter_id: uuid.UUID,
    payload: CommentCreateRequest,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(get_community_service),
) -> CommentResponse:
    try:
        comment, user = service.create_comment(
            current_user,
            chapter_id,
            content=payload.content,
        )
    except CommunityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    return _comment_response(comment, user)


@router.get(
    "/chapters/{chapter_id}/comments",
    response_model=list[CommentResponse],
)
def list_chapter_comments(
    chapter_id: uuid.UUID,
    service: CommunityService = Depends(get_community_service),
) -> list[CommentResponse]:
    try:
        items = service.list_chapter_comments(chapter_id)
    except CommunityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    top_level: list[CommentResponse] = []
    replies_by_parent: dict[uuid.UUID, list[CommentResponse]] = {}

    for comment, user in items:
        response = _comment_response(comment, user)
        if comment.parent_id is None:
            top_level.append(response)
        else:
            replies_by_parent.setdefault(
                comment.parent_id,
                [],
            ).append(response)

    for comment in top_level:
        comment.replies = replies_by_parent.get(comment.id, [])

    return top_level


@router.post(
    "/comments/{comment_id}/replies",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def reply_comment(
    comment_id: uuid.UUID,
    payload: CommentCreateRequest,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(get_community_service),
) -> CommentResponse:
    try:
        reply, user = service.reply_comment(
            current_user,
            comment_id,
            content=payload.content,
        )
    except CommunityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except CommunityConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    return _comment_response(reply, user)


@router.put(
    "/novels/{novel_id}/rating",
    response_model=RatingStatusResponse,
)
def rate_novel(
    novel_id: uuid.UUID,
    payload: RatingUpsertRequest,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(get_community_service),
) -> RatingStatusResponse:
    try:
        rating, novel = service.rate_novel(
            current_user,
            novel_id,
            score=payload.score,
            review_text=payload.review_text,
        )
    except CommunityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    return RatingStatusResponse(
        rating_average=novel.rating_average,
        rating_count=novel.rating_count,
        my_rating=_rating_response(rating),
    )


@router.get(
    "/novels/{novel_id}/rating",
    response_model=RatingStatusResponse,
)
def get_novel_rating_status(
    novel_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(get_community_service),
) -> RatingStatusResponse:
    try:
        rating, novel = service.get_novel_rating_status(
            current_user,
            novel_id,
        )
    except CommunityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    return RatingStatusResponse(
        rating_average=novel.rating_average,
        rating_count=novel.rating_count,
        my_rating=_rating_response(rating) if rating else None,
    )


@router.put(
    "/novels/{novel_id}/follow",
    response_model=NovelFollowResponse,
)
def follow_novel(
    novel_id: uuid.UUID,
    payload: FollowToggleRequest,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(get_community_service),
) -> NovelFollowResponse:
    try:
        follow, novel, author = service.follow_novel(
            current_user,
            novel_id,
            notifications_enabled=payload.notifications_enabled,
        )
    except CommunityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    return _novel_follow_response(follow, novel, author)


@router.delete(
    "/novels/{novel_id}/follow",
    response_model=MessageResponse,
)
def unfollow_novel(
    novel_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(get_community_service),
) -> MessageResponse:
    try:
        service.unfollow_novel(current_user, novel_id)
    except CommunityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    return MessageResponse(message="Novel unfollowed successfully.")


@router.put(
    "/authors/{author_id}/follow",
    response_model=AuthorFollowResponse,
)
def follow_author(
    author_id: uuid.UUID,
    payload: FollowToggleRequest,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(get_community_service),
) -> AuthorFollowResponse:
    try:
        follow, author = service.follow_author(
            current_user,
            author_id,
            notifications_enabled=payload.notifications_enabled,
        )
    except CommunityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except CommunityConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    return _author_follow_response(follow, author)


@router.delete(
    "/authors/{author_id}/follow",
    response_model=MessageResponse,
)
def unfollow_author(
    author_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(get_community_service),
) -> MessageResponse:
    try:
        service.unfollow_author(current_user, author_id)
    except CommunityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    return MessageResponse(message="Author unfollowed successfully.")


@router.get(
    "/me/followed-novels",
    response_model=list[NovelFollowResponse],
)
def list_followed_novels(
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(get_community_service),
) -> list[NovelFollowResponse]:
    items = service.list_followed_novels(current_user)
    return [
        _novel_follow_response(follow, novel, author)
        for follow, novel, author in items
    ]


@router.get(
    "/me/followed-authors",
    response_model=list[AuthorFollowResponse],
)
def list_followed_authors(
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(get_community_service),
) -> list[AuthorFollowResponse]:
    items = service.list_followed_authors(current_user)
    return [
        _author_follow_response(follow, author)
        for follow, author in items
    ]

