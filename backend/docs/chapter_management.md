# NovelHub Chapter Management

Tài liệu này mô tả module Chapter Management, bao gồm thiết kế API, nguyên tắc phân quyền, business rules và hướng dẫn kiểm thử. Module này được tổ chức theo cùng kiểu với Novel Management: `router -> service -> repository -> schema -> tests -> docs`.

## Mục tiêu module

Author có thể:

- Tạo chapter nháp hoặc xuất bản trực tiếp cho novel của chính mình.
- Chỉnh sửa chapter của chính mình.
- Xóa chapter của chính mình theo cơ chế soft delete.
- Xuất bản nhanh một chapter đang lưu nháp.
- Xem danh sách chapter đầy đủ của novel mình sở hữu (bao gồm cả draft/published).
- Xem chi tiết nội dung chương nháp/đã xuất bản của novel mình sở hữu.

Reader hoặc người dùng public có thể:

- Xem danh sách chapter đã được xuất bản (`status = "published"`) của một novel ở chế độ công khai.
- Đọc nội dung chi tiết chương đã được xuất bản (`status = "published"`) của một novel ở chế độ công khai.

## Nguyên tắc không xung đột với module hiện có

- Không thay đổi API contract của `/api/v1/auth/*`.
- Không thay đổi API contract của `/api/v1/users/*`.
- Không thay đổi API contract của `/api/v1/novels/*` (ngoại trừ việc đăng ký thêm các sub-routes liên quan đến chapters).
- Chapter Management dùng router, service, repository và schema riêng.
- Endpoint của author dùng chung `get_current_user` kết hợp `require_author`.
- Endpoint reader/public không yêu cầu xác thực, chỉ trả về các chương `published` và thuộc về novel public.

## Các file chính

```text
backend/app/schemas/chapter.py
backend/app/repositories/chapter_repository.py
backend/app/services/chapter_service.py
backend/app/api/routers/chapters.py
backend/tests/test_chapter_schema.py
backend/tests/test_chapter_management_integration.py
backend/docs/chapter_management.md
```

Router chapter được include trong `backend/main.py`:

```python
app.include_router(chapters_router, prefix="/api/v1")
```

## API contract

Prefix: `/api/v1`

| Endpoint | Actor | Request | Success | Errors |
| --- | --- | --- | --- | --- |
| `POST /novels/{novel_id}/chapters` | author | Chapter create body | `201` created chapter detail | `401`, `403`, `404`, `409`, `422` |
| `GET /novels/{novel_id}/chapters` | reader/public | None | `200` published chapter list | `404` |
| `GET /novels/{novel_id}/chapters/me` | author | Bearer access token | `200` author chapter list | `401`, `403`, `404` |
| `GET /chapters/{chapter_id}` | reader/public | None | `200` public chapter detail | `404` |
| `GET /chapters/{chapter_id}/author` | author | Bearer access token | `200` author chapter detail | `401`, `403`, `404` |
| `PATCH /chapters/{chapter_id}` | author | Chapter update body | `200` updated chapter detail | `401`, `403`, `404`, `409`, `422` |
| `DELETE /chapters/{chapter_id}` | author | Bearer access token | `200` message | `401`, `403`, `404` |
| `POST /chapters/{chapter_id}/publish` | author | Bearer access token | `200` published chapter | `400`, `401`, `403`, `404` |

Validation errors của FastAPI trả `422` với mảng `detail`. Business errors trả `{ "detail": "..." }`. Message-only response dùng `{ "message": "..." }`.

## 1. POST `/api/v1/novels/{novel_id}/chapters`

Tạo chapter mới cho novel của author đang đăng nhập.

Authentication:

- Bắt buộc Bearer access token hợp lệ.
- User phải có role `author` và là chủ sở hữu của bộ truyện.

Request body:

```json
{
  "title": "Chương 1: Khởi Đầu",
  "chapter_number": 1.0,
  "content": "Nội dung chương truyện...",
  "summary": "Tóm tắt chương (tùy chọn)",
  "status": "draft"
}
```

Rules:

