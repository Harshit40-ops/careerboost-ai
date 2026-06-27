// App.jsx
// -------
// Defines every route in the app and the shared page chrome (background,
// Navbar, footer). Also shows a futuristic loading splash on first boot.

import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import FuturisticBackground from "./components/FuturisticBackground.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Analyzer from "./pages/Analyzer.jsx";
import Converters from "./pages/Converters.jsx";
import CoverLetter from "./pages/CoverLetter.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import History from "./pages/History.jsx";
import Interview from "./pages/Interview.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import MockInterview from "./pages/MockInterview.jsx";
import Notes from "./pages/Notes.jsx";
import Register from "./pages/Register.jsx";
import Reviews from "./pages/Reviews.jsx";
import Stats from "./pages/Stats.jsx";

export default function App() {
  // Show the splash screen briefly on first load for a polished entry.
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 1800);
    return () => clearTimeout(t);
  }, []);

  if (booting) return <LoadingScreen />;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Animated futuristic backdrop sits behind everything. */}
      <FuturisticBackground />

      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes require a logged-in user. */}
          <Route
            path="/analyze"
            element={
              <ProtectedRoute>
                <Analyzer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <Interview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cover-letter"
            element={
              <ProtectedRoute>
                <CoverLetter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-interview"
            element={
              <ProtectedRoute>
                <MockInterview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <Notes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          {/* Converters & Reviews are public — no login required. */}
          <Route path="/converters" element={<Converters />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/stats" element={<Stats />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <footer className="border-t border-white/10 py-6 text-center text-sm text-slate-500">
        <p>CareerBoost AI · Built for Indian college students</p>
        <p className="mt-1">
          Designed and made by{" "}
          <span className="bg-gradient-to-r from-brand-300 to-fuchsia-300 bg-clip-text font-semibold text-transparent">
            Harshit Sharma
          </span>
          {" · "}
          <Link to="/stats" className="text-slate-500 hover:text-brand-300">
            Stats
          </Link>
        </p>
      </footer>
    </div>
  );
}
