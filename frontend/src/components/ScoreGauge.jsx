// ScoreGauge.jsx
// --------------
// An animated circular gauge (pure SVG, no chart library) that fills up to the
// given score. Color shifts red -> amber -> green based on the value.

import { useEffect, useState } from "react";

export default function ScoreGauge({ score = 0, size = 180, label = "Overall" }) {
  // Animate from 0 to the target score on mount for a nice effect.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const target = Math.max(0, Math.min(100, score));
    let frame;
    const start = performance.now();
    const duration = 900;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - shown / 100);

  const color =
    shown >= 75 ? "#16a34a" : shown >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
        />
      </svg>
      {/* Center label sits on top of the rotated svg */}
      <div className="-mt-[120px] mb-[40px] text-center">
        <div className="text-4xl font-extrabold" style={{ color }}>
          {Math.round(shown)}
        </div>
        <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      </div>
    </div>
  );
}
