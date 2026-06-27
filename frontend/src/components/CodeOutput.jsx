// CodeOutput.jsx
// --------------
// Runs the student's code in the browser and shows the output:
//   * HTML        -> live preview inside a sandboxed iframe
//   * JavaScript  -> runs in a sandboxed iframe; console output is captured
//   * Python      -> runs via Pyodide (Python compiled to WebAssembly), loaded
//                    lazily from a CDN the first time it's used
//
// The output area has a FIXED height so it is always visible, and the iframe is
// keyed by runId so each Run re-executes the code.

import { useEffect, useState } from "react";
import { getPyodide } from "../utils/pyodideRunner.js";

// HTML wrapper that runs user JS and prints console output into the page.
const JS_TEMPLATE = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{font-family:ui-monospace,Menlo,Consolas,monospace;color:#e2e8f0;background:#0b0b1f;padding:10px;font-size:13px;white-space:pre-wrap;margin:0}
  .err{color:#fca5a5}.muted{color:#64748b}
</style></head><body><div id="__o"></div><script>
  var o=document.getElementById('__o');
  function w(cls,args){var d=document.createElement('div');if(cls)d.className=cls;
    d.textContent=Array.prototype.map.call(args,function(a){try{return typeof a==='object'?JSON.stringify(a):String(a)}catch(e){return String(a)}}).join(' ');o.appendChild(d);}
  console.log=function(){w('',arguments)};console.info=console.log;console.warn=console.log;console.debug=console.log;
  console.error=function(){w('err',arguments)};
  window.onerror=function(m){w('err',[m]);return true};
  try{
/*USER*/
  }catch(e){w('err',[e&&e.message?e.message:e])}
  if(!o.childNodes.length){w('muted',['(ran successfully - no console output)'])}
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
      setSrcDoc(code || "");
      setMode("frame");
    } else if (isJs) {
      const safe = (code || "").replace(/<\/script>/gi, "<\\/script>");
      // Use a replacer FUNCTION so `$` in user code isn't treated specially.
      setSrcDoc(JS_TEMPLATE.replace("/*USER*/", () => safe));
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
    setStatus("Loading Python runtime… (first run can take ~15s)");
    try {
      const py = await getPyodide(setStatus);
      setStatus("Running…");
      let buf = "";
      const sink = { batched: (s) => { buf += s; setPyOut(buf); } };
      py.setStdout(sink);
      py.setStderr(sink);
      await py.runPythonAsync(code || "");
      setStatus("");
      if (!buf) setPyOut("(ran successfully — no output)");
    } catch (e) {
      setStatus("");
      setPyOut((prev) => (prev ? prev + "\n" : "") + "Error: " + (e?.message || e));
    }
  }

  // Fixed-height frame so output is always visible (no layout collapse).
  const box = "h-[320px] w-full overflow-auto rounded-lg border border-white/10";

  if (mode === "idle")
    return (
      <div className={`${box} flex items-center justify-center bg-[#0b0b1f] text-sm text-slate-400`}>
        Output yahan dikhega — ▶ Run dabao
      </div>
    );

  if (mode === "unsupported")
    return (
      <div className={`${box} bg-[#0b0b1f] p-4 text-sm text-amber-300`}>
        In-browser run is available only for <b>Python, JavaScript & HTML</b>.
        <br />For <b>{language}</b> you can still copy / download the code.
      </div>
    );

  if (mode === "python")
    return (
      <div className={`${box} bg-[#0b0b1f] p-3 font-mono text-[13px] text-slate-100`}>
        {status && <div className="mb-2 animate-pulse text-brand-300">{status}</div>}
        <pre className="whitespace-pre-wrap">{pyOut}</pre>
      </div>
    );

  // frame mode (HTML preview or JS console). key={runId} forces a fresh run.
  return (
    <iframe
      key={runId}
      title="code-output"
      sandbox="allow-scripts allow-modals"
      srcDoc={srcDoc}
      className={`${box} bg-white`}
    />
  );
}
