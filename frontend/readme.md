# NovelHUB Frontend

## Authentication UI

Login và registration gọi backend `/api/v1/auth`. Khi chạy development, Vite proxy
`/api` tới `http://localhost:8000`; hãy khởi động backend trước.

```powershell
npm install
npm run dev
```

Mở `http://localhost:5173`. Có thể đặt `VITE_API_BASE_URL` (ví dụ
`http://localhost:8000`) trong `frontend/.env.local` khi không dùng proxy.

Access/refresh token được giữ trong `sessionStorage` để duy trì phiên trong tab
hiện tại. Production nên chuyển refresh token sang HttpOnly Secure cookie khi
backend contract được nâng cấp.
