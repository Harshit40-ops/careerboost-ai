// Landing page: short pitch + primary CTA.
import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import TiltCard from "../components/TiltCard.jsx";

// The 3D scene is heavy (Three.js), so we lazy-load it. This keeps the rest of
// the page fast and means a WebGL hiccup never blocks the main content.
const Hero3D = lazy(() => import("../components/Hero3D.jsx"));

const FEATURES = [
  {
    title: "3-Layer ATS Scoring",
    desc: "Clean parsing + semantic embeddings + an LLM rubric for an accurate, stable score — not naive keyword counting.",
    icon: "🎯",
  },
  {
    title: "Job-Specific Match",
    desc: "Always scored against the exact job description you're targeting, so feedback is relevant.",
    icon: "🧩",
  },
  {
    title: "Interview Prep",
    desc: "Generate role-specific technical, behavioral, and HR questions with hints on what to focus on.",
    icon: "🎤",
  },
  {
    title: "Track Progress",
    desc: "See your scores improve over time on a simple dashboard chart.",
    icon: "📈",
  },
];

export default function Landing() {
  const { user } = useAuth();
  const ctaTo = user ? "/analyze" : "/register";

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="grid items-center gap-10 pt-6 md:grid-cols-2">
        <div>
          <span className="inline-block rounded-full bg-brand-500/15 px-3 py-1 text-sm font-medium text-brand-300">
            For Indian college students
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Beat the ATS. <span className="text-brand-400">Land the interview.</span>
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            CareerBoost AI scores your resume against a specific job description
            using a smart 3-layer engine, then tells you exactly what to fix.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={ctaTo} className="btn-primary">
              Analyze My Resume →
            </Link>
            <Link to="/interview" className="btn-ghost">
              Try Interview Prep
            </Link>
          </div>
        </div>

        {/* 3D visual with the sample score card floating on top. */}
        <div className="relative h-[460px] w-full">
          {/* Animated 3D scene fills the area behind the card. */}
          <div className="absolute inset-0">
            <Suspense fallback={null}>
              <Hero3D />
            </Suspense>
          </div>

          {/* Glass score card floats over the lower part of the 3D scene. */}
          <div className="card absolute bottom-0 left-0 right-0 z-10 bg-white/[0.07]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Sample result</p>
                <p className="text-lg font-semibold">Backend Engineer</p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-full bg-green-500/15 text-2xl font-bold text-green-400">
                82
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ["Skills match", 88],
                ["Experience relevance", 80],
                ["Keyword coverage", 74],
                ["Format & readability", 90],
              ].map(([name, val]) => (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-300">{name}</span>
                    <span className="font-medium">{val}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <TiltCard key={f.title} className="card" glow>
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-3 font-semibold text-white">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-300">{f.desc}</p>
          </TiltCard>
        ))}
      </section>
    </div>
  );
}
