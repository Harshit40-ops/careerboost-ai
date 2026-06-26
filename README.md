# CareerBoost AI 🎯

An ATS resume-scoring + interview-prep platform for Indian college students.

The flagship feature is an **accurate ATS resume scoring engine** that compares a
student's resume against a *specific job description* using a **3-layer approach**:

1. **Layer 1 — Clean Parsing** — extract & clean text from PDF/DOCX.
2. **Layer 2 — Semantic Matching** — sentence-transformer embeddings + cosine
   similarity (catches related skills even when exact words differ).
3. **Layer 3 — LLM Rubric Scoring** — Claude/GPT scores the resume against a
   strict rubric and returns structured JSON.

The **final score** is a weighted blend (default **70% LLM + 30% embeddings**)
for a stable, accurate number — never naive keyword counting.

---

## Tech stack

| Layer     | Tech |
|-----------|------|
| Backend   | Python 3.11+, FastAPI, SQLAlchemy + SQLite, JWT (python-jose + bcrypt) |
| Parsing   | pdfplumber, PyMuPDF, python-docx |
| Embeddings| sentence-transformers (`all-MiniLM-L6-v2`), local & free |
| LLM       | Anthropic Claude (or OpenAI) — called only from the backend |
| Frontend  | React (Vite) + Tailwind CSS + Recharts |

---

## Project structure

```
carrer boost AI/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, startup (loads model once)
│   │   ├── config.py          # settings from .env
│   │   ├── database.py        # SQLAlchemy engine + session
│   │   ├── models.py          # users / analyses / interview_sessions tables
│   │   ├── schemas.py         # pydantic request/response models
│   │   ├── auth.py            # bcrypt hashing + JWT
│   │   ├── routers/           # auth, resume, interview, dashboard
│   │   └── services/
│   │       ├── parsing.py     # Layer 1
│   │       ├── embeddings.py  # Layer 2 (with TF-IDF fallback)
│   │       ├── llm.py         # Layer 3 (+ mock fallback)
│   │       └── scoring.py     # blends the layers
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/             # Landing, Login, Register, Analyzer, Interview, Dashboard
    │   ├── components/        # Navbar, ScoreGauge, Spinner, ProtectedRoute
    │   ├── api.js             # fetch wrapper (attaches JWT)
    │   └── auth.jsx           # auth context
    └── package.json
```

---

## Quick start

### 1. Backend

**Windows (PowerShell)** — run each line separately (PowerShell 5.1 does not
support `&&`; use `;` to chain on one line if you prefer).

> Tip: instead of activating the venv (which can be blocked by PowerShell's
> execution policy), call the venv's Python directly with `.\.venv\Scripts\python.exe`.
> This always uses the right interpreter and needs no policy change.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env                       # then edit .env
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

If you'd rather activate the venv, first allow local scripts once with
`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, then
`.\.venv\Scripts\Activate.ps1`.

**macOS / Linux (bash):**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env               # then edit .env
uvicorn app.main:app --reload
```

Backend runs at **http://localhost:8000** (interactive docs at `/docs`).

#### Configure `.env`

```env
SECRET_KEY=<run: python -c "import secrets; print(secrets.token_hex(32))">
LLM_PROVIDER=anthropic          # anthropic | openai | mock
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-opus-4-8
```

> **No API key? No problem.** Set `LLM_PROVIDER=mock` to run the entire app for
> free using a built-in heuristic scorer — perfect for demos and development.

### 2. Frontend

Run each line separately. The only OS-specific line is copying the env file:

```bash
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:8000` for the API. To override it,
create a `.env` with `VITE_API_URL=...`:
- PowerShell: `Copy-Item .env.example .env`
- bash: `cp .env.example .env`

Frontend runs at **http://localhost:5173**.

---

## How the 3-layer scoring works

```
resume.pdf ─┐
            ├─► Layer 1: parse + clean text ──┐
JD text  ───┘                                 │
                                              ▼
                  Layer 2: embeddings ──► semantic_match_score (0–100)
                  Layer 3: LLM rubric ──► {skills, experience, keywords,
                                           format, missing_keywords,
                                           strengths, suggestions}
                                              │
                                              ▼
        final = 0.7 * LLM_overall + 0.3 * semantic_match   ◄── stable & accurate
```

The exact LLM rubric prompt lives in
[`backend/app/services/llm.py`](backend/app/services/llm.py) (`RUBRIC_PROMPT`).

---

## API endpoints

| Method | Path                  | Auth | Purpose |
|--------|-----------------------|------|---------|
| POST   | `/auth/register`      | —    | Create account |
| POST   | `/auth/login`         | —    | Get JWT token |
| POST   | `/resume/analyze`     | ✅   | 3-layer ATS scoring (multipart: `resume` file + `job_description`) |
| POST   | `/interview/generate` | ✅   | Generate categorized interview questions |
| GET    | `/me/analyses`        | ✅   | List the user's past analyses (for the trend chart) |
| GET    | `/me/analyses/{id}`   | ✅   | Full stored report for one analysis |

Protected routes require an `Authorization: Bearer <token>` header.

---

## Engineering notes

- **API keys never touch the frontend** — all LLM calls go through FastAPI.
- **Upload validation** — PDF/DOCX only, max 5 MB, minimum extracted text length.
- **Robust LLM parsing** — strips ` ```json ` fences and retries the JSON parse once.
- **Embedding model loaded once** at startup (not per request) for speed.
- **CORS** is enabled for the Vite dev server origins.
- **Graceful fallbacks** so the app *always runs*:
  - If `sentence-transformers`/`torch` can't be imported, Layer 2 falls back to a
    pure-Python **TF-IDF cosine similarity**.
  - If no LLM key is configured, Layer 3 falls back to a deterministic heuristic.

### Python version note
`requirements.txt` targets **Python 3.11–3.12**, which have prebuilt wheels for
`torch` (a dependency of `sentence-transformers`). On the newest Pythons
(3.13/3.14) `torch` may not have a wheel yet — the app still runs and simply uses
the TF-IDF fallback for Layer 2. For full embedding quality, use Python 3.11/3.12.

---

## Database schema (SQLite)

```
users               (id, name, email[unique], hashed_password, created_at)
analyses            (id, user_id→users, job_title, overall_score, report_json, created_at)
interview_sessions  (id, user_id→users, role, questions_json, created_at)
```

Tables are created automatically on first startup.

---

## License

Demo / educational project.
