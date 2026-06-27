"""
llm.py  —  LAYER 3: LLM Rubric Scoring (+ interview questions)
-------------------------------------------------------------
We send the resume + JD to an LLM with a STRICT rubric and force JSON output.

Providers supported (set LLM_PROVIDER in .env):
  * "anthropic" -> Claude (recommended)
  * "openai"    -> GPT
  * "mock"      -> deterministic heuristic; needs NO API key, so you can run
                   and demo the whole product for free.

Robustness:
  * All network calls are wrapped in try/except.
  * If the model returns text around the JSON (or ```json fences), we strip the
    fences and retry the parse once before giving up.
"""

import json
import re
from typing import Any, Dict, List

from ..config import settings

# ───────────────────────── Prompt templates ─────────────────────────
RUBRIC_PROMPT = """You are an expert ATS resume analyzer.
Compare the RESUME against the JOB DESCRIPTION.

Score each criterion 0-100:
1. skills_match — do the candidate's skills match the JD?
2. experience_relevance — is their experience relevant?
3. keyword_coverage — are important JD keywords present?
4. format_readability — is the resume clean and ATS-friendly?

Then identify missing keywords, strengths, and concrete improvement suggestions.

Return ONLY valid JSON, no extra text:
{{
  "overall_score": <0-100>,
  "skills_match": <0-100>,
  "experience_relevance": <0-100>,
  "keyword_coverage": <0-100>,
  "format_readability": <0-100>,
  "missing_keywords": ["..."],
  "strengths": ["..."],
  "suggestions": ["..."]
}}

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}
"""

INTERVIEW_PROMPT = """You are an experienced technical interviewer and career coach
preparing an Indian college student for interviews for the role: "{role}".

{resume_block}

Generate exactly {num} interview questions total, split across three categories
(roughly evenly): technical, behavioral, and HR. For EACH question include a
short "looking_for" hint describing what a strong answer demonstrates.

Return ONLY valid JSON, no extra text:
{{
  "technical": [{{"question": "...", "looking_for": "..."}}],
  "behavioral": [{{"question": "...", "looking_for": "..."}}],
  "hr": [{{"question": "...", "looking_for": "..."}}]
}}
"""


# ───────────────────────── JSON extraction ──────────────────────────
def _extract_json(text: str) -> Dict[str, Any]:
    """
    Parse JSON out of a model response.
    Tries straight json.loads first; if that fails, strips ```json fences and
    grabs the first {...} block, then retries once.
    """
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        pass

    # Strip code fences like ```json ... ```
    cleaned = re.sub(r"```(?:json)?", "", text).strip("` \n")

    # Grab the outermost { ... } region.
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        cleaned = cleaned[start : end + 1]

    return json.loads(cleaned)  # may raise; caller handles it


# ─────────────────────── Provider call wrappers ─────────────────────
def _call_anthropic(prompt: str) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    msg = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text


def _call_openai(prompt: str) -> str:
    from openai import OpenAI

    # If OPENAI_BASE_URL is set we talk to an OpenAI-COMPATIBLE provider
    # (Groq, OpenRouter, Gemini's OpenAI endpoint, ...). Otherwise real OpenAI.
    kwargs = {"api_key": settings.OPENAI_API_KEY}
    if settings.OPENAI_BASE_URL:
        kwargs["base_url"] = settings.OPENAI_BASE_URL
    client = OpenAI(**kwargs)
    resp = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500,
    )
    return resp.choices[0].message.content


def _call_llm(prompt: str) -> str:
    """Dispatch to the configured provider and return raw text."""
    provider = settings.LLM_PROVIDER.lower()
    if provider == "anthropic" and settings.ANTHROPIC_API_KEY:
        return _call_anthropic(prompt)
    if provider == "openai" and settings.OPENAI_API_KEY:
        return _call_openai(prompt)
    # No usable provider configured -> signal caller to use mock.
    raise RuntimeError("no-llm-configured")


