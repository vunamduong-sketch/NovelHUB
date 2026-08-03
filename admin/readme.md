# NovelHUB Admin

Ứng dụng quản trị React cho các API `/api/v1/admin`.

## Chạy local

```powershell
cd admin
npm install
npm run dev
```

Vite sử dụng proxy `/api` tới `http://localhost:8000`. Có thể đặt
`VITE_API_BASE_URL` trong `.env` khi backend chạy ở địa chỉ khác.

Tài khoản đăng nhập phải có vai trò `admin`.

## Chức năng

- Tìm kiếm, xem chi tiết và đổi vai trò người dùng.
- Tìm kiếm, lọc và xem thông tin tiểu thuyết.
- Thêm, sửa, xóa và kích hoạt/tắt thể loại.
- Thêm, sửa và xóa nhãn.
