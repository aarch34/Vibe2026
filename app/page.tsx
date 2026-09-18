import Link from "next/link";
import {
  Sparkles,
  QrCode,
  Trophy,
  Compass,
  ArrowRight,
  Shield,
  Coins,
  Flame,
  Users,
  Gamepad2,
  Lock,
} from "lucide-react";

export default function LandingPage() {
  const officialZones = [
    { name: "Arnava", tagline: "Rising Tide", color: "from-sky-500/20 to-blue-600/10", border: "border-sky-500/30", text: "text-sky-400" },
    { name: "Taranaga", tagline: "Electric Ripple", color: "from-indigo-500/20 to-blue-600/10", border: "border-indigo-500/30", text: "text-indigo-400" },
    { name: "Sagara", tagline: "Deep Ocean", color: "from-cyan-500/20 to-teal-600/10", border: "border-cyan-500/30", text: "text-cyan-400" },
    { name: "Pravaha", tagline: "Relentless Flow", color: "from-emerald-500/20 to-green-600/10", border: "border-emerald-500/30", text: "text-emerald-400" },
    { name: "Samudhra", tagline: "Endless Horizon", color: "from-amber-500/20 to-yellow-600/10", border: "border-amber-500/30", text: "text-amber-400" },
    { name: "Varuna", tagline: "Crown Sovereign", color: "from-pink-500/20 to-purple-600/10", border: "border-pink-500/30", text: "text-pink-400" },
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-white flex flex-col justify-between selection:bg-blue-600 relative overflow-hidden">
      {/* Background Neon Atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-blue-600/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-600/10 blur-[120px] pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              ROCCO
            </span>
            <span className="text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300">
              VIBE 2026
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold">
            <Link
              href="/staff"
              className="text-slate-400 hover:text-amber-300 transition-colors hidden sm:inline-block"
            >
              Zonal Heads
            </Link>
            <Link
              href="/admin"
              className="text-slate-400 hover:text-cyan-300 transition-colors hidden sm:inline-block"
            >
              Admin
            </Link>
            <Link
              href="/app"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-xs font-bold text-white shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              Open App
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-12 sm:py-20 flex-1 flex flex-col items-center text-center justify-center space-y-10">
        {/* District & Event Pill */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-bold shadow-lg shadow-blue-950/50 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>Rotaract District 3192 Presents ROCCO 2026</span>
        </div>

        {/* Hero Title & Subheading */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-7xl font-black tracking-tight leading-[1.08]">
            <span className="text-white block drop-shadow-sm">ROCCO '26</span>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
              Don't Just Attend. Experience VIBE.
            </span>
          </h1>
          <p className="text-sm sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
            The physical fresher party venue at ROCCO is transformed into a live game board. Explore 6 official zones, scan checkpoints, play free mini-games, earn XP, connect with friends, and power your zone to victory!
          </p>
        </div>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-sm font-black text-white shadow-xl shadow-blue-500/30 flex items-center justify-center space-x-2 active:scale-95 transition-all"
          >
            <span>Register / Claim 500 VIBE Coins</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/app"
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-sm font-bold text-slate-200 flex items-center justify-center space-x-2 transition-all hover:border-slate-600"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Enter App Dashboard</span>
          </Link>
        </div>

        {/* Four Feature Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4 w-full max-w-3xl">
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 text-left space-y-1.5 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-xs font-bold text-white">500 Starting Coins</h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Credited automatically upon registration
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 text-left space-y-1.5 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Compass className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-xs font-bold text-white">6 Official Zones</h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Arnava, Taranaga, Sagara, Pravaha, Samudhra, Varuna
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 text-left space-y-1.5 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-xs font-bold text-white">VIBE Zone Battle</h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Spend coins to advance your zone championship
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 text-left space-y-1.5 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-xs font-bold text-white">Free Mini-Games</h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Play Minion Run, Quiz & Memory Match for XP
            </p>
          </div>
        </div>

        {/* The 6 Official Zones Showcase */}
        <div className="w-full max-w-3xl pt-6 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              The 6 Official Competition Zones
            </span>
            <Link href="/app/map" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
              View Venue Map →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {officialZones.map((z, idx) => (
              <div
                key={z.name}
                className={`p-3 rounded-xl bg-gradient-to-br ${z.color} border ${z.border} space-y-1`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400">Z{idx + 1}</span>
                  <span className={`text-[10px] font-bold ${z.text}`}>{z.tagline}</span>
                </div>
                <h4 className="text-sm font-black text-white">{z.name}</h4>
              </div>
            ))}
          </div>
        </div>

        {/* Partner & Sponsor Banner */}
        <div className="pt-6 border-t border-slate-800/80 w-full max-w-lg space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
            Official Event Partners
          </span>
          <div className="flex items-center justify-center space-x-6 text-xs font-bold text-slate-400">
            <span>Red Bull</span>
            <span>•</span>
            <span>Spotify India</span>
            <span>•</span>
            <span>OnePlus</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950/60 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center space-x-4 mb-1">
          <Link href="/staff" className="hover:text-amber-400 transition-colors">
            Zonal Staff Login
          </Link>
          <span>•</span>
          <Link href="/admin" className="hover:text-blue-400 transition-colors">
            Admin Portal
          </Link>
        </div>
        <p className="text-[11px] text-slate-500">
          © 2026 Rotaract District 3192 • ROCCO Freshers • VIBE Platform
        </p>
      </footer>
    </div>
  );
}
