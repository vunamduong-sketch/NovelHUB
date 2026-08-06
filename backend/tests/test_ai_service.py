import uuid
import json
import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

from app.services.ai_service import AIService
from app.models.user import User
from app.models.chapter import Chapter
from app.models.novel import Novel

@pytest.fixture
def fake_user():
    user = User(id=uuid.uuid4(), username="test_author")
    return user

@pytest.fixture
def fake_novel(fake_user):
    return Novel(
        id=uuid.uuid4(), 
        title="Truyện Test", 
        description="Mô tả test",
        author_id=fake_user.id
    )

@pytest.fixture
def ai_service():
    mock_chapter_repo = MagicMock()
    mock_novel_repo = MagicMock()
    service = AIService(chapter_repository=mock_chapter_repo, novel_repository=mock_novel_repo)
    service.is_configured = True 
    return service


@patch('app.services.ai_service.genai.GenerativeModel')
def test_summarize_chapter_success(mock_gen_model_class, ai_service, fake_user, fake_novel):
    ai_service.novel_repository.get_active_by_id.return_value = fake_novel
    
    mock_model_instance = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Tóm tắt: Đi chơi gặp chó."
    mock_model_instance.generate_content.return_value = mock_response
    mock_gen_model_class.return_value = mock_model_instance
    
    content = "Hôm qua tôi đi chơi. Con chó rất bực."
    summary = ai_service.summarize_chapter(fake_user, fake_novel.id, content)
    
    assert summary == "Tóm tắt: Đi chơi gặp chó."


@patch('app.services.ai_service.genai.GenerativeModel')
def test_check_grammar_success(mock_gen_model_class, ai_service, fake_user, fake_novel):
    ai_service.novel_repository.get_active_by_id.return_value = fake_novel
    
    mock_model_instance = MagicMock()
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "suggestions": [
            {
                "original_text": "bực",
                "suggested_text": "to",
                "reason": "Dùng từ sai ngữ cảnh"
            }
        ]
    })
    mock_model_instance.generate_content.return_value = mock_response
    mock_gen_model_class.return_value = mock_model_instance
    
    content = "Hôm qua tôi đi chơi. Con chó rất bực."
    suggestions = ai_service.check_grammar(fake_user, fake_novel.id, content)
    
    assert isinstance(suggestions, list)
    assert len(suggestions) == 1
    assert suggestions[0]["original_text"] == "bực"
    assert suggestions[0]["suggested_text"] == "to"


def test_ai_service_unauthorized_novel(ai_service, fake_user):
    other_novel = Novel(
        id=uuid.uuid4(), 
        title="Truyện của người khác", 
        author_id=uuid.uuid4() 
    )
    
    ai_service.novel_repository.get_active_by_id.return_value = other_novel
    
    with pytest.raises(HTTPException) as exc_info:
        ai_service.summarize_chapter(fake_user, other_novel.id, "Nội dung test")
        
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Permission denied"
