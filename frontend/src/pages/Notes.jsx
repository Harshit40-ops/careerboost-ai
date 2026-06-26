// Notes.jsx
// ---------
// AI Study Notes generator. A student enters a topic (and optionally pastes
// source material), and gets structured notes: summary, sections, key terms,
// and practice questions. Notes are saved and listed below ("My Notes"), can
// be re-opened, downloaded as PDF, or deleted.

import { useEffect, useState } from "react";
import { api } from "../api";
import ScanAnimation from "../components/ScanAnimation.jsx";
import TiltCard from "../components/TiltCard.jsx";
import { downloadNotesPdf } from "../utils/notesPdf.js";

const DETAILS = ["concise", "balanced", "detailed"];

// Renders the full structured notes content.
function NotesView({ note }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">{note.title}</h2>
          {note.summary && <p className="mt-1 text-slate-300">{note.summary}</p>}
        </div>
        <button onClick={() => downloadNotesPdf(note)} className="btn-ghost px-4 py-2 text-sm">
          ⬇ PDF
        </button>
      </div>

      {note.sections?.map((sec, i) => (
        <div key={i}>
          <h3 className="mb-2 font-semibold text-brand-300">{sec.heading}</h3>
          <ul className="space-y-1.5">
            {sec.points.map((p, j) => (
              <li key={j} className="flex gap-2 text-sm text-slate-200">
                <span className="text-brand-400">▹</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {note.key_terms?.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold text-brand-300">Key Terms</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {note.key_terms.map((t, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
                <span className="font-semibold text-white">{t.term}</span>
                <span className="text-slate-300"> — {t.definition}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {note.questions?.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold text-brand-300">Practice Questions</h3>
          <ol className="space-y-1.5">
            {note.questions.map((q, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-200">
                <span className="font-semibold text-brand-400">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function Notes() {
  const [topic, setTopic] = useState("");
  const [detail, setDetail] = useState("balanced");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState(null);

  const [saved, setSaved] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [openNote, setOpenNote] = useState(null);

  function loadSaved() {
    api.myNotes().then(setSaved).catch(() => {});
  }
  useEffect(loadSaved, []);

  async function generate() {
    setError("");
    if (topic.trim().length < 2) return setError("Please enter a topic.");
    setLoading(true);
    setNote(null);
    try {
      const res = await api.generateNotes({
        topic,
        source_text: source || null,
        detail,
      });
      setNote(res);
      loadSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function openSaved(id) {
    if (openId === id) {
      setOpenId(null);
      setOpenNote(null);
      return;
    }
    setOpenId(id);
    setOpenNote(null);
    try {
      setOpenNote(await api.noteDetail(id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeSaved(id, e) {
    e.stopPropagation();
    if (!window.confirm("Delete this note?")) return;
    try {
      await api.deleteNote(id);
      setSaved((p) => p.filter((n) => n.id !== id));
      if (openId === id) {
        setOpenId(null);
        setOpenNote(null);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">AI Study Notes</h1>
        <p className="mt-1 text-slate-400">
          Turn any topic into clean, exam-ready notes — saved for later.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Generator */}
        <TiltCard className="card space-y-4" glow max={4}>
          <div>
            <label className="label">Topic</label>
            <input
              className="input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. DBMS - Normalization, or Newton's Laws"
              onKeyDown={(e) => e.key === "Enter" && generate()}
            />
          </div>
          <div>
            <label className="label">Detail level</label>
            <select className="input" value={detail} onChange={(e) => setDetail(e.target.value)}>
              {DETAILS.map((d) => (
                <option key={d} value={d}>
                  {d[0].toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Paste source material (optional)</label>
            <textarea
              className="input min-h-[120px] resize-y"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Paste a chapter / article and AI will turn it into notes…"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</div>
          )}

          <button onClick={generate} disabled={loading} className="btn-primary w-full">
            {loading ? "Generating…" : "Generate Notes"}
          </button>
        </TiltCard>

        {/* Output */}
        <div className="card">
          {loading && <ScanAnimation label="Writing your notes…" />}
          {!loading && !note && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-slate-400">
              <div className="text-5xl">📚</div>
              <p className="mt-3">Your study notes will appear here.</p>
            </div>
          )}
          {!loading && note && <NotesView note={note} />}
        </div>
      </div>

      {/* Saved notes */}
      <div>
        <h2 className="mb-3 text-xl font-bold">My Notes</h2>
        {saved.length === 0 ? (
          <p className="text-sm text-slate-400">No saved notes yet — generate your first above.</p>
        ) : (
          <div className="space-y-3">
            {saved.map((n) => (
              <div key={n.id} className="card">
                <div
                  onClick={() => openSaved(n.id)}
                  className="flex cursor-pointer items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-100">📘 {n.topic}</p>
                    <p className="text-sm text-slate-400">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => removeSaved(n.id, e)}
                      title="Delete"
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-500/15"
                    >
                      🗑
                    </button>
                    <span className="text-slate-400">{openId === n.id ? "▲" : "▼"}</span>
                  </div>
                </div>
                {openId === n.id && openNote && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <NotesView note={openNote} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
