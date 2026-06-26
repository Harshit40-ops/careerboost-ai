"""
scoring.py  —  Orchestrates the 3-layer pipeline
-------------------------------------------------
This ties the layers together into the final report:

  Layer 1 (parsing)     -> already done by the router (we receive clean text)
  Layer 2 (embeddings)  -> semantic_match_score(resume, jd)        [0–100]
  Layer 3 (LLM rubric)  -> score_resume(resume, jd)                [dict]

Final score = weighted average of the LLM overall_score and the embedding
semantic score (defaults: 70% LLM + 30% embeddings). Blending the two gives a
more STABLE and accurate number than either layer alone.
"""

from typing import Any, Dict

from ..config import settings
from . import embeddings, llm


def analyze(resume_text: str, jd_text: str, job_title: str) -> Dict[str, Any]:
    """
    Run Layers 2 & 3 and combine them into the final report dict.
    (Layer 1 / parsing happens before this is called.)
    """
    # Layer 2 — semantic similarity from embeddings.
    semantic = embeddings.semantic_match_score(resume_text, jd_text)

    # Layer 3 — LLM rubric scoring.
    rubric = llm.score_resume(resume_text, jd_text)
    llm_overall = rubric["overall_score"]

    # Final blended score: weighted average of LLM + embeddings.
    final = (
        settings.LLM_WEIGHT * llm_overall
        + settings.EMBEDDING_WEIGHT * semantic
    )

    return {
        "overall_score": round(final, 1),
        "skills_match": rubric["skills_match"],
        "experience_relevance": rubric["experience_relevance"],
        "keyword_coverage": rubric["keyword_coverage"],
        "format_readability": rubric["format_readability"],
        "semantic_match_score": semantic,
        "llm_overall_score": llm_overall,
        "missing_keywords": rubric["missing_keywords"],
        "strengths": rubric["strengths"],
        "suggestions": rubric["suggestions"],
        "job_title": job_title,
    }
