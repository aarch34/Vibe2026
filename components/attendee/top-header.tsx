"use client";

import React, { useState, useEffect } from "react";
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
  Users,
  Compass,
  PlusSquare,
  Gamepad2,
  Flame,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/auth/user-nav";
import { Notification, ConnectionRequest, Profile } from "@/types/database";

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
  notifications: initialNotifs = [],
}: TopHeaderProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifsList, setNotifsList] = useState<Notification[]>(initialNotifs);
  const [incomingRequests, setIncomingRequests] = useState<{ request: ConnectionRequest; sender?: Profile }[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [acceptedRequests, setAcceptedRequests] = useState<Set<string>>(new Set());

  // Dynamic notification polling every 5 seconds
  useEffect(() => {
    let isMounted = true;

    const fetchNotifs = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setNotifsList(data.notifications || []);
            setIncomingRequests(data.incomingRequests || []);
          }
        }
      } catch {
        // Silently ignore network interruptions
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const unreadNotifs = notifsList.filter((n) => !n.read).length;
  const unreadCount = unreadNotifs + incomingRequests.filter((r) => !acceptedRequests.has(r.request.id)).length;
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

  const markAllAsRead = async () => {
    setNotifsList((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications", { method: "POST" });
    } catch {
      // Ignore
    }
  };

  const handleRespondRequest = async (requestId: string, action: "accept" | "decline") => {
    setRespondingId(requestId);
    try {
      const res = await fetch("/api/connections/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        if (action === "accept") {
          setAcceptedRequests((prev) => new Set(prev).add(requestId));
        } else {
          setIncomingRequests((prev) => prev.filter((r) => r.request.id !== requestId));
        }
      }
    } catch {
      // Ignore
    } finally {
      setRespondingId(null);
    }
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

  const desktopNavLinks = [
    { label: "Feed", href: "/app", icon: Flame },
    { label: "Discover", href: "/app/discover", icon: Compass },
    { label: "Post", href: "/app/post", icon: PlusSquare },
    { label: "Games", href: "/app/games", icon: Gamepad2 },
    { label: "Leaderboard", href: "/app/leaderboard", icon: Trophy },
    { label: "Friends", href: "/app/friends", icon: Users },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border/80 px-4 sm:px-6 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & VIBE ID */}
          <div className="flex items-center space-x-3">
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

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 font-bold text-xs">
            {desktopNavLinks.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all",
                    isActive
                      ? "bg-pink-500/10 text-pink-400 border border-pink-500/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* XP & Level Progress */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Level Pill */}
            <div className="flex items-center space-x-1 text-xs font-bold text-foreground bg-secondary/80 border border-secondary/60 px-2.5 py-1 rounded-full shadow-sm">
              <span className="text-sm">{badgeIcon}</span>
              <span className="truncate max-w-[90px] sm:max-w-none text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
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

          {/* Right Action Icons: Notification Bell, Theme, User Nav */}
          <div className="flex items-center space-x-2">
            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 rounded-full bg-secondary/60 hover:bg-secondary text-foreground transition-all active:scale-95 border border-border/50 cursor-pointer"
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
              className="p-2 rounded-full bg-secondary/60 hover:bg-secondary text-foreground transition-all active:scale-95 border border-border/50 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
            </button>

            {/* User Nav */}
            <UserNav vibeId={vibeId} displayName={displayName} avatarUrl={avatarUrl} />
          </div>
        </div>
      </header>

      {/* Notifications Drawer */}
      {isNotifOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-200"
          onClick={() => setIsNotifOpen(false)}
        >
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
                {unreadNotifs > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-bold text-cyan-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* SECTION: Incoming Connection Requests */}
              {incomingRequests.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono font-black uppercase tracking-wider text-cyan-400 flex items-center space-x-1">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Connection Requests ({incomingRequests.length})</span>
                  </span>

                  <div className="space-y-2">
                    {incomingRequests.map(({ request, sender }) => {
                      const isAccepted = acceptedRequests.has(request.id);
                      return (
                        <div
                          key={request.id}
                          className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-2.5"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={sender?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender?.display_name || "user"}`}
                              alt={sender?.display_name || "User"}
                              className="w-10 h-10 rounded-full object-cover border border-cyan-400/50"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-black text-foreground truncate">
                                {sender?.display_name || "Rotaract Attendee"}
                              </h4>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {sender?.rotaract_club || sender?.college || "District 3192"}
                              </p>
                            </div>
                          </div>

                          {isAccepted ? (
                            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center space-x-1.5">
                              <Check className="w-4 h-4" />
                              <span>Connected! +25 XP Earned 🎉</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 pt-1">
                              <button
                                onClick={() => handleRespondRequest(request.id, "accept")}
                                disabled={respondingId === request.id}
                                className="flex-1 py-1.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-black text-xs rounded-xl hover:brightness-110 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                              >
                                {respondingId === request.id ? "Connecting..." : "ACCEPT (+25 XP)"}
                              </button>
                              <button
                                onClick={() => handleRespondRequest(request.id, "decline")}
                                disabled={respondingId === request.id}
                                className="px-3 py-1.5 bg-secondary text-muted-foreground hover:text-foreground font-bold text-xs rounded-xl transition-all cursor-pointer"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* General Notifications */}
              {notifsList.length === 0 && incomingRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground space-y-2">
                  <Bell className="w-10 h-10 mx-auto opacity-30 text-purple-400" />
                  <p className="font-semibold text-sm">No notifications yet!</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    When someone sends a connection request, likes your post, or comments, you will see it here live!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono font-black uppercase tracking-wider text-muted-foreground">
                    Activity & Updates
                  </span>

                  {notifsList.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all flex items-start space-x-3",
                        n.read
                          ? "bg-card/40 border-border/40 opacity-75"
                          : "bg-secondary/60 border-purple-500/30 shadow-sm"
                      )}
                    >
                      <div className="p-2 rounded-xl bg-background border border-border/60 shrink-0">
                        {getNotifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-foreground truncate">{n.title}</h4>
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
                            <span>Open details</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
