// StarRating.jsx
// --------------
// A 5-star rating widget. Interactive (click/hover to set) when `onChange` is
// given; otherwise read-only for displaying a rating.

import { useState } from "react";

export default function StarRating({ value = 0, onChange, size = "text-2xl" }) {
  const [hover, setHover] = useState(0);
  const readOnly = !onChange;
  const shown = hover || value;

  return (
    <div className={`inline-flex ${readOnly ? "" : "cursor-pointer"} select-none`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`${size} transition ${n <= shown ? "text-amber-400" : "text-slate-600"}`}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          role={readOnly ? undefined : "button"}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