- `title`: bắt buộc, 1-250 ký tự sau khi trim.
- `chapter_number`: bắt buộc, số dương (lớn hơn 0), định dạng Decimal để hỗ trợ chương phụ (VD: 1.5). Không được trùng lặp `chapter_number` trong cùng một truyện.
- `content`: chuỗi nội dung chương (mặc định rỗng).
- `summary`: tùy chọn, tối đa 5000 ký tự.
- `status`: bắt buộc, chỉ nhận `"draft"`, `"scheduled"`, hoặc `"published"`.
- `word_count` được backend tự động đếm dựa trên số từ của `content`.
- `slug` được sinh tự động từ `title` và đảm bảo duy nhất trong phạm vi bộ truyện đó.
- Nếu `status = "published"`, backend tự động thiết lập thời gian `published_at = datetime.now(timezone.utc)`.

Success `201`:

```json
{
  "id": "uuid",
  "novel_id": "uuid",
  "title": "Chương 1: Khởi Đầu",
  "slug": "chuong-1-khoi-dau",
  "chapter_number": 1.0,
  "summary": "Tóm tắt chương (tùy chọn)",
  "word_count": 4,
  "status": "draft",
  "published_at": null,
  "view_count": 0,
  "created_at": "2026-08-02T15:00:00Z",
  "updated_at": "2026-08-02T15:00:00Z",
  "content": "Nội dung chương truyện..."
}
```

Errors:

- `401`: chưa đăng nhập hoặc token không hợp lệ.
- `403`: user không có role `author` hoặc không sở hữu novel.
- `404`: novel không tồn tại hoặc đã bị xóa.
- `409`: số chương `chapter_number` hoặc `slug` bị trùng lặp trong truyện.
- `422`: validation error.

## 2. GET `/api/v1/novels/{novel_id}/chapters`

Lấy danh sách chương đã xuất bản công khai dành cho độc giả.

Authentication:

- Không bắt buộc đăng nhập.

Rules:

- Chỉ trả các chapter của novel có:
  - `status = "published"`
  - Novel đó phải public (`visibility = "public"`) và không bị soft delete (`deleted_at IS NULL`).
  - Chapter không bị soft delete (`deleted_at IS NULL`).
- Kết quả được sắp xếp theo `chapter_number` tăng dần.
- Dữ liệu trả về lược bỏ trường `content` để tối ưu dung lượng truyền tải.

Success `200`:

```json
[
  {
    "id": "uuid",
    "novel_id": "uuid",
    "title": "Chương 1: Khởi Đầu",
    "slug": "chuong-1-khoi-dau",
    "chapter_number": 1.0,
    "summary": "Tóm tắt chương (tùy chọn)",
    "word_count": 4,
    "status": "published",
    "published_at": "2026-08-02T15:00:00Z",
    "view_count": 10,
    "created_at": "2026-08-02T15:00:00Z",
    "updated_at": "2026-08-02T15:00:00Z"
  }
]
```

Errors:

- `404`: novel không tồn tại hoặc không public.

## 3. GET `/api/v1/novels/{novel_id}/chapters/me`

Lấy toàn bộ danh sách chương (bao gồm cả nháp/hẹn giờ) dành riêng cho tác giả quản lý truyện.

Authentication:

- Bắt buộc Bearer access token hợp lệ.
- User phải có role `author` và là chủ sở hữu truyện.

Rules:

- Chỉ trả các chapter thuộc về novel của tác giả đang đăng nhập.
- Không trả các chapter đã bị soft delete (`deleted_at IS NULL`).
- Có thể trả về các chương có trạng thái bất kỳ (`draft`, `scheduled`, `published`).
- Kết quả sắp xếp theo `chapter_number` tăng dần.
- Dữ liệu trả về lược bỏ trường `content`.

Success `200`: Trả về danh sách tương tự endpoint GET public nhưng bao gồm cả các chương nháp.

Errors:

- `401`: chưa đăng nhập hoặc token không hợp lệ.
- `403`: user không có role `author` hoặc không sở hữu novel.
- `404`: novel không tồn tại hoặc đã bị xóa.

## 4. GET `/api/v1/chapters/{chapter_id}`

Đọc nội dung chi tiết một chương truyện công khai.

Authentication:

- Không bắt buộc đăng nhập.

