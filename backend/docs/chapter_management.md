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

- Không thay đổi API contract của `/api/v1/auth/*`, `/api/v1/users/*`, `/api/v1/novels/*`.
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

---

## Chi tiết Endpoints

### 1. POST `/api/v1/novels/{novel_id}/chapters`

Tạo chapter mới cho novel của author đang đăng nhập.

Authentication:
- Bắt buộc Bearer access token.
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

---

### 2. GET `/api/v1/novels/{novel_id}/chapters`

Lấy danh sách chương đã xuất bản công khai dành cho độc giả. Không yêu cầu xác thực.

Success `200`: Trả về mảng danh sách chương đã sắp xếp theo `chapter_number` tăng dần. Dữ liệu trả về lược bỏ trường `content` để tối ưu dung lượng truyền tải.

---

### 3. GET `/api/v1/novels/{novel_id}/chapters/me`

Lấy toàn bộ danh sách chương (bao gồm cả nháp/hẹn giờ) dành riêng cho tác giả quản lý truyện.

Authentication:
- Bắt buộc Bearer access token.
- User phải có role `author` và là chủ sở hữu truyện.

---

### 4. GET `/api/v1/chapters/{chapter_id}`

Đọc nội dung chi tiết một chương truyện công khai. Không yêu cầu xác thực.
Hệ thống sẽ tăng `view_count` lên 1 đơn vị mỗi lần gọi thành công.

---

### 5. GET `/api/v1/chapters/{chapter_id}/author`

Đọc nội dung chi tiết chương dành riêng cho tác giả (hỗ trợ đọc cả chương nháp để xem trước/chỉnh sửa).

Authentication:
- Bắt buộc Bearer access token.
- User phải là tác giả sở hữu truyện chứa chương đó.

---

### 6. PATCH /api/v1/chapters/{chapter_id}

Chỉnh sửa nội dung chương truyện.

Authentication:
- Bắt buộc Bearer access token.
- User phải là tác giả của truyện.

---

### 7. DELETE /api/v1/chapters/{chapter_id}

Xóa chương truyện theo cơ chế xóa mềm (soft delete).

Authentication:
- Bắt buộc Bearer access token.
- Thực hiện cập nhật trường `deleted_at = datetime.now(timezone.utc)`.

---

### 8. POST /api/v1/chapters/{chapter_id}/publish

Xuất bản nhanh chương truyện từ trạng thái nháp.

---

## Hướng dẫn Kiểm thử (Testing)

### 1. Unit Test (Schema Validation)
Chạy bộ kiểm thử cấu trúc và tính hợp lệ của dữ liệu đầu vào:
```bash
python -m pytest -v tests/test_chapter_schema.py
```

### 2. Integration Test (API Workflows)
Chạy bộ kiểm thử tích hợp kết nối Database thực tế (Docker):
```bash
docker compose exec backend sh -c "NOVELHUB_TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@database:5432/novelhub python -m pytest -v tests/test_chapter_management_integration.py"
```

## Ghi chú Cơ sở dữ liệu (Database Notes)
- Module sử dụng bảng `chapters` đã được định nghĩa sẵn tại [chapter.py](file:///d:/NovelHUB/backend/app/models/chapter.py).
- Khóa ngoại `novel_id` liên kết với bảng `novels` có thuộc tính `ondelete="CASCADE"`. Khi một novel bị xóa, toàn bộ các chương thuộc novel đó sẽ tự động bị xóa theo ở tầng DB.
