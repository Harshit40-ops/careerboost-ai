"""
routers/code.py
---------------
AI Code Lab:

  POST   /code/assist           -> generate / solve / build / explain / debug code
  POST   /code/snippets         -> save a code snippet
  GET    /code/snippets         -> list the user's saved snippets
  GET    /code/snippets/{id}    -> full snippet
  DELETE /code/snippets/{id}    -> delete a snippet
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import CodeSnippet, User
from ..schemas import (
    CodeRequest,
    CodeResponse,
    SnippetCreate,
    SnippetListItem,
    SnippetOut,
)
from ..services import llm

router = APIRouter(prefix="/code", tags=["code"])


@router.post("/assist", response_model=CodeResponse)
def assist(
    payload: CodeRequest,
    current_user: User = Depends(get_current_user),
):
    result = llm.generate_code(
        prompt=payload.prompt,
        language=payload.language,
        mode=payload.mode,
        existing_code=payload.code,
    )
    return CodeResponse(**result)


@router.post("/snippets", response_model=SnippetOut, status_code=status.HTTP_201_CREATED)
def save_snippet(
    payload: SnippetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = CodeSnippet(
        user_id=current_user.id,
        title=payload.title,
        language=payload.language,
        code=payload.code,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/snippets", response_model=list[SnippetListItem])
def list_snippets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(CodeSnippet)
        .filter(CodeSnippet.user_id == current_user.id)
        .order_by(CodeSnippet.created_at.desc())
        .all()
    )


@router.get("/snippets/{snippet_id}", response_model=SnippetOut)
def snippet_detail(
    snippet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(CodeSnippet)
        .filter(CodeSnippet.id == snippet_id, CodeSnippet.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Snippet not found.")
    return record


@router.delete("/snippets/{snippet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_snippet(
    snippet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(CodeSnippet)
        .filter(CodeSnippet.id == snippet_id, CodeSnippet.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Snippet not found.")
    db.delete(record)
    db.commit()
    return None
