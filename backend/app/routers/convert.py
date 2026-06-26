"""
routers/convert.py
------------------
File converter endpoints (no login required — handy utilities):

  POST /convert/pdf-to-docx -> upload a PDF, download a DOCX
  POST /convert/docx-to-pdf -> upload a DOCX, download a PDF

Both validate type + size and stream the converted file back as a download.
"""

import io

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse

from ..config import settings
from ..services.converters import ConversionError, docx_to_pdf, pdf_to_docx

router = APIRouter(prefix="/convert", tags=["convert"])

MAX_BYTES = settings.MAX_UPLOAD_MB * 1024 * 1024

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
PDF_MIME = "application/pdf"


async def _read_validated(file: UploadFile, expect_ext: str) -> bytes:
    data = await file.read()
    if not data:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Uploaded file is empty.")
    if len(data) > MAX_BYTES:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File too large. Max {settings.MAX_UPLOAD_MB} MB.",
        )
    if not (file.filename or "").lower().endswith(expect_ext):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Please upload a {expect_ext.upper()} file.",
        )
    return data


def _download_name(filename: str, new_ext: str) -> str:
    base = (filename or "converted").rsplit(".", 1)[0]
    return f"{base}.{new_ext}"


@router.post("/pdf-to-docx")
async def convert_pdf_to_docx(file: UploadFile = File(...)):
    data = await _read_validated(file, ".pdf")
    try:
        out = pdf_to_docx(data)
    except ConversionError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc))

    name = _download_name(file.filename, "docx")
    return StreamingResponse(
        io.BytesIO(out),
        media_type=DOCX_MIME,
        headers={"Content-Disposition": f'attachment; filename="{name}"'},
    )


@router.post("/docx-to-pdf")
async def convert_docx_to_pdf(file: UploadFile = File(...)):
    data = await _read_validated(file, ".docx")
    try:
        out = docx_to_pdf(data)
    except ConversionError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc))

    name = _download_name(file.filename, "pdf")
    return StreamingResponse(
        io.BytesIO(out),
        media_type=PDF_MIME,
        headers={"Content-Disposition": f'attachment; filename="{name}"'},
    )
