# NovelHub Novel Management

Tài liệu này mô tả module Novel Management, bao gồm thiết kế API, nguyên tắc phân quyền, business rules và hướng dẫn kiểm thử. Module này được tổ chức theo cùng kiểu với Authentication và User Management: `router -> service -> repository -> schema -> tests -> docs`.

## Mục tiêu module

Author có thể:

- Tạo novel.
- Chỉnh sửa novel của chính mình.
- Xóa novel của chính mình theo cơ chế soft delete.
- Xuất bản novel của chính mình.
- Chọn category và tag đã có sẵn trong database cho novel, nhưng không được tạo/sửa/xóa category hoặc tag.

Reader hoặc người dùng public có thể:

- Xem danh sách novel đã được xuất bản công khai.
- Xem chi tiết novel đã được xuất bản công khai.
- Lấy danh sách category đang active để chọn/lọc.
- Lấy danh sách tag có sẵn để chọn/lọc.

## Nguyên tắc không xung đột với module hiện có

- Không thay đổi API contract của `/api/v1/auth/*`.
- Không thay đổi API contract của `/api/v1/users/*`.
- Không sửa business logic trong `AuthService` hoặc `UserService`.
- Novel Management dùng router, service, repository và schema riêng.
- Endpoint của author dùng chung `get_current_user`, sau đó kiểm tra role `author` bằng `require_author`.
- Endpoint reader/public chỉ trả novel public và chưa bị xóa mềm.
- Category và tag là dữ liệu hệ thống/admin quản lý. Vì module admin chưa phát triển, dữ liệu này cần được tạo sẵn trong database.
- Author có thể bỏ qua category/tag, hoặc chọn từ category/tag đang tồn tại.
- Author có thể xem danh sách novel của chính mình, bao gồm draft/private/public miễn là chưa bị soft delete.

## Các file chính

```text
backend/app/schemas/novel.py
backend/app/repositories/novel_repository.py
backend/app/services/novel_service.py
backend/app/api/routers/novels.py
backend/tests/test_novel_schema.py
backend/tests/test_novel_management_integration.py
backend/docs/novel_management.md
```

Router novel được include trong `backend/main.py`:

```python
app.include_router(novels_router, prefix="/api/v1")
```

## API contract

Prefix: `/api/v1/novels`

| Endpoint | Actor | Request | Success | Errors |
| --- | --- | --- | --- | --- |
| `POST /` | author | Novel create body | `201` novel | `401`, `403`, `404`, `409`, `422` |
| `PATCH /{novel_id}` | author | Novel update body | `200` updated novel | `401`, `403`, `404`, `409`, `422` |
| `DELETE /{novel_id}` | author | Bearer access token | `200` message | `401`, `403`, `404` |
| `POST /{novel_id}/publish` | author | Bearer access token | `200` published novel | `400`, `401`, `403`, `404` |
| `GET /` | reader/public | Query `search`, `category_id`, `status_filter` | `200` public novel list | `422` |
| `GET /me` | author | Query `visibility`, `status_filter` | `200` author novel list | `401`, `403`, `422` |
| `GET /categories` | reader/public | None | `200` active category list | - |
| `GET /tags` | reader/public | None | `200` tag list | - |
| `GET /{novel_id}` | reader/public | None | `200` public novel detail | `404` |

Validation errors của FastAPI trả `422` với mảng `detail`. Business errors trả `{ "detail": "..." }`. Message-only response dùng `{ "message": "..." }`.

## 1. POST `/api/v1/novels/`

Tạo novel mới cho author đang đăng nhập.

Authentication:

- Bắt buộc Bearer access token hợp lệ.
- User phải có role `author`.

Request body:

```json
{
  "title": "Tên truyện",
  "description": "Mô tả ngắn về truyện",
  "category_id": 1,
  "tag_ids": [1, 2, 3],
  "cover_url": "https://cdn.example.com/covers/novel.jpg",
  "language_code": "vi"
}
```

