"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, QrCode, Trophy, User, Gamepad2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function AttendeeBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/app", icon: Home },
    { label: "Zones", href: "/app/map", icon: Compass },
    { label: "Games", href: "/app/games", icon: Gamepad2 },
    { label: "Scan", href: "/app/scan", icon: QrCode, isPrimary: true },
    { label: "Friends", href: "/app/friends", icon: Users },
    { label: "Ranks", href: "/app/leaderboard", icon: Trophy },
    { label: "Profile", href: "/app/profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto px-2 pb-safe pt-2 bg-card/95 backdrop-blur-2xl border-t-2 border-border shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-4 flex flex-col items-center group focus:outline-none"
                aria-label="Scan QR Code"
              >
                <div
                  className={cn(
                    "w-12 h-12 border-2 border-border flex items-center justify-center transition-all duration-150 active:translate-x-[2px] active:translate-y-[2px]",
                    isActive
                      ? "bg-secondary text-secondary-foreground shadow-neon-purple"
                      : "bg-primary text-primary-foreground shadow-neon-pink hover:scale-105"
                  )}
                >
                  <Icon className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-[10px] font-black tracking-wider uppercase text-foreground mt-1 font-mono">
                  Scan
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-1 px-1.5 font-bold transition-all relative",
                isActive
                  ? "text-[#00F0FF] font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 mb-0.5", isActive ? "text-[#00F0FF] scale-110 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" : "text-muted-foreground")} />
              <span className="text-[10px] font-black tracking-tight">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#00F0FF] mt-0.5 shadow-[0_0_6px_#00F0FF]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
