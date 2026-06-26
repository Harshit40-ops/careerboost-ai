"""
main.py
-------
The FastAPI application entry point.

- Creates the database tables on startup.
- Loads the embedding model ONCE (warm_up) so requests are fast.
- Adds CORS so the React frontend can call the API.
- Mounts all routers.

Run with:  uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import (
    auth,
    code,
    convert,
    cover_letter,
    dashboard,
    interview,
    notes,
    practice,
    resume,
    reviews,
)
from .services import embeddings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ---- Startup ----
    # Create tables if they don't exist yet.
    Base.metadata.create_all(bind=engine)
    # Load the embedding model once (or fall back to TF-IDF).
    backend = embeddings.warm_up()
    print(f"[startup] Embedding backend: {backend}")
    print(f"[startup] LLM provider: {settings.LLM_PROVIDER}")
    yield
    # ---- Shutdown ---- (nothing to clean up for SQLite)


app = FastAPI(
    title="CareerBoost AI",
    description="ATS resume scoring + interview prep for Indian college students.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS: allow the React dev server (and configured origins) to call us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers.
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(interview.router)
app.include_router(cover_letter.router)
app.include_router(convert.router)
app.include_router(notes.router)
app.include_router(code.router)
app.include_router(practice.router)
app.include_router(reviews.router)
app.include_router(dashboard.router)


@app.get("/", tags=["health"])
def health():
    """Simple health check / landing for the API."""
    return {
        "status": "ok",
        "app": "CareerBoost AI",
        "embedding_backend": embeddings.get_backend(),
        "llm_provider": settings.LLM_PROVIDER,
    }
