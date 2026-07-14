"""
database_service.py
-------------------
Centralised JSON file-based storage service for EduGenie.

ER relationships maintained:
  users       { id, session_id, created_at }
  queries     { id, user_id, task_type, input_text, created_at }
  responses   { id, query_id, type, content_preview, created_at }
  quiz        { id, query_id, questions: [...] }
  summary     { id, query_id, content }
  learning_path { id, query_id, roadmap_title, overview, milestones: [...] }
"""

import os
import json
import uuid
from datetime import datetime, timezone
from typing import Any

# Resolve absolute paths relative to this file (backend/services/)
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DB_DIR = os.path.join(_BACKEND_DIR, "database")


# --------------------------------------------------------------------------- #
#  Low-level helpers                                                            #
# --------------------------------------------------------------------------- #

def _db_path(filename: str) -> str:
    return os.path.join(_DB_DIR, filename)


def _read(filename: str) -> list:
    path = _db_path(filename)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except (json.JSONDecodeError, ValueError):
            return []


def _write(filename: str, data: list) -> None:
    path = _db_path(filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    return str(uuid.uuid4())


# --------------------------------------------------------------------------- #
#  Public API                                                                   #
# --------------------------------------------------------------------------- #

def get_or_create_user(session_id: str) -> dict:
    """
    Return existing user by session_id, or create and persist a new one.
    """
    users = _read("users.json")
    for u in users:
        if u.get("session_id") == session_id:
            return u
    user = {"id": _new_id(), "session_id": session_id, "created_at": _now()}
    users.append(user)
    _write("users.json", users)
    return user


def save_query(user_id: str, task_type: str, input_text: str) -> dict:
    """
    Persist a user query record and return it.
    """
    queries = _read("queries.json")
    query = {
        "id": _new_id(),
        "user_id": user_id,
        "task_type": task_type,
        "input_text": input_text,
        "created_at": _now(),
    }
    queries.append(query)
    _write("queries.json", queries)
    return query


def save_response(query_id: str, response_type: str, content: Any) -> dict:
    """
    Persist a generic AI response (preview) linked to a query.
    """
    responses = _read("responses.json")
    # Store a short preview so the file stays readable
    if isinstance(content, str):
        preview = content[:300]
    else:
        preview = str(content)[:300]

    record = {
        "id": _new_id(),
        "query_id": query_id,
        "type": response_type,
        "content_preview": preview,
        "created_at": _now(),
    }
    responses.append(record)
    _write("responses.json", responses)
    return record


def save_quiz(query_id: str, questions: list) -> dict:
    """
    Persist a full quiz payload linked to a query.
    """
    quizzes = _read("quiz.json")
    record = {
        "id": _new_id(),
        "query_id": query_id,
        "questions": questions,
        "created_at": _now(),
    }
    quizzes.append(record)
    _write("quiz.json", quizzes)
    return record


def save_summary(query_id: str, content: str) -> dict:
    """
    Persist a full summary payload linked to a query.
    """
    summaries = _read("summary.json")
    record = {
        "id": _new_id(),
        "query_id": query_id,
        "content": content,
        "created_at": _now(),
    }
    summaries.append(record)
    _write("summary.json", summaries)
    return record


def save_learning_path(query_id: str, roadmap_title: str, overview: str, milestones: list) -> dict:
    """
    Persist a full learning path payload linked to a query.
    """
    paths = _read("learning_path.json")
    record = {
        "id": _new_id(),
        "query_id": query_id,
        "roadmap_title": roadmap_title,
        "overview": overview,
        "milestones": milestones,
        "created_at": _now(),
    }
    paths.append(record)
    _write("learning_path.json", paths)
    return record
