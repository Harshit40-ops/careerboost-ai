// Practice.jsx
// ------------
// LeetCode-style Practice Arena: browse topic-wise problems, see your solved
// progress, and open any problem to solve it (ProblemView).

import { useEffect, useState } from "react";
import { api } from "../api";
import Spinner from "../components/Spinner.jsx";
import ProblemView from "./ProblemView.jsx";

const DIFF_COLOR = {
  Easy: "text-green-400",
  Medium: "text-amber-400",
  Hard: "text-red-400",
};

export default function Practice() {
  const [topics, setTopics] = useState([]);
  const [problems, setProblems] = useState(null);
  const [activeTopic, setActiveTopic] = useState("");
  const [progress, setProgress] = useState({ count: 0, total: 0, solved: [] });
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(60);

  function loadProblems(topic) {
    api.practiceProblems(topic).then(setProblems).catch((e) => setError(e.message));
  }
  function loadProgress() {
    api.practiceProgress().then(setProgress).catch(() => {});
  }

  useEffect(() => {
    api.practiceTopics().then(setTopics).catch(() => {});
    loadProblems("");
    loadProgress();
  }, []);

  function filterTopic(t) {
    setActiveTopic(t);
    setProblems(null);
    setLimit(60);
    loadProblems(t);
  }

  // When a problem is solved inside ProblemView, refresh progress + list.
  function handleSolved() {
    loadProgress();
    loadProblems(activeTopic);
  }

  if (selected) {
    return (
      <ProblemView
        slug={selected}
        onBack={() => {
          setSelected(null);
          loadProblems(activeTopic);
          loadProgress();
        }}
        onSolved={handleSolved}
      />
    );
  }

  const pct = progress.total ? Math.round((progress.count / progress.total) * 100) : 0;

  // Client-side search over the loaded (topic-filtered) problems.
  const filtered = (problems || []).filter((p) =>
    p.title.toLowerCase().includes(query.trim().toLowerCase())
  );
  const visible = filtered.slice(0, limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Practice Arena 🧩</h1>
          <p className="mt-1 text-slate-400">
            Solve topic-wise coding problems and run them right here.
          </p>
        </div>
        {/* Progress ring-ish badge */}
        <div className="card flex items-center gap-3 py-3">
          <div className="text-2xl font-extrabold text-brand-300">
            {progress.count}/{progress.total}
          </div>
          <div>
            <div className="text-xs text-slate-400">Solved</div>
            <div className="mt-1 h-2 w-28 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</div>}

      {/* Topic filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => filterTopic("")}
          className={`rounded-full px-4 py-1.5 text-sm transition ${
            activeTopic === "" ? "bg-brand-600 text-white" : "border border-white/10 text-slate-300 hover:bg-white/10"
          }`}
        >
          All
        </button>
        {topics.map((t) => (
          <button
            key={t.topic}
            onClick={() => filterTopic(t.topic)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              activeTopic === t.topic ? "bg-brand-600 text-white" : "border border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            {t.topic} <span className="opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        className="input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setLimit(60);
        }}
        placeholder="🔍 Search problems by name (e.g. two sum, palindrome, fibonacci)…"
      />

      {/* Problem list */}
      {!problems ? (
        <Spinner label="Loading problems…" />
      ) : (
        <>
          <p className="text-sm text-slate-400">
            Showing {Math.min(visible.length, filtered.length)} of {filtered.length} problems
            {activeTopic && ` in ${activeTopic}`}
          </p>
          <div className="space-y-2">
            {visible.map((p) => (
              <div
                key={p.slug}
                onClick={() => setSelected(p.slug)}
                className="card flex cursor-pointer items-center justify-between gap-4 py-3 transition hover:border-brand-400/40"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg ${p.solved ? "text-green-400" : "text-slate-600"}`}>
                    {p.solved ? "✓" : "○"}
                  </span>
                  <div>
                    <p className="font-medium text-slate-100">{p.title}</p>
                    <p className="text-xs text-slate-400">{p.topic}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${DIFF_COLOR[p.difficulty]}`}>
                  {p.difficulty}
                </span>
              </div>
            ))}
          </div>
          {filtered.length > visible.length && (
            <button
              onClick={() => setLimit((l) => l + 60)}
              className="btn-ghost mx-auto mt-4 block"
            >
              Load more ({filtered.length - visible.length} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}
