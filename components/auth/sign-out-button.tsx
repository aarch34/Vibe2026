"use client";

import React from "react";
import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

interface AttendeeSignOutButtonProps {
  className?: string;
  variant?: "badge" | "button";
}

export function AttendeeSignOutButton({
  className,
  variant = "button",
}: AttendeeSignOutButtonProps) {
  return (
    <SignOutButton redirectUrl="/">
      <button
        type="button"
        className={
          className ||
          (variant === "badge"
            ? "inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-black bg-destructive text-destructive-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            : "w-full flex items-center justify-center space-x-2 px-4 py-2 text-xs font-black bg-destructive text-destructive-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer")
        }
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Sign Out</span>
      </button>
    </SignOutButton>
  );
}