Rules:

- `title`: bắt buộc, 1-250 ký tự sau khi trim.
- `description`: tùy chọn, chuỗi rỗng sau khi trim được chuyển thành `null`.
- `category_id`: tùy chọn; nếu gửi lên thì category phải tồn tại và đang active.
- `tag_ids`: tùy chọn, mặc định `[]`; nếu gửi lên thì tất cả tag phải tồn tại trong database.
- `tag_ids` được backend loại ID trùng, chỉ nhận ID dương và tối đa 20 tag/novel.
- Author không được tạo tag mới thông qua endpoint tạo novel.
- `cover_url`: tùy chọn, chuỗi rỗng sau khi trim được chuyển thành `null`.
- `language_code`: mặc định `vi`, tối đa 10 ký tự, được normalize về lowercase.
- `slug` được backend sinh từ `title` và đảm bảo unique.
- Novel mới mặc định:
  - `status = "draft"`
  - `visibility = "private"`
  - `moderation_status = "approved"`
  - `published_at = null`

Success `201`:

```json
{
  "id": "uuid",
  "author_id": "uuid",
  "author_name": "Author Name",
  "category_id": 1,
  "tags": [
    {
      "id": 1,
      "name": "Fantasy",
      "slug": "fantasy"
    },
    {
      "id": 2,
      "name": "Action",
      "slug": "action"
    }
  ],
  "title": "Tên truyện",
  "slug": "ten-truyen",
  "description": "Mô tả ngắn về truyện",
  "cover_url": "https://cdn.example.com/covers/novel.jpg",
  "language_code": "vi",
  "status": "draft",
  "visibility": "private",
  "moderation_status": "approved",
  "published_at": null,
  "view_count": 0,
  "follower_count": 0,
  "rating_count": 0,
  "rating_average": "0.00"
}
```

Errors:

- `401`: chưa đăng nhập hoặc token không hợp lệ.
- `403`: user không có role `author`.
- `404`: category không tồn tại/inactive, hoặc một trong các tag không tồn tại.
- `409`: slug/title gây xung đột unique sau khi retry.
- `422`: validation error.

## 2. PATCH `/api/v1/novels/{novel_id}`

Chỉnh sửa novel của author đang đăng nhập.

Authentication:

- Bắt buộc Bearer access token hợp lệ.
- User phải có role `author`.
- Chỉ owner của novel mới được sửa.

Request body:

```json
{
  "title": "Tên truyện mới",
  "description": "Mô tả mới",
  "category_id": 2,
  "tag_ids": [2, 4],
  "cover_url": "https://cdn.example.com/covers/new.jpg",
  "status": "ongoing"
}
```

Rules:

- Tất cả field đều optional, nhưng phải gửi ít nhất 1 field.
- `title`: nếu thay đổi thì backend cập nhật slug theo title mới.
- `description`: cho phép `null` để xóa mô tả.
- `category_id`: nếu gửi lên thì category phải tồn tại và active; cho phép `null` để bỏ category.
- `tag_ids`: nếu gửi lên thì replace toàn bộ tag cũ bằng danh sách mới.
- `tag_ids: []`: xóa toàn bộ tag khỏi novel.
- Nếu không gửi `tag_ids` khi update thì giữ nguyên tag hiện tại.
- Tất cả tag trong `tag_ids` phải tồn tại trong database; author không được tạo/sửa/xóa tag ở đây.
- `cover_url`: cho phép `null` để xóa cover URL.
- `status`: chỉ chấp nhận `draft`, `ongoing`, `hiatus`, `completed`.
- Khi `status = "completed"`, service set `completed_at` nếu trước đó chưa có.
- Khi status khác `completed`, service xóa `completed_at`.
- Không cho sửa novel đã bị soft delete.

Success `200`: trả về novel mới nhất, cùng format với create response.

Errors:

