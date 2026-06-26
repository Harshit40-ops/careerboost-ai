"""
embeddings.py  —  LAYER 2: Semantic Matching
--------------------------------------------
Measure how semantically similar the resume is to the job description (JD),
NOT just how many keywords overlap. This catches related skills even when the
exact words differ (e.g. JD "machine learning" vs resume "deep learning").

Primary engine:  sentence-transformers "all-MiniLM-L6-v2" (free, local).
Fallback engine: a lightweight TF-IDF cosine similarity implemented in pure
                 Python — used only if sentence-transformers / torch cannot be
                 imported (e.g. no wheel for a very new Python). This keeps the
                 app fully runnable everywhere.

IMPORTANT: the heavy model is loaded ONCE at startup via `warm_up()` and reused
for every request (loading per-request would be very slow).
"""

import math
import re
from collections import Counter
from typing import List, Optional

from ..config import settings

# We try to import sentence-transformers lazily. If it fails we silently use
# the TF-IDF fallback so the server still boots.
_model = None            # the loaded SentenceTransformer (or None)
_backend = "tfidf"       # "transformer" or "tfidf"


def warm_up() -> str:
    """
    Load the embedding model once. Call this on FastAPI startup.
    Returns the backend name actually in use ("transformer" or "tfidf").
    """
    global _model, _backend
    if _model is not None:
        return _backend
    try:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
        _backend = "transformer"
    except Exception as exc:  # torch missing, no wheel, offline, etc.
        print(f"[embeddings] Falling back to TF-IDF similarity ({exc})")
        _model = None
        _backend = "tfidf"
    return _backend


def get_backend() -> str:
    return _backend


# ───────────────────────── TF-IDF fallback ──────────────────────────
_TOKEN_RE = re.compile(r"[a-zA-Z][a-zA-Z+#.]{1,}")

# A few very common words that add noise to similarity.
_STOPWORDS = {
    "the", "and", "for", "with", "this", "that", "from", "are", "was", "you",
    "your", "our", "will", "have", "has", "had", "but", "not", "all", "can",
    "a", "an", "to", "of", "in", "on", "as", "at", "by", "is", "it", "or",
}


def _tokenize(text: str) -> List[str]:
    return [
        t.lower()
        for t in _TOKEN_RE.findall(text)
        if t.lower() not in _STOPWORDS
    ]


def _tfidf_cosine(a: str, b: str) -> float:
    """Cosine similarity of two texts using simple TF-IDF weighting."""
    tok_a, tok_b = _tokenize(a), _tokenize(b)
    if not tok_a or not tok_b:
        return 0.0

    tf_a, tf_b = Counter(tok_a), Counter(tok_b)
    vocab = set(tf_a) | set(tf_b)

    # IDF over our 2-document "corpus": words in both docs get less weight.
    def idf(term: str) -> float:
        df = (1 if term in tf_a else 0) + (1 if term in tf_b else 0)
        return math.log((2 + 1) / (df + 1)) + 1

    dot = norm_a = norm_b = 0.0
    for term in vocab:
        wa = tf_a.get(term, 0) * idf(term)
        wb = tf_b.get(term, 0) * idf(term)
        dot += wa * wb
        norm_a += wa * wa
        norm_b += wb * wb

    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (math.sqrt(norm_a) * math.sqrt(norm_b))


# ─────────────────────── Transformer cosine ────────────────────────
def _transformer_cosine(a: str, b: str) -> float:
    """Cosine similarity using sentence-transformer embeddings."""
    from sentence_transformers import util

    embeddings = _model.encode([a, b], convert_to_tensor=True, normalize_embeddings=True)
    sim = util.cos_sim(embeddings[0], embeddings[1]).item()
    return float(sim)


def semantic_match_score(resume_text: str, jd_text: str) -> float:
    """
    Return a 0–100 semantic similarity score between resume and JD.

    Cosine similarity is in [-1, 1] (in practice ~0–0.9 for text). We clamp to
    [0, 1] and scale to 0–100. We also apply a gentle curve so that a typical
    "good match" lands in an intuitive range rather than feeling too low.
    """
    if _backend == "transformer" and _model is not None:
        raw = _transformer_cosine(resume_text, jd_text)
    else:
        raw = _tfidf_cosine(resume_text, jd_text)

    raw = max(0.0, min(1.0, raw))

    # Light curve: similarities of 0.3–0.6 are already meaningful for resumes,
    # so we map them to a friendlier band. sqrt lifts the low-mid range.
    scaled = math.sqrt(raw) * 100
    return round(min(100.0, scaled), 1)
