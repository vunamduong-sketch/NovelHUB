# NovelHub User Management API Contract

Tai lieu nay bao phu module User Management cho Sprint tiep theo, theo nguyen tac khong xung dot voi module Auth hien tai.

## Muc tieu module

Cho phep nguoi dung da dang nhap:

- xem thong tin ca nhan cua chinh minh
- cap nhat thong tin ca nhan cua chinh minh
- doi mat khau
- cap nhat anh dai dien

Tat ca endpoint deu can bearer access token hop le (JWT `type=access`).

## Nguyen tac khong xung dot voi Auth

- Khong thay doi API contract cua `/api/v1/auth/*`.
- Khong thay doi payload token dang duoc phat hanh boi Auth.
- User Management dung chung dependency xac thuc (`get_current_user`) nhung tach router/service/repository/schema rieng.
- Chi thao tac tren user dang dang nhap (`/users/me`), khong nhan `user_id` tu client cho cac endpoint self-service.

## API contract

Prefix: `/api/v1/users`

| Endpoint | Request | Success | Errors |
| --- | --- | --- | --- |
| `GET /me` | Bearer access token | `200` user profile | `401` unauthorized |
| `PATCH /me` | `display_name`, `bio`, `username` | `200` updated profile | `400` empty update, `409` username trùng, `401` unauthorized, `422` validation |
| `POST /me/change-password` | `current_password`, `new_password` | `200` message | `400` current password sai / new password khong hop le, `401` unauthorized, `422` validation |
| `PUT /me/avatar` | `multipart/form-data` field `file` | `200` avatar URL moi | `400` file khong hop le, `401` unauthorized, `413` file qua lon, `415` unsupported media type, `422` validation |

### 1) GET `/me`

Lay ho so cua user hien tai.

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

- `401` Authentication required / token invalid / user khong con hop le.

### 2) PATCH `/me`

Cap nhat thong tin ho so (chi cho phep cap nhat mot phan truong).

Request body:

```json
{
  "display_name": "Reader One",
  "bio": "I love fantasy novels.",
  "username": "reader01"
}
```

Rules:

- `display_name`: 1-100 ky tu sau khi trim, cho phep null de xoa.
- `bio`: toi da 1000 ky tu, cho phep null de xoa.
- `username` (neu cho phep doi): 3-50 ky tu, chi gom chu cai va chu so, normalize lowercase, unique (case-insensitive).
- It nhat 1 truong hop le phai duoc gui.

Success `200`: tra ve object user profile moi nhat (cung format voi `GET /me`).

Errors:

- `400` Payload khong hop le nghiep vu (vi du: khong co truong nao de update).
- `409` Username da ton tai (neu update username).
- `422` Validation error theo FastAPI.
- `401` Unauthorized.

### 3) POST `/me/change-password`

Doi mat khau cua user hien tai.

Request body:

```json
{
  "current_password": "OldPassword1!",
  "new_password": "NewPassword1!"
}
```

Rules:

- `new_password` theo cung policy voi Auth: 10-128 ky tu, toi thieu 1 chu cai va 1 chu so.
- `new_password` khac `current_password`.
- `current_password` phai dung.

Success `200`:

```json
{
  "message": "Password changed successfully. Please sign in again."
}
```

Security behavior:

- Revoke tat ca refresh token dang active cua user sau khi doi mat khau thanh cong.
- Access token dang dung co the van hop le toi khi het han (giu hanh vi dong nhat voi Auth hien tai).

Errors:

- `400` Mat khau moi khong hop le hoac trung mat khau cu.
- `401` Current password khong dung / unauthorized.
- `422` Validation error.

### 4) PUT `/me/avatar`

Cap nhat anh dai dien.

Che do duoc chot: Multipart upload.

- `Content-Type: multipart/form-data`
- field: `file`

Rules toi thieu:

- Chi chap nhan `image/jpeg`, `image/png`, `image/webp`.
- Kich thuoc toi da: 2 MB.
- Neu thay avatar, he thong se tu dong xoa avatar cu neu do la tep quan ly boi backend.

Success `200` (khuyen nghi):

```json
{
  "message": "Avatar updated successfully",
  "avatar_url": "https://cdn.example.com/avatars/u1-new.jpg"
}
```

Errors:

- `400` Dinh dang file/URL khong hop le.
- `413` File qua gioi han kich thuoc.
- `415` Unsupported media type.
- `401` Unauthorized.
- `422` Validation error.

## Response va error conventions

- Validation errors: FastAPI `422` voi mang `detail`.
- Business errors: `{ "detail": "..." }`.
- Message-only response co dang `{ "message": "..." }`.

## Open questions can chot truoc khi code

1. Co cho phep user tu doi `username` khong? Neu co, can confirm uniqueness va case-insensitive rule.
2. Sau khi doi mat khau co buoc user dang xuat toan bo phien ngay lap tuc khong (them blocklist access token), hay giu nhu hien tai?
3. Co cho sua `email` trong module nay khong? (Khuyen nghi: khong trong phase dau de tranh lien quan verify email.)

## Definition of Done cho buoc contract

- Da thong nhat 4 endpoint tren voi status code, request/response, validation va security behavior.
- Da thong nhat avatar strategy (multipart upload) va quy tac xoa avatar cu.
- Da thong nhat username update policy.
