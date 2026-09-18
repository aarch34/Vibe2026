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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto px-3 pb-safe pt-2 bg-card/95 backdrop-blur-xl border-t-2 border-border shadow-neo">
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
                    "w-12 h-12 border-2 border-border flex items-center justify-center transition-all duration-150 active:translate-x-[2px] active:translate-y-[2px] shadow-[3px_3px_0px_var(--border)]",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-primary text-primary-foreground hover:brightness-105"
                  )}
                >
                  <Icon className="w-6 h-6" />
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
                "flex flex-col items-center py-1 px-2 font-bold transition-all active:scale-95",
                isActive
                  ? "text-primary font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 mb-1", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className="text-[10px] font-black tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
