# NovelHub Community Management

Tài liệu này mô tả Community Management theo luồng `router -> service -> repository -> schema -> tests -> docs`. Module chỉ sử dụng schema, authentication và role hiện có của nhánh `main`; không thay đổi contract `/api/v1/auth/*`, password hashing, JWT hay database migration của module khác.

## Mục tiêu module

Người dùng đang đăng nhập có thể:

- Bình luận tại chương đã xuất bản công khai.
- Trả lời một bình luận cấp đầu.
- Chấm điểm 1 đến 5 và cập nhật nhận xét cho truyện công khai.
- Theo dõi hoặc bỏ theo dõi truyện công khai của tác giả khác.
- Theo dõi hoặc bỏ theo dõi người dùng có role `author`.
- Xem truyện, tác giả đang theo dõi và số người đang theo dõi tác giả.

## Các file chính

```text
backend/app/schemas/community.py
backend/app/repositories/community_repository.py
backend/app/services/community_service.py
backend/app/api/routers/community.py
backend/tests/test_community_schema.py
backend/tests/test_community_service.py
backend/tests/test_community_integration.py
backend/docs/community_management.md
```

Router được include trong `backend/main.py`:

```python
app.include_router(community_router, prefix="/api/v1")
```

## API contract

| Endpoint | Actor | Success | Errors |
| --- | --- | --- | --- |
| `GET /chapters/{chapter_id}/comments` | public | `200` danh sách bình luận dạng cây | `404` |
| `POST /chapters/{chapter_id}/comments` | authenticated user | `201` bình luận cấp đầu | `401`, `404`, `422` |
| `POST /comments/{comment_id}/replies` | authenticated user | `201` phản hồi | `401`, `404`, `409`, `422` |
| `GET /novels/{novel_id}/rating` | authenticated user | `200` điểm trung bình và điểm của mình | `401`, `404` |
| `PUT /novels/{novel_id}/rating` | authenticated user | `200` điểm đã tạo/cập nhật | `401`, `404`, `422` |
| `PUT /novels/{novel_id}/follow` | authenticated user | `200` theo dõi truyện | `401`, `404`, `409` |
| `DELETE /novels/{novel_id}/follow` | authenticated user | `200` message | `401`, `404` |
| `PUT /authors/{author_id}/follow` | authenticated user | `200` theo dõi tác giả và `follower_count` | `401`, `404`, `409` |
| `DELETE /authors/{author_id}/follow` | authenticated user | `200` message | `401`, `404` |
| `GET /me/followed-novels` | authenticated user | `200` danh sách truyện theo dõi | `401` |
| `GET /me/followed-authors` | authenticated user | `200` danh sách tác giả theo dõi và số follower | `401` |
| `GET /authors/{author_id}/follower-count` | public | `200` số người theo dõi tác giả | `404` |

Validation errors của FastAPI trả `422` với mảng `detail`. Business errors trả `{ "detail": "..." }`.

## Business rules

- Chỉ chương `published` thuộc truyện `public` và `approved` mới được bình luận hoặc xem bình luận.
- Reply chỉ được phép ở một cấp, không thể reply vào reply.
- Chỉ truyện `public` và `approved` mới được đánh giá hoặc theo dõi.
- Một user không được theo dõi truyện do chính mình viết.
- Chỉ user active có role `author` mới có thể được theo dõi như tác giả.
- Một user không được theo dõi chính mình như tác giả.
- `novels.follower_count`, `rating_count` và `rating_average` được cập nhật trong cùng transaction repository.
- `author_follows` dùng schema hiện có; số follower tác giả được đếm từ bảng này, không thêm cột vào `users`.

## Unit test

Unit test không cần PostgreSQL:

```powershell
cd backend
..\.venv\Scripts\python.exe -m pytest tests/test_community_schema.py tests/test_community_service.py
```

Coverage hiện có kiểm tra validation comment/rating, comment trên chương public, giới hạn reply một cấp, cập nhật rating, chặn self-follow truyện/tác giả và chặn follow user không có role `author`.

## Integration test

Integration test bắt buộc dùng database PostgreSQL riêng, không trỏ `NOVELHUB_TEST_DATABASE_URL` vào development hoặc production database.

```powershell
cd backend
$env:POSTGRES_ADMIN_URL = "postgresql+psycopg://postgres:postgres@localhost:5433/postgres"
$env:NOVELHUB_TEST_DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5433/novelhub_community_test"
$env:DATABASE_URL = $env:NOVELHUB_TEST_DATABASE_URL
..\.venv\Scripts\python.exe -c "import os; from sqlalchemy import create_engine, text; engine=create_engine(os.environ['POSTGRES_ADMIN_URL'], isolation_level='AUTOCOMMIT'); connection=engine.connect(); exists=connection.execute(text(\"SELECT 1 FROM pg_database WHERE datname = 'novelhub_community_test'\")).scalar(); connection.execute(text('CREATE DATABASE novelhub_community_test')) if not exists else None; connection.close()"
..\.venv\Scripts\python.exe -m alembic upgrade head
..\.venv\Scripts\python.exe -m pytest tests/test_community_integration.py
```

Integration test kiểm tra luồng tạo comment, reply, list comment của người khác, rating, follow novel, follow author, followed lists, follower count, self-follow novel và follow một reader.
