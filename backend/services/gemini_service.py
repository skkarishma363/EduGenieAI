"""
gemini_service.py
-----------------
Centralised Google Gemini service for EduGenie.

Uses the current `google-genai` SDK (google.genai).
Provides two reusable functions:
  - generate_text_content()   → plain markdown / prose responses
  - generate_structured_json() → structured JSON via response_schema
"""

import os
import json
from typing import Optional

from fastapi import HTTPException
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# --------------------------------------------------------------------------- #
#  Model identifier                                                             #
# --------------------------------------------------------------------------- #
_MODEL = "gemini-3.5-flash"


# --------------------------------------------------------------------------- #
#  Internal helpers                                                             #
# --------------------------------------------------------------------------- #

def _build_client(api_key: Optional[str] = None) -> genai.Client:
    """
    Creates and returns a configured Gemini client.
    Priority: caller-supplied key → GEMINI_API_KEY env variable.
    """
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise HTTPException(
            status_code=400,
            detail=(
                "Gemini API Key not found. "
                "Set the GEMINI_API_KEY environment variable or provide it "
                "via the Settings (⚙) button in the UI."
            ),
        )
    return genai.Client(api_key=key)


# --------------------------------------------------------------------------- #
#  Public API                                                                   #
# --------------------------------------------------------------------------- #

def generate_text_content(prompt: str, api_key: Optional[str] = None) -> str:
    """
    Sends a plain-text prompt to Gemini and returns a markdown string.
    Used by: Q&A, Explanation, Summarization modules.
    """
    client = _build_client(api_key)
    try:
        response = client.models.generate_content(
            model=_MODEL,
            contents=prompt,
        )
        text = response.text
        if not text:
            raise ValueError("Gemini returned an empty response.")
        return text
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Google Gemini API error: {exc}",
        )


def generate_structured_json(
    prompt: str,
    response_schema,
    api_key: Optional[str] = None,
) -> dict:
    """
    Sends a prompt to Gemini and requests a JSON response conforming to
    `response_schema` (a Pydantic model class).
    Used by: Quiz Generation, Learning Path modules.
    """
    client = _build_client(api_key)
    try:
        response = client.models.generate_content(
            model=_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
            ),
        )
        text = response.text
        if not text:
            raise ValueError("Gemini returned an empty response.")
        return json.loads(text)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Google Gemini structured JSON error: {exc}",
        )
