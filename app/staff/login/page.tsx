"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Waves,
  ShieldCheck,
} from "lucide-react";
import { loginZonalStaffAction } from "@/actions/staff/auth";
import { ZONAL_CREDENTIALS } from "@/lib/staff/zonal-config";

export default function ZonalStaffLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter both username and password");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.set("username", username.trim());
    formData.set("password", password.trim());

    try {
      const res = await loginZonalStaffAction(formData);
      if (res.success && res.redirectUrl) {
        router.push(res.redirectUrl);
        router.refresh();
      } else {
        setErrorMsg(res.message || "Invalid credentials");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Glow backdrop */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg p-6 sm:p-8 bg-card text-card-foreground border-2 border-border shadow-neo space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-primary text-primary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] flex items-center justify-center mx-auto">
            <MapPin className="w-7 h-7" />
          </div>

          <span className="text-[10px] uppercase font-black tracking-widest text-primary font-mono block">
            ROCCO 2026 • Staff Operations
          </span>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">
            Zonal Station Portal
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Dedicated check-in station & coin collection console for authorized Zonal Heads & Staff.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-destructive text-destructive-foreground border-2 border-border text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* Primary Authentication: Clerk SSO */}
        <div className="p-4 bg-muted border-2 border-border space-y-3">
          <div className="flex items-center space-x-2 text-primary font-mono text-xs font-black uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Zonal Staff Access</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Sign in with your authorized email address added by the administrator to access your assigned Oceanic Zone station.
          </p>
          <a
            href="/sign-in?redirect_url=/staff"
            className="neo-btn-primary w-full py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[3px_3px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <span>Sign In With Clerk (Staff & Heads)</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Offline / Kiosk Direct Passcode Form */}
        <div className="pt-2 border-t-2 border-border space-y-3">
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono font-bold">
              — Or Station Kiosk Passcode (Offline Booth Tablet) —
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-black text-muted-foreground font-mono block">
                Station Username / Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. arnava1, user@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-muted border-2 border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono font-bold"
                  autoCapitalize="none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-black text-muted-foreground font-mono block">
                Kiosk Passcode
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-muted border-2 border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="neo-btn-card w-full py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 disabled:opacity-50 border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Unlock Station Kiosk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
