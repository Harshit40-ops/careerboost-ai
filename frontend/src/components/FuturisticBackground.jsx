// FuturisticBackground.jsx
// ------------------------
// A fixed, full-screen animated backdrop rendered once behind the whole app.
// Pure CSS/divs (no WebGL) so it's basically free for performance:
//   * a deep space-blue gradient base
//   * three large, slowly drifting blurred "orbs" that glow in brand colors
//   * a faint moving grid that gives a techy/futuristic feel
//   * a subtle vignette so content in the center stays readable

export default function FuturisticBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b1f] via-[#070712] to-[#04040a]" />

      {/* Moving grid overlay (fades out towards the bottom) */}
      <div
        className="animate-grid absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(99,102,241,0.25) 1px, transparent 1px)," +
            "linear-gradient(to bottom, rgba(99,102,241,0.25) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(ellipse at 50% 0%, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 0%, black 30%, transparent 80%)",
        }}
      />

      {/* Glowing orbs */}
      <div className="animate-blob absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="animate-blob animation-delay-2000 absolute right-0 top-1/3 h-80 w-80 rounded-full bg-fuchsia-600/25 blur-3xl" />
      <div className="animate-blob animation-delay-4000 absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

      {/* Center vignette to keep text crisp */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(4,4,10,0.6)_100%)]" />
    </div>
  );
}
