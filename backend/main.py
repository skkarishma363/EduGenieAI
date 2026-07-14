import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Request, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import Domain Requests, Responses, and logic handlers
from backend.modules.qna import QnaRequest, QnaResponse, generate_qna
from backend.modules.explanation_module import ExplanationRequest, ExplanationResponse, generate_explanation
from backend.modules.quiz_module import QuizRequest, QuizResponse, generate_quiz
from backend.modules.summary_module import SummaryRequest, SummaryResponse, generate_summary
from backend.modules.learning_path import LearningPathRequest, LearningPathResponse, generate_learning_path

# Load environment variables from .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

app = FastAPI(
    title="EduGenie API",
    description="Modular FastAPI application leveraging Google Gemini API, Pydantic schemas, and JSON storage.",
    version="6.0.0"
)

# Enable CORS for full browser compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _session(request: Request) -> str:
    """Derive a lightweight session identifier from the client IP address."""
    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0] if forwarded else (request.client.host if request.client else "anonymous")
    return ip


# ------------------------------------------------------------------ #
#  REST Endpoints                                                      #
# ------------------------------------------------------------------ #

@app.post("/qa", response_model=QnaResponse, status_code=status.HTTP_200_OK,
          summary="Answer educational questions")
async def post_qa(
    request: Request,
    body: QnaRequest,
    x_gemini_api_key: Optional[str] = Header(None),
):
    try:
        if not body.input_text.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Input text cannot be empty.")
        body.session_id = _session(request)
        return generate_qna(body, api_key=x_gemini_api_key)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Q&A error: {str(e)}")


@app.post("/explain", response_model=ExplanationResponse, status_code=status.HTTP_200_OK,
          summary="Explain educational concepts")
async def post_explain(
    request: Request,
    body: ExplanationRequest,
    x_gemini_api_key: Optional[str] = Header(None),
):
    try:
        if not body.input_text.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Input text cannot be empty.")
        body.session_id = _session(request)
        return generate_explanation(body, api_key=x_gemini_api_key)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Explanation error: {str(e)}")


@app.post("/quiz", response_model=QuizResponse, status_code=status.HTTP_200_OK,
          summary="Generate topic quizzes")
async def post_quiz(
    request: Request,
    body: QuizRequest,
    x_gemini_api_key: Optional[str] = Header(None),
):
    try:
        if not body.input_text.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Input text cannot be empty.")
        body.session_id = _session(request)
        return generate_quiz(body, api_key=x_gemini_api_key)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Quiz generation error: {str(e)}")


@app.post("/summarize", response_model=SummaryResponse, status_code=status.HTTP_200_OK,
          summary="Summarize educational text")
async def post_summarize(
    request: Request,
    body: SummaryRequest,
    x_gemini_api_key: Optional[str] = Header(None),
):
    try:
        if not body.input_text.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Input text cannot be empty.")
        body.session_id = _session(request)
        return generate_summary(body, api_key=x_gemini_api_key)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Summarization error: {str(e)}")


@app.post("/learn/recommendations", response_model=LearningPathResponse, status_code=status.HTTP_200_OK,
          summary="Recommend personalized study roadmaps")
async def post_learn_recommendations(
    request: Request,
    body: LearningPathRequest,
    x_gemini_api_key: Optional[str] = Header(None),
):
    try:
        if not body.input_text.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Input text cannot be empty.")
        body.session_id = _session(request)
        return generate_learning_path(body, api_key=x_gemini_api_key)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Learning path error: {str(e)}")


# ------------------------------------------------------------------ #
#  Serve static frontend                                               #
# ------------------------------------------------------------------ #
current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir  = os.path.join(os.path.dirname(current_dir), "static")

if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
async def get_index():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "EduGenie backend is running. Frontend not found at: " + static_dir}
