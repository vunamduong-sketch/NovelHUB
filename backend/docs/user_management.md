# NovelHub User Management API Contract

Tài liệu này mô tả module User Management cho giai đoạn tiếp theo, giữ nguyên nguyên tắc không xung đột với module Authentication hiện tại.

## Mục tiêu của module

Cho phép người dùng đã đăng nhập:

- xem thông tin cá nhân của chính mình
- cập nhật thông tin cá nhân của chính mình
- đổi mật khẩu
- cập nhật ảnh đại diện

Tất cả các endpoint đều cần bearer access token hợp lệ (JWT có `type=access`).

## Nguyên tắc không xung đột với Auth

- Không thay đổi API contract của các endpoint `/api/v1/auth/*`.
- Không thay đổi payload token đang được phát hành bởi Auth.
- User Management dùng chung dependency xác thực (`get_current_user`) nhưng tách riêng router, service, repository, schema.
- Chỉ thao tác trên user đang đăng nhập (`/users/me`), không nhận `user_id` từ client cho các endpoint tự phục vụ.

## API contract

Prefix: `/api/v1/users`

| Endpoint | Request | Success | Errors |
| --- | --- | --- | --- |
| `GET /me` | Bearer access token | `200` user profile | `401` unauthorized |
| `PATCH /me` | `display_name`, `bio`, `username` | `200` updated profile | `400` empty update, `409` username trùng, `401` unauthorized, `422` validation |
| `POST /me/change-password` | `current_password`, `new_password` | `200` message | `400` current password sai / new password không hợp lệ, `401` unauthorized, `422` validation |
| `PUT /me/avatar` | `multipart/form-data` field `file` | `200` avatar URL mới | `400` file không hợp lệ, `401` unauthorized, `413` file quá lớn, `415` unsupported media type, `422` validation |

### 1) GET `/me`

Lấy hồ sơ của người dùng hiện tại.

Success `200`:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "reader01",
  "display_name": "Reader One",
  "bio": "I love fantasy novels.",
  "avatar_url": "https://cdn.example.com/avatars/u1.jpg",
  "status": "active",
  "roles": ["reader"]
}
```

Errors:

- `401` Authentication required / token invalid / user không còn hợp lệ.

### 2) PATCH `/me`

Cập nhật thông tin hồ sơ (chỉ cho phép cập nhật một phần trường).

Request body:

```json
{
  "display_name": "Reader One",
  "bio": "I love fantasy novels.",
  "username": "reader01"
}
```

Rules:

- `display_name`: 1-100 ký tự sau khi trim, cho phép `null` để xóa.
- `bio`: tối đa 1000 ký tự, cho phép `null` để xóa.
- `username` (nếu được phép đổi): 3-50 ký tự, chỉ gồm chữ cái và chữ số, chuẩn hóa về lowercase, duy nhất theo kiểu case-insensitive.
- Ít nhất 1 trường hợp lệ phải được gửi.

Success `200`: trả về object user profile mới nhất (cùng định dạng với `GET /me`).

Errors:

- `400` Payload không hợp lệ nghiệp vụ (ví dụ: không có trường nào để cập nhật).
- `409` Username đã tồn tại (nếu cập nhật username).
- `422` Validation error theo FastAPI.
- `401` Unauthorized.

### 3) POST `/me/change-password`

Đổi mật khẩu của người dùng hiện tại.

Request body:

```json
{
  "current_password": "OldPassword1!",
  "new_password": "NewPassword1!"
}
```

Rules:

- `new_password` theo cùng policy với Auth: 10-128 ký tự, tối thiểu 1 chữ cái và 1 chữ số.
- `new_password` khác `current_password`.
- `current_password` phải đúng.

Success `200`:

```json
{
  "message": "Password changed successfully. Please sign in again."
}
```

Security behavior:

- Thu hồi tất cả refresh token đang active của user sau khi đổi mật khẩu thành công.
- Access token đang dùng có thể vẫn hợp lệ cho đến khi hết hạn (giữ hành vi đồng nhất với Auth hiện tại).

Errors:

- `400` Mật khẩu mới không hợp lệ hoặc trùng mật khẩu cũ.
- `401` Current password không đúng / unauthorized.
- `422` Validation error.

### 4) PUT `/me/avatar`

Cập nhật ảnh đại diện.

Chế độ được chốt: Multipart upload.

- `Content-Type: multipart/form-data`
- field: `file`

Rules tối thiểu:

- Chỉ chấp nhận `image/jpeg`, `image/png`, `image/webp`.
- Kích thước tối đa: 2 MB.
- Nếu thay avatar, hệ thống sẽ tự động xóa avatar cũ nếu đó là file quản lý bởi backend.

Success `200` (khuyến nghị):

```json
{
  "message": "Avatar updated successfully",
  "avatar_url": "https://cdn.example.com/avatars/u1-new.jpg"
}
```

Errors:

- `400` Định dạng file/URL không hợp lệ.
- `413` File quá giới hạn kích thước.
- `415` Unsupported media type.
- `401` Unauthorized.
- `422` Validation error.

## Response và error conventions

- Validation errors: FastAPI `422` với mảng `detail`.
- Business errors: `{ "detail": "..." }`.
- Message-only response có dạng `{ "message": "..." }`.

## Hướng dẫn chạy test

### Unit test

Chạy từ thư mục backend:

```powershell
$project = 'd:\Lap trinh\Thực tập tốt nghiệp\MockProject\NovelHUB\backend'
Set-Location $project
& 'd:\Lap trinh\Thực tập tốt nghiệp\MockProject\NovelHUB\.venv\Scripts\python.exe' -m pytest tests/test_user_schema.py tests/test_security.py -q
```

### Integration test

Chạy từ thư mục backend:

```powershell
$project = 'd:\Lap trinh\Thực tập tốt nghiệp\MockProject\NovelHUB\backend'
Set-Location $project
& 'd:\Lap trinh\Thực tập tốt nghiệp\MockProject\NovelHUB\.venv\Scripts\python.exe' -m pytest tests/test_user_management_integration.py -q -rs
```

Lưu ý:

- Integration test yêu cầu cơ sở dữ liệu PostgreSQL đang chạy và có thể truy cập.
- Nếu database chưa sẵn sàng, test có thể bị bỏ qua hoặc thất bại ở bước kết nối.
- Đối với môi trường phát triển, có thể dùng Docker Compose để khởi động database trước khi chạy integration test.

## Câu hỏi mở và quyết định cần chốt trước khi code

1. Có cho phép người dùng tự đổi `username` không? Nếu có, cần xác nhận quy tắc uniqueness và case-insensitive.
2. Sau khi đổi mật khẩu có bước đăng xuất toàn bộ phiên ngay lập tức không (thêm blocklist access token), hay giữ như hiện tại?
3. Có cho sửa `email` trong module này không? (Khuyến nghị: không trong giai đoạn đầu để tránh liên quan verify email.)

## Definition of Done cho bước contract

- Đã thống nhất 4 endpoint trên với status code, request/response, validation và security behavior.
- Đã thống nhất avatar strategy (multipart upload) và quy tắc xóa avatar cũ.
- Đã thống nhất username update policy.
