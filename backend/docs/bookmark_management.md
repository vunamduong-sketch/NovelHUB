# NovelHUB Bookmark Management

## 1. Mục tiêu

Chức năng Bookmark cho phép người đọc:

- Đánh dấu một chương đang đọc.
- Lưu vị trí đọc tại thời điểm đánh dấu.
- Kiểm tra một chương đã được đánh dấu hay chưa.
- Bỏ đánh dấu chương.

## 2. Kiến trúc

Module được triển khai theo kiến trúc hiện tại của dự án:

router -> service -> repository -> model

Các file backend chính:

- `app/api/routers/bookmarks.py`
- `app/services/bookmark_service.py`
- `app/repositories/bookmark_repository.py`
- `app/schemas/bookmark.py`

Module sử dụng model `Bookmark` và bảng `bookmarks` đã tồn tại trong dự án.

Không tạo migration mới và không sửa các model cũ.

## 3. Business rules

- Người dùng phải đăng nhập.
- Chapter phải tồn tại và có trạng thái `published`.
- Novel phải có `visibility = public`.
- Novel phải có `moderation_status = approved`.
- Novel và chapter không được bị xóa mềm.
- Một user chỉ có một bookmark trên mỗi chapter.
- PUT bookmark hoạt động theo kiểu upsert:
  - Chưa có bookmark thì tạo mới.
  - Đã có bookmark thì cập nhật vị trí và ghi chú.
- `position_offset` phải lớn hơn hoặc bằng 0.
- `note` có tối đa 500 ký tự.
- Ghi chú chỉ chứa khoảng trắng được chuyển thành `null`.

## 4. API tạo hoặc cập nhật bookmark

### Endpoint

`PUT /api/v1/chapters/{chapter_id}/bookmark`

### Request body

```json
{
  "position_offset": 120,
  "note": "Đọc lại đoạn này"
}
 
## 5. API kiểm tra trạng thái bookmark

### Endpoint

`GET /api/v1/chapters/{chapter_id}/bookmark`

### Response khi đã bookmark

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
    "created_at": "datetime",
    "updated_at": "datetime"
  }
}
```

### Response khi chưa bookmark

```json
{
  "is_bookmarked": false,
  "bookmark": null
}
```

---

## 6. API xóa bookmark

### Endpoint

`DELETE /api/v1/chapters/{chapter_id}/bookmark`

### Response 200 OK

```json
{
  "message": "Bookmark removed successfully."
}
```

---

## 7. Các mã lỗi

| HTTP Code | Ý nghĩa |
|-----------|---------|
| 200 | Thực hiện thành công |
| 401 | Chưa đăng nhập hoặc token không hợp lệ |
| 404 | Chapter hoặc bookmark không tồn tại |
| 422 | Request không hợp lệ |

---

## 8. Unit Test

Các trường hợp đã kiểm thử:

- Kiểm tra giá trị mặc định của request.
- Kiểm tra loại bỏ khoảng trắng của note.
- Kiểm tra note rỗng được chuyển thành `null`.
- Kiểm tra không cho phép `position_offset < 0`.
- Kiểm tra giới hạn 500 ký tự của note.
- Kiểm tra lưu bookmark đúng user và chapter.
- Kiểm tra lấy bookmark theo user.
- Kiểm tra từ chối chapter chưa publish.
- Kiểm tra từ chối novel private.
- Kiểm tra lỗi khi xóa bookmark không tồn tại.

**Kết quả:**

```text
10 passed
```

---

## 9. Integration Test

Thực hiện trên PostgreSQL test database.

Các bước kiểm thử:

1. Tạo user test.
2. Tạo novel public.
3. Tạo chapter published.
4. Gọi PUT để tạo bookmark.
5. Gọi GET kiểm tra bookmark.
6. Gọi PUT lần hai để cập nhật bookmark.
7. Gọi DELETE để xóa bookmark.
8. Gọi GET xác nhận bookmark đã bị xóa.

**Kết quả:**

```text
1 passed
```

---

## 10. Kiểm thử API bằng Swagger

Đã kiểm tra các trường hợp sau:

| Chức năng | Kết quả |
|-----------|----------|
| Tạo bookmark | ✅ 200 OK |
| Lấy bookmark | ✅ 200 OK |
| Cập nhật bookmark | ✅ 200 OK |
| Xóa bookmark | ✅ 200 OK |
| Lấy trạng thái sau khi xóa | ✅ 200 OK (`is_bookmarked = false`) |
| Offset âm | ✅ 422 |
| Chapter không tồn tại | ✅ 404 |
| Xóa bookmark không tồn tại | ✅ 404 |
| Không có access token | ✅ 401 |

---

## 11. Kết luận

Chức năng Bookmark đã được triển khai theo kiến trúc hiện có của dự án (Router → Service → Repository → Database), không ảnh hưởng đến các module khác.

Các chức năng tạo, cập nhật, lấy trạng thái và xóa bookmark đều hoạt động đúng. Toàn bộ unit test, integration test và kiểm thử API đều đạt kết quả mong muốn.