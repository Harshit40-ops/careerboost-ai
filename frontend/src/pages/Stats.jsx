// Stats.jsx
// ---------
// Founder dashboard: live aggregate usage numbers (how many people are using
// the platform). Public read-only — no personal data.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth.jsx";
import Spinner from "../components/Spinner.jsx";
import TiltCard from "../components/TiltCard.jsx";

const CARDS = [
  ["users", "Registered users", "👥"],
  ["analyses", "Resumes analyzed", "📄"],
  ["interviews", "Interview sets", "🎤"],
  ["notes", "Notes generated", "📚"],
  ["reviews", "Reviews", "⭐"],
  ["avg_rating", "Avg rating", "🌟"],
];

export default function Stats() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  function load() {
    api.getStats().then((d) => { setData(d); setError(""); }).catch((e) => setError(e.message));
  }
  useEffect(() => {
    if (!user) return; // don't call the API if not logged in
    load();
    const t = setInterval(load, 15000); // refresh every 15s
    return () => clearInterval(t);
  }, [user]);

  // Not logged in → ask to log in.
  if (!user)
    return (
      <div className="card mx-auto max-w-md text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="mt-3 text-2xl font-bold">Founder only</h1>
        <p className="mt-2 text-slate-400">
          Ye page sirf founder ke liye hai. Apne founder account se login karo.
        </p>
        <Link to="/login" className="btn-primary mt-4 inline-block">Log in</Link>
      </div>
    );

  // Logged in but not the founder (403), or any error.
  if (error)
    return (
      <div className="card mx-auto max-w-md text-center">
        <div className="text-5xl">⛔</div>
        <h1 className="mt-3 text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-slate-400">{error}</p>
      </div>
    );

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
