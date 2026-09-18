"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, User, ArrowRight, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { loginAdminAction } from "@/actions/admin/auth";

export default function AdminLoginPage() {
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
      const res = await loginAdminAction(formData);
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

  function fillQuickLogin(user: string, pass: string) {
    setUsername(user);
    setPassword(pass);
    setErrorMsg(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-6 sm:p-8 bg-card text-card-foreground border-2 border-border shadow-neo space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-primary text-primary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <span className="text-[10px] uppercase font-black tracking-widest text-primary font-mono block">
            ROCCO 2026 • Command Center
          </span>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">
            Admin Authentication
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Restricted access for designated festival administrators (jk, gunjan).
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-destructive text-destructive-foreground border-2 border-border text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase font-black text-muted-foreground font-mono block">
              Admin Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="jk or gunjan"
                className="w-full pl-10 pr-4 py-2.5 bg-muted border-2 border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono font-bold"
                autoCapitalize="none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase font-black text-muted-foreground font-mono block">
              Password
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
            className="neo-btn-primary w-full py-3.5 text-sm font-black uppercase tracking-wider flex items-center justify-center space-x-2 disabled:opacity-50 shadow-[4px_4px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Enter Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Helper */}
        <div className="pt-4 border-t-2 border-border space-y-2.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono font-black block text-center">
            Authorized Administrator Logins
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillQuickLogin("jk", "jk@vibe2026")}
              className="neo-btn-card p-2.5 border-2 border-border text-left shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <span className="text-[11px] font-black text-foreground block">
                👤 JK
              </span>
              <span className="text-[9px] text-muted-foreground font-mono font-bold">jk / jk@vibe2026</span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickLogin("gunjan", "gunjan@vibe2026")}
              className="neo-btn-card p-2.5 border-2 border-border text-left shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <span className="text-[11px] font-black text-foreground block">
                👤 Gunjan
              </span>
              <span className="text-[9px] text-muted-foreground font-mono font-bold">gunjan / gunjan@vibe2026</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
