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

Chạy từ thư mục backend của project:

```powershell
cd backend
python -m pytest tests/test_user_schema.py tests/test_security.py -q
```

Nếu project đang dùng virtual environment, có thể kích hoạt môi trường trước rồi chạy:

```powershell
.venv\Scripts\Activate.ps1
python -m pytest tests/test_user_schema.py tests/test_security.py -q
```

### Integration test

Integration test cần PostgreSQL đang chạy và nên dùng database test riêng để không ghi dữ liệu vào database `novelhub` thật. Nếu dùng Docker Compose của project, PostgreSQL thường được expose ở cổng host `5433`.

Chạy từ thư mục `backend` của project:

```powershell
cd backend
```

Tạo database test riêng nếu chưa có:

```powershell
@'
from sqlalchemy import create_engine, text

engine = create_engine('postgresql+psycopg://postgres:postgres@localhost:5433/postgres', isolation_level='AUTOCOMMIT')
with engine.connect() as conn:
    exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = 'novelhub_user_management_test'")).scalar()
    if not exists:
        conn.execute(text('CREATE DATABASE novelhub_user_management_test'))
'@ | ..\.venv\Scripts\python.exe -
```

Chạy migration và test bằng `NOVELHUB_TEST_DATABASE_URL` để tránh fallback về `DATABASE_URL`/database `novelhub`:

```powershell
$env:NOVELHUB_TEST_DATABASE_URL='postgresql+psycopg://postgres:postgres@localhost:5433/novelhub_user_management_test'
$env:DATABASE_URL=$env:NOVELHUB_TEST_DATABASE_URL
..\.venv\Scripts\python.exe -m alembic upgrade head
..\.venv\Scripts\python.exe -m pytest tests\test_user_management_integration.py -q
```

Nếu muốn xóa database test sau khi chạy xong:

```powershell
@'
from sqlalchemy import create_engine, text

engine = create_engine('postgresql+psycopg://postgres:postgres@localhost:5433/postgres', isolation_level='AUTOCOMMIT')
with engine.connect() as conn:
    conn.execute(text('DROP DATABASE IF EXISTS novelhub_user_management_test WITH (FORCE)'))
'@ | ..\.venv\Scripts\python.exe -
```

Lưu ý:

- Luôn đặt `NOVELHUB_TEST_DATABASE_URL` khi chạy integration test để không dùng nhầm database dev.
- Database test phải tồn tại trước khi chạy `alembic upgrade head`.
- Migration cần chạy trước test vì luồng đăng ký user cần role mặc định `reader` được seed.
- Mặc định test không tự xóa database `novelhub_user_management_test`; chỉ xóa dữ liệu/file tạm do test tạo.
- Nếu database chưa sẵn sàng hoặc biến môi trường chưa đúng, test có thể bị skip hoặc lỗi kết nối.

