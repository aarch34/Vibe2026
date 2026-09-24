"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Bell,
  Sun,
  Moon,
  X,
  CheckCircle2,
  UserPlus,
  Heart,
  MessageSquare,
  Trophy,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/auth/user-nav";
import { Notification } from "@/types/database";

interface TopHeaderProps {
  vibeId?: string;
  xp?: number;
  levelName?: string;
  badgeIcon?: string;
  displayName?: string;
  avatarUrl?: string | null;
  notifications?: Notification[];
}

export function TopHeader({
  vibeId = "VB2026-000",
  xp = 0,
  levelName = "VIBE NEWBIE",
  badgeIcon = "🌱",
  displayName,
  avatarUrl,
  notifications = [],
}: TopHeaderProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifsList, setNotifsList] = useState<Notification[]>(notifications);

  const unreadCount = notifsList.filter((n) => !n.read).length;
  const displayXp = typeof xp === "number" ? xp : 0;

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

  const markAllAsRead = () => {
    setNotifsList((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getNotifIcon = (type: Notification["type"]) => {
    switch (type) {
      case "connection_request":
      case "connection_accepted":
        return <UserPlus className="w-4 h-4 text-cyan-400" />;
      case "post_like":
        return <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />;
      case "post_comment":
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case "level_unlocked":
      case "xp_earned":
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case "high_score":
        return <Trophy className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border/80 px-4 sm:px-6 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & VIBE ID */}
          <div className="flex items-center space-x-2.5">
            <Link href="/app" className="flex items-center space-x-1.5 group">
              <span className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 group-hover:brightness-125 transition-all font-mono drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                VIBE
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30">
                '26
              </span>
            </Link>
            <span className="hidden sm:inline-block text-[11px] font-mono font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
              {vibeId}
            </span>
          </div>

          {/* Center XP & Level Progress */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Level Pill */}
            <div className="flex items-center space-x-1 text-xs font-bold text-foreground bg-secondary/80 border border-secondary/60 px-2.5 py-1 rounded-full shadow-sm">
              <span className="text-sm">{badgeIcon}</span>
              <span className="truncate max-w-[100px] sm:max-w-none text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                {levelName}
              </span>
            </div>

            {/* XP Pill */}
            <Link
              href="/app/profile"
              className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 px-3 py-1 rounded-full text-amber-300 font-extrabold text-xs shadow-sm transition-all active:scale-95"
            >
              <span className="text-amber-400">⭐</span>
              <span className="font-mono text-sm tracking-tight">{displayXp.toLocaleString()} XP</span>
            </Link>
          </div>


          {/* Right Action Icons */}
          <div className="flex items-center space-x-2">
            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 rounded-full bg-secondary/60 hover:bg-secondary text-foreground transition-all active:scale-95 border border-border/50"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center animate-pulse shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-secondary/60 hover:bg-secondary text-foreground transition-all active:scale-95 border border-border/50"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
            </button>

            {/* User Nav */}
            <UserNav vibeId={vibeId} displayName={displayName} avatarUrl={avatarUrl} />
          </div>
        </div>
      </header>

      {/* Notifications Drawer / Modal */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-purple-400" />
                <h3 className="font-black text-lg text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-pink-500/20 text-pink-400 rounded-full border border-pink-500/30">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-bold text-cyan-400 hover:underline flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifsList.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground space-y-2">
                  <Bell className="w-10 h-10 mx-auto opacity-30 text-purple-400" />
                  <p className="font-semibold text-sm">No notifications yet!</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Connect with people, create posts, and play games to trigger XP & notification alerts.
                  </p>
                </div>
              ) : (
                notifsList.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all flex items-start space-x-3",
                      n.read
                        ? "bg-card/40 border-border/40 opacity-80"
                        : "bg-secondary/60 border-purple-500/30 shadow-sm"
                    )}
                  >
                    <div className="p-2 rounded-lg bg-background border border-border/60 shrink-0">
                      {getNotifIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-foreground truncate">{n.title}</h4>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => setIsNotifOpen(false)}
                          className="inline-flex items-center space-x-1 text-[11px] font-bold text-cyan-400 mt-2 hover:underline"
                        >
                          <span>View details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
