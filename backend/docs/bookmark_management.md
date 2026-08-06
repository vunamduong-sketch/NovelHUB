# NovelHUB Bookmark Management

Tài liệu này mô tả module Bookmark Management, bao gồm thiết kế API, nguyên tắc phân quyền, business rules và hướng dẫn kiểm thử.

Module được tổ chức theo kiến trúc hiện tại của dự án:

```text
router -> service -> repository -> model
```

Router bookmark được include trong `backend/main.py`:

```python
app.include_router(bookmarks_router, prefix="/api/v1")
```

## API contract

| Endpoint | Actor | Request | Success | Errors |
| --- | --- | --- | --- | --- |
| `PUT /api/v1/chapters/{chapter_id}/bookmark` | Reader | Bookmark request body | `200` bookmark | `401`, `404`, `422` |
| `GET /api/v1/chapters/{chapter_id}/bookmark` | Reader | Bearer access token | `200` bookmark status | `401`, `404` |
| `DELETE /api/v1/chapters/{chapter_id}/bookmark` | Reader | Bearer access token | `200` message | `401`, `404` |
| `GET /api/v1/novels/{novel_id}/bookmarks` | Reader | Bearer access token | `200` bookmark list | `401`, `404` |

Validation errors của FastAPI trả về mã `422` với mảng `detail`.

Business errors trả về:

```json
{
  "detail": "Error message"
}
```

Response chỉ chứa thông báo sử dụng format:

```json
{
  "message": "Message"
}
```

## Business rules chung

- Người dùng phải đăng nhập bằng Bearer access token hợp lệ.
- Chapter phải tồn tại.
- Chapter phải có `status = "published"`.
- Chapter không được bị soft delete.
- Novel chứa chapter phải tồn tại.
- Novel phải có `visibility = "public"`.
- Novel phải có `moderation_status = "approved"`.
- Novel không được bị soft delete.
- Mỗi cặp `user_id` và `chapter_id` chỉ có một bookmark.
- Việc lưu bookmark hoạt động theo cơ chế upsert:
  - Nếu bookmark chưa tồn tại thì tạo mới.
  - Nếu bookmark đã tồn tại thì cập nhật bản ghi hiện tại.
- `position_offset` phải lớn hơn hoặc bằng `0`.
- `note` có tối đa `500` ký tự.
- Ghi chú chỉ chứa khoảng trắng được chuyển thành `null`.
- Người dùng chỉ được xem, sửa hoặc xóa bookmark của chính mình.

## Unit test

Unit test không cần database.

Chạy từ thư mục `backend`:

```powershell
python -m pytest tests/test_bookmark_schema.py tests/test_bookmark_service.py -q
```

Các test kiểm tra:

- Schema bookmark request có giá trị mặc định đúng.
- Schema normalize dữ liệu ghi chú.
- Ghi chú rỗng được chuyển thành `null`.
- Schema từ chối `position_offset < 0`.
- Schema từ chối ghi chú dài quá `500` ký tự.
- Service lưu bookmark đúng user và chapter.
- Service lấy bookmark theo user hiện tại.
- Service xóa bookmark của user hiện tại.
- Service báo lỗi khi bookmark cần xóa không tồn tại.
- Service từ chối chapter chưa được publish.
- Service từ chối novel private.
- Service từ chối novel chưa được phê duyệt.
- Service lấy danh sách bookmark theo novel.
- Service không gọi repository khi chapter hoặc novel không hợp lệ.

## Integration test

Integration test của Bookmark Management cần PostgreSQL test database riêng. Test chỉ chạy khi có `NOVELHUB_TEST_DATABASE_URL`; nếu không có biến này thì test sẽ bị skip. Test không fallback sang database development để tránh ghi nhầm dữ liệu.

### 1. Chuẩn bị biến môi trường

PowerShell:

```powershell
cd backend
..\.venv\Scripts\Activate.ps1
$env:POSTGRES_ADMIN_URL = "postgresql+psycopg://postgres:postgres@localhost:5433/postgres"
$env:NOVELHUB_TEST_DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5433/novelhub_reader_activity_test"
$env:DATABASE_URL = $env:NOVELHUB_TEST_DATABASE_URL
```

Ghi chú:

