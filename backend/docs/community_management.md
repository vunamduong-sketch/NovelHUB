# Community Module

## Scope

Reader community features for NovelHub MVP:

- Comment on a published chapter.
- Reply to a top-level comment.
- Rate a public novel from 1 to 5.
- Follow or unfollow a public novel.
- Follow or unfollow an author.
- View followed novels and followed authors.

## API

All write endpoints require an authenticated active user.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/chapters/{chapter_id}/comments` | List visible comments and replies for a public published chapter. |
| `POST` | `/api/v1/chapters/{chapter_id}/comments` | Create a top-level comment. |
| `POST` | `/api/v1/comments/{comment_id}/replies` | Reply to a top-level comment. |
| `GET` | `/api/v1/novels/{novel_id}/rating` | View aggregate rating and current user's rating. |
| `PUT` | `/api/v1/novels/{novel_id}/rating` | Create or update current user's rating. |
| `PUT` | `/api/v1/novels/{novel_id}/follow` | Follow a public novel or update notification preference. |
| `DELETE` | `/api/v1/novels/{novel_id}/follow` | Unfollow a novel. |
| `PUT` | `/api/v1/authors/{author_id}/follow` | Follow an active author or update notification preference. |
| `DELETE` | `/api/v1/authors/{author_id}/follow` | Unfollow an author. |
| `GET` | `/api/v1/me/followed-novels` | List public novels followed by current user. |
| `GET` | `/api/v1/me/followed-authors` | List active authors followed by current user. |

## Business Rules

- Only public, approved novels can be rated or followed.
- Only published chapters under public, approved novels can receive comments.
- Replies are limited to one level under top-level comments.
- Users cannot follow themselves as authors.
- Novel follow count is updated when a novel follow is created or removed.
- Novel rating average and rating count are recalculated when a rating is created or updated.

