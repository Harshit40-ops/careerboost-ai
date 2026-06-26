// CodeOutput.jsx
// --------------
// Runs the student's code in the browser and shows the output:
//   * HTML        -> live preview inside a sandboxed iframe
//   * JavaScript  -> runs in a sandboxed iframe; console output is captured
//   * Python      -> runs via Pyodide (Python compiled to WebAssembly), loaded
//                    lazily from a CDN the first time it's used
//
// Running in an iframe with sandbox="allow-scripts" keeps user code isolated
// from the rest of the app.

import { useEffect, useState } from "react";
import { getPyodide } from "../utils/pyodideRunner.js";

// HTML wrapper that runs user JS and prints console output into the page.
const JS_TEMPLATE = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{font-family:ui-monospace,Menlo,Consolas,monospace;color:#e2e8f0;background:#0b0b1f;padding:10px;font-size:13px;white-space:pre-wrap;margin:0}
  .err{color:#fca5a5}
</style></head><body><div id="__o"></div><script>
  var o=document.getElementById('__o');
  function w(cls,args){var d=document.createElement('div');if(cls)d.className=cls;
    d.textContent=Array.prototype.map.call(args,function(a){try{return typeof a==='object'?JSON.stringify(a):String(a)}catch(e){return String(a)}}).join(' ');o.appendChild(d);}
  console.log=function(){w('',arguments)};console.info=console.log;console.warn=console.log;
  console.error=function(){w('err',arguments)};
  window.onerror=function(m){w('err',[m]);return true};
  try{
/*USER*/
  }catch(e){w('err',[e.message])}
<\/script></body></html>`;

export default function CodeOutput({ language, code, runId }) {
  const [srcDoc, setSrcDoc] = useState("");
  const [mode, setMode] = useState("idle"); // idle | frame | python | unsupported
  const [pyOut, setPyOut] = useState("");
  const [status, setStatus] = useState("");

  const lang = (language || "").toLowerCase();
  const isHtml = lang === "html";
  const isJs = lang.includes("javascript") || lang === "js" || lang === "node";
  const isPy = lang.includes("python") || lang === "py";

  useEffect(() => {
    if (!runId) return;
    if (isHtml) {
      setSrcDoc(code);
      setMode("frame");
    } else if (isJs) {
      const safe = code.replace(/<\/script>/gi, "<\\/script>");
      setSrcDoc(JS_TEMPLATE.replace("/*USER*/", safe));
      setMode("frame");
    } else if (isPy) {
      runPython();
    } else {
      setMode("unsupported");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  async function runPython() {
    setMode("python");
    setPyOut("");
    setStatus("");
    try {
      const py = await getPyodide(setStatus);
      setStatus("Running…");
      let buf = "";
      const sink = { batched: (s) => { buf += s; setPyOut(buf); } };
      py.setStdout(sink);
      py.setStderr(sink);
      await py.runPythonAsync(code);
      setStatus("");
      if (!buf) setPyOut("(ran successfully — no output)");
    } catch (e) {
      setStatus("");
      setPyOut((prev) => prev + "\nError: " + e.message);
    }
  }

  if (mode === "idle")
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-slate-400">
        Output will appear here after you Run ▶
      </div>
    );

  if (mode === "unsupported")
    return (
      <div className="p-4 text-sm text-amber-300">
        In-browser run isn't available for <b>{language}</b>. You can still copy,
        save, or download this code. (Runnable: Python, JavaScript, HTML.)
      </div>
    );

  if (mode === "python")
    return (
      <div className="h-full overflow-auto rounded-lg bg-[#0b0b1f] p-3 font-mono text-[13px] text-slate-100">
        {status && <div className="mb-2 animate-pulse text-brand-300">{status}</div>}
        <pre className="whitespace-pre-wrap">{pyOut}</pre>
      </div>
    );

  // frame mode (HTML preview or JS console)
  return (
    <iframe
      title="code-output"
      sandbox="allow-scripts allow-modals"
      srcDoc={srcDoc}
      className="h-full min-h-[200px] w-full rounded-lg border border-white/10 bg-white"
    />
  );
}
