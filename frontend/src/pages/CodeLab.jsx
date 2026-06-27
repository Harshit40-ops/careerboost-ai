// CodeLab.jsx
// -----------
// AI Code Lab: students describe what they want, the AI writes/solves/explains/
// debugs code, and they can edit and RUN it in the browser (Python, JS, HTML).
// Snippets can be saved to "My Code" for later.

import { useEffect, useState } from "react";
import { api } from "../api";
import CodeOutput from "../components/CodeOutput.jsx";
import Spinner from "../components/Spinner.jsx";

const LANGUAGES = ["python", "javascript", "html", "java", "c++", "c"];
const MODES = [
  ["generate", "✍️ Generate code"],
  ["solve_assignment", "📘 Solve assignment"],
  ["build_project", "🏗️ Build project"],
  ["explain", "💡 Explain my code"],
  ["debug", "🐞 Debug & fix"],
];
const EXT = { python: "py", javascript: "js", html: "html", java: "java", "c++": "cpp", c: "c" };

export default function CodeLab() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("generate");
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [runId, setRunId] = useState(0);

  const [saved, setSaved] = useState([]);

  function loadSaved() {
    api.mySnippets().then(setSaved).catch(() => {});
  }
  useEffect(loadSaved, []);

  async function generate() {
    setError("");
    if (prompt.trim().length < 3) return setError("Describe what you need.");
    if ((mode === "explain" || mode === "debug") && !code.trim())
      return setError("Paste the code you want me to explain/debug into the editor.");
    setLoading(true);
    try {
      const res = await api.codeAssist({ prompt, language, mode, code: code || null });
      setCode(res.code);
      setExplanation(res.explanation);
      setLanguage(res.language || language);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Tab key inserts 2 spaces instead of leaving the textarea.
  function onEditorKey(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.target;
      const s = el.selectionStart;
      const next = code.slice(0, s) + "  " + code.slice(el.selectionEnd);
      setCode(next);
      requestAnimationFrame(() => (el.selectionStart = el.selectionEnd = s + 2));
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
  }

  function downloadCode() {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${EXT[language] || "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveSnippet() {
    if (!code.trim()) return setError("Nothing to save yet.");
    const title = window.prompt("Save as:", prompt.slice(0, 50) || "My snippet");
    if (!title) return;
    try {
      await api.saveSnippet({ title, language, code });
      loadSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  async function openSnippet(id) {
    try {
      const s = await api.snippetDetail(id);
      setCode(s.code);
      setLanguage(s.language);
      setExplanation("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeSnippet(id, e) {
    e.stopPropagation();
    if (!window.confirm("Delete this snippet?")) return;
    try {
      await api.deleteSnippet(id);
      setSaved((p) => p.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Code Lab 👨‍💻</h1>
        <p className="mt-1 text-slate-400">
          Build projects, solve assignments, and run code — with an AI pair-programmer.
        </p>
      </div>

      {/* AI prompt panel */}
      <div className="card space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div>
            <label className="label">What do you want to do?</label>
            <input
              className="input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Build a to-do list, or solve: reverse a linked list"
              onKeyDown={(e) => e.key === "Enter" && generate()}
            />
          </div>
          <div>
            <label className="label">Mode</label>
            <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
              {MODES.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Language</label>
            <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        {error && (
          <div className="rounded-lg bg-red-500/15 px-4 py-2.5 text-sm text-red-300">{error}</div>
        )}
        <button onClick={generate} disabled={loading} className="btn-primary">
          {loading ? "Thinking…" : "✨ Ask AI"}
        </button>
      </div>

      {/* Editor + output */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor */}
        <div className="card flex flex-col">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-white">Editor · {language}</h3>
            <div className="flex gap-2">
              <button onClick={() => setRunId((n) => n + 1)} className="btn-primary px-4 py-1.5 text-sm">
                ▶ Run
              </button>
              <button onClick={copyCode} className="btn-ghost px-3 py-1.5 text-sm">Copy</button>
              <button onClick={downloadCode} className="btn-ghost px-3 py-1.5 text-sm">Download</button>
              <button onClick={saveSnippet} className="btn-ghost px-3 py-1.5 text-sm">Save</button>
            </div>
          </div>
          <textarea
            className="input min-h-[360px] flex-1 resize-y font-mono text-[13px] leading-relaxed"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={onEditorKey}
            spellCheck={false}
            placeholder="Write code here, or ask the AI above to generate it…"
          />
        </div>

        {/* Output */}
        <div className="card flex flex-col">
          <h3 className="mb-3 font-semibold text-white">Output</h3>
          <CodeOutput language={language} code={code} runId={runId} />
          <p className="mt-2 text-xs text-slate-500">
            Runs in your browser · Python, JavaScript & HTML supported.
          </p>
        </div>
      </div>

      {/* AI explanation */}
      {loading && <Spinner label="Writing your code…" />}
      {explanation && (
        <div className="card">
          <h3 className="mb-2 font-semibold text-brand-300">💡 Explanation</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
            {explanation}
          </p>
        </div>
      )}

      {/* Saved snippets */}
      <div>
        <h2 className="mb-3 text-xl font-bold">My Code</h2>
        {saved.length === 0 ? (
          <p className="text-sm text-slate-400">No saved snippets yet.</p>
        ) : (
          <div className="space-y-2">
            {saved.map((s) => (
              <div
                key={s.id}
                onClick={() => openSnippet(s.id)}
                className="card flex cursor-pointer items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-100">
                    📄 {s.title}{" "}
                    <span className="ml-1 rounded bg-white/10 px-2 py-0.5 text-xs text-brand-300">
                      {s.language}
                    </span>
                  </p>
                  <p className="text-sm text-slate-400">
                    {new Date(s.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={(e) => removeSnippet(s.id, e)}
                  title="Delete"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-500/15"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
