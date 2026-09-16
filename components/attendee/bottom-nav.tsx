"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, QrCode, Trophy, User, Gamepad2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

export function AttendeeBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/app", icon: Home },
    { label: "Zones", href: "/app/map", icon: Compass },
    { label: "Games", href: "/app/games", icon: Gamepad2 },
    { label: "Scan", href: "/app/scan", icon: QrCode, isPrimary: true },
    { label: "Stalls", href: "/app/stalls", icon: Camera },
    { label: "Ranks", href: "/app/leaderboard", icon: Trophy },
    { label: "Profile", href: "/app/profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto px-3 pb-safe pt-2 bg-[#070B14]/90 backdrop-blur-xl border-t border-slate-800/80">
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
                    "w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-200 active:scale-95 shadow-lg border-2",
                    isActive
                      ? "bg-gradient-to-tr from-cyan-500 to-blue-600 border-cyan-300 shadow-cyan-500/50"
                      : "bg-gradient-to-tr from-blue-600 to-cyan-500 border-blue-400 shadow-blue-500/40 hover:scale-105"
                  )}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-cyan-400 mt-1">
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
                "flex flex-col items-center py-1 px-2 rounded-lg transition-colors duration-150 active:scale-95",
                isActive
                  ? "text-blue-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon className={cn("w-5 h-5 mb-1", isActive && "text-blue-400")} />
              <span className="text-[10px] font-medium tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
