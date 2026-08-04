# NovelHub Administration Management

Tài liệu này mô tả module Administration Management, bao gồm thiết kế API,
phân quyền, business rules, cấu trúc source code, giao diện React Admin và hướng
dẫn kiểm thử. Module được tổ chức theo cùng kiểu với User, Novel và Chapter
Management: `router -> service -> repository -> schema -> tests -> docs`.

## Mục tiêu module

Admin có thể:

- Tìm kiếm, xem danh sách và xem chi tiết user.
- Thay đổi role của user.
- Tìm kiếm, lọc và xem thông tin cơ bản của mọi novel, kể cả novel private.
- Tạo, xem, chỉnh sửa, bật/tắt và xóa category.
- Tạo, xem, chỉnh sửa và xóa tag.
- Sử dụng dashboard React riêng trong thư mục `admin/`.

## Nguyên tắc không xung đột với module hiện có

- Không thay đổi API contract của `/api/v1/auth/*`, `/api/v1/users/*`,
  `/api/v1/novels/*` hoặc `/api/v1/chapters/*`.
- Admin dùng chung login, refresh và logout của Authentication.
- Admin dùng chung model và database session, nhưng có router, service,
  repository và schema riêng theo từng domain.
- Mọi endpoint quản trị dùng `require_admin`; role được đọc lại từ database ở
  mỗi request thay vì chỉ tin vào claim trong token.
- Public/author API không được mở rộng quyền chỉ vì dashboard admin tồn tại.
- Không trả `password_hash`, refresh token hoặc dữ liệu bảo mật trong response
  quản trị.

## Các file chính

```text
backend/app/admin/api/routers/users.py
backend/app/admin/api/routers/novels.py
backend/app/admin/api/routers/categories.py
backend/app/admin/api/routers/tags.py
backend/app/admin/repositories/
backend/app/admin/schemas/
backend/app/admin/services/
backend/tests/test_admin_*_schema.py
backend/tests/test_admin_*_service.py
backend/tests/test_admin_integration.py
backend/docs/admin_management.md
admin/src/api/
admin/src/pages/
```

Các router admin được include trong `backend/main.py`:

```python
app.include_router(admin_users_router, prefix="/api/v1")
app.include_router(admin_novels_router, prefix="/api/v1")
app.include_router(admin_categories_router, prefix="/api/v1")
app.include_router(admin_tags_router, prefix="/api/v1")
```

## API contract

- Base URL: `/api/v1`
- Swagger UI: `/docs`
- Authentication: Bearer access token
- Quyền bắt buộc: `admin`
- Request content type: `application/json`

Mọi endpoint `/admin/*` gọi dependency `require_admin`. Dependency đọc vai trò
hiện tại từ database ở mỗi request; sửa token hoặc session phía trình duyệt
không thể cấp quyền quản trị.

| Endpoint | Actor | Request | Success | Errors |
| --- | --- | --- | --- | --- |
| `GET /admin/users` | admin | `search`, `page`, `page_size` | `200` paginated users | `401`, `403`, `422` |
| `GET /admin/users/{user_id}` | admin | Bearer token | `200` user detail | `401`, `403`, `404`, `422` |
| `PATCH /admin/users/{user_id}/roles` | admin | `roles` | `200` updated user | `401`, `403`, `404`, `409`, `422` |
| `GET /admin/novels` | admin | search/filter/pagination | `200` paginated novels | `401`, `403`, `422` |
| `GET /admin/novels/{novel_id}` | admin | Bearer token | `200` novel detail | `401`, `403`, `404`, `422` |
| `GET /admin/categories` | admin | Bearer token | `200` category list | `401`, `403` |
| `POST /admin/categories` | admin | Category create body | `201` category | `401`, `403`, `409`, `422` |
| `PATCH /admin/categories/{category_id}` | admin | Category update body | `200` category | `401`, `403`, `404`, `409`, `422` |
| `DELETE /admin/categories/{category_id}` | admin | Bearer token | `200` message | `401`, `403`, `404`, `409` |
| `GET /admin/tags` | admin | Bearer token | `200` tag list | `401`, `403` |
| `POST /admin/tags` | admin | Tag create body | `201` tag | `401`, `403`, `409`, `422` |
| `PATCH /admin/tags/{tag_id}` | admin | Tag update body | `200` tag | `401`, `403`, `404`, `409`, `422` |
| `DELETE /admin/tags/{tag_id}` | admin | Bearer token | `200` message | `401`, `403`, `404`, `409` |

