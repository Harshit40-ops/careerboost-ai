// TypeOut.jsx
// -----------
// Renders text with a live typewriter effect + a blinking cursor while typing.
// Each instance animates once (it remembers progress across re-renders), so
// only newly-added messages animate — older ones stay fully shown.

import { useTypewriter } from "../hooks/useTypewriter.js";

export default function TypeOut({ text, speed = 12 }) {
  const { shown, done } = useTypewriter(text, speed);
  return (
    <span>
      {shown}
      {!done && (
        <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-brand-300 align-middle" />
      )}
    </span>
  );
}
