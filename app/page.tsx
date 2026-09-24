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
  Waves,
  Activity,
  Zap,
  Radio,
  Music,
} from "lucide-react";
import { OceanicParticlesCanvas } from "@/components/ui/oceanic-particles-canvas";

export default function LandingPage() {
  const officialZones = [
    {
      name: "Arnava",
      tagline: "The Rising Tide",
      badge: "Zone 01",
      icon: Waves,
      desc: "High-intensity cooperative team challenges and aquatic wave tags.",
      accent: "#00F0FF",
      borderHover: "hover:border-[#00F0FF] hover:shadow-neon-cyan",
      bgGradient: "from-cyan-950/40 to-card",
      textClass: "text-[#00F0FF]",
    },
    {
      name: "Taranaga",
      tagline: "The Electric Ripple",
      badge: "Zone 02",
      icon: Activity,
      desc: "Rapid rhythm face-offs, dance confrontations, and soundwave beat drops.",
      accent: "#8B5CF6",
      borderHover: "hover:border-[#8B5CF6] hover:shadow-neon-purple",
      bgGradient: "from-purple-950/40 to-card",
      textClass: "text-[#A78BFA]",
    },
    {
      name: "Sagara",
      tagline: "The Deep Ocean",
      badge: "Zone 03",
      icon: Compass,
      desc: "Mystery deep dive riddles, cryptographic cipher puzzles, and lost sea crests.",
      accent: "#38BDF8",
      borderHover: "hover:border-[#38BDF8] hover:shadow-neon-cyan",
      bgGradient: "from-sky-950/40 to-card",
      textClass: "text-[#38BDF8]",
    },
    {
      name: "Pravaha",
      tagline: "The Rushing Current",
      badge: "Zone 04",
      icon: Zap,
      desc: "Adrenaline agility sprints, reflex agility rapids, and laser hurdles.",
      accent: "#10B981",
      borderHover: "hover:border-[#10B981] hover:shadow-[4px_4px_0px_#10B981]",
      bgGradient: "from-emerald-950/40 to-card",
      textClass: "text-[#34D399]",
    },
    {
      name: "Samudhra",
      tagline: "The Endless Ocean",
      badge: "Zone 05",
      icon: Users,
      desc: "Fellowship arena, 360 glam creator photo rigs, and social Instagram friend connect.",
      accent: "#F59E0B",
      borderHover: "hover:border-[#F59E0B] hover:shadow-neon-gold",
      bgGradient: "from-amber-950/40 to-card",
      textClass: "text-[#FBBF24]",
    },
    {
      name: "Varuna",
      tagline: "The Celestial Waters",
      badge: "Zone 06",
      icon: Sparkles,
      desc: "The festival crown zone, mainstage midnight showdown, and grand championship coronation.",
      accent: "#FF1B7A",
      borderHover: "hover:border-[#FF1B7A] hover:shadow-neon-pink",
      bgGradient: "from-pink-950/40 to-card",
      textClass: "text-[#FF1B7A]",
    },
  ];

  return (
    <div className="min-h-screen bg-oceanic-depth bg-cyber-grid text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground relative overflow-hidden">
      {/* Interactive Bioluminescent Particle Background */}
      <OceanicParticlesCanvas />

      {/* Ambient Neon Atmosphere Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-[#FF1B7A]/15 via-[#00F0FF]/12 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-10 w-[450px] h-[450px] bg-[#8B5CF6]/12 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-[#00F0FF]/10 blur-[150px] pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="px-4 sm:px-8 py-3.5 border-b-2 border-border bg-card/90 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="text-2xl sm:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FF1B7A] via-[#8B5CF6] to-[#00F0FF] font-mono drop-shadow-[0_0_15px_rgba(255,27,122,0.4)]">
                ROCCO
              </span>
              <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-0.5 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] group-hover:brightness-110 transition-all">
                VIBE 2026
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4 text-xs font-black">
            {/* Live Indicator Pill */}
            <div className="hidden md:inline-flex items-center space-x-2 px-3 py-1 bg-muted border-2 border-border text-foreground text-[10px] uppercase tracking-wider font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE ARENA</span>
            </div>

            <Link
              href="/staff"
              className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block uppercase tracking-wider text-[11px]"
            >
              Zonal Heads
            </Link>
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block uppercase tracking-wider text-[11px]"
            >
              Admin
            </Link>
            <Link
              href="/sign-in"
              className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block uppercase tracking-wider text-[11px]"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              id="join-vibe-nav-btn"
              className="neo-btn-primary px-4 py-2 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_var(--border)] hover:shadow-neon-pink transition-all"
            >
              Join VIBE
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex-1 flex flex-col items-center text-center justify-center space-y-12 relative z-10">
        {/* District & Event Pill */}
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 bg-card/95 border-2 border-border text-foreground text-xs font-black shadow-[3px_3px_0px_var(--border)]">
          <Sparkles className="w-4 h-4 text-[#00F0FF] animate-spin" />
          <span className="tracking-wide">Rotaract District 3192 Presents ROCCO 2026</span>
          <span className="hidden sm:inline text-muted-foreground">•</span>
          <span className="hidden sm:inline text-primary font-mono">OCTOBER FESTIVAL</span>
        </div>

        {/* Hero Title & Subheading */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-7xl font-black tracking-tight leading-[1.05] uppercase">
            <span className="text-foreground block drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              ROCCO '26
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF1B7A] via-[#A855F7] to-[#00F0FF] block mt-1 drop-shadow-[0_0_25px_rgba(255,27,122,0.35)]">
              Don't Just Attend. Experience VIBE.
            </span>
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
            The physical fresher party venue at ROCCO is transformed into a live oceanic game arena.
            Explore 6 factions, scan QR checkpoints, compete in arcade mini-games, earn XP, and power your zone to victory!
          </p>
        </div>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            id="join-vibe-hero-btn"
            className="neo-btn-primary w-full sm:w-auto px-8 py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center space-x-2.5 shadow-[5px_5px_0px_#000] hover:shadow-neon-pink active:translate-x-[2px] active:translate-y-[2px] transition-all group"
          >
            <span>JOIN VIBE</span>
            <span className="text-xs opacity-90">• Claim 500 Coins</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/app"
            className="neo-btn-secondary w-full sm:w-auto px-7 py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center space-x-2.5 shadow-[5px_5px_0px_#000] hover:shadow-neon-purple active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#00F0FF]" />
            <span>Enter App Dashboard</span>
          </Link>
        </div>

        {/* Live Arena Metrics Ticker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 w-full max-w-3xl">
          <div className="p-4 bg-card/90 backdrop-blur-md border-2 border-border shadow-[3px_3px_0px_var(--border)] text-left space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F0FF] font-black block">Factions</span>
            <span className="text-2xl font-black font-mono text-foreground">6 Oceanic</span>
            <span className="text-[10px] text-muted-foreground block font-bold">Zones in Battle</span>
          </div>

          <div className="p-4 bg-card/90 backdrop-blur-md border-2 border-border shadow-[3px_3px_0px_var(--border)] text-left space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF1B7A] font-black block">Starter Wallet</span>
            <span className="text-2xl font-black font-mono text-foreground">500 VIBE</span>
            <span className="text-[10px] text-muted-foreground block font-bold">Coins on signup</span>
          </div>

          <div className="p-4 bg-card/90 backdrop-blur-md border-2 border-border shadow-[3px_3px_0px_var(--border)] text-left space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A855F7] font-black block">Arcade Games</span>
            <span className="text-2xl font-black font-mono text-foreground">4 Mini-Games</span>
            <span className="text-[10px] text-muted-foreground block font-bold">Free to play for XP</span>
          </div>

          <div className="p-4 bg-card/90 backdrop-blur-md border-2 border-border shadow-[3px_3px_0px_var(--border)] text-left space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#10B981] font-black block">Live Verification</span>
            <span className="text-2xl font-black font-mono text-foreground">12 Zonal Staff</span>
            <span className="text-[10px] text-muted-foreground block font-bold">Booth check-in stations</span>
          </div>
        </div>

        {/* The 6 Official Zones Showcase with Interactive 3D Cards */}
        <div className="w-full max-w-4xl pt-6 space-y-4 text-left">
          <div className="flex items-center justify-between border-b-2 border-border pb-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#00F0FF] font-black block">
                Faction Battlegrounds
              </span>
              <h2 className="text-lg sm:text-xl font-black uppercase text-foreground">
                The 6 Official Oceanic Zones
              </h2>
            </div>
            <Link
              href="/app/map"
              className="neo-btn-card px-3.5 py-1.5 text-xs font-black text-foreground hover:shadow-neon-cyan transition-all"
            >
              Explore Map →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {officialZones.map((z) => {
              const Icon = z.icon;
              return (
                <Link
                  key={z.name}
                  href="/register"
                  className={`p-4 bg-gradient-to-br ${z.bgGradient} border-2 border-border shadow-[4px_4px_0px_var(--border)] transition-all duration-200 ${z.borderHover} group relative flex flex-col justify-between space-y-3 cursor-pointer`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-muted border border-border text-foreground">
                        {z.badge}
                      </span>
                      <div
                        className="w-8 h-8 rounded-none border-2 border-border flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: z.accent, color: "#000" }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <div>
                      <h3 className={`text-base font-black uppercase tracking-tight ${z.textClass}`}>
                        {z.name}
                      </h3>
                      <p className="text-[11px] font-bold text-foreground tracking-wide">
                        {z.tagline}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {z.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono font-bold text-muted-foreground">
                    <span>Faction Arena</span>
                    <span className="group-hover:translate-x-1 transition-transform text-foreground font-black">
                      Join Zone →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* The 4 Pillars of VIBE */}
        <div className="w-full max-w-4xl pt-8 space-y-4 text-left">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF1B7A] font-black block">
            Core Mechanics
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-card/95 border-2 border-border shadow-[4px_4px_0px_var(--border)] space-y-2.5">
              <div className="w-10 h-10 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <h4 className="text-base font-black text-foreground uppercase">
                1. Gamified Dual Currency
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Start with <strong className="text-foreground font-black">500 VIBE Coins</strong>. Spend coins to power up your zone in the Zone Battle or unlock exclusive festival privileges, while earning non-spendable <strong className="text-foreground font-black">XP</strong> to level up your personal festival rank.
              </p>
            </div>

            <div className="p-5 bg-card/95 border-2 border-border shadow-[4px_4px_0px_var(--border)] space-y-2.5">
              <div className="w-10 h-10 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <h4 className="text-base font-black text-foreground uppercase">
                2. Real-World Checkpoints
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Locate physical QR stands at each of the 6 Oceanic zones and partner stalls. Every scan instantly verifies your attendance, earns you experience stamps, and boosts your Zone Battle standing.
              </p>
            </div>

            <div className="p-5 bg-card/95 border-2 border-border shadow-[4px_4px_0px_var(--border)] space-y-2.5">
              <div className="w-10 h-10 bg-accent text-accent-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-black text-foreground uppercase">
                3. Festival Arcade Hub
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Between DJ drops and stage shows, play <strong className="text-foreground font-black">Minion VIBE Run</strong>, <strong className="text-foreground font-black">Memory Match</strong>, and <strong className="text-foreground font-black">ROCCO Festival Quiz</strong> right from your phone. Zero downloads needed.
              </p>
            </div>

            <div className="p-5 bg-card/95 border-2 border-border shadow-[4px_4px_0px_var(--border)] space-y-2.5">
              <div className="w-10 h-10 bg-muted text-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <h4 className="text-base font-black text-foreground uppercase">
                4. Live Oceanic Leaderboard
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Compete for individual glory as the <strong className="text-foreground font-black">Festival MVP</strong>, or team up with your zone peers to take down the other 5 oceanic factions on the live venue jumbotron!
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t-2 border-border bg-card/95 text-center text-xs text-muted-foreground relative z-10">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          <div className="flex items-center justify-center space-x-6 font-black text-foreground uppercase tracking-wider text-[11px]">
            <Link href="/staff" className="hover:text-primary transition-colors">
              Zonal Staff Portal
            </Link>
            <span>•</span>
            <Link href="/admin" className="hover:text-primary transition-colors">
              Admin Command Center
            </Link>
            <span>•</span>
            <Link href="/app" className="hover:text-primary transition-colors">
              Attendee App
            </Link>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            © 2026 Rotaract District 3192 • ROCCO Freshers • VIBE Oceanic Platform
          </p>
        </div>
      </footer>
    </div>
  );
}

