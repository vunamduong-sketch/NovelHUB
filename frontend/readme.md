# NovelHUB Frontend

## Authentication UI

Login, registration và password reset gọi backend `/api/v1/auth`. Khi chạy development, Vite proxy
`/api` tới `http://localhost:8000`; hãy khởi động backend trước.

```powershell
npm install
npm run dev
```

Mở `http://localhost:5173`. Có thể đặt `VITE_API_BASE_URL` (ví dụ
`http://localhost:8000`) trong `frontend/.env.local` khi không dùng proxy.

Access/refresh token được giữ trong `sessionStorage` để duy trì phiên trong tab
hiện tại. Password reset chỉ hiển thị development token khi backend trả
`debug_reset_token`; production cần email provider. Production nên chuyển refresh
token sang HttpOnly Secure cookie khi backend contract được nâng cấp.

## Structure and testing

Authentication is organized into `api/`, `auth/`, `components/auth/`, `pages/auth/`
and `utils/` so later User Management tasks can reuse routes, API client and
validation. `ProtectedRoute` is ready for Profile and Avatar pages.

```powershell
npm run test
npm run lint
npm run build
```
