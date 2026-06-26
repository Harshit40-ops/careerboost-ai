// Analyzer.jsx — the flagship page.
// Upload a resume (drag & drop) + paste a job description, then show the full
// 3-layer report: animated gauge, sub-scores, missing keywords, strengths,
// and a numbered suggestions list.

import { useRef, useState } from "react";
import { api } from "../api";
import RadarScores from "../components/RadarScores.jsx";
import ScanAnimation from "../components/ScanAnimation.jsx";
import ScoreGauge from "../components/ScoreGauge.jsx";
import TiltCard from "../components/TiltCard.jsx";
import { downloadReportPdf } from "../utils/reportPdf.js";

const ACCEPTED = [".pdf", ".docx"];
const MAX_MB = 5;

// A single sub-score bar.
function SubScore({ name, value }) {
  const color = value >= 75 ? "bg-green-500" : value >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-300">{name}</span>
        <span className="font-semibold">{Math.round(value)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/10">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function Analyzer() {
  const [file, setFile] = useState(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const inputRef = useRef(null);

  function validateAndSet(f) {
    setError("");
    if (!f) return;
    const lower = f.name.toLowerCase();
    if (!ACCEPTED.some((ext) => lower.endsWith(ext))) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File is too large. Max ${MAX_MB} MB.`);
      return;
    }
    setFile(f);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    validateAndSet(e.dataTransfer.files?.[0]);
  }

  async function handleAnalyze() {
    setError("");
    if (!file) return setError("Please upload your resume first.");
    if (jobDescription.trim().length < 30)
      return setError("Please paste a fuller job description.");

    setLoading(true);
    setReport(null);
    try {
      const result = await api.analyzeResume(file, jobDescription, jobTitle);
      setReport(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Resume Analyzer</h1>
        <p className="mt-1 text-slate-400">
          Upload your resume and paste the target job description to get an
          accurate ATS score.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Input column ── */}
        <div className="card space-y-5">
          {/* Drag & drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
              dragging ? "border-brand-500 bg-brand-500/15" : "border-white/10 hover:bg-white/5"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => validateAndSet(e.target.files?.[0])}
            />
            <div className="text-4xl">📄</div>
            {file ? (
              <p className="mt-2 font-medium text-slate-200">{file.name}</p>
            ) : (
              <>
                <p className="mt-2 font-medium text-slate-200">
                  Drag & drop your resume here
                </p>
                <p className="text-sm text-slate-400">or click to browse · PDF or DOCX · max {MAX_MB} MB</p>
              </>
            )}
          </div>

          <div>
            <label className="label">Job title (optional)</label>
            <input
              className="input"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Backend Engineer"
            />
          </div>

          <div>
            <label className="label">Job description</label>
            <textarea
              className="input min-h-[180px] resize-y"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here…"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button onClick={handleAnalyze} disabled={loading} className="btn-primary w-full">
            {loading ? "Analyzing…" : "Analyze Resume"}
          </button>
        </div>

        {/* ── Results column ── */}
        <TiltCard className="card" glow={!!report} max={5}>
          {loading && <ScanAnimation label="Scanning your resume across 3 layers…" />}

          {!loading && !report && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-slate-400">
              <div className="text-5xl">🎯</div>
              <p className="mt-3">Your score and suggestions will appear here.</p>
            </div>
          )}

          {!loading && report && (
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <ScoreGauge score={report.overall_score} />
                <p className="text-sm text-slate-400">
                  Final score · {report.job_title}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Blended from LLM rubric ({Math.round(report.llm_overall_score)}) and
                  semantic match ({Math.round(report.semantic_match_score)})
                </p>
              </div>

              {/* Futuristic radar view of the sub-scores */}
              <RadarScores report={report} />

              <div className="space-y-3">
                <SubScore name="Skills match" value={report.skills_match} />
                <SubScore name="Experience relevance" value={report.experience_relevance} />
                <SubScore name="Keyword coverage" value={report.keyword_coverage} />
                <SubScore name="Format & readability" value={report.format_readability} />
              </div>
            </div>
          )}
        </TiltCard>
      </div>

      {/* Download report button */}
      {!loading && report && (
        <div className="flex justify-end">
          <button onClick={() => downloadReportPdf(report)} className="btn-ghost">
            ⬇ Download PDF report
          </button>
        </div>
      )}

      {/* ── Detailed feedback (full width) ── */}
      {!loading && report && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Missing keywords */}
          <div className="card">
            <h3 className="font-semibold text-white">Missing keywords</h3>
            <p className="mb-3 text-sm text-slate-400">Consider adding these where true.</p>
            {report.missing_keywords.length ? (
              <div className="flex flex-wrap gap-2">
                {report.missing_keywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-red-500/15 px-3 py-1 text-sm font-medium text-red-300"
                  >
                    {k}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Great — no major gaps found!</p>
            )}
          </div>

          {/* Strengths */}
          <div className="card">
            <h3 className="font-semibold text-white">Strengths</h3>
            <p className="mb-3 text-sm text-slate-400">What's already working.</p>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-200">
                  <span className="text-green-400">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggestions */}
          <div className="card">
            <h3 className="font-semibold text-white">Suggestions</h3>
            <p className="mb-3 text-sm text-slate-400">Concrete next steps.</p>
            <ol className="space-y-2">
              {report.suggestions.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-200">
                  <span className="font-semibold text-brand-400">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
