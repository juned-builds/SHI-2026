import json
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """Encapsulates interaction with the Google GenAI SDK (google-genai)."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, client: Optional[Any] = None):
        self._api_key = api_key if api_key is not None else settings.GEMINI_API_KEY
        self._model = model if model is not None else (settings.GEMINI_MODEL or "gemini-3.7-flash")
        self._client = client

    def _get_client(self) -> Any:
        """Lazily initialize the google-genai Client."""
        if self._client is not None:
            return self._client

        if not self._api_key or not self._api_key.strip():
            raise ValueError(
                "GEMINI_API_KEY is not configured on the FastAPI backend. "
                "Please set GEMINI_API_KEY in backend/.env to execute real GenAI transformations."
            )

        try:
            from google import genai
            self._client = genai.Client(api_key=self._api_key.strip())
            return self._client
        except Exception as e:
            logger.error(f"Failed to initialize google-genai Client: {str(e)}")
            raise RuntimeError(f"Failed to initialize Gemini AI client: {str(e)}")

    def generate_json_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        model_override: Optional[str] = None,
        temperature: float = 0.3,
    ) -> Dict[str, Any]:
        """Execute a structured JSON generation call to the Gemini API."""
        client = self._get_client()
        target_model = model_override or self._model

        try:
            from google.genai import types

            config = types.GenerateContentConfig(
                temperature=temperature,
                response_mime_type="application/json",
            )
            if system_instruction:
                config.system_instruction = system_instruction

            logger.info(f"Calling Gemini API with model: {target_model}")
            response = client.models.generate_content(
                model=target_model,
                contents=prompt,
                config=config,
            )

            if not response or not response.text:
                raise ValueError("Gemini API returned an empty response.")

            raw_text = response.text.strip()
            
            # Clean possible markdown wrapping if returned despite json mime type
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            raw_text = raw_text.strip()

            parsed_json = json.loads(raw_text)
            return parsed_json

        except json.JSONDecodeError as jde:
            logger.error(f"Failed to parse Gemini output as JSON: {str(jde)}")
            raise ValueError(f"Gemini returned invalid JSON structure: {str(jde)}")
        except Exception as e:
            err_msg = str(e)
            logger.error(f"Gemini API error during generation: {err_msg}")
            # Ensure no secret keys or internal trace is leaked
            if "API key not valid" in err_msg or "INVALID_ARGUMENT" in err_msg:
                raise ValueError("Invalid Gemini API Key provided. Please check GEMINI_API_KEY in backend/.env.")
            if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg:
                raise RuntimeError("Gemini API quota or rate limit exceeded. Please try again later.")
            raise RuntimeError(f"Gemini AI transformation error: {err_msg}")


# Singleton instance
_gemini_service_instance: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Returns the singleton instance of GeminiService."""
    global _gemini_service_instance
    if _gemini_service_instance is None:
        _gemini_service_instance = GeminiService()
    return _gemini_service_instance


def set_gemini_service(service: GeminiService) -> None:
    """Set or override the GeminiService instance (used for unit testing with mocks)."""
    global _gemini_service_instance
    _gemini_service_instance = service
