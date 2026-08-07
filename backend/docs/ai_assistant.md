# NovelHub AI Assistant

Tài liệu này mô tả module AI Assistant, một tính năng nâng cao được tích hợp trong trình soạn thảo chương (Chapter Editor) giúp hỗ trợ tác giả trong quá trình sáng tác. Module này sử dụng Google Gemini AI (cụ thể là mô hình `gemini-flash-latest`).

Module được tổ chức theo kiến trúc hiện tại của dự án:

```text
router -> service -> repository -> schema
```

Router AI được include trong `backend/main.py`:

```python
app.include_router(ai_router, prefix="/api/v1")
```

## Các file chính

```text
backend/app/schemas/ai.py
backend/app/services/ai_service.py
backend/app/api/routers/ai.py
backend/tests/test_ai_service.py
backend/docs/ai_assistant.md
```

## Mục tiêu module

Author có thể:

- Yêu cầu AI đọc nội dung chương và tóm tắt tự động.
- Yêu cầu AI đề xuất 3 tiêu đề chương phù hợp nhất dựa trên nội dung.
- Yêu cầu AI kiểm tra lỗi chính tả, ngữ pháp và lỗi diễn đạt lủng củng trong chương.
- Yêu cầu AI viết tiếp nội dung chương dựa trên văn cảnh hiện tại và một chỉ dẫn (prompt) tùy chọn.

## API contract

Prefix: `/api/v1/ai`

| Endpoint | Actor | Request | Success | Errors |
| --- | --- | --- | --- | --- |
| `POST /novels/{novel_id}/summarize` | author | `AIBaseRequest` | `200` summary string | `401`, `403`, `404`, `422`, `500` |
| `POST /novels/{novel_id}/suggest-title` | author | `AIBaseRequest` | `200` danh sách title | `401`, `403`, `404`, `422`, `500` |
| `POST /novels/{novel_id}/check-grammar` | author | `AIBaseRequest` | `200` danh sách lỗi | `401`, `403`, `404`, `422`, `500` |
| `POST /novels/{novel_id}/suggest-writing` | author | `AIWritingSuggestionRequest` | `200` text gợi ý | `401`, `403`, `404`, `422`, `500` |

Tất cả endpoint đều được bảo vệ bởi dependency `require_author`, đảm bảo chỉ có tác giả đăng nhập (và là chủ sở hữu của bộ truyện `novel_id`) mới được phép gọi AI nhằm tiết kiệm chi phí API.

## 1. POST `/api/v1/ai/novels/{novel_id}/summarize`

Yêu cầu AI tóm tắt ngắn gọn và súc tích nội dung chương.

**Request body:**

```json
{
  "content": "Nội dung chương truyện hiện tại..."
}
```

**Success `200`:**

```json
{
  "summary": "Tóm tắt ngắn gọn được tạo ra bởi AI."
}
```

## 2. POST `/api/v1/ai/novels/{novel_id}/suggest-title`

Yêu cầu AI đề xuất chính xác 3 tiêu đề sáng tạo dựa trên nội dung chương.

**Request body:**

```json
{
  "content": "Nội dung chương truyện hiện tại..."
}
```

**Success `200`:**

```json
{
  "suggested_titles": [
    "Tiêu đề gợi ý 1",
    "Tiêu đề gợi ý 2",
    "Tiêu đề gợi ý 3"
  ]
}
```

Backend gọi Gemini với `response_mime_type="application/json"` để ép mô hình trả về JSON chuẩn xác và parse tự động vào Schema Pydantic.

## 3. POST `/api/v1/ai/novels/{novel_id}/check-grammar`

Yêu cầu AI đóng vai trò một biên tập viên, kiểm tra các lỗi chính tả, lặp từ, và lỗi diễn đạt.

**Request body:**

```json
{
  "content": "Hôm nai chời trong xan chàn đầy hi vọng..."
}
```

**Success `200`:**

```json
{
  "suggestions": [
    {
      "original_text": "nai",
      "suggested_text": "nay",
      "reason": "Sai chính tả, từ đúng là 'nay'"
    },
    {
      "original_text": "xan",
      "suggested_text": "xanh",
      "reason": "Sai chính tả phụ âm cuối"
    }
  ]
}
```

## 4. POST `/api/v1/ai/novels/{novel_id}/suggest-writing`

Yêu cầu AI viết tiếp nội dung dựa theo mạch truyện đang có. Tác giả có thể truyền thêm `prompt` để định hướng (ví dụ: "cho nhân vật chính nhặt được một thanh gươm").

**Request body:**

```json
{
  "content": "Nội dung chương truyện hiện tại...",
  "prompt": "Cho nhân vật chính nhặt được một thanh gươm" 
}
```

*Lưu ý: `prompt` là trường tùy chọn (nullable).*

**Success `200`:**

```json
{
  "suggestion": "Nhân vật chính bước đi và bất ngờ vấp phải một vật cứng. Đó là một thanh gươm rỉ sét..."
}
```

## Environment configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | None | Bắt buộc phải có để gọi Google Generative AI |

Không bao giờ commit file `.env` chứa `GEMINI_API_KEY` lên Git. Trong Docker, biến này được inject thông qua cấu hình `docker-compose.yml` (`env_file: .env`).

## Known Issues & Notes

- **AI Model:** Module bắt buộc sử dụng `gemini-flash-latest` vì các phiên bản khác (như `gemini-1.5-flash`) có thể gây ra lỗi `404 Not Found` trên môi trường API hiện hành.
- **Token Limits Issue:** Tránh việc truyền `max_output_tokens` kèm với `response_mime_type="application/json"` trong `GenerationConfig` vì SDK Gemini hiện tại đang có lỗi cắt xén (truncate) đầu ra quá sớm, khiến JSON bị hỏng giữa chừng và sinh ra lỗi `500 Internal Server Error`. Các phương thức trong `AIService` đã được tinh chỉnh bằng cách loại bỏ `max_output_tokens` để khắc phục lỗi này.
- **Markdown Wrapping:** Đôi khi LLM trả về chuỗi JSON bọc trong markdown code block (```` ```json ... ``` ````). `AIService` đã có cơ chế sử dụng Regex để bóc tách chuỗi JSON sạch trước khi parse.

## Testing

Unit test chạy độc lập, mock (giả lập) toàn bộ module `google.generativeai` để kiểm tra logic backend mà không tốn API call:

```powershell
python -m pytest tests/test_ai_service.py -q
```

Test sẽ kiểm tra:
- Khả năng xử lý khi AI trả về markdown code blocks.
- Khả năng ném ra `HTTPException` (404, 403) nếu truyền ID sai hoặc không thuộc quyền sở hữu của user hiện tại.
- Đúng định dạng Pydantic Responses.
