# NovelHUB Bookmark Management

Tài liệu này mô tả module Bookmark Management, bao gồm thiết kế API, nguyên tắc phân quyền, business rules và hướng dẫn kiểm thử.

Module được tổ chức theo kiến trúc hiện tại của dự án:

```text
router -> service -> repository -> model
```

## Mục tiêu module

Chức năng Bookmark cho phép Reader:

- Đánh dấu chương đang đọc.
- Lưu vị trí đọc tại thời điểm đánh dấu.
- Kiểm tra một chương đã được đánh dấu hay chưa.
- Cập nhật lại vị trí và ghi chú của bookmark đã tồn tại.
- Bỏ đánh dấu chương.
- Xem danh sách các chương đã đánh dấu của một novel.

## Nguyên tắc không xung đột với module hiện có

- Không thay đổi API contract của `/api/v1/auth/*`.
- Không thay đổi API contract của `/api/v1/users/*`.
- Không sửa business logic trong `AuthService`, `UserService`, `NovelService` hoặc `ChapterService`.
- Bookmark Management sử dụng router, service, repository và schema riêng.
- Các endpoint bookmark dùng chung dependency `get_current_user`.
- Dữ liệu bookmark được phân tách theo từng user.
- Một user chỉ có một bookmark trên mỗi chapter.
- Chỉ cho phép bookmark chapter đã được xuất bản.
- Chapter phải thuộc novel public và đã được phê duyệt.
- Không tạo migration mới vì bảng `bookmarks` và model `Bookmark` đã tồn tại trong dự án.
- Không chỉnh sửa các model hiện có.

## Các file chính

```text
backend/app/api/routers/bookmarks.py
backend/app/services/bookmark_service.py
backend/app/repositories/bookmark_repository.py
backend/app/schemas/bookmark.py
backend/tests/test_bookmark_schema.py
backend/tests/test_bookmark_service.py
backend/tests/test_reader_activity_integration.py
backend/docs/bookmark_management.md
```

Các file frontend liên quan:

```text
frontend/src/api/bookmarkApi.js
frontend/src/components/reader/BookmarkButton.jsx
frontend/src/components/reader/BookmarkedChapterList.jsx
frontend/src/pages/chapter_management/ChapterReader.jsx
frontend/src/pages/novel_management/NovelDetail.jsx
frontend/src/styles/bookmark.css
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

## 1. PUT `/api/v1/chapters/{chapter_id}/bookmark`

Tạo mới hoặc cập nhật bookmark của chapter cho Reader đang đăng nhập.

### Authentication

- Bắt buộc Bearer access token hợp lệ.
- Bookmark được lưu cho user hiện tại.
- Không cho phép user thao tác trên bookmark của user khác.

### Path parameter

| Param | Type | Required | Meaning |
| --- | --- | --- | --- |
| `chapter_id` | UUID | yes | ID của chapter cần đánh dấu |

### Request body

```json
{
  "position_offset": 120,
  "note": "Đọc lại đoạn này"
}
```

### Rules

- `position_offset` là vị trí đọc tại thời điểm người dùng nhấn nút đánh dấu.
- `position_offset` mặc định bằng `0`.
- `position_offset` không được nhỏ hơn `0`.
- `note` là tùy chọn.
- `note` có tối đa `500` ký tự.
- `note` được trim trước khi lưu.
- Nếu `note` chỉ chứa khoảng trắng thì được chuyển thành `null`.
- Nếu bookmark chưa tồn tại thì tạo bản ghi mới.
- Nếu bookmark đã tồn tại thì cập nhật:
  - `position_offset`
  - `note`
  - `updated_at`

### Success `200`

```json
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
```

### Errors

- `401`: chưa đăng nhập hoặc access token không hợp lệ.
- `404`: chapter không tồn tại, chưa được xuất bản hoặc không thuộc novel hợp lệ.
- `422`: `chapter_id` không đúng định dạng UUID hoặc request body không hợp lệ.

## 2. GET `/api/v1/chapters/{chapter_id}/bookmark`

Kiểm tra trạng thái bookmark của một chapter đối với Reader đang đăng nhập.

### Authentication

- Bắt buộc Bearer access token hợp lệ.
- Chỉ kiểm tra bookmark của user hiện tại.

### Path parameter

| Param | Type | Required | Meaning |
| --- | --- | --- | --- |
| `chapter_id` | UUID | yes | ID của chapter cần kiểm tra |

### Rules

- Chapter phải là chapter khả dụng đối với Reader.
- Nếu user đã đánh dấu chapter, API trả `is_bookmarked = true`.
- Nếu user chưa đánh dấu chapter, API vẫn trả `200` với `is_bookmarked = false`.
- Không trả bookmark của user khác.

### Success `200` khi đã bookmark

```json
{
  "is_bookmarked": true,
  "bookmark": {
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
}
```

### Success `200` khi chưa bookmark

```json
{
  "is_bookmarked": false,
  "bookmark": null
}
```

### Errors

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

## Unit test

Unit test không cần kết nối database thật.

Chạy từ thư mục `backend`:

```powershell
python -m pytest tests/test_bookmark_schema.py tests/test_bookmark_service.py -q
```

Các test kiểm tra:

- Giá trị mặc định của bookmark request.
- Normalize dữ liệu ghi chú.
- Ghi chú rỗng được chuyển thành `null`.
- Từ chối `position_offset < 0`.
- Từ chối ghi chú dài quá `500` ký tự.
- Lưu bookmark đúng user và chapter.
- Lấy bookmark theo user hiện tại.
- Xóa bookmark của user hiện tại.
- Báo lỗi khi bookmark cần xóa không tồn tại.
- Từ chối chapter chưa được publish.
- Từ chối novel private.
- Từ chối novel chưa được phê duyệt.
- Lấy danh sách bookmark theo novel.
- Không gọi repository khi chapter hoặc novel không hợp lệ.

## Integration test

Integration test sử dụng PostgreSQL test database riêng.

Test chỉ chạy khi có biến môi trường:

```text
NOVELHUB_TEST_DATABASE_URL
```

Nếu không có biến này thì integration test sẽ được skip. Test không fallback sang database development để tránh ghi nhầm dữ liệu.

### 1. Chuẩn bị biến môi trường

PowerShell:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1

$env:NOVELHUB_TEST_DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5433/novelhub_reader_activity_test"
```

### 2. Chạy integration test

```powershell
python -m pytest tests/test_reader_activity_integration.py -q
```

Integration test kiểm tra toàn bộ luồng:

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