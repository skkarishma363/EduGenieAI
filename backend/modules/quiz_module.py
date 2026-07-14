from typing import List, Optional
from pydantic import BaseModel, Field
from backend.services.gemini_service import generate_structured_json
from backend.services import database_service as db


class QuizRequest(BaseModel):
    input_text: str
    session_id: Optional[str] = "anonymous"


# ---------- Frontend-compatible schemas ----------
class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_option_index: int
    explanation: str


class QuizContent(BaseModel):
    questions: List[QuizQuestion]


class QuizResponse(BaseModel):
    type: str = "quiz"
    content: QuizContent


# ---------- Gemini structured-output schemas ----------
class GeminiQuizQuestion(BaseModel):
    question: str = Field(description="The question testing core concepts")
    option_a: str = Field(description="Choice Option A")
    option_b: str = Field(description="Choice Option B")
    option_c: str = Field(description="Choice Option C")
    option_d: str = Field(description="Choice Option D")
    correct_answer: str = Field(description="The correct option letter. Must be exactly 'A', 'B', 'C', or 'D'")
    explanation: str = Field(description="An explanation of why the correct option is right")


class GeminiQuizResponse(BaseModel):
    questions: List[GeminiQuizQuestion] = Field(description="A list containing exactly 5 questions")


def generate_quiz(request: QuizRequest, api_key: Optional[str] = None) -> QuizResponse:
    """
    Generates exactly 5 MCQs, translates A/B/C/D keys to 0-indexed arrays for the UI,
    and persists the query, response, and full quiz payload to JSON storage.
    """
    topic = request.input_text.strip()
    session_id = request.session_id or "anonymous"

    prompt = (
        "Generate a multiple-choice quiz consisting of exactly 5 questions based on the following topic or text. "
        "Questions should range in difficulty (easy, medium, hard) and test conceptual knowledge. "
        "Provide exactly four choices (Option A, Option B, Option C, and Option D) for each question "
        "and select the correct answer ('A', 'B', 'C', or 'D'). Provide detailed explanations of the answer.\n\n"
        f"Topic/Text: {topic}"
    )

    gemini_data = generate_structured_json(prompt, response_schema=GeminiQuizResponse, api_key=api_key)

    letter_to_index = {"A": 0, "B": 1, "C": 2, "D": 3}
    questions_list: List[QuizQuestion] = []
    questions_raw = []

    for q in gemini_data.get("questions", []):
        options = [
            q.get("option_a", ""),
            q.get("option_b", ""),
            q.get("option_c", ""),
            q.get("option_d", ""),
        ]
        correct_index = letter_to_index.get(q.get("correct_answer", "A").upper().strip(), 0)

        questions_list.append(QuizQuestion(
            question=q.get("question", ""),
            options=options,
            correct_option_index=correct_index,
            explanation=q.get("explanation", ""),
        ))
        questions_raw.append({
            "question": q.get("question", ""),
            "options": options,
            "correct_option_index": correct_index,
            "explanation": q.get("explanation", ""),
        })

    # Persist to JSON storage
    user  = db.get_or_create_user(session_id)
    query = db.save_query(user["id"], "quiz_generation", topic)
    db.save_response(query["id"], "quiz", f"{len(questions_list)} questions generated")
    db.save_quiz(query["id"], questions_raw)

    return QuizResponse(content=QuizContent(questions=questions_list))
