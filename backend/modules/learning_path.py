from typing import List, Optional
from pydantic import BaseModel, Field
from backend.services.gemini_service import generate_structured_json
from backend.services import database_service as db


class LearningPathRequest(BaseModel):
    input_text: str
    session_id: Optional[str] = "anonymous"


# ---------- Frontend-compatible schemas ----------
class Milestone(BaseModel):
    title: str
    duration: str
    topics: List[str]
    practical_exercises: List[str]
    recommended_resources: List[str]


class LearningPathContent(BaseModel):
    roadmap_title: str
    overview: str
    milestones: List[Milestone]


class LearningPathResponse(BaseModel):
    type: str = "learning_path"
    content: LearningPathContent


# ---------- Gemini structured-output schemas ----------
class GeminiPathwayPhase(BaseModel):
    phase_name: str = Field(description="The phase level, e.g., 'Beginner Phase'")
    estimated_duration: str = Field(description="Estimated study duration, e.g., '1 week'")
    key_topics: List[str] = Field(description="List of 3-5 core topics or syntax points to learn")
    practice_projects: List[str] = Field(description="List of 1-2 small projects or practical exercises to build")
    recommended_resources: List[str] = Field(description="List of 2-3 specific learning resources or documentation")


class GeminiLearningPath(BaseModel):
    roadmap_title: str = Field(description="Clean roadmap title, e.g., 'React.js Mastery Pathway'")
    overview: str = Field(description="Brief high-level description of what the student will learn")
    beginner: GeminiPathwayPhase = Field(description="The beginner phase details")
    intermediate: GeminiPathwayPhase = Field(description="The intermediate phase details")
    advanced: GeminiPathwayPhase = Field(description="The advanced phase details")


def generate_learning_path(request: LearningPathRequest, api_key: Optional[str] = None) -> LearningPathResponse:
    """
    Queries Gemini for a Beginner/Intermediate/Advanced roadmap, translates to the
    frontend milestone timeline format, and persists the full payload to JSON storage.
    """
    topic = request.input_text.strip()
    session_id = request.session_id or "anonymous"

    prompt = (
        f"You are an expert academic advisor. Create a personalized learning roadmap for: {topic}. "
        "Structure the pathway into exactly three progressive phases: Beginner, Intermediate, and Advanced. "
        "For each phase, provide an estimated learning duration, key topics to study, "
        "practice projects, and recommended resources."
    )

    gemini_data = generate_structured_json(prompt, response_schema=GeminiLearningPath, api_key=api_key)

    phases = [
        ("Beginner Level",      gemini_data.get("beginner",      {})),
        ("Intermediate Level",  gemini_data.get("intermediate",  {})),
        ("Advanced Level",      gemini_data.get("advanced",      {})),
    ]

    milestones: List[Milestone] = []
    milestones_raw = []

    for fallback_title, phase in phases:
        m = Milestone(
            title=phase.get("phase_name", fallback_title),
            duration=phase.get("estimated_duration", "Varies"),
            topics=phase.get("key_topics", []),
            practical_exercises=phase.get("practice_projects", []),
            recommended_resources=phase.get("recommended_resources", []),
        )
        milestones.append(m)
        milestones_raw.append(m.model_dump())

    roadmap_title = gemini_data.get("roadmap_title", f"Roadmap for {topic}")
    overview      = gemini_data.get("overview", "")

    # Persist to JSON storage
    user   = db.get_or_create_user(session_id)
    query  = db.save_query(user["id"], "learning_path", topic)
    db.save_response(query["id"], "learning_path", roadmap_title)
    db.save_learning_path(query["id"], roadmap_title, overview, milestones_raw)

    return LearningPathResponse(
        content=LearningPathContent(
            roadmap_title=roadmap_title,
            overview=overview,
            milestones=milestones,
        )
    )
