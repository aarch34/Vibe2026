"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coins,
  Sparkles,
  Home,
  Compass,
  QrCode,
  Trophy,
  Gift,
  User,
  Gamepad2,
  Camera,
  Waves,
} from "lucide-react";
import { formatCoins, cn } from "@/lib/utils";

interface TopHeaderProps {
  vibeId: string;
  coins: number;
  levelName: string;
  assignedZoneName?: string;
}

const NAV_LINKS = [
  { label: "Home", href: "/app", icon: Home },
  { label: "6 Zones", href: "/app/map", icon: Compass },
  { label: "Games", href: "/app/games", icon: Gamepad2 },
  { label: "Stalls", href: "/app/stalls", icon: Camera },
  { label: "Scan QR", href: "/app/scan", icon: QrCode },
  { label: "Leaderboard", href: "/app/leaderboard", icon: Trophy },
  { label: "Quests", href: "/app/quests", icon: Sparkles },
  { label: "Rewards", href: "/app/rewards", icon: Gift },
  { label: "Profile", href: "/app/profile", icon: User },
];

export function TopHeader({ vibeId, coins, levelName, assignedZoneName }: TopHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-[#070B14]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & VIBE ID */}
        <div className="flex items-center space-x-2.5">
          <Link href="/app" className="flex items-center space-x-1.5 group">
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
              VIBE
            </span>
            <span className="text-[10px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/30 text-blue-300">
              '26
            </span>
          </Link>
          <span className="text-xs font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            {vibeId}
          </span>
          {assignedZoneName && (
            <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
              <span>🌊</span>
              <span>{assignedZoneName}</span>
            </span>
          )}
        </div>

        {/* Desktop Navigation Links (Visible on Tablet/Desktop md+) */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                  isActive
                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                )}
              >
                <Icon
                  className={cn(
                    "w-3.5 h-3.5",
                    isActive ? "text-blue-400" : "text-slate-400"
                  )}
                />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Status Badges & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Level Pill */}
          <div className="flex items-center space-x-1 text-[11px] font-semibold text-purple-300 bg-purple-950/40 border border-purple-500/30 px-2.5 py-1 rounded-full shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="truncate max-w-[110px] sm:max-w-none">
              {levelName.replace("VIBE ", "")}
            </span>
          </div>

          {/* Coins Pill */}
          <Link
            href="/app/rewards"
            className="flex items-center space-x-1.5 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 transition-all duration-150 border border-amber-500/30 px-3 py-1 rounded-full text-amber-400 shadow-sm"
          >
            <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold tracking-tight font-mono">
              {formatCoins(coins)}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
