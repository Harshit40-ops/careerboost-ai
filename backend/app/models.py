"""
models.py
---------
SQLAlchemy ORM models = the database tables.

Tables:
  users               -> registered accounts
  analyses            -> one row per resume analysis
  interview_sessions  -> one row per generated question set
"""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


def _utcnow() -> datetime:
    """Timezone-aware UTC timestamp (avoids the deprecated utcnow())."""
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    # Convenience back-references so we can do user.analyses, etc.
    analyses = relationship(
        "Analysis", back_populates="user", cascade="all, delete-orphan"
    )
    interview_sessions = relationship(
        "InterviewSession", back_populates="user", cascade="all, delete-orphan"
    )
    notes = relationship(
        "Note", back_populates="user", cascade="all, delete-orphan"
    )
    snippets = relationship(
        "CodeSnippet", back_populates="user", cascade="all, delete-orphan"
    )
    progress = relationship(
        "ProblemProgress", back_populates="user", cascade="all, delete-orphan"
    )
    review = relationship(
        "Review", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_title = Column(String, nullable=False)
    overall_score = Column(Float, nullable=False)
    # The full report (sub-scores, keywords, suggestions) stored as JSON text.
    report_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="analyses")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String, nullable=False)
    questions_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="interview_sessions")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    topic = Column(String, nullable=False)
    # Full structured notes (summary, sections, key terms, questions) as JSON.
    notes_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="notes")


class CodeSnippet(Base):
    __tablename__ = "code_snippets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    language = Column(String, nullable=False)
    code = Column(Text, nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="snippets")


class ProblemProgress(Base):
    """One row per (user, problem) the user has solved in the Practice Arena."""
    __tablename__ = "problem_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    slug = Column(String, nullable=False, index=True)
    solved_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="progress")


class Review(Base):
    """A user's star rating (1-5) and optional written review of the platform.
    One review per user (updated in place)."""
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1..5
    comment = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    user = relationship("User", back_populates="review")
