from typing import Optional
from pydantic import BaseModel
from backend.services.gemini_service import generate_text_content
from backend.services import database_service as db


class ExplanationRequest(BaseModel):
    input_text: str
    session_id: Optional[str] = "anonymous"


class ExplanationResponse(BaseModel):
    type: str = "markdown"
    content: str


def generate_explanation(request: ExplanationRequest, api_key: Optional[str] = None) -> ExplanationResponse:
    """
    Queries Gemini for detailed concept explanations using a structured 4-section layout.
    Persists the query and response to JSON storage.
    """
    concept = request.input_text.strip()
    session_id = request.session_id or "anonymous"

    prompt = (
        "You are an expert educator. Explain the following concept in beginner-friendly, simple English. "
        "Your response MUST contain the following four sections, utilizing clear Markdown header elements (##):\n\n"
        "1. ## Real-World Analogy\n"
        "Explain the concept using a simple, relatable, real-world analogy. Keep it engaging.\n\n"
        "2. ## Key Concepts & Breakdowns\n"
        "A bullet-point breakdown detailing the fundamental building blocks of the concept.\n\n"
        "3. ## Deep Dive\n"
        "A detailed explanation of how it works. Include code, formulas, or step-by-step examples where appropriate.\n\n"
        "4. ## Common Misconceptions\n"
        "List 2-3 points explaining what people commonly misunderstand about this concept.\n\n"
        f"Concept to explain: {concept}"
    )

    result = generate_text_content(prompt, api_key=api_key)

    # Persist to JSON storage
    user  = db.get_or_create_user(session_id)
    query = db.save_query(user["id"], "concept_explanation", concept)
    db.save_response(query["id"], "markdown", result)

    return ExplanationResponse(content=result)