Rules:

- Chương phải có trạng thái `status = "published"`.
- Novel tương ứng phải public và không bị soft delete.
- Hệ thống sẽ tăng `view_count` lên 1 đơn vị mỗi lần gọi thành công.

Success `200`: Trả về chi tiết chương bao gồm cả trường `content`.

```json
{
  "id": "uuid",
  "novel_id": "uuid",
  "title": "Chương 1: Khởi Đầu",
  "slug": "chuong-1-khoi-dau",
  "chapter_number": 1.0,
  "summary": "Tóm tắt chương (tùy chọn)",
  "word_count": 4,
  "status": "published",
  "published_at": "2026-08-02T15:00:00Z",
  "view_count": 11,
  "created_at": "2026-08-02T15:00:00Z",
  "updated_at": "2026-08-02T15:00:00Z",
  "content": "Nội dung chương truyện..."
}
```

Errors:

- `404`: chapter không tồn tại, chưa được xuất bản hoặc thuộc về novel không công khai.

## 5. GET `/api/v1/chapters/{chapter_id}/author`

Đọc nội dung chi tiết chương dành riêng cho tác giả (hỗ trợ đọc cả chương nháp để xem trước/chỉnh sửa).

Authentication:

- Bắt buộc Bearer access token hợp lệ.
- User phải là tác giả sở hữu truyện chứa chương đó.

Rules:

- Cho phép đọc chi tiết chương ở bất kỳ trạng thái nào (`draft`, `scheduled`, `published`).
- Không tăng `view_count` khi tác giả tự xem.

Success `200`: Trả về chi tiết chương tương tự format của reader nhưng không giới hạn trạng thái chương.

Errors:

- `401`: chưa đăng nhập hoặc token không hợp lệ.
- `403`: không phải tác giả sở hữu chương truyện.
- `404`: chapter không tồn tại hoặc đã bị xóa.

## 6. PATCH `/api/v1/chapters/{chapter_id}`

Chỉnh sửa nội dung chương truyện.

Authentication:

- Bắt buộc Bearer access token hợp lệ.
- User phải có role `author` và là chủ sở hữu truyện chứa chương đó.

Request body:

```json
{
  "title": "Chương 1: Khởi Đầu Mới",
  "chapter_number": 1.0,
  "content": "Nội dung chương truyện đã cập nhật...",
  "summary": "Tóm tắt cập nhật",
  "status": "published"
}
```

Rules:

- Tất cả các trường là tùy chọn, nhưng phải cập nhật ít nhất một trường.
- Nếu cập nhật `content`, backend tự động đếm lại `word_count`.
- Nếu cập nhật `title`, `slug` được sinh mới và đảm bảo duy nhất trong truyện.
- Nếu chuyển trạng thái `status` sang `published` từ `draft` và trước đó chưa từng publish, set `published_at = now`.
- Không cho phép sửa chương đã bị soft delete.

Success `200`: Trả về chi tiết chương sau khi cập nhật (chứa `content`).

Errors:

- `401`: chưa đăng nhập hoặc token không hợp lệ.
- `403`: không phải tác giả sở hữu chương truyện.
- `404`: chapter không tồn tại hoặc đã bị xóa.
- `409`: số chương hoặc slug trùng lặp sau khi sửa.
- `422`: validation error.

## 7. DELETE `/api/v1/chapters/{chapter_id}`

Xóa chương truyện theo cơ chế xóa mềm (soft delete).

Authentication:

- Bắt buộc Bearer access token hợp lệ.
- User phải có role `author` và là chủ sở hữu truyện.

Rules:

- Không xóa cứng dòng khỏi DB.
- Cập nhật trường `deleted_at = datetime.now(timezone.utc)`.
- Chapter đã xóa mềm sẽ không xuất hiện ở bất kỳ API liệt kê hay xem chi tiết nào của reader/author.

Success `200`:

```json
{
  "message": "Chapter deleted successfully."
}
```

Errors:

- `401`: chưa đăng nhập hoặc token không hợp lệ.
- `403`: không phải tác giả sở hữu chương truyện.
- `404`: chapter không tồn tại hoặc đã bị xóa trước đó.

