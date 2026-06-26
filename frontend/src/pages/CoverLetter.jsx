// CoverLetter.jsx
// ---------------
// Generate an AI cover letter from a job description (and optional resume text).
// Output can be copied or downloaded as a .txt file.

import { useState } from "react";
import { api } from "../api";
import Spinner from "../components/Spinner.jsx";
import { useTypewriter } from "../hooks/useTypewriter.js";

const TONES = ["professional", "enthusiastic", "confident", "friendly"];

export default function CoverLetter() {
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [letter, setLetter] = useState("");
  const [copied, setCopied] = useState(false);
  // Reveals the letter with a live "typing" effect when it first arrives.
  const { shown, done } = useTypewriter(letter, 8);

  async function handleGenerate() {
    setError("");
    if (role.trim().length < 2) return setError("Please enter the role.");
    if (jd.trim().length < 20) return setError("Please paste the job description.");
    setLoading(true);
    setLetter("");
    try {
      const res = await api.generateCoverLetter({
        role,
        job_description: jd,
        resume_text: resumeText || null,
        tone,
      });
      setLetter(res.cover_letter);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyLetter() {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadTxt() {
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Cover Letter Generator</h1>
        <p className="mt-1 text-slate-400">
          Paste a job description and get a tailored cover letter in seconds.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <div className="card space-y-4">
          <div>
            <label className="label">Role / job title</label>
            <input
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Data Analyst"
            />
          </div>
          <div>
            <label className="label">Job description</label>
            <textarea
              className="input min-h-[140px] resize-y"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description here…"
            />
          </div>
          <div>
            <label className="label">Your resume / key points (optional)</label>
            <textarea
              className="input min-h-[100px] resize-y"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text or a few key achievements…"
            />
          </div>
          <div>
            <label className="label">Tone</label>
            <select className="input" value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full">
            {loading ? "Writing…" : "Generate Cover Letter"}
          </button>
        </div>

        {/* Output */}
        <div className="card flex flex-col">
          {loading && <Spinner label="Crafting your cover letter…" />}

          {!loading && !letter && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-slate-400">
              <div className="text-5xl">✉️</div>
              <p className="mt-3">Your cover letter will appear here.</p>
            </div>
          )}

          {!loading && letter && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-white">Your cover letter</h3>
                <div className="flex gap-2">
                  <button onClick={copyLetter} className="btn-ghost px-3 py-1.5 text-sm">
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={downloadTxt} className="btn-ghost px-3 py-1.5 text-sm">
                    Download
                  </button>
                </div>
              </div>
              {/* While typing, show a read-only animated view; once done, the
                  textarea becomes editable. */}
              {done ? (
                <textarea
                  className="input min-h-[420px] flex-1 resize-y whitespace-pre-wrap leading-relaxed"
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                />
              ) : (
                <div className="input min-h-[420px] flex-1 overflow-auto whitespace-pre-wrap leading-relaxed">
                  {shown}
                  <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-brand-400 align-middle" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
