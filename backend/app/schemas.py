"""
schemas.py
----------
Pydantic models = the shape of data going IN and OUT of the API.

These are separate from the SQLAlchemy models (models.py). SQLAlchemy models
talk to the database; Pydantic schemas validate requests and serialize
responses. Keeping them separate is a common, clean pattern.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ─────────────────────────── Auth ───────────────────────────
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    # Lets Pydantic read attributes off the ORM object directly.
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ───────────────────────── Resume ───────────────────────────
class AnalysisReport(BaseModel):
    """The full 3-layer scoring result returned to the frontend."""
    overall_score: float
    skills_match: float
    experience_relevance: float
    keyword_coverage: float
    format_readability: float
    semantic_match_score: float        # Layer 2 (embeddings)
    llm_overall_score: float           # Layer 3 (LLM)
    missing_keywords: List[str]
    strengths: List[str]
    suggestions: List[str]
    job_title: str
    analysis_id: Optional[int] = None


# ──────────────────────── Interview ─────────────────────────
class InterviewRequest(BaseModel):
    role: str = Field(..., min_length=1, max_length=160)
    resume_text: Optional[str] = None
    num_questions: int = Field(default=8, ge=3, le=20)


class InterviewQuestion(BaseModel):
    question: str
    looking_for: Optional[str] = None


class InterviewResponse(BaseModel):
    role: str
    technical: List[InterviewQuestion]
    behavioral: List[InterviewQuestion]
    hr: List[InterviewQuestion]
    session_id: Optional[int] = None


# ─────────────────────── Cover letter ───────────────────────
class CoverLetterRequest(BaseModel):
    role: str = Field(..., min_length=1, max_length=160)
    job_description: str = Field(..., min_length=20)
    resume_text: Optional[str] = None
    tone: str = Field(default="professional", max_length=40)


class CoverLetterResponse(BaseModel):
    cover_letter: str


# ─────────────────── Mock (chat) interview ──────────────────
class MockMessage(BaseModel):
    role: str  # "interviewer" or "candidate"
    content: str


class MockInterviewRequest(BaseModel):
    role: str = Field(..., min_length=1, max_length=160)
    messages: List[MockMessage] = Field(default_factory=list)


class MockInterviewResponse(BaseModel):
    reply: str


# ───────────────────────── Notes ────────────────────────────
class NotesRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200)
    source_text: Optional[str] = None
    detail: str = Field(default="balanced", max_length=20)  # concise|balanced|detailed


class NoteSection(BaseModel):
    heading: str
    points: List[str]


class NoteTerm(BaseModel):
    term: str
    definition: str = ""


class NotesContent(BaseModel):
    title: str
    summary: str = ""
    sections: List[NoteSection] = Field(default_factory=list)
    key_terms: List[NoteTerm] = Field(default_factory=list)
    questions: List[str] = Field(default_factory=list)


class NoteOut(NotesContent):
    id: Optional[int] = None
    topic: str
    created_at: Optional[datetime] = None


class NoteListItem(BaseModel):
    id: int
    topic: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ────────────────────── Code Lab ────────────────────────────
class CodeRequest(BaseModel):
    prompt: str = Field(..., min_length=2, max_length=4000)
    language: str = Field(default="python", max_length=30)
    mode: str = Field(default="generate", max_length=30)
    code: Optional[str] = None  # existing code (for explain / debug)


class CodeResponse(BaseModel):
    language: str
    code: str
    explanation: str


class SnippetCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=160)
    language: str = Field(..., max_length=30)
    code: str


class SnippetOut(BaseModel):
    id: int
    title: str
    language: str
    code: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SnippetListItem(BaseModel):
    id: int
    title: str
    language: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ───────────────────────── Reviews ──────────────────────────
class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(default="", max_length=1000)


class ReviewOut(BaseModel):
    id: int
    name: str
    rating: int
    comment: str
    created_at: datetime


class ReviewSummary(BaseModel):
    average: float
    count: int
    distribution: dict  # {"5": n, "4": n, ...}


# ──────────────────────── Dashboard ─────────────────────────
class AnalysisHistoryItem(BaseModel):
    id: int
    job_title: str
    overall_score: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