- `POSTGRES_ADMIN_URL` trỏ tới database quản trị, thường là `postgres`, để tạo/xóa database test.
- `NOVELHUB_TEST_DATABASE_URL` trỏ tới database test riêng.
- `DATABASE_URL` được set bằng `NOVELHUB_TEST_DATABASE_URL` để app và Alembic dùng cùng database test.
- Không trỏ `NOVELHUB_TEST_DATABASE_URL` tới database development hoặc production.

### 2. Tạo database test riêng

PowerShell:

```powershell
python -c "import os; from sqlalchemy import create_engine, text; db_name='novelhub_reader_activity_test'; engine=create_engine(os.environ['POSTGRES_ADMIN_URL'], isolation_level='AUTOCOMMIT'); conn=engine.connect(); exists=conn.execute(text('SELECT 1 FROM pg_database WHERE datname = :name'), {'name': db_name}).scalar(); conn.execute(text(f'CREATE DATABASE {db_name}')) if not exists else None; conn.close()"
```

### 3. Chạy migration

Chạy từ thư mục `backend`:

```powershell
python -m alembic upgrade head
```

### 4. Chạy integration test

Chạy riêng Bookmark Management integration test:

```powershell
python -m pytest tests/test_reader_activity_integration.py -q
```

Có thể chạy chung với các integration test hiện có:

```powershell
python -m pytest tests/test_auth_integration.py tests/test_user_management_integration.py tests/test_reader_activity_integration.py -q
```

Các test này kiểm tra toàn bộ luồng:

1. Tạo user test.
2. Tạo novel public và approved.
3. Tạo chapter published.
4. Gọi `PUT` để tạo bookmark.
5. Gọi `GET` để kiểm tra trạng thái bookmark.
6. Gọi `GET` để lấy danh sách bookmark theo novel.
7. Gọi `PUT` lần hai để cập nhật bookmark.
8. Kiểm tra `position_offset` và `note` được cập nhật.
9. Gọi `DELETE` để xóa bookmark.
10. Gọi `GET` để xác nhận bookmark đã được xóa.

### 5. Xóa database test sau khi chạy

PowerShell:

```powershell
python -c "import os; from sqlalchemy import create_engine, text; db_name='novelhub_reader_activity_test'; engine=create_engine(os.environ['POSTGRES_ADMIN_URL'], isolation_level='AUTOCOMMIT'); conn=engine.connect(); conn.execute(text(f'DROP DATABASE IF EXISTS {db_name} WITH (FORCE)')); conn.close()"
```

Nếu PostgreSQL version không hỗ trợ `WITH (FORCE)`, hãy đảm bảo không còn connection tới database test rồi chạy lại với câu lệnh drop phù hợp.

## Kiểm thử API bằng Swagger

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

Các trường hợp đã kiểm tra:

| Chức năng | Kết quả mong đợi |
| --- | --- |
| Tạo bookmark | `200 OK` |
| Lấy trạng thái bookmark | `200 OK` |
| Cập nhật bookmark | `200 OK` |
| Xem bookmark theo novel | `200 OK` |
| Xóa bookmark | `200 OK` |
| Lấy trạng thái sau khi xóa | `200 OK`, `is_bookmarked = false` |
| Gửi offset âm | `422 Unprocessable Entity` |
| Chapter không tồn tại | `404 Not Found` |
| Novel không khả dụng | `404 Not Found` |
| Xóa bookmark không tồn tại | `404 Not Found` |
| Không có access token | `401 Unauthorized` |

## Kiểm thử frontend

Các nội dung đã kiểm tra trên frontend:

- Nút đánh dấu được hiển thị trong trang đọc chapter.
- Nút bookmark nhận vị trí đọc hiện tại từ `getReadingPosition`.
- Khi nhấn đánh dấu, frontend gửi đúng `position_offset`.
- Nút thay đổi trạng thái giữa:
  - `Đánh dấu`
  - `Đã đánh dấu`
  - `Đang lưu...`
- Reader có thể bỏ đánh dấu chapter.
- Trang chi tiết novel có tab `Đã đánh dấu`.
- Tab `Đã đánh dấu` hiển thị các chapter đã bookmark của novel.
- Khi chưa đăng nhập, người dùng được chuyển tới trang đăng nhập.
- Frontend lint chạy thành công:

```powershell
npm.cmd run lint
```

- Frontend production build chạy thành công:

```powershell
npm.cmd run build
```

## Database notes

- Module sử dụng bảng `bookmarks` đã tồn tại.
- Không tạo migration mới.
- Khóa của bookmark được xác định theo cặp:
  - `user_id`
  - `chapter_id`
