"""
config.py
---------
Central place for all application settings.

We use `pydantic-settings` which automatically reads values from:
  1. environment variables, and
  2. a local `.env` file (see .env.example).

Reading config in ONE place means the rest of the code never has to touch
`os.environ` directly — it just imports `settings`.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Auth / JWT ---
    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # --- Database ---
    # SQLite file lives next to the backend folder. "check_same_thread"
    # is handled in database.py.
    DATABASE_URL: str = "sqlite:///./careerboost.db"

    # --- LLM provider ---
    LLM_PROVIDER: str = "mock"  # "anthropic" | "openai" | "mock"
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-opus-4-8"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    # Lets you point the OpenAI-compatible client at a different provider
    # (Groq, OpenRouter, Together, Google Gemini's OpenAI endpoint, etc.).
    # Leave blank to use the real OpenAI API.
    OPENAI_BASE_URL: str = ""

    # --- Embeddings ---
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # --- Uploads ---
    MAX_UPLOAD_MB: int = 5
    MIN_RESUME_CHARS: int = 200  # below this we treat parsing as failed

    # --- Scoring weights (LLM vs embeddings) ---
    LLM_WEIGHT: float = 0.7
    EMBEDDING_WEIGHT: float = 0.3

    # --- Founder/admin ---
    # Only this account (when logged in) can view the /stats founder dashboard.
    FOUNDER_EMAIL: str = "saytoharshitsharma@gmail.com"

    # --- CORS ---
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> List[str]:
        """Turn the comma-separated CORS string into a clean list."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached so we only build the Settings object once."""
    return Settings()


# Importable singleton used across the app.
settings = get_settings()
