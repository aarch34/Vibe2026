"use client";

import React from "react";
import Link from "next/link";
import { User, LogOut, LogIn } from "lucide-react";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isClerkReady = Boolean(publishableKey && !publishableKey.includes("placeholder"));

interface UserNavProps {
  vibeId?: string;
  displayName?: string;
}

export function UserNav({ vibeId, displayName }: UserNavProps) {
  if (isClerkReady) {
    return (
      <div className="flex items-center space-x-2">
        <SignedIn>
          <div className="border-2 border-border shadow-[2px_2px_0px_var(--border)] p-0.5 bg-card flex items-center justify-center">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-7 h-7 rounded-none",
                  userButtonTrigger: "focus:shadow-none focus:outline-none",
                  userButtonPopoverCard:
                    "bg-[#090816] border-2 border-[#3b336a] text-white shadow-[4px_4px_0px_#000000] rounded-none",
                  userButtonPopoverActionButton:
                    "text-white hover:bg-[#1c1838] hover:text-white rounded-none transition-colors",
                  userButtonPopoverActionButtonText:
                    "text-white font-bold text-xs",
                  userButtonPopoverActionButtonIcon:
                    "text-[#ff2a85]",
                  userButtonPopoverFooter:
                    "border-t border-[#3b336a] bg-[#090816]",
                  userPreviewMainIdentifier:
                    "text-white font-black",
                  userPreviewSecondaryIdentifier:
                    "text-[#a39ebf]",
                },
              }}
            />
          </div>
        </SignedIn>
        <SignedOut>
          {vibeId ? (
            <Link
              href="/app/profile"
              className="flex items-center space-x-1.5 p-1 bg-card hover:bg-muted text-card-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
              title="View Attendee Profile"
            >
              <div className="w-6 h-6 bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
                {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-black bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:brightness-105"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </SignedOut>
      </div>
    );
  }

  // Fallback Dev / In-memory Attendee Nav
  return (
    <Link
      href="/app/profile"
      className="flex items-center space-x-1.5 p-1 bg-card hover:bg-muted text-card-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
      title="View Attendee Profile"
    >
      <div className="w-6 h-6 bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
        {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
      </div>
    </Link>
  );
}
