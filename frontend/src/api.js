// api.js
// -------
// A tiny wrapper around fetch() so every component talks to the backend the
// same way. It automatically attaches the JWT token and parses JSON / errors.

// Empty string => same-origin (relative) requests, used when the backend also
// serves the built frontend. In local dev, .env.development points this at the
// separate FastAPI dev server on :8000.
const BASE_URL = import.meta.env.VITE_API_URL ?? "";

// Read/store the token in localStorage so a refresh keeps the user logged in.
export const tokenStore = {
  get: () => localStorage.getItem("cb_token"),
  set: (t) => localStorage.setItem("cb_token", t),
  clear: () => localStorage.removeItem("cb_token"),
};

// Core request helper. Throws an Error with a readable message on failure.
async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let payload = body;
  if (body && !isForm) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  // Try to read JSON either way (errors include a `detail` field from FastAPI).
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data.detail ||
      (Array.isArray(data) && data[0]?.msg) ||
      `Request failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : "Request failed");
  }
  return data;
}

// ── Public API methods used by the pages ──
export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),

  analyzeResume: (file, jobDescription, jobTitle) => {
    const form = new FormData();
    form.append("resume", file);
    form.append("job_description", jobDescription);
    form.append("job_title", jobTitle || "Untitled Role");
    return request("/resume/analyze", { method: "POST", body: form, isForm: true });
  },

  generateInterview: (payload) =>
    request("/interview/generate", { method: "POST", body: payload }),

  mockInterview: (payload) =>
    request("/interview/mock", { method: "POST", body: payload }),

  generateCoverLetter: (payload) =>
    request("/cover-letter/generate", { method: "POST", body: payload }),

  myAnalyses: () => request("/me/analyses"),
  analysisDetail: (id) => request(`/me/analyses/${id}`),
  deleteAnalysis: (id) => request(`/me/analyses/${id}`, { method: "DELETE" }),

  // Study notes
  generateNotes: (payload) => request("/notes/generate", { method: "POST", body: payload }),
  myNotes: () => request("/notes"),
  noteDetail: (id) => request(`/notes/${id}`),
  deleteNote: (id) => request(`/notes/${id}`, { method: "DELETE" }),

  // Code Lab
  codeAssist: (payload) => request("/code/assist", { method: "POST", body: payload }),
  saveSnippet: (payload) => request("/code/snippets", { method: "POST", body: payload }),
  mySnippets: () => request("/code/snippets"),
  snippetDetail: (id) => request(`/code/snippets/${id}`),
  deleteSnippet: (id) => request(`/code/snippets/${id}`, { method: "DELETE" }),

  // Practice Arena
  practiceTopics: () => request("/practice/topics"),
  practiceProblems: (topic) =>
    request(`/practice/problems${topic ? `?topic=${encodeURIComponent(topic)}` : ""}`),
  practiceProblem: (slug) => request(`/practice/problems/${slug}`),
  markSolved: (slug) => request(`/practice/problems/${slug}/solved`, { method: "POST" }),
  practiceProgress: () => request("/practice/progress"),

  // Reviews & ratings
  listReviews: () => request("/reviews"),
  reviewSummary: () => request("/reviews/summary"),
  myReview: () => request("/reviews/me"),
  submitReview: (payload) => request("/reviews", { method: "POST", body: payload }),

  // Converters return a binary file, so we download the blob directly.
  convertFile: (direction, file) => {
    const form = new FormData();
    form.append("file", file);
    return downloadBlob(`/convert/${direction}`, form);
  },
};

// Helper: POST a file and get back a downloadable Blob (for converters).
async function downloadBlob(path, form) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method: "POST", headers, body: form });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Conversion failed (${res.status})`);
  }
  // Try to read the suggested filename from the response headers.
  const disp = res.headers.get("Content-Disposition") || "";
  const match = disp.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : "converted";
  const blob = await res.blob();
  return { blob, filename };
}
