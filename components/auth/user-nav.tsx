"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, LogOut, LogIn } from "lucide-react";
import { SignedIn, SignedOut, useClerk } from "@clerk/nextjs";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isClerkReady = Boolean(publishableKey && !publishableKey.includes("placeholder"));

interface UserNavProps {
  vibeId?: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export function UserNav({ vibeId, displayName, avatarUrl }: UserNavProps) {
  const fallbackAvatar =
    avatarUrl ||
    (displayName
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`
      : null);

  if (isClerkReady) {
    return (
      <div className="flex items-center space-x-1.5">
        <SignedIn>
          {/* Profile avatar → profile page */}
          <Link
            href="/app/profile"
            className="flex items-center p-0.5 bg-card hover:bg-muted text-card-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] transition-all overflow-hidden"
            title="My Profile"
          >
            {fallbackAvatar ? (
              <div className="w-7 h-7 overflow-hidden bg-primary/20 shrink-0">
                <img 
                  src={fallbackAvatar} 
                  alt={displayName || "User"} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    const fb = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName || "user")}`;
                    if ((e.target as HTMLImageElement).src !== fb) {
                      (e.target as HTMLImageElement).src = fb;
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-7 h-7 bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
                {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
            )}
          </Link>

          {/* Explicit Sign Out — always visible */}
          <SignOutButton />
        </SignedIn>

        <SignedOut>
          {vibeId ? (
            <Link
              href="/app/profile"
              className="flex items-center space-x-1.5 p-0.5 bg-card hover:bg-muted text-card-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] transition-all overflow-hidden"
              title="View Attendee Profile"
            >
              {fallbackAvatar ? (
                <div className="w-7 h-7 overflow-hidden bg-primary/20 shrink-0">
                  <img 
                    src={fallbackAvatar} 
                    alt={displayName || "User"} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      const fb = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName || "user")}`;
                      if ((e.target as HTMLImageElement).src !== fb) {
                        (e.target as HTMLImageElement).src = fb;
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-7 h-7 bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
                  {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
              )}
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

  // Fallback: dev / in-memory mode (no Clerk)
  return (
    <Link
      href="/app/profile"
      className="flex items-center space-x-1.5 p-0.5 bg-card hover:bg-muted text-card-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] transition-all overflow-hidden"
      title="View Attendee Profile"
    >
      {fallbackAvatar ? (
        <div className="w-7 h-7 overflow-hidden bg-primary/20 shrink-0">
          <img 
            src={fallbackAvatar} 
            alt={displayName || "User"} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              const fb = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName || "user")}`;
              if ((e.target as HTMLImageElement).src !== fb) {
                (e.target as HTMLImageElement).src = fb;
              }
            }}
          />
        </div>
      ) : (
        <div className="w-7 h-7 bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
          {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
        </div>
      )}
    </Link>
  );
}

// ─── Standalone Sign-Out Button ───────────────────────────────────────────────
function SignOutButton() {
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut({ redirectUrl: "/sign-in" });
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      id="signout-btn"
      onClick={handleSignOut}
      disabled={loading}
      title="Sign Out"
      className="flex items-center space-x-1 px-2 py-1 text-xs font-black bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/40 rounded-lg transition-all disabled:opacity-50"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{loading ? "..." : "Logout"}</span>
    </button>
  );
}
