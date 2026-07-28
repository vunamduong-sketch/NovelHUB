# NovelHub Authentication

Tài liệu này bao phủ Sprint 1: FCPMP-11 (Register), FCPMP-12 (Login & Logout),
FCPMP-13 (Reset password) và FCPMP-14 (JWT authentication).

## API contract

Prefix: `/api/v1/auth`. Swagger UI: `GET /docs`. Validation errors của FastAPI
trả `422` với mảng `detail`; business errors trả `{ "detail": "..." }`.

| Endpoint | Request | Success | Errors |
| --- | --- | --- | --- |
| `POST /register` | `email`, `username`, `password` | `201` user | `409` email/username trùng; `422` validation |
| `POST /login` | `identity` (email/username), `password` | `200` access JWT, refresh token, user | `401` thông tin không hợp lệ |
| `POST /refresh` | `refresh_token` | `200` token pair mới | `401` refresh token hết hạn/revoked |
| `POST /logout` | `refresh_token` | `200` | Luôn thành công để tránh tiết lộ token state |
| `POST /password-reset/request` | `email` | `202` thông điệp trung lập | `422` email không hợp lệ |
| `POST /password-reset/confirm` | `token`, `new_password` | `200` | `400` token không hợp lệ/hết hạn/đã dùng |

User response gồm `id`, `email`, `username`, `status`, `roles`; không bao giờ
trả `password_hash`.

## Validation và registration

- Email và username được normalize lowercase.
- Username: 3–50 ký tự ASCII chữ, số hoặc `_`.
- Password: 10–128 ký tự; cần tối thiểu một chữ cái và một chữ số.
- Email/username unique (case-insensitive) theo index PostgreSQL hiện có.
- User mới được gán role mặc định `reader`, role đã được Alembic seed.

## Token và logout

Access token là HS256 JWT, chứa `sub`, `roles`, `type=access`, `exp`; mặc định
30 phút. Refresh token là chuỗi ngẫu nhiên opaque, chỉ hash SHA-256 được lưu
trong `refresh_tokens`. Mỗi lần refresh sẽ revoke token cũ và phát token mới.

Logout revoke refresh token. Access token đã phát hành là stateless và vẫn hợp
lệ cho đến khi hết hạn. Nếu cần revoke access token tức thời, team cần chốt
một Redis/database token blocklist.

Authentication dependency `get_current_user` đã sẵn sàng để gắn vào endpoint
cần bearer access JWT ở các Sprint task sau.

## Password reset

Reset request luôn trả cùng một thông điệp, dù email có tồn tại hay không, để
chống account enumeration. Reset token là JWT riêng (`type=password_reset`),
chỉ có hiệu lực 15 phút. Token tự trở thành không hợp lệ sau khi mật khẩu đổi,
vì `users.updated_at` được cập nhật.

Trong `development`, token được trả ở `debug_reset_token` để test local. Đây
không phải cơ chế production. Production cần email provider và nên chốt thêm
bảng reset-token hash nếu cần revoke token độc lập hoặc audit đầy đủ.

## Environment configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `JWT_SECRET_KEY` | Development-only value | Khóa ký access/reset token; phải thay bằng secret mạnh ở production |
| `JWT_ALGORITHM` | `HS256` | Thuật toán JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Thời hạn access token |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `14` | Thời hạn refresh token |
| `PASSWORD_RESET_EXPIRE_MINUTES` | `15` | Thời hạn reset token |
| `ENVIRONMENT` | `development` | Ẩn `debug_reset_token` khi khác development |

Không commit `.env` hoặc secret thật.

## Testing

Unit tests không cần database:

```powershell
python -m pytest tests/test_security.py -q
```

Integration test chỉ chạy với PostgreSQL test database riêng. Trước khi chạy,
set cả hai biến để Alembic và pytest dùng cùng database:

```powershell
$env:DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5433/novelhub_auth_test"
$env:NOVELHUB_TEST_DATABASE_URL = $env:DATABASE_URL
alembic upgrade head
python -m pytest -q
```

Không đặt `NOVELHUB_TEST_DATABASE_URL` trỏ đến database development/production.
