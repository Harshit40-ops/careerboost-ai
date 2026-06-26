// Dashboard.jsx
// -------------
// Lists the user's past analyses and draws a score-over-time line chart so they
// can track improvement.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import Spinner from "../components/Spinner.jsx";

function scoreColor(v) {
  return v >= 75 ? "text-green-400" : v >= 50 ? "text-amber-400" : "text-red-400";
}

export default function Dashboard() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .myAnalyses()
      .then(setItems)
      .catch((err) => setError(err.message));
  }, []);

  if (error)
    return (
      <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</div>
    );
  if (!items) return <Spinner label="Loading your history…" />;

  // Build chart data (label by date + index).
  const chartData = items.map((a, i) => ({
    name: `#${i + 1}`,
    score: a.overall_score,
    date: new Date(a.created_at).toLocaleDateString(),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <p className="mt-1 text-slate-400">Track how your resume score improves.</p>
        </div>
        <Link to="/analyze" className="btn-primary">
          + New Analysis
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center text-slate-400">
          <div className="text-5xl">📈</div>
          <p className="mt-3">No analyses yet. Run your first one to see progress here.</p>
          <Link to="/analyze" className="btn-primary mt-4">
            Analyze My Resume
          </Link>
        </div>
      ) : (
        <>
          {/* Trend chart */}
          <div className="card">
            <h3 className="mb-4 font-semibold text-white">Score over time</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.15)" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.15)" />
                  <Tooltip
                    formatter={(v) => [`${v}`, "Score"]}
                    labelFormatter={(l, p) => p?.[0]?.payload?.date || l}
                    contentStyle={{
                      background: "rgba(15,15,30,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "0.5rem",
                      color: "#e2e8f0",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#a78bfa"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#a78bfa" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History list */}
          <div className="card">
            <h3 className="mb-4 font-semibold text-white">History</h3>
            <div className="divide-y divide-white/10">
              {[...items].reverse().map((a) => (
                <div key={a.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-100">{a.job_title}</p>
                    <p className="text-sm text-slate-400">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className={`text-2xl font-bold ${scoreColor(a.overall_score)}`}>
                    {Math.round(a.overall_score)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
