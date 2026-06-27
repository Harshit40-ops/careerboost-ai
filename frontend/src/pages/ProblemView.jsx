// ProblemView.jsx
// ---------------
// Solve a single Practice problem: read the statement, write a solution in
// Python or JavaScript, Run it (console) or Submit it (judged against the
// problem's hidden + visible test cases in the browser).

import { useEffect, useState } from "react";
import { api } from "../api";
import CodeOutput from "../components/CodeOutput.jsx";
import Spinner from "../components/Spinner.jsx";
import { runJudge } from "../utils/judge.js";

const DIFF_COLOR = {
  Easy: "text-green-400 bg-green-500/15",
  Medium: "text-amber-400 bg-amber-500/15",
  Hard: "text-red-400 bg-red-500/15",
};

// Shows a short value preview for the results table.
function show(v) {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export default function ProblemView({ slug, onBack, onSolved }) {
  const [p, setP] = useState(null);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [runId, setRunId] = useState(0);
  const [mode, setMode] = useState("idle"); // idle | run | judge
  const [judging, setJudging] = useState(false);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState(null);
  const [solved, setSolved] = useState(false);

  // Load the problem once.
  useEffect(() => {
    api
      .practiceProblem(slug)
      .then((data) => {
        setP(data);
        setSolved(!!data.solved);
        setCode(data.starter[language] || "");
      })
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Switching language loads that language's starter code.
  function switchLang(lang) {
    setLanguage(lang);
    setCode(p?.starter[lang] || "");
    setResults(null);
    setMode("idle");
  }

  function onEditorKey(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.target;
      const s = el.selectionStart;
      setCode(code.slice(0, s) + "  " + code.slice(el.selectionEnd));
      requestAnimationFrame(() => (el.selectionStart = el.selectionEnd = s + 2));
    }
  }

  async function submit() {
    setMode("judge");
    setJudging(true);
    setResults(null);
    setStatus("");
    const res = await runJudge(language, code, p.function_name, p.tests, setStatus);
    setJudging(false);
    setStatus("");
    if (!res.supported) {
      setError(`Submission only runs Python or JavaScript here. Switch language.`);
      return;
    }
    if (res.error) {
      setResults({ error: res.error });
      return;
    }
    setResults({ cases: res.results });
    const allPass = res.results.length > 0 && res.results.every((r) => r.pass);
    if (allPass && !solved) {
      setSolved(true);
      try {
        await api.markSolved(slug);
        onSolved?.(slug);
      } catch {
        /* non-fatal */
      }
    }
  }

  if (error && !p)
    return <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</div>;
  if (!p) return <Spinner label="Loading problem…" />;

  const passCount = results?.cases?.filter((r) => r.pass).length || 0;
  const total = results?.cases?.length || 0;
  const allPass = total > 0 && passCount === total;

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm text-brand-300 hover:underline">
        ← Back to problems
      </button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Statement */}
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{p.title}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DIFF_COLOR[p.difficulty]}`}>
              {p.difficulty}
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-slate-300">
              {p.topic}
            </span>
            {solved && (
              <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-400">
                ✓ Solved
              </span>
            )}
          </div>

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
            {p.description}
          </p>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-brand-300">Examples</h3>
            <div className="space-y-2">
              {p.examples.map((ex, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
                  <div><span className="text-slate-400">Input: </span><code className="text-slate-100">{ex.input}</code></div>
                  <div><span className="text-slate-400">Output: </span><code className="text-slate-100">{ex.output}</code></div>
                  {ex.explanation && <div className="mt-1 text-slate-400">{ex.explanation}</div>}
                </div>
              ))}
            </div>
          </div>

          {p.constraints?.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-brand-300">Constraints</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                {p.constraints.map((c, i) => <li key={i}><code>{c}</code></li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Editor + run/submit */}
        <div className="card flex flex-col">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
              {["python", "javascript"].map((l) => (
                <button
                  key={l}
                  onClick={() => switchLang(l)}
                  className={`rounded-md px-3 py-1 text-sm transition ${
                    language === l ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setMode("run"); setRunId((n) => n + 1); }} className="btn-ghost px-4 py-1.5 text-sm">
                ▶ Run
              </button>
              <button onClick={submit} disabled={judging} className="btn-primary px-4 py-1.5 text-sm">
                {judging ? "Judging…" : "✅ Submit"}
              </button>
            </div>
          </div>

          <textarea
            className="input min-h-[260px] flex-1 resize-y font-mono text-[13px] leading-relaxed"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={onEditorKey}
            spellCheck={false}
          />

          {/* Output area */}
          <div className="mt-3">
            {mode === "run" && (
              <CodeOutput language={language} code={code} runId={runId} />
            )}

            {mode === "judge" && (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                {judging && <Spinner label={status || "Running test cases…"} />}

                {!judging && results?.error && (
                  <div className="text-sm text-red-300">
                    <b>Error:</b> {results.error}
                  </div>
                )}

                {!judging && results?.cases && (
                  <>
                    <div className={`mb-2 font-semibold ${allPass ? "text-green-400" : "text-amber-400"}`}>
                      {allPass ? "🎉 Accepted — all tests passed!" : `${passCount}/${total} test cases passed`}
                    </div>
                    <div className="space-y-1.5">
                      {results.cases.map((r, i) => (
                        <div key={i} className="rounded-md bg-white/5 p-2 text-xs">
                          <span className={r.pass ? "text-green-400" : "text-red-400"}>
                            {r.pass ? "✓" : "✗"} Test {i + 1}
                          </span>
                          {!r.pass && (
                            <span className="ml-2 text-slate-400">
                              {r.error
                                ? `error: ${r.error}`
                                : `got ${show(r.got)}, expected ${show(r.expected)}`}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
