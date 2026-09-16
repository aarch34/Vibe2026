import Link from "next/link";
import {
  Sparkles,
  QrCode,
  Trophy,
  Compass,
  ArrowRight,
  Shield,
  Coins,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070B14] text-white flex flex-col justify-between selection:bg-blue-600">
      {/* Top Bar */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              VIBE
            </span>
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-blue-950 border border-blue-500/30 text-blue-300">
              Freshers '26
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <Link
              href="/admin"
              className="text-slate-400 hover:text-slate-200 transition-colors font-medium hidden sm:inline-block"
            >
              Admin
            </Link>
            <Link
              href="/staff"
              className="text-slate-400 hover:text-slate-200 transition-colors font-medium hidden sm:inline-block"
            >
              Zone Staff
            </Link>
            <Link
              href="/app"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              Open App
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-16 flex-1 flex flex-col items-center text-center justify-center space-y-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          <span>Rotaract District 3192 Presents</span>
        </div>

        <div className="space-y-3 max-w-2xl">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Don't Just Attend. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
              Experience VIBE.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto font-normal">
            The physical fresher party venue is now a live game board. Compete across 6 official zones, scan checkpoints, play 4 browser mini-games, earn VIBE Coins, and lead your zone to victory!
          </p>
        </div>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-sm font-extrabold text-white shadow-xl shadow-blue-500/30 flex items-center justify-center space-x-2 active:scale-95 transition-all"
          >
            <span>Register / Claim 500 Coins</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/app"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-bold text-slate-300 flex items-center justify-center space-x-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Open App</span>
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 w-full max-w-2xl">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-left space-y-1">
            <Coins className="w-5 h-5 text-amber-400" />
            <h3 className="text-xs font-bold text-white">500 Starting Coins</h3>
            <p className="text-[11px] text-slate-400">
              Credited automatically on initial join
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-left space-y-1">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xs font-bold text-white">6 Official Zones</h3>
            <p className="text-[11px] text-slate-400">
              Arnava, Taranaga, Sagara & more
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-left space-y-1">
            <Trophy className="w-5 h-5 text-purple-400" />
            <h3 className="text-xs font-bold text-white">VIBE Zone Battle</h3>
            <p className="text-[11px] text-slate-400">
              Coins spent power zone championship
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-left space-y-1">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xs font-bold text-white">4 Playable Games</h3>
            <p className="text-[11px] text-slate-400">
              Rotaract Quiz, Minion Run & more
            </p>
          </div>
        </div>

        {/* Sponsor Banner */}
        <div className="pt-6 border-t border-slate-800/80 w-full max-w-lg space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
            Powered By Official Event Partners
          </span>
          <div className="flex items-center justify-center space-x-8 text-xs font-bold text-slate-400">
            <span>Red Bull</span>
            <span>•</span>
            <span>Spotify India</span>
            <span>•</span>
            <span>OnePlus</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-400">
        © 2026 Rotaract District 3192 • VIBE Gamified Event Platform
      </footer>
    </div>
  );
}
