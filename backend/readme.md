# NovelHub Backend - Database

Phần database được triển khai bằng PostgreSQL 15+, SQLAlchemy 2 và Alembic theo
thiết kế trong dự án `novel`.

## Cấu trúc

```text
backend/
├── alembic/
│   ├── versions/20260728_0001_initial_schema.py
│   └── env.py
├── app/
│   ├── core/config.py
│   ├── database/
│   │   ├── base.py
│   │   └── session.py
│   └── models/
│       ├── user.py
│       ├── novel.py
│       ├── chapter.py
│       └── ... (mỗi model nằm trong một file riêng)
├── .env.example
├── alembic.ini
└── requirements.txt
```

Schema gồm 17 bảng:

- Auth: `users`, `roles`, `user_roles`, `refresh_tokens`
- Nội dung: `categories`, `tags`, `novels`, `novel_tags`, `chapters`
- Tương tác: `ratings`, `bookmarks`, `novel_follows`, `author_follows`,
  `reading_history`, `comments`
- Hệ thống và AI: `notifications`, `ai_requests`

## Khởi tạo

Tạo database PostgreSQL rỗng tên `novelhub`, sau đó:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
```

Chỉnh `DATABASE_URL` trong `.env` nếu thông tin kết nối PostgreSQL của bạn khác
giá trị mẫu.

Migration đầu tiên sẽ:

1. Bật extension `pgcrypto`.
2. Tạo toàn bộ bảng, khóa ngoại, check constraint và index.
3. Tạo trigger tự cập nhật `updated_at`.
4. Seed ba role `reader`, `author`, `admin`.

## Tạo migration tiếp theo

Sau khi sửa model:

```powershell
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Chạy bằng Docker

Từ thư mục `NovelHUB/backend`:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Compose khởi động PostgreSQL ở cổng host `5433` và API ở
`http://localhost:8000`. Container backend tự chạy `alembic upgrade head`
trước khi khởi động Uvicorn.

Kiểm tra API:

```text
GET http://localhost:8000/health
GET http://localhost:8000/docs
```

Dừng container:

```powershell
docker compose down
```

Thêm `-v` nếu muốn xóa cả volume database:

```powershell
docker compose down -v
```
