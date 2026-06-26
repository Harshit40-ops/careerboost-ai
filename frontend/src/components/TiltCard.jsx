// TiltCard.jsx
// ------------
// A card that tilts in 3D towards the mouse and (optionally) has an animated
// neon gradient border. Wrap any content with it.
//
//   <TiltCard className="card" glow>...</TiltCard>

import { useRef } from "react";

export default function TiltCard({ children, className = "", glow = false, max = 8 }) {
  const ref = useRef(null);

  function handleMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Mouse position within the card, as -0.5 … 0.5
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    // Tilt: moving right tips on Y axis, moving down tips on X axis.
    el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) scale(1.01)`;
  }

  function reset() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={`tilt-card ${glow ? "neon-border" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
