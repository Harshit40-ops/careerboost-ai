"""
routers/resume.py
-----------------
POST /resume/analyze  -> the flagship 3-layer ATS scoring endpoint.

Flow:
  1. Validate the upload (type + size).
  2. Layer 1: parse + clean the resume text.
  3. Layers 2 & 3: scoring.analyze() blends embeddings + LLM rubric.
  4. Save the analysis to SQLite, linked to the current user.
  5. Return the full report.
"""

import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..config import settings
from ..database import get_db
from ..models import Analysis, User
from ..schemas import AnalysisReport
from ..services import scoring
from ..services.parsing import ParsingError, parse_resume

router = APIRouter(prefix="/resume", tags=["resume"])

MAX_BYTES = settings.MAX_UPLOAD_MB * 1024 * 1024


@router.post("/analyze", response_model=AnalysisReport)
async def analyze_resume(
    resume: UploadFile = File(..., description="Resume file (PDF or DOCX)"),
    job_description: str = Form(..., description="Target job description text"),
    job_title: str = Form("Untitled Role", description="Short role title"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --- Validate the JD ---
    if len(job_description.strip()) < 30:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please paste a fuller job description (at least a few lines).",
        )

    # --- Read + size-check the upload ---
    data = await resume.read()
    if len(data) == 0:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Uploaded file is empty.")
    if len(data) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size is {settings.MAX_UPLOAD_MB} MB.",
        )

    # --- Layer 1: parse + clean ---
    try:
        resume_text = parse_resume(data, resume.content_type or "", resume.filename or "")
    except ParsingError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc))

    # --- Layers 2 & 3: blended scoring ---
    report = scoring.analyze(resume_text, job_description, job_title)

    # --- Persist ---
    record = Analysis(
        user_id=current_user.id,
        job_title=job_title,
        overall_score=report["overall_score"],
        report_json=json.dumps(report),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    report["analysis_id"] = record.id
    return AnalysisReport(**report)
