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

  function fillZoneLogin(user: string, pass: string) {
    setUsername(user);
    setPassword(pass);
    setErrorMsg(null);
  }

  const zonePresets = [
    { zone: "Arnava", user1: "arnava1", user2: "arnava2", pass: "arnava@vibe2026", color: "border-sky-500/30 text-sky-400" },
    { zone: "Taranaga", user1: "taranaga1", user2: "taranaga2", pass: "taranaga@vibe2026", color: "border-purple-500/30 text-purple-400" },
    { zone: "Sagara", user1: "sagara1", user2: "sagara2", pass: "sagara@vibe2026", color: "border-blue-500/30 text-blue-400" },
    { zone: "Pravaha", user1: "pravaha1", user2: "pravaha2", pass: "pravaha@vibe2026", color: "border-emerald-500/30 text-emerald-400" },
    { zone: "Samudhra", user1: "samudhra1", user2: "samudhra2", pass: "samudhra@vibe2026", color: "border-amber-500/30 text-amber-400" },
    { zone: "Varuna", user1: "varuna1", user2: "varuna2", pass: "varuna@vibe2026", color: "border-rose-500/30 text-rose-400" },
  ];

  return (
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow backdrop */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 relative z-10 backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center mx-auto text-white shadow-lg shadow-cyan-500/30">
            <MapPin className="w-7 h-7" />
          </div>

          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 font-mono block">
            ROCCO 2026 • Staff Operations
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Zonal Heads Portal
          </h1>
          <p className="text-xs text-slate-400">
            Dedicated check-in station & coin collection console for the 6 official zones.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase font-bold text-slate-400 font-mono block">
              Zonal Head Username (12 Logins Available)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. arnava1, taranaga2, varuna1"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-mono transition-colors"
                autoCapitalize="none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase font-bold text-slate-400 font-mono block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-mono transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-98 transition-all text-sm font-black text-white shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Access Zonal Station</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 12 Logins Quick-Click Selector */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">
              12 Official Zonal Logins (2 Per Zone)
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">Password: [zone]@vibe2026</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {zonePresets.map((z) => (
              <div
                key={z.zone}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-1.5"
              >
                <span className={`text-[11px] font-bold block ${z.color}`}>
                  Zone {z.zone}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => fillZoneLogin(z.user1, z.pass)}
                    className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-300 transition-colors text-center border border-slate-800 cursor-pointer"
                  >
                    Head 1
                  </button>
                  <button
                    type="button"
                    onClick={() => fillZoneLogin(z.user2, z.pass)}
                    className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-300 transition-colors text-center border border-slate-800 cursor-pointer"
                  >
                    Head 2
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
