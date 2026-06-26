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

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

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
    stats,
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

# CORS: allow the local dev server, plus any Vercel / Cloudflare-tunnel origin
# (so the deployed frontend can call this API). We authenticate with Bearer
# tokens (not cookies), so allow_credentials can be False — which lets the
# regex/origins work cleanly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https://.*\.(vercel\.app|trycloudflare\.com)",
    allow_credentials=False,
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
app.include_router(stats.router)
app.include_router(dashboard.router)


@app.get("/healthz", tags=["health"])
def health():
    """Simple health check for the API."""
    return {
        "status": "ok",
        "app": "CareerBoost AI",
        "embedding_backend": embeddings.get_backend(),
        "llm_provider": settings.LLM_PROVIDER,
    }


# ── Serve the built frontend (single-origin) if it exists ──
# After `npm run build`, frontend/dist holds the static site. We serve its
# assets and fall back to index.html for client-side routes, so the whole app
# (UI + API) runs from ONE origin/link. In local dev you instead run Vite
# separately on :5173 and this block is simply skipped if dist is absent.
_DIST = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.isdir(_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(_DIST, "assets")), name="assets")
    _INDEX = os.path.join(_DIST, "index.html")

    @app.get("/", include_in_schema=False)
    def _serve_index():
        return FileResponse(_INDEX)

    # Catch-all for client-side routes (/practice, /reviews, …). Registered last
    # so it never shadows the API routers above.
    @app.get("/{full_path:path}", include_in_schema=False)
    def _spa_fallback(full_path: str):
        candidate = os.path.join(_DIST, full_path)
        if os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(_INDEX)
else:
    @app.get("/", tags=["health"])
    def root():
        return {"status": "ok", "app": "CareerBoost AI", "docs": "/docs"}
