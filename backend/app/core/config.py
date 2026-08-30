import os
import json
from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Core application settings and configuration."""
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "content-transformation-api"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # CORS origins for local frontend communication
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Gemini GenAI Settings (Server-side only)
    GEMINI_API_KEY: Optional[str] = os.environ.get("GEMINI_API_KEY")
    GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")
    MAX_SOURCE_LENGTH: int = 150000

    @property
    def cors_origins_list(self) -> List[str]:
        """Returns parsed list of allowed CORS origins."""
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        if isinstance(self.CORS_ORIGINS, str):
            val = self.CORS_ORIGINS.strip()
            if val.startswith("[") and val.endswith("]"):
                try:
                    parsed = json.loads(val)
                    if isinstance(parsed, list):
                        return [str(x) for x in parsed]
                except Exception:
                    pass
            return [x.strip() for x in val.split(",") if x.strip()]
        return ["http://localhost:3000", "http://127.0.0.1:3000"]


settings = Settings()
