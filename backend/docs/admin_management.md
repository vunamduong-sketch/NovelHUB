# Administration API

Tài liệu này mô tả API quản trị NovelHUB và ứng dụng React trong thư mục
`admin/`.

## Tổng quan

- Base URL: `/api/v1`
- Swagger UI: `/docs`
- Authentication: Bearer access token
- Quyền bắt buộc: `admin`
- Request content type: `application/json`

Mọi endpoint `/admin/*` gọi dependency `require_admin`. Dependency đọc vai trò
hiện tại từ database ở mỗi request; sửa token hoặc session phía trình duyệt
không thể cấp quyền quản trị.

## Authentication

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

## Quản lý người dùng

### Tìm kiếm và lấy danh sách

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

### Xem chi tiết

```http
GET /api/v1/admin/users/{user_id}
```

Trả về `404` nếu user không tồn tại hoặc đã bị soft-delete.

### Thay thế vai trò

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

## Quản lý tiểu thuyết

### Tìm kiếm và lấy danh sách

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

### Xem thông tin cơ bản

```http
GET /api/v1/admin/novels/{novel_id}
```

Response gồm author, category, trạng thái, visibility, moderation status,
thống kê lượt xem/theo dõi/đánh giá và timestamps.

## Quản lý category

### Danh sách

```http
GET /api/v1/admin/categories
```

Danh sách gồm cả category đang hoạt động và đã tắt.

### Tạo category

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

### Cập nhật category

```http
PATCH /api/v1/admin/categories/{category_id}
```

Chỉ gửi các field cần thay đổi. Có thể dùng `is_active: false` để tắt category
mà không xóa.

### Xóa category

```http
DELETE /api/v1/admin/categories/{category_id}
```

Category bị xóa thật. Foreign key đặt `category_id` của các novel liên quan
thành `NULL`.

## Quản lý tag

```http
GET    /api/v1/admin/tags
POST   /api/v1/admin/tags
PATCH  /api/v1/admin/tags/{tag_id}
DELETE /api/v1/admin/tags/{tag_id}
```

Request tạo tag:

```json
{
  "name": "Xuyên không",
  "slug": "xuyen-khong"
}
```

`slug` là tùy chọn và được tự sinh từ `name`. Khi tag bị xóa, các liên kết
trong `novel_tags` được database xóa theo `ON DELETE CASCADE`.

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

## Cấu trúc backend

Mỗi domain được tách riêng trong từng layer:

```text
app/admin/
├── api/routers/
│   ├── users.py
│   ├── novels.py
│   ├── categories.py
│   └── tags.py
├── repositories/
├── schemas/
└── services/
```

Model và database session dùng chung với backend chính, tránh khai báo trùng.

## Ứng dụng admin

```powershell
cd admin
npm install
npm run dev
```

Ứng dụng dùng React Router, Axios, Material UI và Emotion. Trong development,
Vite proxy `/api` tới `http://localhost:8000`. Nếu backend ở host khác, đặt
`VITE_API_BASE_URL` trong `.env`.

## Kiểm thử

Unit tests không cần database:

```powershell
cd backend
python -m pytest tests/test_admin_schemas.py tests/test_admin_services.py -q
```

Integration tests cần PostgreSQL test riêng:

```powershell
$env:NOVELHUB_TEST_DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5433/novelhub_admin_test"
python -m pytest tests/test_admin_integration.py -q
```

Kiểm tra frontend admin:

```powershell
cd admin
npm run lint
npm run build
```
