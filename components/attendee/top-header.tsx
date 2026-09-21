"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coins,
  Sparkles,
  Home,
  Compass,
  QrCode,
  Trophy,
  User,
  Gamepad2,
  Waves,
  Sun,
  Moon,
} from "lucide-react";
import { formatCoins, cn } from "@/lib/utils";
import { UserNav } from "@/components/auth/user-nav";

interface TopHeaderProps {
  vibeId: string;
  coins: number;
  levelName: string;
  assignedZoneName?: string;
  displayName?: string;
}

const NAV_LINKS = [
  { label: "Home", href: "/app", icon: Home },
  { label: "6 Zones", href: "/app/map", icon: Compass },
  { label: "Games", href: "/app/games", icon: Gamepad2 },
  { label: "Scan QR", href: "/app/scan", icon: QrCode },
  { label: "Leaderboard", href: "/app/leaderboard", icon: Trophy },
  { label: "Quests", href: "/app/quests", icon: Sparkles },
  { label: "Profile", href: "/app/profile", icon: User },
];

export function TopHeader({ vibeId, coins, levelName, assignedZoneName, displayName }: TopHeaderProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains("dark");
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    setIsDark(nextDark);
  };

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b-2 border-border px-4 sm:px-6 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & VIBE ID */}
        <div className="flex items-center space-x-2.5">
          <Link href="/app" className="flex items-center space-x-1.5 group">
            <span className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 group-hover:brightness-125 transition-all font-mono drop-shadow-[0_0_12px_rgba(255,42,133,0.35)]">
              VIBE
            </span>
            <span className="text-[10px] uppercase tracking-widest font-black px-1.5 py-0.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white border border-border shadow-[1px_1px_0px_var(--border)]">
              '26
            </span>
          </Link>
          <span className="text-xs font-mono font-black text-foreground bg-muted px-2 py-0.5 border-2 border-border shadow-[2px_2px_0px_var(--border)]">
            {vibeId}
          </span>
          {assignedZoneName && (
            <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] font-black text-secondary-foreground bg-secondary border-2 border-border shadow-[2px_2px_0px_var(--border)] px-2 py-0.5">
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
                  "flex items-center space-x-1.5 px-3 py-1.5 text-xs font-black transition-all border-2",
                  isActive
                    ? "bg-primary text-primary-foreground border-border shadow-[2px_2px_0px_var(--border)]"
                    : "bg-card text-card-foreground border-border shadow-[2px_2px_0px_var(--border)] hover:bg-muted active:translate-x-[1px] active:translate-y-[1px]"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Status Badges & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Level Pill */}
          <div className="hidden sm:flex items-center space-x-1 text-[11px] font-black text-card-foreground bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)] px-2.5 py-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="truncate max-w-[110px] sm:max-w-none">
              {levelName.replace("VIBE ", "")}
            </span>
          </div>

          {/* Coins Pill */}
          <Link
            href="/app/profile"
            title="View Wallet & Ledger"
            className="flex items-center space-x-1.5 bg-secondary hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] transition-all border-2 border-border shadow-[2px_2px_0px_var(--border)] px-3 py-1 text-secondary-foreground font-black cursor-pointer"
          >
            <Coins className="w-4 h-4 text-secondary-foreground" />
            <span className="text-xs font-black tracking-tight font-mono">
              {formatCoins(coins)}
            </span>
          </Link>

          {/* Sun / Moon Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 bg-card text-card-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:bg-muted active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center justify-center transition-all"
            aria-label="Toggle Theme"
            title="Toggle Light / Dark Mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-secondary" /> : <Moon className="w-4 h-4 text-foreground" />}
          </button>

          {/* User Nav / Avatar / Clerk UserButton */}
          <UserNav vibeId={vibeId} displayName={displayName} />
        </div>
      </div>
    </header>
  );
}
