// useTypewriter.js
// ----------------
// A small hook that "types out" a string character-by-character for a
// sci-fi / live-AI feel.
//
//   const { shown, done } = useTypewriter(fullText, 12); // 12ms per char
//
// Whenever `text` changes it restarts the animation. Returns the partial
// string shown so far and a `done` flag.

import { useEffect, useState } from "react";

export function useTypewriter(text, speed = 14) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) {
      setShown("");
      setDone(true);
      return;
    }
    setShown("");
    setDone(false);

    let i = 0;
    // Reveal a few chars per tick so long text isn't painfully slow.
    const step = Math.max(1, Math.round(text.length / 600));
    const id = setInterval(() => {
      i += step;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setShown(text);
        setDone(true);
      }
    }, speed);

    return () => clearInterval(id);
  }, [text, speed]);

  return { shown, done };
}
