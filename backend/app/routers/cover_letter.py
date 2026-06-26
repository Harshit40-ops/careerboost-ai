"""
routers/cover_letter.py
-----------------------
POST /cover-letter/generate -> AI-written cover letter from a job description
(and optionally the candidate's resume text). Uses the logged-in user's name
for the signature.
"""

from fastapi import APIRouter, Depends
from ..auth import get_current_user
from ..models import User
from ..schemas import CoverLetterRequest, CoverLetterResponse
from ..services import llm

router = APIRouter(prefix="/cover-letter", tags=["cover-letter"])


@router.post("/generate", response_model=CoverLetterResponse)
def generate(
    payload: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
):
    letter = llm.generate_cover_letter(
        name=current_user.name,
        role=payload.role,
        jd_text=payload.job_description,
        resume_text=payload.resume_text,
        tone=payload.tone,
    )
    return CoverLetterResponse(cover_letter=letter)