- `401`: chưa đăng nhập hoặc token không hợp lệ.
- `403`: user không có role `author`.
- `404`: novel không tồn tại, không thuộc author, đã bị xóa, category không hợp lệ, hoặc tag không hợp lệ.
- `409`: slug/title gây xung đột unique.
- `422`: validation error.

## 3. DELETE `/api/v1/novels/{novel_id}`

Xóa novel của author đang đăng nhập theo cơ chế soft delete.

Authentication:

- Bắt buộc Bearer access token hợp lệ.
- User phải có role `author`.
- Chỉ owner của novel mới được xóa.

Rules:

- Không hard delete record.
- Set `deleted_at = now`.
- Novel đã soft delete không xuất hiện trong endpoint reader/public.

Success `200`:

```json
{
  "message": "Novel deleted successfully."
}
```

Errors:

- `401`: chưa đăng nhập hoặc token không hợp lệ.
- `403`: user không có role `author`.
- `404`: novel không tồn tại, không thuộc author, hoặc đã bị xóa.

## 4. POST `/api/v1/novels/{novel_id}/publish`

Xuất bản novel của author đang đăng nhập.

Authentication:

- Bắt buộc Bearer access token hợp lệ.
- User phải có role `author`.
- Chỉ owner của novel mới được publish.

Rules:

- Novel phải chưa bị soft delete.
- Novel phải có title hợp lệ.
- Set `visibility = "public"`.
- Nếu `status = "draft"` thì chuyển thành `status = "ongoing"`.
- Nếu `published_at` đang null thì set bằng thời điểm hiện tại.
- Giữ `moderation_status = "approved"` theo model hiện tại, trừ khi sau này có module moderation.

Success `200`: trả về novel đã publish, cùng format với create response.

Errors:

- `400`: novel chưa đủ điều kiện publish.
- `401`: chưa đăng nhập hoặc token không hợp lệ.
- `403`: user không có role `author`.
- `404`: novel không tồn tại, không thuộc author, hoặc đã bị xóa.

## 5. GET `/api/v1/novels/`

Reader hoặc public user xem danh sách novel đã xuất bản công khai.

Authentication:

- Không bắt buộc đăng nhập.

Query params:

| Param | Type | Required | Meaning |
| --- | --- | --- | --- |
| `search` | string | no | Tìm theo `title` hoặc `description` bằng match gần đúng |
| `category_id` | integer | no | Lọc theo category |
| `status_filter` | string | no | Lọc theo status: `draft`, `ongoing`, `hiatus`, `completed` |

Rules:

- Chỉ trả novel có:
  - `deleted_at IS NULL`
  - `visibility = "public"`
- Kết quả được sort theo `published_at DESC NULLS LAST`, sau đó `updated_at DESC`.
- Mỗi item trả cùng format `NovelResponse`, gồm `author_name` và `tags`.
- Nếu không có novel phù hợp thì trả mảng rỗng `[]`.

Success `200`:

```json
[
  {
    "id": "uuid",
    "author_id": "uuid",
    "author_name": "Author Name",
    "category_id": 1,
    "tags": [
      {
        "id": 1,
        "name": "Fantasy",
        "slug": "fantasy"
      }
    ],
    "title": "Tên truyện",
    "slug": "ten-truyen",
    "description": "Mô tả ngắn về truyện",
    "cover_url": null,
    "language_code": "vi",
    "status": "ongoing",
    "visibility": "public",
    "moderation_status": "approved",
    "published_at": "2026-07-31T10:00:00Z",
    "view_count": 0,
    "follower_count": 0,
    "rating_count": 0,
    "rating_average": "0.00"
  }
]
```

Errors:

- `422`: query param không đúng kiểu, ví dụ `category_id` không phải integer.

## 6. GET `/api/v1/novels/me`

Author xem danh sách novel của chính mình.

Authentication:

- Bắt buộc Bearer access token hợp lệ.
- User phải có role `author`.

Query params:

| Param | Type | Required | Meaning |
| --- | --- | --- | --- |
| `visibility` | string | no | Lọc theo `public` hoặc `private` |
| `status_filter` | string | no | Lọc theo `draft`, `ongoing`, `hiatus`, `completed` |

