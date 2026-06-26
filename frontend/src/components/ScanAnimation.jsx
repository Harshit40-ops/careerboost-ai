// ScanAnimation.jsx
// -----------------
// A sci-fi "scanning" animation shown while a resume is being analyzed:
// a mock document with a glowing neon line sweeping up and down over it.

export default function ScanAnimation({ label = "Scanning your resume…" }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-5">
      {/* Mock resume sheet */}
      <div className="relative h-[240px] w-[180px] overflow-hidden rounded-lg border border-white/15 bg-white/5 p-4">
        {/* Fake text lines */}
        <div className="space-y-2">
          <div className="h-3 w-2/3 rounded bg-white/15" />
          <div className="h-2 w-1/2 rounded bg-white/10" />
          <div className="mt-4 h-2 w-full rounded bg-white/10" />
          <div className="h-2 w-5/6 rounded bg-white/10" />
          <div className="h-2 w-full rounded bg-white/10" />
          <div className="mt-4 h-2 w-3/4 rounded bg-white/10" />
          <div className="h-2 w-full rounded bg-white/10" />
          <div className="h-2 w-2/3 rounded bg-white/10" />
          <div className="mt-4 h-2 w-1/2 rounded bg-white/10" />
          <div className="h-2 w-5/6 rounded bg-white/10" />
        </div>

        {/* Glowing scan line */}
        <div className="scan-line absolute left-0 right-0 top-0 h-10 bg-gradient-to-b from-transparent via-brand-400/40 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400 shadow-[0_0_14px_4px_rgba(129,140,248,0.8)]" />
        </div>
      </div>

      <p className="text-sm text-brand-300">
        <span className="animate-pulse">{label}</span>
      </p>
    </div>
  );
}
