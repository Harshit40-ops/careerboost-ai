// Converters.jsx
// --------------
// Two file converters: PDF → DOCX and DOCX → PDF.
// Upload a file, click Convert, and the result downloads automatically.

import { useRef, useState } from "react";
import { api } from "../api";
import TiltCard from "../components/TiltCard.jsx";

// One converter card (reused for both directions).
function ConvertCard({ title, emoji, direction, accept, hint }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const inputRef = useRef(null);

  function pick(f) {
    setError("");
    setDone("");
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(accept)) {
      setError(`Please choose a ${accept.toUpperCase()} file.`);
      return;
    }
    setFile(f);
  }

  async function convert() {
    if (!file) return setError("Please choose a file first.");
    setLoading(true);
    setError("");
    setDone("");
    try {
      const { blob, filename } = await api.convertFile(direction, file);
      // Trigger the browser download.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setDone(`Downloaded ${filename}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TiltCard className="card space-y-4" glow max={5}>
      <div>
        <h3 className="text-lg font-semibold text-white">
          {emoji} {title}
        </h3>
        <p className="text-sm text-slate-400">{hint}</p>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-white/15 p-6 text-center transition hover:bg-white/5"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <div className="text-3xl">📁</div>
        <p className="mt-2 text-sm font-medium text-slate-200">
          {file ? file.name : `Click to choose a ${accept.toUpperCase()} file`}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/15 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}
      {done && (
        <div className="rounded-lg bg-green-500/15 px-4 py-2.5 text-sm text-green-300">
          ✓ {done}
        </div>
      )}

      <button onClick={convert} disabled={loading} className="btn-primary w-full">
        {loading ? "Converting…" : "Convert & Download"}
      </button>
    </TiltCard>
  );
}

export default function Converters() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">File Converters</h1>
        <p className="mt-1 text-slate-400">
          Convert your resume between PDF and Word — free, right in the browser.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ConvertCard
          title="PDF → Word"
          emoji="📄"
          direction="pdf-to-docx"
          accept=".pdf"
          hint="Turn a PDF into an editable .docx document."
        />
        <ConvertCard
          title="Word → PDF"
          emoji="📝"
          direction="docx-to-pdf"
          accept=".docx"
          hint="Turn a .docx document into a clean PDF."
        />
      </div>

      <p className="text-center text-xs text-slate-500">
        Max file size 5 MB · Files are converted on the server and not stored.
      </p>
    </div>
  );
}