# ───────────────────────── Public functions ─────────────────────────
def score_resume(resume_text: str, jd_text: str) -> Dict[str, Any]:
    """
    Run the LLM rubric scoring. Returns a dict matching the rubric JSON.
    Falls back to a heuristic mock if no provider is configured or on error.
    """
    prompt = RUBRIC_PROMPT.format(resume_text=resume_text, jd_text=jd_text)
    try:
        raw = _call_llm(prompt)
        data = _extract_json(raw)
        return _normalise_rubric(data)
    except Exception as exc:
        print(f"[llm] scoring fell back to mock ({exc})")
        return _mock_rubric(resume_text, jd_text)


def generate_questions(role: str, resume_text: str | None, num: int) -> Dict[str, Any]:
    """Generate categorized interview questions (LLM, with mock fallback)."""
    resume_block = (
        f"Here is the student's resume for context:\n{resume_text}\n"
        if resume_text
        else "No resume was provided; base questions on the role alone."
    )
    prompt = INTERVIEW_PROMPT.format(role=role, resume_block=resume_block, num=num)
    try:
        raw = _call_llm(prompt)
        data = _extract_json(raw)
        return _normalise_questions(data)
    except Exception as exc:
        print(f"[llm] interview generation fell back to mock ({exc})")
        return _mock_questions(role, num)


# ─────────────────────── Cover letter ───────────────────────────────
COVER_LETTER_PROMPT = """You are a professional career writer helping an Indian
college student. Write a concise, confident, ATS-friendly cover letter
(180-260 words) for the role of "{role}".

Tone: {tone}. Use the candidate's name "{name}". Do NOT invent fake experience —
only use what the resume provides. Highlight the strongest matches to the job.
Return ONLY the cover letter text (no preamble, no markdown).

CANDIDATE NAME: {name}

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}
"""


def generate_cover_letter(name, role, jd_text, resume_text, tone="professional"):
    """Generate a cover letter (plain text). Falls back to a template on error."""
    prompt = COVER_LETTER_PROMPT.format(
        name=name or "the candidate",
        role=role or "the role",
        tone=tone or "professional",
        resume_text=resume_text or "(no resume provided)",
        jd_text=jd_text,
    )
    try:
        return _call_llm(prompt).strip()
    except Exception as exc:
        print(f"[llm] cover letter fell back to mock ({exc})")
        return _mock_cover_letter(name, role)


# ─────────────────────── Mock (chat) interview ──────────────────────
def mock_interview_reply(role, history):
    """
    Drive a turn-by-turn mock interview.
    `history` is a list of {"role": "interviewer"|"candidate", "content": str}.
    Returns the interviewer's next message (brief feedback + next question).
    """
    transcript = "\n".join(
        f"{'Interviewer' if m['role'] == 'interviewer' else 'Candidate'}: {m['content']}"
        for m in history
    )
    started = any(m["role"] == "candidate" for m in history)

    if not started:
        instruction = (
            "The interview is just starting. Briefly greet the candidate (1 line) "
            "and ask your FIRST interview question."
        )
    else:
        instruction = (
            "Give SHORT, kind feedback (1-2 sentences) on the candidate's last "
            "answer, then ask the NEXT question. Ask only ONE question."
        )

    prompt = (
        f"You are a friendly but professional interviewer for a '{role}' role, "
        f"interviewing an Indian college student. Mix technical, behavioral and HR "
        f"questions over the session. Keep replies under 80 words and conversational.\n\n"
        f"Conversation so far:\n{transcript or '(none yet)'}\n\n{instruction}\n"
        f"Reply as the interviewer only (no labels)."
    )
    try:
        return _call_llm(prompt).strip()
    except Exception as exc:
        print(f"[llm] mock interview fell back to mock ({exc})")
        return _mock_interview_reply(role, started)


# ─────────────────────── Study notes ────────────────────────────────
NOTES_PROMPT = """You are an expert teacher creating clear, exam-ready study
notes for an Indian college student on the topic: "{topic}".

Detail level: {detail}.
{source_block}

Produce well-structured notes. Return ONLY valid JSON, no extra text:
{{
  "title": "<a clean title for the notes>",
  "summary": "<2-3 sentence overview>",
  "sections": [
    {{"heading": "<subtopic>", "points": ["<concise bullet>", "..."]}}
  ],
  "key_terms": [
    {{"term": "<term>", "definition": "<one-line definition>"}}
  ],
  "questions": ["<important practice question>", "..."]
}}
"""


