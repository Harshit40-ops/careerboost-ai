"""
routers/dashboard.py
--------------------
GET /me/analyses          -> list the user's past analyses (for history/trend)
GET /me/analyses/{id}     -> full stored report for one analysis
GET /me                   -> current user's profile
"""

import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Analysis, User
from ..schemas import AnalysisHistoryItem, UserOut

router = APIRouter(prefix="/me", tags=["dashboard"])


@router.get("", response_model=UserOut)
def my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/analyses", response_model=list[AnalysisHistoryItem])
def my_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Oldest -> newest so the frontend can draw a left-to-right trend line.
    return (
        db.query(Analysis)
        .filter(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.asc())
        .all()
    )


@router.get("/analyses/{analysis_id}")
def analysis_detail(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Analysis not found.")

    report = json.loads(record.report_json)
    report["analysis_id"] = record.id
    report["created_at"] = record.created_at.isoformat()
    return report


@router.delete("/analyses/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Let a user remove a single analysis from their own history."""
    record = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Analysis not found.")
    db.delete(record)
    db.commit()
    return None
