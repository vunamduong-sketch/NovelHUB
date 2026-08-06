import uuid
from pydantic import BaseModel, Field

class AIBaseRequest(BaseModel):
    content: str = Field(..., description="Nội dung chương hiện tại")

class AIChapterSummaryResponse(BaseModel):
    summary: str = Field(..., description="Tóm tắt được tạo bởi AI")

class AITitleSuggestionResponse(BaseModel):
    suggested_titles: list[str] = Field(..., description="Danh sách các tiêu đề được gợi ý bởi AI")

class AIGrammarSuggestionItem(BaseModel):
    original_text: str = Field(..., description="Đoạn văn bản/Câu/Từ gốc bị lỗi")
    suggested_text: str = Field(..., description="Câu/Từ thay thế đã được sửa")
    reason: str = Field(..., description="Lý do sửa lỗi")

class AIGrammarCheckResponse(BaseModel):
    suggestions: list[AIGrammarSuggestionItem] = Field(..., description="Danh sách các lỗi và đề xuất sửa")

class AIWritingSuggestionRequest(BaseModel):
    content: str = Field(..., description="Nội dung chương hiện tại để làm ngữ cảnh")
    prompt: str | None = Field(None, description="Chỉ dẫn định hướng thêm của tác giả (nếu có)")

class AIWritingSuggestionResponse(BaseModel):
    suggestion: str = Field(..., description="Đoạn văn tiếp theo được gợi ý bởi AI")
