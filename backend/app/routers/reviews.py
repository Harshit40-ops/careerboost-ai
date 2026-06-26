"""
routers/reviews.py
------------------
Star ratings + written reviews of the platform.

  GET  /reviews          -> all reviews (public), newest first
  GET  /reviews/summary  -> average rating, count, and star distribution (public)
  GET  /reviews/me       -> the current user's own review (auth)
  POST /reviews          -> create or update the current user's review (auth)
  DELETE /reviews/me     -> remove the current user's review (auth)

Each user has at most one review (posting again updates it).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Review, User
from ..schemas import ReviewCreate, ReviewOut, ReviewSummary

router = APIRouter(prefix="/reviews", tags=["reviews"])


def _to_out(r: Review) -> ReviewOut:
    return ReviewOut(
        id=r.id,
        name=r.user.name if r.user else "Anonymous",
        rating=r.rating,
        comment=r.comment,
        created_at=r.created_at,
    )


@router.get("", response_model=list[ReviewOut])
def list_reviews(db: Session = Depends(get_db)):
    rows = db.query(Review).order_by(Review.created_at.desc()).all()
    return [_to_out(r) for r in rows]


@router.get("/summary", response_model=ReviewSummary)
def summary(db: Session = Depends(get_db)):
    rows = db.query(Review).all()
    count = len(rows)
    dist = {str(i): 0 for i in range(1, 6)}
    total = 0
    for r in rows:
        dist[str(r.rating)] += 1
        total += r.rating
    average = round(total / count, 2) if count else 0.0
    return ReviewSummary(average=average, count=count, distribution=dist)


@router.get("/me", response_model=ReviewOut | None)
def my_review(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = db.query(Review).filter(Review.user_id == current_user.id).first()
    return _to_out(r) if r else None


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def upsert_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = db.query(Review).filter(Review.user_id == current_user.id).first()
    if r:
        r.rating = payload.rating
        r.comment = payload.comment
    else:
        r = Review(user_id=current_user.id, rating=payload.rating, comment=payload.comment)
        db.add(r)
    db.commit()
    db.refresh(r)
    return _to_out(r)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_review(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = db.query(Review).filter(Review.user_id == current_user.id).first()
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No review to delete.")
    db.delete(r)
    db.commit()
    return None
