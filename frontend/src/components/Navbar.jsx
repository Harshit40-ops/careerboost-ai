// Navbar.jsx
// ----------
// Professional, compact navigation: related links are grouped into hover
// dropdown menus on desktop (saves horizontal space), and collapse into a
// hamburger panel on mobile.

import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

// Grouped menus for logged-in users.
const GROUPS = [
  ["Resume", [
    ["Analyze Resume", "/analyze"],
    ["Cover Letter", "/cover-letter"],
    ["Dashboard", "/dashboard"],
    ["History", "/history"],
  ]],
  ["Interview", [
    ["Mock Interview", "/mock-interview"],
    ["Question Generator", "/interview"],
  ]],
  ["Study Tools", [
    ["AI Notes", "/notes"],
    ["File Converters", "/converters"],
  ]],
];

const itemClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm transition ${
    isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
  }`;

// A desktop hover dropdown.
function Menu({ label, items }) {
  return (
    <div className="group relative">
      <button className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
        {label}
        <span className="text-[10px] opacity-70 transition group-hover:rotate-180">▾</span>
      </button>
      {/* pt-2 bridges the gap so hover stays active */}
      <div className="absolute left-0 top-full z-30 hidden min-w-[200px] pt-2 group-hover:block">
        <div className="rounded-xl border border-white/10 bg-[#0b0b1f]/95 p-1.5 shadow-xl shadow-black/40 backdrop-blur-xl">
          {items.map(([l, to]) => (
            <NavLink key={to} to={to} className={itemClass}>
              {l}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false); // mobile panel

  function handleLogout() {
    logout();
    setOpen(false);
    navigate("/");
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070712]/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            CB
          </span>
          CareerBoost&nbsp;AI
        </Link>

        {/* ── Desktop nav ── */}
        <div className="hidden items-center gap-1 lg:flex">
          {user ? (
            <>
              {GROUPS.map(([label, items]) => (
                <Menu key={label} label={label} items={items} />
              ))}
              <NavLink to="/reviews" className={linkClass}>
                Reviews
              </NavLink>
              <span className="mx-2 hidden text-sm text-slate-400 xl:inline">
                Hi, {user.name.split(" ")[0]}
              </span>
              <button onClick={handleLogout} className="btn-ghost px-4 py-2 text-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/converters" className={linkClass}>Converters</NavLink>
              <NavLink to="/reviews" className={linkClass}>Reviews</NavLink>
              <NavLink to="/login" className={linkClass}>Login</NavLink>
              <Link to="/register" className="btn-primary px-4 py-2 text-sm">Get Started</Link>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg border border-white/10 p-2 text-slate-200 lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {/* ── Mobile panel ── */}
      {open && (
        <div className="border-t border-white/10 bg-[#070712]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
          {user ? (
            <div className="space-y-3" onClick={() => setOpen(false)}>
              {GROUPS.map(([label, items]) => (
                <div key={label}>
                  <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {items.map(([l, to]) => (
                      <NavLink key={to} to={to} className={itemClass}>{l}</NavLink>
                    ))}
                  </div>
                </div>
              ))}
              <NavLink to="/reviews" className={itemClass}>Reviews</NavLink>
              <button onClick={handleLogout} className="btn-ghost mt-2 w-full">Logout</button>
            </div>
          ) : (
            <div className="space-y-1" onClick={() => setOpen(false)}>
              <NavLink to="/converters" className={itemClass}>Converters</NavLink>
              <NavLink to="/reviews" className={itemClass}>Reviews</NavLink>
              <NavLink to="/login" className={itemClass}>Login</NavLink>
              <Link to="/register" className="btn-primary mt-2 block text-center">Get Started</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