- Một user không tạo nhiều bookmark trùng nhau cho cùng một chapter.
- Khi bookmark đã tồn tại, API cập nhật bản ghi thay vì tạo thêm dòng mới.
- `created_at` lưu thời điểm bookmark được tạo.
- `updated_at` được cập nhật mỗi khi bookmark thay đổi.
- `position_offset` lưu vị trí đọc tại thời điểm bookmark gần nhất.
- `note` lưu ghi chú tùy chọn của Reader.

## Kết luận

Bookmark Management đã được triển khai theo kiến trúc hiện tại của dự án:

```text
Router -> Service -> Repository -> Database
```

Module không thay đổi các API contract và business logic của Authentication, User Management, Novel Management hoặc Chapter Management.

Các chức năng đã được triển khai gồm:

- Tạo bookmark.
- Cập nhật bookmark.
- Lấy trạng thái bookmark của chapter.
- Xóa bookmark.
- Xem danh sách chapter đã bookmark theo novel.
- Lưu đúng vị trí đọc tại thời điểm đánh dấu.
- Hiển thị bookmark trên giao diện Reader.

Các API được bảo vệ bằng Bearer access token và chỉ thao tác trên dữ liệu bookmark của user hiện tại.

- `401`: chưa đăng nhập hoặc access token không hợp lệ.
- `404`: chapter không tồn tại, chưa được xuất bản hoặc không thuộc novel hợp lệ.
- `422`: `chapter_id` không đúng định dạng UUID.

## 3. DELETE `/api/v1/chapters/{chapter_id}/bookmark`

Xóa bookmark của chapter đối với Reader đang đăng nhập.

### Authentication

- Bắt buộc Bearer access token hợp lệ.
- Chỉ được xóa bookmark thuộc user hiện tại.

### Path parameter

| Param | Type | Required | Meaning |
| --- | --- | --- | --- |
| `chapter_id` | UUID | yes | ID của chapter cần bỏ đánh dấu |

### Rules

- Chapter phải là chapter khả dụng đối với Reader.
- Bookmark phải tồn tại đối với cặp `user_id` và `chapter_id`.
- API xóa bản ghi bookmark khỏi bảng `bookmarks`.
- Việc xóa bookmark không ảnh hưởng tới novel, chapter hoặc reading history.

### Success `200`

```json
{
  "message": "Bookmark removed successfully."
}
```

### Errors

- `401`: chưa đăng nhập hoặc access token không hợp lệ.
- `404`: chapter không tồn tại, chapter không khả dụng hoặc bookmark không tồn tại.
- `422`: `chapter_id` không đúng định dạng UUID.

## 4. GET `/api/v1/novels/{novel_id}/bookmarks`

Lấy danh sách các chapter mà Reader đã đánh dấu trong một novel.

### Authentication

- Bắt buộc Bearer access token hợp lệ.
- Chỉ trả bookmark của user hiện tại.

### Path parameter

| Param | Type | Required | Meaning |
| --- | --- | --- | --- |
| `novel_id` | UUID | yes | ID của novel cần lấy danh sách bookmark |

### Rules

- Novel phải tồn tại.
- Novel phải có `visibility = "public"`.
- Novel phải có `moderation_status = "approved"`.
- Novel không được bị soft delete.
- Chỉ trả bookmark thuộc user hiện tại.
- Chỉ trả các chapter:
  - Chưa bị soft delete.
  - Có `status = "published"`.
  - Thuộc novel được yêu cầu.
- Danh sách được sắp xếp theo `chapter_number` tăng dần.
- Nếu user chưa đánh dấu chapter nào trong novel thì trả mảng rỗng `[]`.

### Success `200`

```json
[
  {
    "chapter_id": "chapter-uuid",
    "novel_id": "novel-uuid",
    "novel_title": "Tên truyện",
    "chapter_title": "Tên chương",
    "chapter_number": 1,
    "position_offset": 120,
    "note": "Đọc lại đoạn này",
    "created_at": "2026-08-06T10:00:00Z",
    "updated_at": "2026-08-06T10:00:00Z"
  }
]
```

### Errors

- `401`: chưa đăng nhập hoặc access token không hợp lệ.
- `404`: novel không tồn tại, đã bị xóa, không public hoặc chưa được phê duyệt.
- `422`: `novel_id` không đúng định dạng UUID.

