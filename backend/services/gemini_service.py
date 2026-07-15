"""
gemini_service.py
-----------------
Centralised Google Gemini service for EduGenie.

Uses the current `google-genai` SDK (google.genai).

Features:
  - Model: gemini-2.5-flash
  - Auto-retry: up to 3 attempts on HTTP 503 UNAVAILABLE, with 2-second back-off
  - Structured logging for all API failures
  - Two reusable public functions used by all 5 modules:
      generate_text_content()    -> plain markdown / prose responses
      generate_structured_json() -> structured JSON via response_schema
"""

import os
import json
import time
import logging
from typing import Optional

from fastapi import HTTPException
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# --------------------------------------------------------------------------- #
#  Logging setup                                                                #
# --------------------------------------------------------------------------- #

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("edugenie.gemini")

# --------------------------------------------------------------------------- #
#  Configuration                                                                #
# --------------------------------------------------------------------------- #

_MODEL        = "gemini-3.5-flash"   # gemini-2.5-flash is unavailable on free-tier keys
_MAX_RETRIES  = 3
_RETRY_DELAY  = 2   # seconds between retry attempts
_BUSY_MESSAGE = "The AI service is currently busy. Please try again in a few moments."


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


def _is_503(exc: Exception) -> bool:
    """
    Returns True if the exception represents an HTTP 503 Service Unavailable
    error from the Gemini API.
    """
    msg = str(exc).upper()
    return "503" in msg or "UNAVAILABLE" in msg


def _call_with_retry(fn, *args, **kwargs):
    """
    Executes `fn(*args, **kwargs)` with automatic retry on 503 errors.

    - Retries up to _MAX_RETRIES times.
    - Waits _RETRY_DELAY seconds between each attempt.
    - Raises HTTPException(503) with a user-friendly message after all retries.
    - Re-raises all non-503 exceptions immediately without retrying.
    """
    last_exc: Optional[Exception] = None

    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            return fn(*args, **kwargs)

        except HTTPException:
            # FastAPI exceptions (e.g. missing API key) — do not retry
            raise

        except Exception as exc:
            if _is_503(exc):
                last_exc = exc
                logger.warning(
                    "Gemini API returned 503 UNAVAILABLE "
                    "(attempt %d/%d). Retrying in %ds... | error: %s",
                    attempt, _MAX_RETRIES, _RETRY_DELAY, exc,
                )
                if attempt < _MAX_RETRIES:
                    time.sleep(_RETRY_DELAY)
            else:
                # Non-503 error — log and raise immediately
                logger.error(
                    "Gemini API error (non-retryable) on attempt %d/%d: %s",
                    attempt, _MAX_RETRIES, exc,
                )
                raise HTTPException(
                    status_code=500,
                    detail=f"Google Gemini API error: {exc}",
                )

    # All retries exhausted
    logger.error(
        "Gemini API returned 503 UNAVAILABLE after %d attempts. Last error: %s",
        _MAX_RETRIES, last_exc,
    )
    raise HTTPException(
        status_code=503,
        detail=_BUSY_MESSAGE,
    )


# --------------------------------------------------------------------------- #
#  Public API                                                                   #
# --------------------------------------------------------------------------- #

def generate_text_content(prompt: str, api_key: Optional[str] = None) -> str:
    """
    Sends a plain-text prompt to Gemini and returns a markdown string.
    Used by: Q&A, Explanation, Summarization modules.

    Automatically retries up to 3 times on 503 errors.
    """
    client = _build_client(api_key)
    logger.info("Calling Gemini [%s] for text generation.", _MODEL)

    def _call():
        response = client.models.generate_content(
            model=_MODEL,
            contents=prompt,
        )
        text = response.text
        if not text:
            raise ValueError("Gemini returned an empty response.")
        return text

    result = _call_with_retry(_call)
    logger.info("Gemini text generation succeeded (%d chars).", len(result))
    return result


def generate_structured_json(
    prompt: str,
    response_schema,
    api_key: Optional[str] = None,
) -> dict:
    """
    Sends a prompt to Gemini and requests a JSON response conforming to
    `response_schema` (a Pydantic model class).
    Used by: Quiz Generation, Learning Path modules.

    Automatically retries up to 3 times on 503 errors.
    """
    client = _build_client(api_key)
    logger.info("Calling Gemini [%s] for structured JSON generation.", _MODEL)

    def _call():
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

    result = _call_with_retry(_call)
    logger.info(
        "Gemini structured JSON generation succeeded (%d top-level keys).",
        len(result) if isinstance(result, dict) else 0,
    )
    return result
