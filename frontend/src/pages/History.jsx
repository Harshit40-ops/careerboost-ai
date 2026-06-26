// History.jsx
// -----------
// A dedicated, persistent history of all past resume analyses. Each entry can
// be re-opened to view the full saved report, or deleted by the user.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Spinner from "../components/Spinner.jsx";

function scoreColor(v) {
  return v >= 75 ? "text-green-400" : v >= 50 ? "text-amber-400" : "text-red-400";
}

// Compact view of a single saved report (scores + lists).
function ReportDetails({ report }) {
  const subs = [
    ["Skills match", report.skills_match],
    ["Experience relevance", report.experience_relevance],
    ["Keyword coverage", report.keyword_coverage],
    ["Format & readability", report.format_readability],
  ];
  return (
    <div className="mt-4 space-y-5 border-t border-white/10 pt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {subs.map(([name, val]) => (
          <div key={name}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-300">{name}</span>
              <span className="font-semibold">{Math.round(val)}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-brand-500"
                style={{ width: `${val}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {report.missing_keywords?.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-white">Missing keywords</h4>
          <div className="flex flex-wrap gap-2">
            {report.missing_keywords.map((k) => (
              <span
                key={k}
                className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      {report.suggestions?.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-white">Suggestions</h4>
          <ol className="space-y-1">
            {report.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="font-semibold text-brand-400">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function History() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  function load() {
    api.myAnalyses().then(setItems).catch((err) => setError(err.message));
  }
  useEffect(load, []);

  async function toggle(id) {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(id);
    setDetail(null);
    setLoadingDetail(true);
    try {
      setDetail(await api.analysisDetail(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function remove(id, e) {
    e.stopPropagation();
    if (!window.confirm("Delete this analysis from your history?")) return;
    try {
      await api.deleteAnalysis(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
      if (openId === id) {
        setOpenId(null);
        setDetail(null);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  if (error)
    return <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</div>;
  if (!items) return <Spinner label="Loading your history…" />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">History</h1>
          <p className="mt-1 text-slate-400">
            All your past resume analyses — click any to re-open the full report.
          </p>
        </div>
        <Link to="/analyze" className="btn-primary">
          + New Analysis
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center text-slate-400">
          <div className="text-5xl">🗂️</div>
          <p className="mt-3">No history yet. Run your first analysis to see it here.</p>
          <Link to="/analyze" className="btn-primary mt-4">
            Analyze My Resume
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {[...items].reverse().map((a) => (
            <div key={a.id} className="card">
              <div
                onClick={() => toggle(a.id)}
                className="flex cursor-pointer items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-100">{a.job_title}</p>
                  <p className="text-sm text-slate-400">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold ${scoreColor(a.overall_score)}`}>
                    {Math.round(a.overall_score)}
                  </div>
                  <button
                    onClick={(e) => remove(a.id, e)}
                    title="Delete"
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-500/15"
                  >
                    🗑
                  </button>
                  <span className="text-slate-400">{openId === a.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {openId === a.id && (
                <>
                  {loadingDetail && <Spinner label="Loading report…" />}
                  {detail && <ReportDetails report={detail} />}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
