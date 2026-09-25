"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusSquare, Gamepad2, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const BOTTOM_NAV_ITEMS = [
  { label: "Home", href: "/app", icon: Home },
  { label: "Discover", href: "/app/discover", icon: Compass },
  { label: "Post", href: "/app/post", icon: PlusSquare, isPrimary: true },
  { label: "Friends", href: "/app/friends", icon: Users },
  { label: "Profile", href: "/app/profile", icon: User },
];

export function AttendeeBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/80 md:hidden py-1.5 px-3">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-3 flex flex-col items-center group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-pink-500/25 group-active:scale-95 transition-all">
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-foreground group-hover:bg-transparent group-hover:text-white transition-all">
                    <Icon className="w-6 h-6 text-pink-400 group-hover:text-white" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-pink-400 mt-0.5">Post</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-1 px-2.5 rounded-xl transition-all active:scale-95",
                isActive
                  ? "text-pink-400 font-bold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110 text-pink-400")} />
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
