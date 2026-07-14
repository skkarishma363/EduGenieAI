from typing import Optional
from pydantic import BaseModel
from backend.services.gemini_service import generate_text_content
from backend.services import database_service as db


class QnaRequest(BaseModel):
    input_text: str
    session_id: Optional[str] = "anonymous"


class QnaResponse(BaseModel):
    type: str = "markdown"
    content: str


def generate_qna(request: QnaRequest, api_key: Optional[str] = None) -> QnaResponse:
    """
    Accepts educational questions, queries Gemini for detailed answers,
    and persists the query/response to JSON storage.
    """
    question = request.input_text.strip()
    session_id = request.session_id or "anonymous"

    prompt = (
        "You are an expert academic tutor. Answer the following question accurately. "
        "Your explanation must be written in beginner-friendly, simple English. "
        "Include concrete examples where appropriate to illustrate your points. "
        "Use rich, structured educational markdown (headings, bold text, bullet points, and code blocks) "
        "to ensure it is highly readable.\n\n"
        f"Question: {question}"
    )

    result = generate_text_content(prompt, api_key=api_key)

    # Persist to JSON storage
    user  = db.get_or_create_user(session_id)
    query = db.save_query(user["id"], "question_answering", question)
    db.save_response(query["id"], "markdown", result)

    return QnaResponse(content=result)
