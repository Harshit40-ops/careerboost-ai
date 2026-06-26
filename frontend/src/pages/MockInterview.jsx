// MockInterview.jsx
// -----------------
// A chat-style mock interview. The AI plays the interviewer: it asks a
// question, you type an answer, it gives short feedback and asks the next one.
// We keep the whole conversation in state and send it to the backend each turn.

import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import TypeOut from "../components/TypeOut.jsx";

export default function MockInterview() {
  const [role, setRole] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]); // {role:"interviewer"|"candidate", content}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  // Auto-scroll to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function ask(history) {
    setLoading(true);
    setError("");
    try {
      const res = await api.mockInterview({ role, messages: history });
      setMessages([...history, { role: "interviewer", content: res.reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function startInterview() {
    if (role.trim().length < 2) return setError("Please enter a role first.");
    setStarted(true);
    setMessages([]);
    await ask([]); // empty history -> AI greets + asks first question
  }

  async function sendAnswer() {
    const text = input.trim();
    if (!text || loading) return;
    const history = [...messages, { role: "candidate", content: text }];
    setMessages(history);
    setInput("");
    await ask(history);
  }

  function reset() {
    setStarted(false);
    setMessages([]);
    setInput("");
    setError("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Mock Interview</h1>
          <p className="mt-1 text-slate-400">
            Practice with an AI interviewer that gives live feedback.
          </p>
        </div>
        {started && (
          <button onClick={reset} className="btn-ghost px-4 py-2 text-sm">
            ↺ Restart
          </button>
        )}
      </div>

      {!started ? (
        <div className="card max-w-xl space-y-4">
          <div>
            <label className="label">Which role are you interviewing for?</label>
            <input
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Frontend Developer"
              onKeyDown={(e) => e.key === "Enter" && startInterview()}
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <button onClick={startInterview} className="btn-primary w-full">
            Start Interview
          </button>
        </div>
      ) : (
        <div className="card flex h-[60vh] flex-col">
          {/* Chat transcript */}
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "candidate" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "candidate"
                      ? "bg-gradient-to-br from-brand-600 to-fuchsia-600 text-white"
                      : "bg-white/10 text-slate-100"
                  }`}
                >
                  {m.role === "interviewer" && (
                    <div className="mb-1 text-xs font-semibold text-brand-300">
                      Interviewer 🎤
                    </div>
                  )}
                  {m.role === "interviewer" ? <TypeOut text={m.content} /> : m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm text-slate-400">
                  <span className="animate-pulse">Interviewer is typing…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mt-3 rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Answer input */}
          <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
            <input
              className="input flex-1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendAnswer()}
              placeholder="Type your answer…"
              disabled={loading}
            />
            <button onClick={sendAnswer} disabled={loading} className="btn-primary px-5">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
