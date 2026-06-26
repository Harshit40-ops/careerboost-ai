// LoadingScreen.jsx
// -----------------
// A futuristic full-screen splash / loading screen. Used:
//   * once when the app first boots (in App.jsx), and
//   * reusable anywhere you need a themed loading state.
//
// Visuals: a glowing rotating ring around the "CB" logo, a gradient title,
// and an indeterminate progress bar — all on the dark futuristic background.

import FuturisticBackground from "./FuturisticBackground.jsx";

export default function LoadingScreen({ message = "Initializing CareerBoost AI…" }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center">
      <FuturisticBackground />

      {/* Logo with spinning glow ring */}
      <div className="relative grid place-items-center">
        {/* Outer rotating gradient ring */}
        <div
          className="absolute h-32 w-32 animate-spin rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent, #6366f1, #d946ef, transparent)",
            animationDuration: "1.5s",
            maskImage: "radial-gradient(farthest-side, transparent 60%, black 62%)",
            WebkitMaskImage:
              "radial-gradient(farthest-side, transparent 60%, black 62%)",
          }}
        />
        {/* Logo tile */}
        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-600 text-2xl font-extrabold text-white shadow-[0_0_50px_rgba(99,102,241,0.6)]">
          CB
        </div>
      </div>

      {/* Title */}
      <h1 className="mt-8 bg-gradient-to-r from-brand-300 to-fuchsia-300 bg-clip-text text-2xl font-extrabold tracking-wide text-transparent">
        CareerBoost AI
      </h1>
      <p className="mt-2 text-sm text-slate-400">{message}</p>

      {/* Indeterminate progress bar */}
      <div className="mt-6 h-1 w-56 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full w-1/3 rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500"
          style={{ animation: "loadingbar 1.2s ease-in-out infinite" }}
        />
      </div>
    </div>
  );
}
