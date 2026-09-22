"use client";

import React, { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { LogOut, Loader2 } from "lucide-react";
import { logoutAttendeeAction } from "@/actions/auth/logout";

interface AttendeeSignOutButtonProps {
  className?: string;
  variant?: "badge" | "button";
  redirectUrl?: string;
  label?: string;
}

export function AttendeeSignOutButton({
  className,
  variant = "button",
  redirectUrl = "/sign-in",
  label = "Sign Out",
}: AttendeeSignOutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const clerk = useClerk();

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // 1. Purge server-side cookies & invalidate session cache
      try {
        await logoutAttendeeAction();
      } catch (err) {
        console.warn("Server action logout warning:", err);
      }

      // Also call direct sign-out API endpoint as backup
      try {
        await fetch("/api/auth/sign-out", { method: "POST" });
      } catch {}

      // 2. Purge client cookies
      document.cookie =
        "vibe_user_id=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie =
        "vibe_zonal_auth=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      // 3. Clerk Sign Out if Clerk is active
      if (clerk && typeof clerk.signOut === "function") {
        try {
          await clerk.signOut({ redirectUrl });
          return;
        } catch (clerkErr) {
          console.warn("Clerk signOut error, falling back to direct redirect:", clerkErr);
        }
      }
    } finally {
      // 4. Force hard redirect to ensure zero stale client state
      window.location.href = redirectUrl;
    }
  };

  const defaultBadgeClasses =
    "inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-black bg-destructive text-destructive-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50";

  const defaultButtonClasses =
    "w-full flex items-center justify-center space-x-2 px-4 py-3 text-xs font-black bg-destructive text-destructive-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50";

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isLoggingOut}
      className={className || (variant === "badge" ? defaultBadgeClasses : defaultButtonClasses)}
      title="Sign out of VIBE 2026"
    >
      {isLoggingOut ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Signing out...</span>
        </>
      ) : (
        <>
          <LogOut className="w-3.5 h-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