def generate_notes(topic, source_text=None, detail="balanced"):
    """Generate structured study notes (dict). Falls back to a mock on error."""
    source_block = (
        f"Base the notes on this material the student provided:\n{source_text}\n"
        if source_text
        else "Use your own knowledge of the topic."
    )
    prompt = NOTES_PROMPT.format(
        topic=topic, detail=detail, source_block=source_block
    )
    try:
        raw = _call_llm(prompt)
        data = _extract_json(raw)
        return _normalise_notes(data, topic)
    except Exception as exc:
        print(f"[llm] notes generation fell back to mock ({exc})")
        return _mock_notes(topic)


def _normalise_notes(data, topic):
    """Ensure the notes dict has the expected, clean shape."""
    sections = []
    for s in data.get("sections", []) or []:
        if isinstance(s, dict):
            sections.append({
                "heading": str(s.get("heading", "")).strip() or "Notes",
                "points": [str(p).strip() for p in (s.get("points") or []) if str(p).strip()],
            })
    key_terms = []
    for t in data.get("key_terms", []) or []:
        if isinstance(t, dict) and t.get("term"):
            key_terms.append({
                "term": str(t["term"]).strip(),
                "definition": str(t.get("definition", "")).strip(),
            })
    return {
        "title": str(data.get("title") or topic).strip(),
        "summary": str(data.get("summary", "")).strip(),
        "sections": sections,
        "key_terms": key_terms[:25],
        "questions": [str(q).strip() for q in (data.get("questions") or []) if str(q).strip()][:15],
    }


# ─────────────────────── Code assistant ─────────────────────────────
_CODE_MODES = {
    "generate": "Write clean, well-commented code that fulfills the request.",
    "solve_assignment": "Solve this assignment/problem with correct, efficient, "
                        "well-explained code. Show the approach in the explanation.",
    "build_project": "Build a small but complete project. Prefer a single runnable "
                     "file when possible; explain the structure and how to run it.",
    "explain": "Explain what the provided code does, step by step. Return the same "
               "code (you may add helpful comments) in 'code'.",
    "debug": "Find and fix the bug(s) in the provided code. Return the corrected, "
             "runnable code and clearly explain what was wrong and how you fixed it.",
}

CODE_PROMPT = """You are an expert programming tutor and senior engineer helping an
Indian college student. Be accurate and beginner-friendly.

Mode: {mode_instruction}
Target language: {language}
{existing_block}
Student's request:
{prompt}

IMPORTANT: The code is run directly in the browser, so it MUST produce visible
output. Always end the code with a small demonstration that PRINTS results —
use print() for Python, console.log() for JavaScript. If you define a function,
also call it with sample inputs and print the returned value. (For "explain"
mode, keep the original code but you may add a print/console.log demo.)

Return ONLY valid JSON, no extra text or markdown fences:
{{
  "language": "<language used>",
  "code": "<complete, runnable code as a single string>",
  "explanation": "<concise, student-friendly explanation with key points>"
}}
"""


def generate_code(prompt, language="python", mode="generate", existing_code=None):
    """Generate / explain / debug code. Returns {language, code, explanation}."""
    existing_block = (
        f"The student's current code:\n```\n{existing_code}\n```\n"
        if existing_code
        else ""
    )
    full_prompt = CODE_PROMPT.format(
        mode_instruction=_CODE_MODES.get(mode, _CODE_MODES["generate"]),
        language=language,
        existing_block=existing_block,
        prompt=prompt,
    )
    try:
        raw = _call_llm(full_prompt)
        data = _extract_json(raw)
        return {
            "language": str(data.get("language") or language).strip(),
            "code": str(data.get("code") or "").strip("\n"),
            "explanation": str(data.get("explanation") or "").strip(),
        }
    except Exception as exc:
        print(f"[llm] code assist fell back to mock ({exc})")
        return _mock_code(prompt, language)


