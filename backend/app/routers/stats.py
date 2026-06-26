"""
routers/stats.py
----------------
Public, aggregate usage stats for the founder — just counts, no personal data.

  GET /stats -> totals for users, analyses, interviews, notes, snippets,
                reviews (+ average rating), and problems solved.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..config import settings
from ..database import get_db
from ..models import (
    Analysis,
    CodeSnippet,
    InterviewSession,
    Note,
    ProblemProgress,
    Review,
    User,
)

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
def stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Founder-only: must be logged in AND match the configured founder email.
    if current_user.email.lower() != settings.FOUNDER_EMAIL.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="These stats are private to the founder.",
        )
    avg_rating = db.query(func.avg(Review.rating)).scalar()
    return {
        "users": db.query(User).count(),
        "analyses": db.query(Analysis).count(),
        "interviews": db.query(InterviewSession).count(),
        "notes": db.query(Note).count(),
        "code_snippets": db.query(CodeSnippet).count(),
        "problems_solved": db.query(ProblemProgress).count(),
        "reviews": db.query(Review).count(),
        "avg_rating": round(float(avg_rating), 2) if avg_rating else 0.0,
    }
