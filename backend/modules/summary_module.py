from typing import Optional
from pydantic import BaseModel
from backend.services.gemini_service import generate_text_content
from backend.services import database_service as db


class SummaryRequest(BaseModel):
    input_text: str
    session_id: Optional[str] = "anonymous"


class SummaryResponse(BaseModel):
    type: str = "markdown"
    content: str


def generate_summary(request: SummaryRequest, api_key: Optional[str] = None) -> SummaryResponse:
    """
    Accepts long text, queries Gemini for a Title, Short Summary, and Key Points,
    and persists the query, response, and full summary to JSON storage.
    """
    text = request.input_text.strip()
    session_id = request.session_id or "anonymous"

    prompt = (
        "You are an academic summarizer. Summarize the following educational text or article. "
        "Your output must be formatted strictly in Markdown using the following structure with these exact headers (##):\n\n"
        "## Title\n"
        "Generate a brief, clear, and professional title that summarizes the topic.\n\n"
        "## Short Summary\n"
        "Write a concise, beginner-friendly summary of the text in simple English (1-3 sentences).\n\n"
        "## Key Points\n"
        "List 3-5 critical arguments, insights, or facts from the text as bullet points. "
        "Include examples mentioned in the text where appropriate.\n\n"
        f"Text to summarize:\n\n{text}"
    )

    result = generate_text_content(prompt, api_key=api_key)

    # Persist to JSON storage
    user   = db.get_or_create_user(session_id)
    query  = db.save_query(user["id"], "text_summarization", text[:500])  # truncate long inputs
    db.save_response(query["id"], "markdown", result)
    db.save_summary(query["id"], result)

    return SummaryResponse(content=result)