Rules:

- Chỉ trả novel thuộc author đang đăng nhập.
- Không trả novel đã bị soft delete.
- Có thể trả draft/private/public vì đây là endpoint quản lý của author.
- Kết quả sort theo `updated_at DESC`.
- Mỗi item trả cùng format `NovelResponse`, gồm `author_name` và `tags`.

Success `200`: trả về list novel của author. Nếu author chưa có novel phù hợp thì trả `[]`.

Errors:

- `401`: chưa đăng nhập hoặc token không hợp lệ.
- `403`: user không có role `author`.
- `422`: query param không hợp lệ.

## 7. GET `/api/v1/novels/categories`

Lấy danh sách category đang active để frontend/Swagger chọn khi tạo hoặc lọc novel.

Authentication:

- Không bắt buộc đăng nhập.

Rules:

- Chỉ trả category có `is_active = true`.
- Category/tag là dữ liệu do admin quản lý; endpoint này chỉ đọc dữ liệu có sẵn.
- Kết quả sort theo `name`.

Success `200`:

```json
[
  {
    "id": 1,
    "name": "Fantasy",
    "slug": "fantasy",
    "description": "Truyện kỳ ảo, phép thuật và thế giới tưởng tượng."
  }
]
```

## 8. GET `/api/v1/novels/tags`

Lấy danh sách tag có sẵn để frontend/Swagger chọn khi tạo hoặc lọc novel.

Authentication:

- Không bắt buộc đăng nhập.

Rules:

- Trả tất cả tag đang có trong bảng `tags`.
- Endpoint này không tạo/sửa/xóa tag.
- Kết quả sort theo `name`.

Success `200`:

```json
[
  {
    "id": 1,
    "name": "Fantasy",
    "slug": "fantasy"
  }
]
```

## 9. GET `/api/v1/novels/{novel_id}`

Reader hoặc public user xem chi tiết novel đã xuất bản công khai.

Authentication:

- Tạm thời không bắt buộc đăng nhập.
- Sau này nếu cần reading history hoặc personalization thì có thể thêm optional/current user dependency.

Rules:

- Chỉ trả novel có:
  - `deleted_at IS NULL`
  - `visibility = "public"`
- Novel private, draft hoặc deleted trả `404` để không lộ thông tin.

Success `200`: trả về novel detail, cùng format với create response.

Errors:

- `404`: novel không tồn tại hoặc không public.

## Unit test

Unit test không cần database. Chạy từ thư mục `backend`:

```powershell
python -m pytest tests/test_novel_schema.py -q
```

Có thể chạy chung với các unit test hiện có:

```powershell
python -m pytest tests/test_security.py tests/test_user_schema.py tests/test_novel_schema.py -q
```

Các test này kiểm tra:

- Schema tạo novel normalize dữ liệu.
- Schema update novel bắt buộc có ít nhất 1 field.
- Schema update cho phép gửi `category_id: null`.
- Schema create/update normalize `tag_ids`, loại ID trùng và reject ID không hợp lệ.
- Schema reject status không hợp lệ.
- Schema reject field không được định nghĩa.

## Integration test

Integration test của Novel Management cần PostgreSQL test database riêng. Test chỉ chạy khi có `NOVELHUB_TEST_DATABASE_URL`; nếu không có biến này thì test sẽ skip. Test không fallback sang `DATABASE_URL` để tránh ghi nhầm vào database development như `novelhub`.

### 1. Chuẩn bị biến môi trường

Database test riêng của module này dùng cố định tên `novelhub_novel_management_test`.

PowerShell:

```powershell
cd backend
..\.venv\Scripts\Activate.ps1
$env:POSTGRES_ADMIN_URL = "postgresql+psycopg://postgres:postgres@localhost:5433/postgres"
$env:NOVELHUB_TEST_DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5433/novelhub_novel_management_test"
$env:DATABASE_URL = $env:NOVELHUB_TEST_DATABASE_URL
```

