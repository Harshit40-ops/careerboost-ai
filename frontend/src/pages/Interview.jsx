// Interview.jsx
// -------------
// Enter a role -> get categorized interview questions in collapsible cards.

import { useState } from "react";
import { api } from "../api";
import Spinner from "../components/Spinner.jsx";

// One collapsible question card.
function QuestionCard({ index, q }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="font-medium text-slate-100">
          <span className="mr-2 text-brand-400">{index + 1}.</span>
          {q.question}
        </span>
        <span className="text-slate-400">{open ? "−" : "+"}</span>
      </button>
      {open && q.looking_for && (
        <div className="border-t border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          <span className="font-semibold text-slate-200">What they're looking for: </span>
          {q.looking_for}
        </div>
      )}
    </div>
  );
}

// A section for one category (technical / behavioral / hr).
function Category({ title, emoji, questions }) {
  if (!questions?.length) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">
        {emoji} {title}
      </h3>
      <div className="space-y-2">
        {questions.map((q, i) => (
          <QuestionCard key={i} index={i} q={q} />
        ))}
      </div>
    </div>
  );
}

export default function Interview() {
  const [role, setRole] = useState("");
  const [num, setNum] = useState(9);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  async function handleGenerate() {
    setError("");
    if (role.trim().length < 2) return setError("Please enter a role.");
    setLoading(true);
    setData(null);
    try {
      const res = await api.generateInterview({ role, num_questions: Number(num) });
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Interview Prep</h1>
        <p className="mt-1 text-slate-400">
          Get role-specific technical, behavioral, and HR questions to practice.
        </p>
      </div>

      <div className="card">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div>
            <label className="label">Role / job title</label>
            <input
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Data Analyst, Frontend Developer"
            />
          </div>
          <div>
            <label className="label">Questions</label>
            <select
              className="input"
              value={num}
              onChange={(e) => setNum(e.target.value)}
            >
              {[6, 9, 12, 15].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleGenerate} disabled={loading} className="btn-primary">
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
        {error && (
          <div className="mt-4 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>

      {loading && <Spinner label="Preparing your questions…" />}

      {data && (
        <div className="grid gap-8 lg:grid-cols-3">
          <Category title="Technical" emoji="💻" questions={data.technical} />
          <Category title="Behavioral" emoji="🤝" questions={data.behavioral} />
          <Category title="HR" emoji="🧑‍💼" questions={data.hr} />
        </div>
      )}
    </div>
  );
}
