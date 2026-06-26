"""
routers/notes.py
----------------
AI Study Notes generator + storage (so notes persist in the student's history).

  POST   /notes/generate  -> generate structured notes from a topic (or pasted
                             material) and SAVE them for the user
  GET    /notes           -> list the user's saved notes
  GET    /notes/{id}      -> full content of one saved note
  DELETE /notes/{id}      -> remove a saved note
"""

import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Note, User
from ..schemas import NoteListItem, NoteOut, NotesRequest
from ..services import llm

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("/generate", response_model=NoteOut)
def generate(
    payload: NotesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = llm.generate_notes(
        topic=payload.topic,
        source_text=payload.source_text,
        detail=payload.detail,
    )

    record = Note(
        user_id=current_user.id,
        topic=payload.topic,
        notes_json=json.dumps(content),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return NoteOut(
        id=record.id,
        topic=record.topic,
        created_at=record.created_at,
        **content,
    )


@router.get("", response_model=list[NoteListItem])
def list_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Note)
        .filter(Note.user_id == current_user.id)
        .order_by(Note.created_at.desc())
        .all()
    )


@router.get("/{note_id}", response_model=NoteOut)
def note_detail(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Note not found.")
    content = json.loads(record.notes_json)
    return NoteOut(
        id=record.id, topic=record.topic, created_at=record.created_at, **content
    )


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Note not found.")
    db.delete(record)
    db.commit()
    return None
