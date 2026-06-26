// judge.js
// --------
// Runs a student's solution against a problem's test cases IN THE BROWSER and
// returns per-test pass/fail. No server-side execution.
//
//   Python     -> executed via Pyodide (shared loader)
//   JavaScript -> executed inside a Web Worker (isolated + terminable, so an
//                 infinite loop can't freeze the page)
//
// runJudge(...) resolves to:
//   { supported: true,  results: [{ pass, got?, expected, error? }] }
//   { supported: true,  results: [], error: "..." }   (compile/timeout error)
//   { supported: false }                              (language can't run here)

import { getPyodide } from "./pyodideRunner.js";

export async function runJudge(language, code, functionName, tests, onStatus) {
  const lang = (language || "").toLowerCase();
  if (lang.includes("python") || lang === "py")
    return runPythonJudge(code, functionName, tests, onStatus);
  if (lang.includes("javascript") || lang === "js")
    return runJsJudge(code, functionName, tests);
  return { supported: false };
}

// ───────────────────────── Python ─────────────────────────
async function runPythonJudge(code, fn, tests, onStatus) {
  let py;
  try {
    py = await getPyodide(onStatus);
  } catch (e) {
    return { supported: true, results: [], error: e.message };
  }

  let buf = "";
  const sink = { batched: (s) => (buf += s) };
  py.setStdout(sink);
  py.setStderr(sink);

  // Pass user code + tests via globals to avoid string-escaping issues.
  py.globals.set("__user_code", code);
  py.globals.set("__tests_json", JSON.stringify(tests));

  const harness = `
import json
__out = []
try:
    exec(__user_code, globals())
    __tests = json.loads(__tests_json)
    for __t in __tests:
        try:
            __g = ${fn}(*__t["input"])
            __out.append({"pass": __g == __t["output"], "got": __g, "expected": __t["output"]})
        except Exception as __e:
            __out.append({"pass": False, "error": str(__e), "expected": __t["output"]})
except Exception as __e:
    __out = {"__error__": str(__e)}
print("@@JUDGE@@" + json.dumps(__out, default=str))
`;
  try {
    await py.runPythonAsync(harness);
  } catch (e) {
    return { supported: true, results: [], error: e.message };
  }

  const idx = buf.lastIndexOf("@@JUDGE@@");
  if (idx < 0) return { supported: true, results: [], error: buf || "No output." };
  let parsed;
  try {
    parsed = JSON.parse(buf.slice(idx + 9).trim());
  } catch {
    return { supported: true, results: [], error: "Could not read results." };
  }
  if (parsed && parsed.__error__)
    return { supported: true, results: [], error: parsed.__error__ };
  return { supported: true, results: parsed };
}

// ───────────────────────── JavaScript ─────────────────────────
function runJsJudge(code, fn, tests) {
  const workerSrc = `
    function deepEqual(a, b) {
      if (a === b) return true;
      if (typeof a !== typeof b) return false;
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (var i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
        return true;
      }
      if (a && b && typeof a === "object") {
        var ka = Object.keys(a), kb = Object.keys(b);
        if (ka.length !== kb.length) return false;
        return ka.every(function (k) { return deepEqual(a[k], b[k]); });
      }
      return false;
    }
    self.onmessage = function (e) {
      var code = e.data.code, fn = e.data.fn, tests = e.data.tests;
      try {
        (0, eval)(code + "\\n;self.__fn = (typeof " + fn + " !== 'undefined') ? " + fn + " : null;");
        var f = self.__fn;
        if (typeof f !== "function") {
          self.postMessage({ error: "Function '" + fn + "' is not defined." });
          return;
        }
        var results = [];
        for (var i = 0; i < tests.length; i++) {
          try {
            var got = f.apply(null, tests[i].input);
            results.push({ pass: deepEqual(got, tests[i].output), got: got, expected: tests[i].output });
          } catch (err) {
            results.push({ pass: false, error: String(err && err.message || err), expected: tests[i].output });
          }
        }
        self.postMessage({ results: results });
      } catch (err) {
        self.postMessage({ error: String(err && err.message || err) });
      }
    };
  `;

  return new Promise((resolve) => {
    let url, worker, timer;
    try {
      url = URL.createObjectURL(new Blob([workerSrc], { type: "text/javascript" }));
      worker = new Worker(url);
    } catch (e) {
      resolve({ supported: true, results: [], error: e.message });
      return;
    }
    // Kill runaway code after 5s.
    timer = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ supported: true, results: [], error: "Timed out (possible infinite loop)." });
    }, 5000);

    worker.onmessage = (e) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      if (e.data.error) resolve({ supported: true, results: [], error: e.data.error });
      else resolve({ supported: true, results: e.data.results });
    };
    worker.postMessage({ code, fn, tests });
  });
}
