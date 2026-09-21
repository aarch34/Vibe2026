"use client";

import React from "react";
import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

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
  const handleSignOutClick = () => {
    // Purge any dev/registration attendee cookies from browser
    document.cookie =
      "vibe_user_id=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "vibe_zonal_auth=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  return (
    <SignOutButton redirectUrl={redirectUrl}>
      <button
        type="button"
        onClick={handleSignOutClick}
        className={
          className ||
          (variant === "badge"
            ? "inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-black bg-destructive text-destructive-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            : "w-full flex items-center justify-center space-x-2 px-4 py-3 text-xs font-black bg-destructive text-destructive-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer")
        }
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>
    </SignOutButton>
  );
}
