import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_author
from app.database.session import get_db
from app.models.user import User
from app.repositories.chapter_repository import ChapterRepository
from app.repositories.novel_repository import NovelRepository
from app.schemas.ai import (
    AIBaseRequest, 
    AIChapterSummaryResponse, 
    AITitleSuggestionResponse, 
    AIGrammarCheckResponse, 
    AIWritingSuggestionRequest, 
    AIWritingSuggestionResponse
)
from app.services.ai_service import AIService

router = APIRouter(tags=["ai"])


def get_ai_service(db: Session = Depends(get_db)) -> AIService:
    return AIService(ChapterRepository(db), NovelRepository(db))


@router.post("/ai/novels/{novel_id}/summarize", response_model=AIChapterSummaryResponse, status_code=status.HTTP_200_OK)
def summarize_chapter(
    novel_id: uuid.UUID,
    payload: AIBaseRequest,
    current_user: User = Depends(require_author),
    service: AIService = Depends(get_ai_service),
) -> AIChapterSummaryResponse:
    summary = service.summarize_chapter(current_user, novel_id, payload.content)
    return AIChapterSummaryResponse(summary=summary)


@router.post("/ai/novels/{novel_id}/suggest-title", response_model=AITitleSuggestionResponse, status_code=status.HTTP_200_OK)
def suggest_chapter_title(
    novel_id: uuid.UUID,
    payload: AIBaseRequest,
    current_user: User = Depends(require_author),
    service: AIService = Depends(get_ai_service),
) -> AITitleSuggestionResponse:
    titles = service.suggest_chapter_title(current_user, novel_id, payload.content)
    return AITitleSuggestionResponse(suggested_titles=titles)


@router.post("/ai/novels/{novel_id}/check-grammar", response_model=AIGrammarCheckResponse, status_code=status.HTTP_200_OK)
def check_chapter_grammar(
    novel_id: uuid.UUID,
    payload: AIBaseRequest,
    current_user: User = Depends(require_author),
    service: AIService = Depends(get_ai_service),
) -> AIGrammarCheckResponse:
    suggestions = service.check_grammar(current_user, novel_id, payload.content)
    return AIGrammarCheckResponse(suggestions=suggestions)


@router.post("/ai/novels/{novel_id}/suggest-writing", response_model=AIWritingSuggestionResponse, status_code=status.HTTP_200_OK)
def suggest_writing(
    novel_id: uuid.UUID,
    payload: AIWritingSuggestionRequest,
    current_user: User = Depends(require_author),
    service: AIService = Depends(get_ai_service),
) -> AIWritingSuggestionResponse:
    suggestion = service.suggest_writing(
        current_user, 
        novel_id, 
        payload.content, 
        payload.prompt
    )
    return AIWritingSuggestionResponse(suggestion=suggestion)
