import uuid
import logging
import json
from fastapi import HTTPException, status
import google.generativeai as genai

from app.core.config import settings
from app.models.user import User
from app.repositories.chapter_repository import ChapterRepository
from app.repositories.novel_repository import NovelRepository

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self, chapter_repository: ChapterRepository, novel_repository: NovelRepository) -> None:
        self.chapter_repository = chapter_repository
        self.novel_repository = novel_repository
        
        # Initialize Gemini client if API key is provided
        self.is_configured = False
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.is_configured = True

    def summarize_chapter(self, current_user: User, novel_id: uuid.UUID, content: str) -> str:
        if not self.is_configured:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is not configured (missing API key)"
            )

        novel = self.novel_repository.get_active_by_id(novel_id)
        if not novel or novel.author_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

        if not content or not content.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chapter content is empty")

        try:
            model = genai.GenerativeModel("gemini-flash-latest")
            prompt = f"Bạn là một trợ lý viết tiểu thuyết. Nhiệm vụ của bạn là tóm tắt ngắn gọn và súc tích nội dung đoạn văn sau:\n\n{content}"
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(temperature=0.7)
            )
            
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate summary from AI provider"
            )

    def suggest_chapter_title(self, current_user: User, novel_id: uuid.UUID, content: str) -> list[str]:
        if not self.is_configured:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is not configured (missing API key)"
            )

        novel = self.novel_repository.get_active_by_id(novel_id)
        if not novel or novel.author_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

        if not content or not content.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chapter content is empty")

        all_chapters = self.chapter_repository.get_chapters_by_novel(novel.id)
        previous_titles = [c.title for c in all_chapters]
        previous_titles_str = ", ".join(previous_titles[-3:]) if previous_titles else "Chưa có chương nào trước đó."

        prompt = (
            f"Bạn là một nhà văn chuyên nghiệp. Hãy gợi ý 3 tiêu đề hay nhất cho chương mới của bộ truyện '{novel.title}'.\n"
            f"Mô tả truyện: {novel.description or 'Không có'}\n"
            f"Các chương trước có tên là: {previous_titles_str}\n\n"
            f"Nội dung chương mới:\n{content}\n\n"
            "Chỉ trả về JSON định dạng duy nhất một object với key 'titles' chứa một mảng gồm đúng 3 chuỗi tiêu đề."
        )

        try:
            model = genai.GenerativeModel("gemini-flash-latest")
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.8, 
                    response_mime_type="application/json"
                )
            )
            
            raw_text = response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            
            result_json = json.loads(raw_text.strip())
            titles = result_json.get("titles", [])
            
            if not isinstance(titles, list) or len(titles) == 0:
                return ["Không thể tạo tiêu đề phù hợp."]
            return [str(t) for t in titles]
            
        except Exception as e:
            logger.error(f"Error suggesting title via Gemini: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get title suggestions from AI provider"
            )

    def check_grammar(self, current_user: User, novel_id: uuid.UUID, content: str) -> list[dict]:
        if not self.is_configured:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is not configured (missing API key)"
            )

        novel = self.novel_repository.get_active_by_id(novel_id)
        if not novel or novel.author_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

        if not content or not content.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chapter content is empty")

        prompt = (
            "Bạn là một biên tập viên xuất sắc. Nhiệm vụ của bạn là kiểm tra lỗi chính tả, "
            "lỗi lặp từ và các câu quá lủng củng trong đoạn văn bản sau.\n"
            "Chỉ báo cáo các lỗi thực sự đáng chú ý (tối đa 15 lỗi để tránh làm người viết bị ngợp).\n"
            "Chỉ trả về JSON định dạng duy nhất một object với key 'suggestions' chứa một mảng các object. "
            "Mỗi object trong mảng phải có đúng 3 thuộc tính: 'original_text' (phần chữ bị lỗi), "
            "'suggested_text' (phần chữ đã sửa), và 'reason' (lý do sửa).\n\n"
            f"Nội dung cần kiểm tra:\n{content}"
        )

        try:
            model = genai.GenerativeModel("gemini-flash-latest")
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3, 
                    response_mime_type="application/json"
                )
            )
            
            raw_text = response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            
            result_json = json.loads(raw_text.strip())
            suggestions = result_json.get("suggestions", [])
            
            if not isinstance(suggestions, list):
                return []
            return suggestions
            
        except Exception as e:
            logger.error(f"Error checking grammar via Gemini: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to check grammar from AI provider"
            )

    def suggest_writing(
        self, 
        current_user: User, 
        novel_id: uuid.UUID, 
        content: str, 
        prompt: str | None
    ) -> str:
        if not self.is_configured:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is not configured (missing API key)"
            )

        novel = self.novel_repository.get_active_by_id(novel_id)
        if not novel or novel.author_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

        all_chapters = self.chapter_repository.get_chapters_by_novel(novel.id)
        
        recent_summaries = []
        for c in all_chapters[-20:]:
            summary_text = c.summary if c.summary else "(Không có tóm tắt)"
            recent_summaries.append(f"Chương {c.chapter_number}: {summary_text}")
        summaries_str = "\n".join(recent_summaries) if recent_summaries else "Chưa có chương trước nào."
        
        previous_chapter_content = all_chapters[-1].content if all_chapters else "Không có."

        user_content_parts = []
        if content and content.strip():
            user_content_parts.append(f"Tác giả đang viết dở đoạn sau:\n{content}")
        else:
            user_content_parts.append("Chương này hiện tại đang trống. Hãy viết đoạn mở đầu.")
            
        if prompt and prompt.strip():
            user_content_parts.append(f"Chỉ dẫn của tác giả cho đoạn viết tiếp theo: {prompt}")
            
        user_prompt = "\n\n".join(user_content_parts)

        full_prompt = (
            f"Bạn là một trợ lý sáng tác tiểu thuyết xuất sắc. Đang viết truyện '{novel.title}'.\n"
            f"Thể loại/Mô tả: {novel.description or 'Không có'}\n\n"
            f"TÓM TẮT DIỄN BIẾN (Các chương gần đây):\n{summaries_str}\n\n"
            f"NỘI DUNG CHƯƠNG GẦN NHẤT ĐỂ THAM KHẢO VĂN PHONG VÀ BỐI CẢNH:\n{previous_chapter_content}\n\n"
            "Nhiệm vụ của bạn là viết tiếp một đoạn văn dài vừa phải cho chương hiện tại một cách tự nhiên, "
            "tuân thủ mạch truyện và phong cách của tác giả.\n\n"
            f"{user_prompt}"
        )

        try:
            model = genai.GenerativeModel("gemini-flash-latest")
            response = model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.8
                )
            )
            
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Error suggesting writing via Gemini: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate writing suggestion from AI provider"
            )