# ─────────────────────── Normalisation helpers ──────────────────────
def _clamp(value: Any, default: float = 0.0) -> float:
    try:
        return max(0.0, min(100.0, float(value)))
    except (TypeError, ValueError):
        return default


def _normalise_rubric(data: Dict[str, Any]) -> Dict[str, Any]:
    """Make sure all expected keys exist and scores are clean 0–100 numbers."""
    return {
        "overall_score": _clamp(data.get("overall_score")),
        "skills_match": _clamp(data.get("skills_match")),
        "experience_relevance": _clamp(data.get("experience_relevance")),
        "keyword_coverage": _clamp(data.get("keyword_coverage")),
        "format_readability": _clamp(data.get("format_readability")),
        "missing_keywords": [str(x) for x in data.get("missing_keywords", [])][:25],
        "strengths": [str(x) for x in data.get("strengths", [])][:15],
        "suggestions": [str(x) for x in data.get("suggestions", [])][:15],
    }


def _normalise_questions(data: Dict[str, Any]) -> Dict[str, Any]:
    def fix(items: Any) -> List[Dict[str, str]]:
        out = []
        for it in items or []:
            if isinstance(it, dict):
                out.append({
                    "question": str(it.get("question", "")).strip(),
                    "looking_for": str(it.get("looking_for", "")).strip() or None,
                })
            elif isinstance(it, str):
                out.append({"question": it.strip(), "looking_for": None})
        return [q for q in out if q["question"]]

    return {
        "technical": fix(data.get("technical")),
        "behavioral": fix(data.get("behavioral")),
        "hr": fix(data.get("hr")),
    }


# ───────────────────────── Mock fallbacks ───────────────────────────
# Common JD filler words we don't want to surface as "missing keywords".
_FILLER = {
    "need", "needs", "skilled", "experience", "experienced", "some", "plus",
    "with", "and", "the", "for", "you", "your", "our", "will", "have",
    "strong", "good", "great", "ability", "work", "working", "role", "team",
    "looking", "candidate", "must", "should", "knowledge", "familiar",
    "design", "designing", "using", "used", "etc", "such", "this", "that",
    "across", "within", "various", "related", "preferred", "required",
}


def _keywords(text: str) -> set:
    words = set()
    for w in re.findall(r"[a-zA-Z][a-zA-Z+#.]{2,}", text):
        # Strip trailing dots so "learning." == "learning".
        cleaned = w.strip(".").lower()
        if len(cleaned) > 2 and cleaned not in _FILLER:
            words.add(cleaned)
    return words


def _mock_rubric(resume_text: str, jd_text: str) -> Dict[str, Any]:
    """
    A deterministic, explainable heuristic used when no LLM is configured.
    It overlaps JD keywords with the resume so demos still produce sensible,
    varying numbers (not random).
    """
    resume_words = _keywords(resume_text)
    jd_words = _keywords(jd_text)
    important = {w for w in jd_words if len(w) > 3}

    present = important & resume_words
    missing = sorted(important - resume_words)

    coverage = (len(present) / len(important) * 100) if important else 50.0
    skills = min(100.0, coverage + 10)
    experience = min(100.0, coverage + 5)
    fmt = 75.0 if len(resume_text) > 800 else 60.0
    overall = round(0.4 * skills + 0.3 * experience + 0.2 * coverage + 0.1 * fmt, 1)

    return {
        "overall_score": overall,
        "skills_match": round(skills, 1),
        "experience_relevance": round(experience, 1),
        "keyword_coverage": round(coverage, 1),
        "format_readability": fmt,
        "missing_keywords": missing[:12],
        "strengths": [
            "Resume contains several keywords relevant to the role.",
            "Reasonable length and structure for an ATS to parse.",
        ],
        "suggestions": [
            "Add the missing keywords above where they truthfully apply.",
            "Quantify achievements with numbers (e.g. 'improved speed by 30%').",
            "Mirror the exact wording of key skills from the job description.",
        ],
        "_mock": True,
    }


