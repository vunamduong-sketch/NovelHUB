# NovelHub Demo Checklist

## 1. Chay backend va database cua nhanh main

Mo terminal thu nhat trong VS Code:

```powershell
cd D:\code_source\NovelHUB\backend
Copy-Item .env.example .env -ErrorAction SilentlyContinue
docker compose up --build -d
docker compose ps
```

Container backend tu chay `alembic upgrade head`, dung schema PostgreSQL cua
nhanh `main`. Script demo khong tu tao schema.

Seed du lieu ngay trong backend container:

```powershell
docker compose exec backend python scripts/seed_demo_data.py
```

Kiem tra backend:

- `http://localhost:8000/health`
- `http://localhost:8000/docs`

File khoi dong backend: `D:\code_source\NovelHUB\backend\main.py`.

## 2. Chay frontend

Mo terminal thu hai trong VS Code:

```powershell
cd D:\code_source\NovelHUB\frontend
npm install
npm run dev
```

Mo `http://localhost:5173/login` tren browser.

File khoi dong frontend: `D:\code_source\NovelHUB\frontend\src\main.jsx`.
Lenh `npm run dev` duoc khai bao trong `frontend/package.json`.

## 3. Tai khoan demo

- Reader: `reader.demo@novelhub.com` / `DemoPass123!`
- Author: `author.demo@novelhub.com` / `DemoPass123!`
- Admin: `admin.demo@novelhub.com` / `DemoPass123!`

## 4. Luong demo UI ngan

1. Dang nhap reader tai `/login`.
2. Mo truyen `The Ember Library`.
3. Follow truyen, follow tac gia va danh gia truyen.
4. Mo chuong, them binh luan va tra loi binh luan.
5. Mo `/followed` de xem truyen va tac gia da theo doi.

## 5. File nen mo khi thuyet trinh code

- `backend/scripts/seed_demo_data.py`
- `frontend/src/pages/auth/LoginPage.jsx`
- `frontend/src/pages/novel_management/NovelDetail.jsx`
- `frontend/src/pages/chapter_management/ChapterReader.jsx`
- `frontend/src/pages/reader/FollowedLibraryPage.jsx`
