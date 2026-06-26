// Stats.jsx
// ---------
// Founder dashboard: live aggregate usage numbers (how many people are using
// the platform). Public read-only — no personal data.

import { useEffect, useState } from "react";
import { api } from "../api";
import Spinner from "../components/Spinner.jsx";
import TiltCard from "../components/TiltCard.jsx";

const CARDS = [
  ["users", "Registered users", "👥"],
  ["analyses", "Resumes analyzed", "📄"],
  ["problems_solved", "Problems solved", "🧩"],
  ["interviews", "Interview sets", "🎤"],
  ["notes", "Notes generated", "📚"],
  ["code_snippets", "Code snippets", "👨‍💻"],
  ["reviews", "Reviews", "⭐"],
  ["avg_rating", "Avg rating", "🌟"],
];

export default function Stats() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  function load() {
    api.getStats().then(setData).catch((e) => setError(e.message));
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 15000); // refresh every 15s
    return () => clearInterval(t);
  }, []);

  if (error)
    return <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</div>;
  if (!data) return <Spinner label="Loading stats…" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Founder Dashboard 📊</h1>
        <p className="mt-1 text-slate-400">
          Live usage across CareerBoost AI · auto-refreshes every 15s.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map(([key, label, icon]) => (
          <TiltCard key={key} className="card text-center" glow max={6}>
            <div className="text-3xl">{icon}</div>
            <div className="mt-2 text-4xl font-extrabold text-brand-300">
              {data[key] ?? 0}
            </div>
            <div className="mt-1 text-sm text-slate-400">{label}</div>
          </TiltCard>
        ))}
      </div>

      <p className="text-center text-xs text-slate-500">
        Sirf aapke (founder) liye — numbers real-time database se aate hain.
      </p>
    </div>
  );
}