def _mock_questions(role: str, num: int) -> Dict[str, Any]:
    per = max(1, num // 3)
    tech = [
        {"question": f"Explain a core concept you'd use as a {role}.",
         "looking_for": "Depth of fundamentals and clear explanation."},
        {"question": f"Walk through how you'd debug a failing feature as a {role}.",
         "looking_for": "Structured problem-solving."},
        {"question": "Describe a project and the trade-offs you made.",
         "looking_for": "Engineering judgement."},
    ]
    behav = [
        {"question": "Tell me about a time you worked in a team under deadline.",
         "looking_for": "Collaboration and ownership."},
        {"question": "Describe a failure and what you learned.",
         "looking_for": "Self-awareness and growth."},
    ]
    hr = [
        {"question": f"Why do you want this {role} role?",
         "looking_for": "Genuine motivation and research."},
        {"question": "Where do you see yourself in 3 years?",
         "looking_for": "Ambition aligned with the role."},
    ]
    return {
        "technical": (tech * 3)[:per + 1],
        "behavioral": (behav * 3)[:per],
        "hr": (hr * 3)[:per],
    }


def _mock_cover_letter(name, role):
    name = name or "Candidate"
    role = role or "the role"
    return (
        f"Dear Hiring Manager,\n\n"
        f"I am excited to apply for the {role} position. Through my coursework and "
        f"projects, I have built hands-on skills that align closely with what your "
        f"team is looking for, and I am eager to contribute and keep learning.\n\n"
        f"My background has taught me to solve problems methodically, collaborate "
        f"well, and deliver results. I am confident I can bring the same energy and "
        f"ownership to your team.\n\n"
        f"Thank you for considering my application. I would welcome the opportunity "
        f"to discuss how I can add value.\n\n"
        f"Sincerely,\n{name}\n\n"
        f"(Demo letter — add your ANTHROPIC/Groq key for a tailored version.)"
    )


def _mock_code(prompt, language):
    lang = (language or "python").lower()
    if lang in ("javascript", "js"):
        code = "// Demo output — add an LLM key for real AI code.\nconsole.log('Hello from CareerBoost AI!');"
    elif lang in ("html",):
        code = "<!-- Demo — add an LLM key for real AI code. -->\n<h1>Hello from CareerBoost AI!</h1>"
    else:
        code = "# Demo output — add an LLM key for real AI code.\nprint('Hello from CareerBoost AI!')"
    return {
        "language": language or "python",
        "code": code,
        "explanation": (
            f"This is a demo response for: '{prompt}'. Add a Groq/Anthropic key in "
            f"the backend .env to get real, complete AI-generated code."
        ),
        "_mock": True,
    }


def _mock_notes(topic):
    topic = topic or "the topic"
    return {
        "title": f"Study Notes: {topic}",
        "summary": (
            f"These are demo notes for {topic}. Add an LLM key (Groq/Anthropic) "
            f"in the backend .env for full, AI-generated study notes."
        ),
        "sections": [
            {"heading": "Overview", "points": [
                f"{topic} is an important concept to understand for exams.",
                "Break it into smaller subtopics and study each with examples.",
            ]},
            {"heading": "Key Ideas", "points": [
                "Define the core terms in your own words.",
                "Practice with one or two solved examples.",
                "Revise using the questions below.",
            ]},
        ],
        "key_terms": [
            {"term": topic, "definition": "Add a real LLM key for detailed definitions."},
        ],
        "questions": [
            f"Explain {topic} in simple terms.",
            f"Give a real-world example of {topic}.",
        ],
        "_mock": True,
    }


def _mock_interview_reply(role, started):
    if not started:
        return (
            f"Hi! Thanks for joining. Let's begin your mock interview for the "
            f"{role} role. To start: can you briefly introduce yourself and tell me "
            f"why you're interested in this position?"
        )
    return (
        "Good — that's a reasonable answer; try to add a concrete example next "
        "time. Next question: tell me about a project you're proud of and your "
        "specific contribution to it."
    )