Validation errors của FastAPI trả `422` với mảng `detail`. Business errors trả
`{ "detail": "..." }`. Message-only response dùng `{ "message": "..." }`.

## Authentication và phân quyền

Ứng dụng admin dùng chung API authentication của NovelHUB:

```http
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

Ví dụ đăng nhập:

```json
{
  "identity": "admin@example.com",
  "password": "your-password"
}
```

Access token được gửi trong các request quản trị:

```http
Authorization: Bearer <access_token>
```

- `401 Unauthorized`: thiếu token, token hết hạn hoặc user không khả dụng.
- `403 Forbidden`: tài khoản hợp lệ nhưng không có role `admin`.

## User Management

### 1. GET `/api/v1/admin/users`

```http
GET /api/v1/admin/users?search=reader&page=1&page_size=20
```

| Query | Kiểu | Mặc định | Mô tả |
| --- | --- | --- | --- |
| `search` | string | rỗng | Tìm theo email, username hoặc display name |
| `page` | integer | `1` | Trang hiện tại, bắt đầu từ 1 |
| `page_size` | integer | `20` | Số bản ghi, từ 1 đến 100 |

Response sử dụng cấu trúc phân trang:

```json
{
  "items": [
    {
      "id": "uuid",
      "email": "reader@example.com",
      "username": "reader01",
      "display_name": "Reader",
      "status": "active",
      "roles": ["reader"],
      "created_at": "2026-08-04T00:00:00Z",
      "updated_at": "2026-08-04T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

### 2. GET `/api/v1/admin/users/{user_id}`

```http
GET /api/v1/admin/users/{user_id}
```

Trả về `404` nếu user không tồn tại hoặc đã bị soft-delete.

### 3. PATCH `/api/v1/admin/users/{user_id}/roles`

```http
PATCH /api/v1/admin/users/{user_id}/roles
```

```json
{
  "roles": ["reader", "author"]
}
```

- Danh sách mới thay thế toàn bộ role hiện tại.
- Request phải có ít nhất một role.
- Role code không tồn tại trả về `422`.
- Admin không được tự thay đổi role của chính mình; backend trả `409` để tránh
  tự khóa quyền quản trị.

## Novel Management

### 4. GET `/api/v1/admin/novels`

```http
GET /api/v1/admin/novels?search=fantasy&status=ongoing&visibility=private&moderation_status=pending&page=1&page_size=20
```

Admin có thể xem cả novel `public` và `private`.

| Filter | Giá trị hợp lệ |
| --- | --- |
| `status` | `draft`, `ongoing`, `hiatus`, `completed` |
| `visibility` | `public`, `private` |
| `moderation_status` | `pending`, `approved`, `rejected`, `hidden` |

`search` tìm theo title hoặc description. Response dùng cấu trúc `items`,
`total`, `page`, `page_size`.

### 5. GET `/api/v1/admin/novels/{novel_id}`

```http
GET /api/v1/admin/novels/{novel_id}
```

Response gồm author, category, trạng thái, visibility, moderation status,
thống kê lượt xem/theo dõi/đánh giá và timestamps.

## Category Management

### 6. GET `/api/v1/admin/categories`

```http
GET /api/v1/admin/categories
```

Danh sách gồm cả category đang hoạt động và đã tắt.

### 7. POST `/api/v1/admin/categories`

```http
POST /api/v1/admin/categories
```

```json
{
  "name": "Khoa học viễn tưởng",
  "slug": "khoa-hoc-vien-tuong",
  "description": "Các tác phẩm khoa học viễn tưởng",
  "is_active": true
}
```

`slug` là tùy chọn. Nếu bỏ trống, backend tự sinh slug ASCII từ `name`.

### 8. PATCH `/api/v1/admin/categories/{category_id}`

```http
PATCH /api/v1/admin/categories/{category_id}
```

Chỉ gửi các field cần thay đổi. Có thể dùng `is_active: false` để tắt category
mà không xóa.

### 9. DELETE `/api/v1/admin/categories/{category_id}`

```http
DELETE /api/v1/admin/categories/{category_id}
```

Category bị xóa thật. Foreign key đặt `category_id` của các novel liên quan
thành `NULL`.

## Tag Management

### 10. GET `/api/v1/admin/tags`

Trả về toàn bộ tag, sắp xếp theo tên.

### 11. POST `/api/v1/admin/tags`

```http
POST /api/v1/admin/tags
```

Request tạo tag:

```json
{
  "name": "Xuyên không",
  "slug": "xuyen-khong"
}
```

`slug` là tùy chọn và được tự sinh từ `name`.

### 12. PATCH `/api/v1/admin/tags/{tag_id}`

Tất cả field đều optional nhưng phải gửi ít nhất một field. Nếu không gửi
`slug`, slug hiện tại được giữ nguyên.

### 13. DELETE `/api/v1/admin/tags/{tag_id}`

Khi tag bị xóa, các liên kết trong `novel_tags` được database xóa theo
`ON DELETE CASCADE`.

## Validation và mã lỗi

| HTTP status | Ý nghĩa |
| --- | --- |
| `200` | Request thành công |
| `201` | Tạo category/tag thành công |
| `401` | Chưa xác thực hoặc token không hợp lệ |
| `403` | Không có role admin |
| `404` | Không tìm thấy resource |
| `409` | Trùng name/slug hoặc thao tác gây conflict |
| `422` | Body/query không hợp lệ |

Category và tag không cho phép trùng name không phân biệt hoa thường hoặc trùng
slug. Slug chỉ gồm chữ thường ASCII, chữ số và dấu gạch ngang.

## Ghi chú cơ sở dữ liệu

- User và novel dùng soft-delete hiện có; API admin không trả các row có
  `deleted_at` khác `NULL`.
- Category không có `deleted_at`. Xóa category là hard delete; foreign key
  `novels.category_id` dùng `ON DELETE SET NULL`.
- Tag không có `deleted_at`. Xóa tag là hard delete; foreign key
  `novel_tags.tag_id` dùng `ON DELETE CASCADE`.
- Role hợp lệ được lấy từ bảng `roles`, không hard-code trong service backend.
- Name category/tag được kiểm tra unique không phân biệt hoa thường ở repository;
  slug được kiểm tra unique trước khi commit và tiếp tục được bảo vệ bởi unique
  constraint/index của PostgreSQL.

## Ứng dụng admin

```powershell
cd admin
npm install
npm run dev
```

Ứng dụng dùng React Router, Axios, Material UI và Emotion. Trong development,
Vite proxy `/api` tới `http://localhost:8000`. Nếu backend ở host khác, đặt
`VITE_API_BASE_URL` trong `.env`.

## Unit test

Unit test không cần database. Chạy từ thư mục `backend`:

```powershell
python -m pytest `
  tests/test_admin_user_schema.py `
  tests/test_admin_user_service.py `
  tests/test_admin_novel_service.py `
  tests/test_admin_category_schema.py `
  tests/test_admin_category_service.py `
  tests/test_admin_tag_schema.py `
  tests/test_admin_tag_service.py `
  -q
```

Các test này kiểm tra:

- Normalize search trước khi gọi repository.
- Ghép role vào user list và giữ đúng thứ tự role khi replace.
- Chặn admin tự thay đổi role của chính mình và chặn role không tồn tại.
- Forward đúng filter/pagination của novel.
- Normalize name, description, slug và chặn extra field.
- Update schema bắt buộc có ít nhất một field.
- Sinh slug ASCII từ tên tiếng Việt.
- Phát hiện category/tag trùng name hoặc slug.
- Rollback transaction khi database trả `IntegrityError`.
- Trả domain error khi user, novel, category hoặc tag không tồn tại.

## Integration test

Integration test cần PostgreSQL test database riêng. Test chỉ chạy khi có
`NOVELHUB_TEST_DATABASE_URL`; nếu thiếu biến này, pytest sẽ skip file.

### 1. Tạo database test

Nếu dùng Docker Compose từ thư mục `backend`:

```powershell
docker compose up -d database
docker compose exec database createdb -U postgres novelhub_admin_test
```

### 2. Chạy integration test

```powershell
docker compose exec `
  -e NOVELHUB_TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@database:5432/novelhub_admin_test `
  backend python -m pytest tests/test_admin_integration.py -q
```

Integration test kiểm tra end-to-end:

- User không có role admin nhận `403`.
- Admin tìm kiếm, xem chi tiết và thay role user.
- Admin tìm kiếm và xem novel private.
- Admin tạo, phát hiện trùng, sửa, liệt kê và xóa category/tag.

### 3. Xóa database test

```powershell
docker compose exec database dropdb -U postgres novelhub_admin_test
```

Không trỏ `NOVELHUB_TEST_DATABASE_URL` vào database development hoặc production.

## Kiểm tra frontend admin

```powershell
cd admin
npm run lint
npm run build
```
