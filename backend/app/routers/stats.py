"""
routers/stats.py
----------------
Public, aggregate usage stats for the founder — just counts, no personal data.

  GET /stats -> totals for users, analyses, interviews, notes, snippets,
                reviews (+ average rating), and problems solved.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

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
def stats(db: Session = Depends(get_db)):
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