Bash:

```bash
cd backend
..\.venv\Scripts\Activate.ps1
export POSTGRES_ADMIN_URL="postgresql+psycopg://postgres:postgres@localhost:5433/postgres"
export NOVELHUB_TEST_DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5433/novelhub_novel_management_test"
export DATABASE_URL="$NOVELHUB_TEST_DATABASE_URL"
```

Ghi chú:

- `POSTGRES_ADMIN_URL` trỏ tới database quản trị, thường là `postgres`, để tạo/xóa database test.
- `NOVELHUB_TEST_DATABASE_URL` trỏ tới database test riêng.
- `DATABASE_URL` được set bằng `NOVELHUB_TEST_DATABASE_URL` để app và Alembic dùng cùng database test.
- Không trỏ `NOVELHUB_TEST_DATABASE_URL` tới database development hoặc production.

### 2. Tạo database test riêng

PowerShell:

```powershell
python -c "import os; from sqlalchemy import create_engine, text; db_name='novelhub_novel_management_test'; engine=create_engine(os.environ['POSTGRES_ADMIN_URL'], isolation_level='AUTOCOMMIT'); conn=engine.connect(); exists=conn.execute(text('SELECT 1 FROM pg_database WHERE datname = :name'), {'name': db_name}).scalar(); conn.execute(text(f'CREATE DATABASE {db_name}')) if not exists else None; conn.close()"
```

Bash:

```bash
python -c "import os; from sqlalchemy import create_engine, text; db_name='novelhub_novel_management_test'; engine=create_engine(os.environ['POSTGRES_ADMIN_URL'], isolation_level='AUTOCOMMIT'); conn=engine.connect(); exists=conn.execute(text('SELECT 1 FROM pg_database WHERE datname = :name'), {'name': db_name}).scalar(); conn.execute(text(f'CREATE DATABASE {db_name}')) if not exists else None; conn.close()"
```

### 3. Chạy migration

Chạy từ thư mục `backend`:

```powershell
python -m alembic upgrade head
```

Lệnh này tạo schema và seed các role mặc định như `reader`, `author`, `admin`.

### 4. Chạy integration test

Chạy riêng Novel Management integration test:

```powershell
python -m pytest tests/test_novel_management_integration.py -q
```

Có thể chạy chung với các integration test hiện có:

```powershell
python -m pytest tests/test_auth_integration.py tests/test_user_management_integration.py tests/test_novel_management_integration.py -q
```

Các test này kiểm tra:

- Author tạo, sửa, publish và xóa mềm novel.
- Author chọn tag có sẵn khi tạo/update novel.
- Reader/public chỉ xem được novel public.
- Reader không được tạo novel.
- Author không sửa được novel của author khác.
- Test không chạy nếu thiếu `NOVELHUB_TEST_DATABASE_URL`.

### 5. Xóa database test sau khi chạy

PowerShell:

```powershell
python -c "import os; from sqlalchemy import create_engine, text; db_name='novelhub_novel_management_test'; engine=create_engine(os.environ['POSTGRES_ADMIN_URL'], isolation_level='AUTOCOMMIT'); conn=engine.connect(); conn.execute(text(f'DROP DATABASE IF EXISTS {db_name} WITH (FORCE)')); conn.close()"
```

Bash:

```bash
python -c "import os; from sqlalchemy import create_engine, text; db_name='novelhub_novel_management_test'; engine=create_engine(os.environ['POSTGRES_ADMIN_URL'], isolation_level='AUTOCOMMIT'); conn=engine.connect(); conn.execute(text(f'DROP DATABASE IF EXISTS {db_name} WITH (FORCE)')); conn.close()"
```

Nếu PostgreSQL version không hỗ trợ `WITH (FORCE)`, hãy đảm bảo không còn connection tới database test rồi chạy lại với câu lệnh drop phù hợp.