## 8. POST `/api/v1/chapters/{chapter_id}/publish`

Xuất bản nhanh chương truyện từ trạng thái nháp.

Authentication:

- Bắt buộc Bearer access token hợp lệ.
- User phải có role `author` và là chủ sở hữu truyện.

Rules:

- Chương truyện phải chưa bị xóa mềm.
- Chuyển `status = "published"`.
- Cập nhật `published_at = datetime.now(timezone.utc)` nếu trước đó trường này là `null`.

Success `200`: Trả về thông tin chương đã xuất bản (không chứa `content`).

Errors:

- `400`: chương truyện đã ở trạng thái `published`.
- `401`: chưa đăng nhập hoặc token không hợp lệ.
- `403`: không phải tác giả sở hữu chương truyện.
- `404`: chapter không tồn tại hoặc đã bị xóa.

## Unit test

Unit test không cần database. Chạy từ thư mục `backend`:

```powershell
python -m pytest tests/test_chapter_schema.py -q
```

Các test này kiểm tra:

- Schema tạo chapter tự động trim và loại bỏ khoảng trắng dư thừa ở tiêu đề.
- `chapter_number` phải lớn hơn 0 và hỗ trợ số thập phân.
- Schema update bắt buộc phải chứa ít nhất một trường thay đổi.
- Bắt buộc chặn các trường không định nghĩa (`extra="forbid"`).

## Integration test

Integration test của Chapter Management cần PostgreSQL test database riêng. Test chỉ chạy khi có `NOVELHUB_TEST_DATABASE_URL`; nếu không có biến này thì test sẽ bị skip.

### 1. Chuẩn bị biến môi trường

Database test riêng dùng cố định tên `novelhub_chapter_management_test`.

PowerShell:

```powershell
cd backend
..\.venv\Scripts\Activate.ps1
$env:POSTGRES_ADMIN_URL = "postgresql+psycopg://postgres:postgres@localhost:5433/postgres"
$env:NOVELHUB_TEST_DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5433/novelhub_chapter_management_test"
$env:DATABASE_URL = $env:NOVELHUB_TEST_DATABASE_URL
```

Bash:

```bash
cd backend
export POSTGRES_ADMIN_URL="postgresql+psycopg://postgres:postgres@localhost:5433/postgres"
export NOVELHUB_TEST_DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5433/novelhub_chapter_management_test"
export DATABASE_URL="$NOVELHUB_TEST_DATABASE_URL"
```

### 2. Tạo database test riêng

PowerShell/Bash:

```bash
python -c "import os; from sqlalchemy import create_engine, text; db_name='novelhub_chapter_management_test'; engine=create_engine(os.environ['POSTGRES_ADMIN_URL'], isolation_level='AUTOCOMMIT'); conn=engine.connect(); exists=conn.execute(text('SELECT 1 FROM pg_database WHERE datname = :name'), {'name': db_name}).scalar(); conn.execute(text(f'CREATE DATABASE {db_name}')) if not exists else None; conn.close()"
```

### 3. Chạy migration

Chạy từ thư mục `backend`:

```powershell
python -m alembic upgrade head
```

### 4. Chạy integration test

Chạy riêng Chapter Management integration test:

```powershell
python -m pytest tests/test_chapter_management_integration.py -q
```

### 5. Xóa database test sau khi chạy

PowerShell/Bash:

```bash
python -c "import os; from sqlalchemy import create_engine, text; db_name='novelhub_chapter_management_test'; engine=create_engine(os.environ['POSTGRES_ADMIN_URL'], isolation_level='AUTOCOMMIT'); conn=engine.connect(); conn.execute(text(f'DROP DATABASE IF EXISTS {db_name} WITH (FORCE)')); conn.close()"
```

## Ghi chú Cơ sở dữ liệu (Database Notes)

- Module sử dụng bảng `chapters` được định nghĩa tại [chapter.py](file:///d:/NovelHUB/backend/app/models/chapter.py).
- Khóa ngoại `novel_id` liên kết với bảng `novels` có thuộc tính `ondelete="CASCADE"`. Khi một novel bị xóa, toàn bộ các chương thuộc novel đó sẽ tự động bị xóa theo ở tầng DB.
