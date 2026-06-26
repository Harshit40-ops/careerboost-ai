"""
routers/practice.py
--------------------
LeetCode-style Practice Arena.

  GET  /practice/topics             -> topics with problem counts
  GET  /practice/problems?topic=    -> list problems (+ which the user solved)
  GET  /practice/problems/{slug}    -> full problem (description, starter, tests)
  POST /practice/problems/{slug}/solved -> mark a problem solved for the user
  GET  /practice/progress           -> the user's solved slugs + count

Problems/tests are static seed data (practice_data.py). Judging happens in the
browser, so there is no server-side code execution.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import ProblemProgress, User
from ..practice_data import (
    PROBLEMS_BY_SLUG,
    list_problems,
    topics_with_counts,
)

router = APIRouter(prefix="/practice", tags=["practice"])


def _solved_slugs(db: Session, user_id: int) -> set:
    rows = db.query(ProblemProgress.slug).filter(ProblemProgress.user_id == user_id).all()
    return {r[0] for r in rows}


@router.get("/topics")
def topics():
    return topics_with_counts()


@router.get("/problems")
def problems(
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    solved = _solved_slugs(db, current_user.id)
    items = list_problems()
    if topic:
        items = [p for p in items if p["topic"].lower() == topic.lower()]
    if difficulty:
        items = [p for p in items if p["difficulty"].lower() == difficulty.lower()]
    for p in items:
        p["solved"] = p["slug"] in solved
    return items


@router.get("/problems/{slug}")
def problem_detail(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = PROBLEMS_BY_SLUG.get(slug)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Problem not found.")
    data = dict(p)
    data["solved"] = slug in _solved_slugs(db, current_user.id)
    return data


@router.post("/problems/{slug}/solved")
def mark_solved(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if slug not in PROBLEMS_BY_SLUG:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Problem not found.")
    # Only record once per user/problem.
    exists = (
        db.query(ProblemProgress)
        .filter(ProblemProgress.user_id == current_user.id, ProblemProgress.slug == slug)
        .first()
    )
    if not exists:
        db.add(ProblemProgress(user_id=current_user.id, slug=slug))
        db.commit()
    return {"slug": slug, "solved": True}


@router.get("/progress")
def progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    solved = sorted(_solved_slugs(db, current_user.id))
    return {"solved": solved, "count": len(solved), "total": len(PROBLEMS_BY_SLUG)}
