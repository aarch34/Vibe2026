import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Trophy,
  ArrowRight,
  Flame,
  Users,
  Gamepad2,
  Share2,
  UserPlus,
  MessageSquare,
  Heart,
  Brain,
  Award,
  GraduationCap,
  HelpCircle,
  Zap,
  Star,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { OceanicParticlesCanvas } from "@/components/ui/oceanic-particles-canvas";

export default function LandingPage() {
  const vibeGames = [
    {
      id: "rotaract-game",
      name: "Rotaract Game",
      tagline: "District Lore Trivia",
      desc: "Test your knowledge of Rotaract history, milestones, and district lore.",
      xp: "Up to +250 XP",
      icon: GraduationCap,
      color: "#00F0FF",
      borderHover: "hover:border-[#00F0FF] hover:shadow-neon-cyan",
      bgGradient: "from-cyan-950/40 via-card to-card",
    },
    {
      id: "minion-game",
      name: "VIBE Minion Game",
      tagline: "30s Arcade Runner",
      desc: "Tap target minions quickly before time runs out in this fast-paced arcade runner.",
      xp: "Up to +300 XP",
      icon: Gamepad2,
      color: "#FF1B7A",
      borderHover: "hover:border-[#FF1B7A] hover:shadow-neon-pink",
      bgGradient: "from-pink-950/40 via-card to-card",
    },
    {
      id: "memory-game",
      name: "Memory Game",
      tagline: "Card Match Sprint",
      desc: "Flip and match pairs of VIBE cards in record time to prove your memory skills.",
      xp: "Up to +200 XP",
      icon: Brain,
      color: "#8B5CF6",
      borderHover: "hover:border-[#8B5CF6] hover:shadow-neon-purple",
      bgGradient: "from-purple-950/40 via-card to-card",
    },
    {
      id: "vibe-quiz",
      name: "VIBE Quiz",
      tagline: "Festival Knowledge",
      desc: "Show off your knowledge about VIBE 2026 event rules, schedule, and secrets.",
      xp: "Up to +250 XP",
      icon: HelpCircle,
      color: "#F59E0B",
      borderHover: "hover:border-[#F59E0B] hover:shadow-neon-gold",
      bgGradient: "from-amber-950/40 via-card to-card",
    },
  ];

  const xpLevels = [
    { name: "VIBE NEWBIE", xp: "0 XP", badge: "LVL 1", color: "#94A3B8" },
    { name: "VIBE EXPLORER", xp: "100 XP", badge: "LVL 2", color: "#38BDF8" },
    { name: "VIBE SEEKER", xp: "300 XP", badge: "LVL 3", color: "#34D399" },
    { name: "VIBE RIDER", xp: "600 XP", badge: "LVL 4", color: "#FBBF24" },
    { name: "VIBE ICON", xp: "1000 XP", badge: "LVL 5", color: "#A78BFA" },
    { name: "VIBE LEGEND", xp: "1500+ XP", badge: "MAX", color: "#FF1B7A" },
  ];

  const featuredProfiles = [
    {
      name: "Aarav Sharma",
      username: "@aarav_vibe",
      college: "RV College of Engineering",
      club: "RC Koramangala",
      xp: "850 XP",
      level: "VIBE RIDER",
      interests: ["Music", "Gaming", "Coding"],
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Ananya Rao",
      username: "@ananya_r",
      college: "PES University",
      club: "RC Bangalore South",
      xp: "1240 XP",
      level: "VIBE ICON",
      interests: ["Dance", "Photography", "Travel"],
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Rohan Verma",
      username: "@rohan_v",
      college: "BMS College of Engg",
      club: "RC Indiranagar",
      xp: "620 XP",
      level: "VIBE RIDER",
      interests: ["Sports", "Art", "Fitness"],
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
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

      {/* Top Header Navbar */}
      <header className="px-4 sm:px-8 py-3.5 border-b-2 border-border bg-card/90 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-pink-500/40 shadow-[0_0_12px_rgba(255,27,122,0.4)] group-hover:scale-105 group-hover:border-cyan-400/60 transition-all flex-shrink-0 bg-black/40">
                <Image
                  src="/images/vibe-logo.png"
                  alt="VIBE 2026 Logo"
                  width={32}
                  height={32}
                  className="object-contain w-full h-full scale-105"
                  priority
                />
              </div>
              <span className="text-2xl sm:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FF1B7A] via-[#8B5CF6] to-[#00F0FF] font-mono drop-shadow-[0_0_15px_rgba(255,27,122,0.4)]">
                VIBE
              </span>
              <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-0.5 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] group-hover:brightness-110 transition-all">
                '26
              </span>
            </Link>
          </div>

          {/* Desktop & Mobile Navigation */}
          <nav className="flex items-center space-x-2 sm:space-x-4 text-xs font-black">
            <Link
              href="/app/discover"
              className="text-muted-foreground hover:text-foreground transition-colors hidden md:inline-block uppercase tracking-wider text-[11px]"
            >
              Discover
            </Link>
            <Link
              href="/app/games"
              className="text-muted-foreground hover:text-foreground transition-colors hidden md:inline-block uppercase tracking-wider text-[11px]"
            >
              Games
            </Link>
            <Link
              href="/app"
              className="text-muted-foreground hover:text-foreground transition-colors hidden md:inline-block uppercase tracking-wider text-[11px]"
            >
              Feed
            </Link>
            <Link
              href="/app/leaderboard"
              className="text-muted-foreground hover:text-foreground transition-colors hidden md:inline-block uppercase tracking-wider text-[11px]"
            >
              Leaderboard
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
              className="neo-btn-primary px-4 py-2 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_var(--border)] hover:shadow-neon-pink transition-all flex items-center space-x-1.5"
            >
              <span>JOIN VIBE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex-1 flex flex-col items-center text-center justify-center space-y-16 relative z-10">
        
        {/* HERO SECTION */}
        <section className="space-y-8 flex flex-col items-center max-w-3xl">
          {/* Official VIBE Logo Emblem */}
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse" />
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-pink-500/60 shadow-[0_0_35px_rgba(255,27,122,0.45)] bg-black/60 backdrop-blur-md flex items-center justify-center p-1">
              <Image
                src="/images/vibe-logo.png"
                alt="VIBE 2026 Rotaract Freshers Party"
                width={160}
                height={160}
                priority
                className="w-full h-full object-contain scale-105 group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Event Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-card/95 border-2 border-border text-foreground text-xs font-black shadow-[3px_3px_0px_var(--border)]">
            <Sparkles className="w-4 h-4 text-[#00F0FF] animate-spin" />
            <span className="tracking-wide">Rotaract District 3192 Presents VIBE 2026</span>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <span className="hidden sm:inline text-primary font-mono">PRE-EVENT PLATFORM</span>
          </div>

          {/* Hero Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-7xl font-black tracking-tight leading-[1.05] uppercase">
              <span className="text-foreground block drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                ROCCO '26
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF1B7A] via-[#A855F7] to-[#00F0FF] block mt-1 drop-shadow-[0_0_25px_rgba(255,27,122,0.35)]">
                DON'T JUST ATTEND.
                <br />
                CONNECT. PLAY. VIBE.
              </span>
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
              Your pre-VIBE experience starts here. Connect with people, share your moments, play games, and climb the XP leaderboard before you even step into the event.
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
              <span>ENTER VIBE →</span>
            </Link>
          </div>
        </section>

        {/* HERO FEATURE HIGHLIGHTS */}
        <section className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-5 bg-card/95 border-2 border-border shadow-[4px_4px_0px_var(--border)] hover:border-[#00F0FF] hover:shadow-neon-cyan transition-all space-y-2.5">
            <div className="w-10 h-10 bg-[#00F0FF]/15 text-[#00F0FF] border-2 border-[#00F0FF]/40 flex items-center justify-center font-black">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
              CONNECT
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Meet people before the event. Discover attendees, send connection requests, build your network and find people with similar interests.
            </p>
          </div>

          <div className="p-5 bg-card/95 border-2 border-border shadow-[4px_4px_0px_var(--border)] hover:border-[#FF1B7A] hover:shadow-neon-pink transition-all space-y-2.5">
            <div className="w-10 h-10 bg-[#FF1B7A]/15 text-[#FF1B7A] border-2 border-[#FF1B7A]/40 flex items-center justify-center font-black">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
              PLAY
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Challenge yourself. Play the four VIBE games and earn XP through gameplay and trivia challenges.
            </p>
          </div>

          <div className="p-5 bg-card/95 border-2 border-border shadow-[4px_4px_0px_var(--border)] hover:border-[#8B5CF6] hover:shadow-neon-purple transition-all space-y-2.5">
            <div className="w-10 h-10 bg-[#8B5CF6]/15 text-[#8B5CF6] border-2 border-[#8B5CF6]/40 flex items-center justify-center font-black">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
              VIBE
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Share your experience. Post photos, introduce yourself, interact with the community and build your VIBE profile.
            </p>
          </div>
        </section>

        {/* 4-STEP HOW IT WORKS */}
        <section className="w-full max-w-4xl space-y-6 text-left border-t-2 border-border pt-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#00F0FF] font-black block">
              Pre-Event Journey
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
              YOUR VIBE STARTS BEFORE THE EVENT
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Don't wait until event day to meet people. Start connecting, posting, playing and climbing the XP leaderboard before you arrive.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 bg-card/90 border-2 border-border shadow-[3px_3px_0px_var(--border)] space-y-2">
              <span className="text-xs font-mono font-black text-[#FF1B7A] block">01</span>
              <h4 className="text-sm font-black uppercase text-foreground">CREATE YOUR PROFILE</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Set up your VIBE profile and tell people who you are, your college, club, and interests.
              </p>
            </div>

            <div className="p-4 bg-card/90 border-2 border-border shadow-[3px_3px_0px_var(--border)] space-y-2">
              <span className="text-xs font-mono font-black text-[#8B5CF6] block">02</span>
              <h4 className="text-sm font-black uppercase text-foreground">CONNECT</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Discover attendees, find common interests and send connection requests.
              </p>
            </div>

            <div className="p-4 bg-card/90 border-2 border-border shadow-[3px_3px_0px_var(--border)] space-y-2">
              <span className="text-xs font-mono font-black text-[#00F0FF] block">03</span>
              <h4 className="text-sm font-black uppercase text-foreground">PLAY</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Take on VIBE's 4 arcade & trivia games to earn XP and climb ranks.
              </p>
            </div>

            <div className="p-4 bg-card/90 border-2 border-border shadow-[3px_3px_0px_var(--border)] space-y-2">
              <span className="text-xs font-mono font-black text-[#10B981] block">04</span>
              <h4 className="text-sm font-black uppercase text-foreground">SHOW UP CONNECTED</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Arrive at the event already knowing people and ready to celebrate together.
              </p>
            </div>
          </div>
        </section>

        {/* GAMES SECTION */}
        <section className="w-full max-w-4xl space-y-6 text-left border-t-2 border-border pt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A855F7] font-black block">
                VIBE Arena
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                PLAY. EARN XP. LEVEL UP.
              </h2>
            </div>
            <Link
              href="/app/games"
              className="neo-btn-card px-4 py-2 text-xs font-black text-foreground hover:shadow-neon-purple transition-all inline-flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <span>EXPLORE GAMES</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vibeGames.map((game) => {
              const Icon = game.icon;
              return (
                <div
                  key={game.id}
                  className={`p-5 bg-gradient-to-br ${game.bgGradient} border-2 border-border shadow-[4px_4px_0px_var(--border)] transition-all duration-200 ${game.borderHover} flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-black px-2.5 py-0.5 bg-muted border border-border text-foreground">
                        {game.tagline}
                      </span>
                      <div
                        className="w-9 h-9 rounded-none border-2 border-border flex items-center justify-center"
                        style={{ backgroundColor: game.color, color: "#000" }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-black uppercase text-foreground">
                        {game.name}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        {game.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-amber-400">
                      {game.xp}
                    </span>
                    <Link
                      href="/app/games"
                      className="text-xs font-black uppercase tracking-wider text-foreground hover:text-primary transition-colors flex items-center space-x-1"
                    >
                      <span>PLAY NOW</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* NETWORKING SECTION */}
        <section className="w-full max-w-4xl space-y-6 text-left border-t-2 border-border pt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#00F0FF] font-black block">
                Discover Community
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                MEET YOUR VIBE PEOPLE
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                Discover people from across the VIBE community, connect with new friends, explore profiles and build your network before the event.
              </p>
            </div>
            <Link
              href="/app/discover"
              className="neo-btn-card px-4 py-2 text-xs font-black text-foreground hover:shadow-neon-cyan transition-all inline-flex items-center space-x-1.5 self-start sm:self-auto shrink-0"
            >
              <span>DISCOVER ATTENDEES</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featuredProfiles.map((p) => (
              <div
                key={p.username}
                className="p-4 bg-card/95 border-2 border-border shadow-[4px_4px_0px_var(--border)] hover:border-[#00F0FF] transition-all space-y-3"
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 border-2 border-border overflow-hidden bg-muted shrink-0">
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-foreground">{p.name}</h4>
                    <p className="text-[11px] text-muted-foreground font-mono">{p.username}</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>College:</span>
                    <span className="font-bold text-foreground truncate max-w-[150px]">{p.college}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Rotaract:</span>
                    <span className="font-bold text-foreground truncate max-w-[150px]">{p.club}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {p.interests.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold px-2 py-0.5 bg-muted text-muted-foreground border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-amber-400">{p.xp}</span>
                  <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/40 text-[10px]">
                    {p.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SOCIAL FEED SECTION */}
        <section className="w-full max-w-4xl space-y-6 text-left border-t-2 border-border pt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF1B7A] font-black block">
                Social Hub
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                SHARE YOUR VIBE
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                Post your moments, introduce yourself, share photos and see what everyone else is up to before the event.
              </p>
            </div>
            <Link
              href="/app"
              className="neo-btn-card px-4 py-2 text-xs font-black text-foreground hover:shadow-neon-pink transition-all inline-flex items-center space-x-1.5 self-start sm:self-auto shrink-0"
            >
              <span>EXPLORE THE FEED</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Sample Feed Post Mockup */}
          <div className="p-5 bg-card/95 border-2 border-border shadow-[4px_4px_0px_var(--border)] max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 border-2 border-border overflow-hidden bg-primary/20 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    alt="Author"
                    className="w-full h-full object-cover"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground">Aarav Sharma</h4>
                  <p className="text-[11px] text-muted-foreground font-mono">@aarav_vibe • 2h ago</p>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-pink-500/20 text-pink-400 border border-pink-500/30">
                +50 XP Post
              </span>
            </div>

            <p className="text-xs sm:text-sm text-foreground leading-relaxed">
              Super excited for ROCCO '26! Who else is coming from Koramangala Rotaract? Let's connect and play games on VIBE! 🎉✨
            </p>

            <div className="h-48 sm:h-64 border-2 border-border overflow-hidden relative bg-muted">
              <img
                src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80"
                alt="VIBE Fest Preview"
                className="w-full h-full object-cover"
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            <div className="flex items-center space-x-6 text-xs font-bold text-muted-foreground pt-1 border-t border-border/60">
              <div className="flex items-center space-x-1.5 text-pink-400">
                <Heart className="w-4 h-4 fill-pink-400" />
                <span>24 Likes</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>8 Comments</span>
              </div>
            </div>
          </div>
        </section>

        {/* XP SECTION */}
        <section className="w-full max-w-4xl space-y-6 text-left border-t-2 border-border pt-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#10B981] font-black block">
              Gamification System
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
              EARN XP. LEVEL UP.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Every connection, challenge, post and game brings you closer to the next VIBE level.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {xpLevels.map((lvl) => (
              <div
                key={lvl.name}
                className="p-3 bg-card/90 border-2 border-border shadow-[3px_3px_0px_var(--border)] text-center space-y-1.5"
              >
                <span
                  className="text-[10px] font-mono font-black px-2 py-0.5 border border-border inline-block"
                  style={{ color: lvl.color }}
                >
                  {lvl.badge}
                </span>
                <h4 className="text-xs font-black text-foreground uppercase tracking-tight truncate">
                  {lvl.name}
                </h4>
                <p className="text-[11px] font-mono font-bold text-muted-foreground">
                  {lvl.xp}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* LEADERBOARD SECTION */}
        <section className="w-full max-w-4xl space-y-6 text-left border-t-2 border-border pt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-black block">
                Rankings
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                WHO'S LEADING THE VIBE?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                Earn XP through networking, social challenges and games and see where you stand.
              </p>
            </div>
            <Link
              href="/app/leaderboard"
              className="neo-btn-card px-4 py-2 text-xs font-black text-foreground hover:shadow-neon-gold transition-all inline-flex items-center space-x-1.5 self-start sm:self-auto shrink-0"
            >
              <span>VIEW LEADERBOARD</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </Link>
          </div>
        </section>

        {/* EVENT INFORMATION: BEFORE VIBE vs AT VIBE */}
        <section className="w-full max-w-4xl space-y-6 text-left border-t-2 border-border pt-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#00F0FF] font-black block">
              Event Timeline
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
              BEFORE VIBE vs AT VIBE
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="p-6 bg-gradient-to-br from-purple-950/30 via-card to-card border-2 border-border shadow-[4px_4px_0px_var(--border)] space-y-4">
              <div className="flex items-center space-x-2 text-[#00F0FF]">
                <Zap className="w-5 h-5" />
                <h3 className="text-lg font-black uppercase">BEFORE VIBE</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-foreground font-medium">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
                  <span>Build your attendee profile & add interests</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
                  <span>Discover attendees & send connection requests</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
                  <span>Play 4 arcade & trivia games for XP</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
                  <span>Share posts on the VIBE social feed</span>
                </li>
              </ul>
            </div>

            <div className="p-6 bg-gradient-to-br from-pink-950/30 via-card to-card border-2 border-border shadow-[4px_4px_0px_var(--border)] space-y-4">
              <div className="flex items-center space-x-2 text-[#FF1B7A]">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-lg font-black uppercase">AT VIBE</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-foreground font-medium">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF1B7A] shrink-0 mt-0.5" />
                  <span>Meet your pre-event connections live</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF1B7A] shrink-0 mt-0.5" />
                  <span>Experience mainstage music & DJ drops</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF1B7A] shrink-0 mt-0.5" />
                  <span>Celebrate Rotaract District 3192 festival</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF1B7A] shrink-0 mt-0.5" />
                  <span>Show up connected with friends already made</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-8 border-t-2 border-border bg-card/95 text-center text-xs text-muted-foreground relative z-10">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-4 font-black text-foreground uppercase tracking-wider text-[11px]">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span>•</span>
            <Link href="/register" className="hover:text-primary transition-colors">
              Register
            </Link>
            <span>•</span>
            <Link href="/app/discover" className="hover:text-primary transition-colors">
              Discover
            </Link>
            <span>•</span>
            <Link href="/app/games" className="hover:text-primary transition-colors">
              Games
            </Link>
            <span>•</span>
            <Link href="/app" className="hover:text-primary transition-colors">
              Feed
            </Link>
            <span>•</span>
            <Link href="/app/leaderboard" className="hover:text-primary transition-colors">
              Leaderboard
            </Link>
            <span>•</span>
            <Link href="/sign-in" className="hover:text-primary transition-colors">
              Sign In
            </Link>
            <span>•</span>
            <Link href="/app" className="hover:text-primary transition-colors">
              Open App
            </Link>
            <span>•</span>
            <Link href="/privacy" className="text-pink-400 hover:text-pink-300 transition-colors font-bold">
              DPDP Privacy Notice
            </Link>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            © 2026 Rotaract District 3192 • ROCCO Freshers • VIBE Pre-Event Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
