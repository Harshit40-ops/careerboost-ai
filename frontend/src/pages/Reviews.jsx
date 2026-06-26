// Reviews.jsx
// -----------
// Ratings & reviews page: shows the average rating + distribution, lets the
// logged-in user leave/update their own 5-star review, and lists everyone's.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth.jsx";
import StarRating from "../components/StarRating.jsx";
import Spinner from "../components/Spinner.jsx";

function initials(name) {
  return (name || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function Reviews() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  function loadAll() {
    api.reviewSummary().then(setSummary).catch(() => {});
    api.listReviews().then(setReviews).catch((e) => setError(e.message));
  }

  useEffect(() => {
    loadAll();
    if (user) {
      api.myReview().then((r) => {
        if (r) {
          setRating(r.rating);
          setComment(r.comment);
        }
      }).catch(() => {});
    }
  }, [user]);

  async function submit() {
    setError("");
    setSavedMsg("");
    if (rating < 1) return setError("Please pick a star rating.");
    setSaving(true);
    try {
      await api.submitReview({ rating, comment });
      setSavedMsg("Thanks! Your review has been saved. 🙌");
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const avg = summary?.average || 0;
  const count = summary?.count || 0;
  const dist = summary?.distribution || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ratings & Reviews ⭐</h1>
        <p className="mt-1 text-slate-400">See what students think — and share your own.</p>
      </div>

      {/* Summary */}
      <div className="card grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="text-center">
          <div className="text-5xl font-extrabold text-amber-400">{avg.toFixed(1)}</div>
          <StarRating value={Math.round(avg)} />
          <div className="mt-1 text-sm text-slate-400">{count} review{count !== 1 ? "s" : ""}</div>
        </div>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const n = dist[String(star)] || 0;
            const pct = count ? (n / count) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-10 text-slate-400">{star}★</span>
                <div className="h-2 flex-1 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-slate-400">{n}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leave a review */}
      {user ? (
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Leave your review</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Your rating:</span>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <textarea
            className="input min-h-[100px] resize-y"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (optional)…"
            maxLength={1000}
          />
          {error && <div className="rounded-lg bg-red-500/15 px-4 py-2.5 text-sm text-red-300">{error}</div>}
          {savedMsg && <div className="rounded-lg bg-green-500/15 px-4 py-2.5 text-sm text-green-300">{savedMsg}</div>}
          <button onClick={submit} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Submit review"}
          </button>
        </div>
      ) : (
        <div className="card text-center text-slate-300">
          <Link to="/login" className="font-medium text-brand-300 hover:underline">Log in</Link>{" "}
          to leave a rating and review.
        </div>
      )}

      {/* All reviews */}
      <div>
        <h2 className="mb-3 text-xl font-bold">What students say</h2>
        {!reviews ? (
          <Spinner label="Loading reviews…" />
        ) : reviews.length === 0 ? (
          <p className="text-sm text-slate-400">No reviews yet — be the first!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-600 text-sm font-bold text-white">
                    {initials(r.name)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">{r.name}</p>
                    <StarRating value={r.rating} size="text-sm" />
                  </div>
                  <span className="ml-auto text-xs text-slate-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                {r.comment && <p className="mt-3 text-sm text-slate-300">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
