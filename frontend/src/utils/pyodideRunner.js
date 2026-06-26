// pyodideRunner.js
// ----------------
// Loads Pyodide (CPython compiled to WebAssembly) once and caches it on
// `window.__cbPyodide`, so both the Code Lab runner and the Practice judge
// share a single instance. Loaded lazily from a CDN the first time it's needed.

let pyodidePromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some((s) => s.src === src)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Could not load the Python runtime (offline?)."));
    document.body.appendChild(s);
  });
}

export async function getPyodide(onStatus) {
  if (window.__cbPyodide) return window.__cbPyodide;
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      onStatus?.("Loading Python runtime (first run only)…");
      await loadScript("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
      const py = await window.loadPyodide();
      window.__cbPyodide = py;
      return py;
    })();
  }
  return pyodidePromise;
}
