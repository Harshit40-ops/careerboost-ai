"""
converters.py
-------------
File conversion helpers used by the /convert endpoints.

  pdf_to_docx : uses the `pdf2docx` library (keeps layout/tables reasonably).
  docx_to_pdf : reads the DOCX with python-docx and renders a clean text PDF
                with reportlab. This is pure-Python so it works everywhere
                (no MS Word / LibreOffice needed); complex formatting is
                simplified to readable paragraphs.

Both take raw bytes in and return raw bytes out, using temp files where a
library needs real paths.
"""

import io
import os
import tempfile

from docx import Document
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


class ConversionError(Exception):
    """Raised when a file cannot be converted."""


def pdf_to_docx(data: bytes) -> bytes:
    """Convert PDF bytes -> DOCX bytes."""
    from pdf2docx import Converter

    # pdf2docx works with file paths, so we stage temp files.
    tmpdir = tempfile.mkdtemp(prefix="cb_conv_")
    pdf_path = os.path.join(tmpdir, "in.pdf")
    docx_path = os.path.join(tmpdir, "out.docx")
    try:
        with open(pdf_path, "wb") as f:
            f.write(data)

        cv = Converter(pdf_path)
        try:
            cv.convert(docx_path)  # convert all pages
        finally:
            cv.close()

        with open(docx_path, "rb") as f:
            return f.read()
    except Exception as exc:
        raise ConversionError(f"PDF→DOCX failed: {exc}") from exc
    finally:
        # Best-effort cleanup.
        for p in (pdf_path, docx_path):
            try:
                os.remove(p)
            except OSError:
                pass
        try:
            os.rmdir(tmpdir)
        except OSError:
            pass


def docx_to_pdf(data: bytes) -> bytes:
    """Convert DOCX bytes -> PDF bytes (clean text layout via reportlab)."""
    try:
        document = Document(io.BytesIO(data))
    except Exception as exc:
        raise ConversionError(f"Could not read DOCX: {exc}") from exc

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )
    styles = getSampleStyleSheet()
    body = styles["BodyText"]
    heading = styles["Heading2"]

    flowables = []
    for para in document.paragraphs:
        text = (para.text or "").strip()
        if not text:
            flowables.append(Spacer(1, 6))
            continue
        # Treat Word "Heading"/"Title" styles as PDF headings.
        style_name = (para.style.name or "").lower() if para.style else ""
        is_heading = "head" in style_name or "title" in style_name
        # Escape XML-special chars so reportlab's mini-markup doesn't choke.
        safe = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        flowables.append(Paragraph(safe, heading if is_heading else body))
        flowables.append(Spacer(1, 4))

    if not flowables:
        raise ConversionError("The DOCX appears to be empty.")

    try:
        doc.build(flowables)
    except Exception as exc:
        raise ConversionError(f"DOCX→PDF failed: {exc}") from exc

    return buffer.getvalue()
