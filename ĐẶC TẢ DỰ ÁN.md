# NovelHub: Nền tảng đọc và chia sẻ tiểu thuyết trực tuyến

## 1. Tổng quan

NovelHub là nền tảng trực tuyến dành cho tác giả và độc giả.

-   Tác giả có thể sáng tác, quản lý và xuất bản tiểu thuyết.
-   Độc giả có thể khám phá, đọc và tương tác với truyện.
-   AI đóng vai trò **trợ lý sáng tác**, hỗ trợ người viết thay vì thay
    thế sự sáng tạo.

## 2. Mục tiêu

Xây dựng một MVP - Minimum Viable Product đáp ứng:

-   Quản lý truyện và chương
-   Đọc truyện trực tuyến
-   Tương tác giữa tác giả và độc giả
-   Tích hợp AI hỗ trợ sáng tác
-   Kiến trúc mở rộng cho các tính năng AI trong tương lai

## 3. Vai trò người dùng

### Guest

-   Xem danh sách truyện
-   Tìm kiếm
-   Xem thông tin truyện

### Reader

-   Đăng ký / Đăng nhập
-   Đọc truyện
-   Bookmark
-   Theo dõi truyện
-   Bình luận
-   Đánh giá
-   Lịch sử đọc

### Author

-   CRUD truyện
-   CRUD chương
-   Lưu Draft
-   Publish chương
-   Dashboard cá nhân
-   AI Assistant

### Administrator

-   Quản lý người dùng
-   Quản lý truyện
-   Quản lý bình luận
-   Quản lý danh mục
-   Dashboard

## 4. Các module

### Authentication

-   Register
-   Login
-   JWT
-   Refresh Token
-   Role-based Authorization

### User Management

-   Hồ sơ
-   Avatar
-   Đổi mật khẩu

### Story Management

-   CRUD truyện
-   Cover
-   Description
-   Category
-   Tag
-   Public / Private

### Chapter Management

-   CRUD chương
-   Draft
-   Publish

### Reading Platform

-   Đọc truyện
-   Bookmark
-   Follow
-   Rating
-   Comment
-   Reading History

### Community

-   Comment
-   Reply
-   Follow Author
-   Notification cơ bản

### Dashboard

Author: - Tổng truyện - Tổng chương - Lượt xem - Người theo dõi

Admin: - Tổng người dùng - Tổng truyện - Tổng chương

## 5. AI Assistant (MVP)

Triển khai 4 tính năng:

-   AI Writing Assistant
-   AI Story Summary
-   AI Grammar & Style Suggestion
-   AI Title Suggestion

## 6. Kiến trúc

* **Kiến trúc:** Monolith theo Layered/Clean Architecture.
* **Framework:** FastAPI.
* **Database:** PostgreSQL.
* **AI:** Một module `ai` trong backend, gọi OpenAI API hoặc LLM tương đương.
* **Triển khai:** Docker Compose (backend + frontend + PostgreSQL).

## 7. Database

Hệ thống hiện dùng PostgreSQL. Các đối tượng/bảng database trong backend gồm:

-   `users`
-   `roles`
-   `user_roles`
-   `refresh_tokens`
-   `categories`
-   `tags`
-   `novels`
-   `novel_tags`
-   `chapters`
-   `comments`
-   `ratings`
-   `bookmarks`
-   `reading_history`
-   `novel_follows`
-   `author_follows`
-   `notifications`
-   `ai_requests`

## 8. Sprint Planning

### Sprint 1

-   Database Design
-   Authentication
-   User Management
-   Novel Management
-   Chapter Management
-   Administration

### Sprint 2

-   Reading Platform
-   Community
-   AI Assistant
-   Testing Documents
-   Slide Presentation

## 9. Công nghệ

### Backend

-   FastAPI
-   SQLAlchemy
-   Alembic
-   PostgreSQL

### Frontend

-   React
-   Vite
-   Tailwind CSS

### Authentication

-   JWT

### Testing

-   Pytest

### DevOps

-   Docker
-   Docker Compose

### AI

-   OpenAI API hoặc LLM tương đương

## 10. Giá trị dự án

NovelHub là nền tảng sáng tác và chia sẻ tiểu thuyết trực tuyến, trong
đó AI được tích hợp như một trợ lý hỗ trợ sáng tác và nâng cao trải
nghiệm người dùng. MVP tập trung vào các chức năng cốt lõi để hoàn thành
trong thời gian mock project, đồng thời giữ kiến trúc mở để phát triển
thành một hệ sinh thái AI Writing hoàn chỉnh trong tương lai.


