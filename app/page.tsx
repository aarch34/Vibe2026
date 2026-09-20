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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground relative overflow-hidden">
      {/* Background Neon Atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-primary/10 via-accent/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-secondary/10 blur-[120px] pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="px-6 py-4 border-b-2 border-border bg-card/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl font-black tracking-wider text-foreground">
              ROCCO
            </span>
            <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-0.5 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)]">
              VIBE 2026
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-bold">
            <Link
              href="/staff"
              className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block"
            >
              Zonal Heads
            </Link>
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block"
            >
              Admin
            </Link>
            <Link
              href="/sign-in"
              className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block"
            >
              Sign In
            </Link>
            <Link
              href="/app"
              className="neo-btn-primary px-4 py-2 text-xs font-black uppercase tracking-wider"
            >
              Open App
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-12 sm:py-20 flex-1 flex flex-col items-center text-center justify-center space-y-10">
        {/* District & Event Pill */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-card border-2 border-border text-foreground text-xs font-black shadow-[2px_2px_0px_var(--border)] animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" />
          <span>Rotaract District 3192 Presents ROCCO 2026</span>
        </div>

        {/* Hero Title & Subheading */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-7xl font-black tracking-tight leading-[1.08]">
            <span className="text-foreground block drop-shadow-sm">ROCCO '26</span>
            <span className="text-primary block mt-1">
              Don't Just Attend. Experience VIBE.
            </span>
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
            The physical fresher party venue at ROCCO is transformed into a live game board. Explore 6 official zones, scan checkpoints, play free mini-games, earn XP, connect with friends, and power your zone to victory!
          </p>
        </div>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="neo-btn-primary w-full sm:w-auto px-8 py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[4px_4px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px]"
          >
            <span>Register / Claim 500 VIBE Coins</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/app"
            className="neo-btn-secondary w-full sm:w-auto px-7 py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[4px_4px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Enter App Dashboard</span>
          </Link>
        </div>

        {/* Four Feature Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4 w-full max-w-3xl">
          <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo text-left space-y-2">
            <div className="w-8 h-8 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-foreground">500 Starting Coins</h3>
            <p className="text-[11px] text-muted-foreground leading-snug font-medium">
              Credited automatically upon registration
            </p>
          </div>

          <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo text-left space-y-2">
            <div className="w-8 h-8 bg-accent text-accent-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-foreground">6 Official Zones</h3>
            <p className="text-[11px] text-muted-foreground leading-snug font-medium">
              Arnava, Taranaga, Sagara, Pravaha, Samudhra, Varuna
            </p>
          </div>

          <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo text-left space-y-2">
            <div className="w-8 h-8 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-foreground">VIBE Zone Battle</h3>
            <p className="text-[11px] text-muted-foreground leading-snug font-medium">
              Spend coins to advance your zone championship
            </p>
          </div>

          <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo text-left space-y-2">
            <div className="w-8 h-8 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-foreground">Free Mini-Games</h3>
            <p className="text-[11px] text-muted-foreground leading-snug font-medium">
              Play Minion Run, Quiz & Memory Match for XP
            </p>
          </div>
        </div>

        {/* The 6 Official Zones Showcase */}
        <div className="w-full max-w-3xl pt-6 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              The 6 Official Competition Zones
            </span>
            <Link href="/app/map" className="neo-btn-card px-3 py-1 text-xs font-black text-foreground">
              View Venue Map →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {officialZones.map((z, idx) => (
              <div
                key={z.name}
                className="p-3.5 bg-card text-card-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-muted-foreground">Z{idx + 1}</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 bg-muted border border-border text-foreground">{z.tagline}</span>
                </div>
                <h4 className="text-sm font-black text-foreground">{z.name}</h4>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t-2 border-border bg-card text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center space-x-4 mb-2 font-black text-foreground">
          <Link href="/staff" className="hover:underline">
            Zonal Staff Login
          </Link>
          <span>•</span>
          <Link href="/admin" className="hover:underline">
            Admin Portal
          </Link>
        </div>
        <p className="text-[11px] text-muted-foreground font-mono">
          © 2026 Rotaract District 3192 • ROCCO Freshers • VIBE Platform
        </p>
      </footer>
    </div>
  );
}
