"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Instagram,
  Hash,
  Compass,
  Loader2,
  Waves,
} from "lucide-react";

const OFFICIAL_ZONES = [
  { id: "z-arnava", name: "Arnava", tagline: "The Ocean of Momentum", icon: "🌊" },
  { id: "z-taranaga", name: "Taranaga", tagline: "The Rhythm of the Tide", icon: "🌊" },
  { id: "z-sagara", name: "Sagara", tagline: "The Deep Collective", icon: "🌊" },
  { id: "z-pravaha", name: "Pravaha", tagline: "The Relentless Current", icon: "🌊" },
  { id: "z-samudhra", name: "Samudhra", tagline: "The Endless Horizon", icon: "🌊" },
  { id: "z-varuna", name: "Varuna", tagline: "The Cosmic Sovereign", icon: "🌊" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    club: "",
    instagramId: "",
    registrationId: "",
    assignedZoneId: "z-arnava",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!formData.club.trim()) {
      setErrorMsg("Please enter your Rotaract club name.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Registration failed. Please try again.");
      }

      router.push("/app/welcome");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-white flex flex-col justify-between selection:bg-blue-600">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              VIBE
            </span>
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-blue-950 border border-blue-500/30 text-blue-300">
              Freshers '26
            </span>
          </Link>
          <Link
            href="/app"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Already registered? Skip to App →
          </Link>
        </div>
      </header>

      {/* Main Registration Form */}
      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12 w-full">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Rotaract District 3192 Registration</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Create Your VIBE Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Get assigned to your festival zone, claim your <strong>500 VIBE Coins</strong> starter wallet, and dive into the live competition!
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-5 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Full Name *</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Aarcha U"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Phone & Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="aarcha@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Rotaract Club & Instagram */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rotaract Club *</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.club}
                  onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                  placeholder="e.g. RC Bangalore West"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Instagram className="w-3.5 h-3.5 text-pink-400" />
                  <span>Instagram ID (Handle)</span>
                </label>
                <input
                  type="text"
                  value={formData.instagramId}
                  onChange={(e) => setFormData({ ...formData, instagramId: e.target.value })}
                  placeholder="@aarcha.u"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Registration ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ticket / Registration ID</span>
              </label>
              <input
                type="text"
                value={formData.registrationId}
                onChange={(e) => setFormData({ ...formData, registrationId: e.target.value })}
                placeholder="REG-2026-0042 (optional)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition-colors"
              />
            </div>

            {/* Zone Assignment Selection */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Waves className="w-3.5 h-3.5 text-blue-400" />
                  <span>Assigned VIBE Zone</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-normal">
                  6 Official Zones
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OFFICIAL_ZONES.map((zone) => {
                  const isSelected = formData.assignedZoneId === zone.id;
                  return (
                    <button
                      type="button"
                      key={zone.id}
                      onClick={() => setFormData({ ...formData, assignedZoneId: zone.id })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/20"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-80"
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sm">{zone.icon}</span>
                        <span className="text-xs font-bold text-white">{zone.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {zone.tagline}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-sm font-extrabold text-white shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Profile & Wallet...</span>
                  </>
                ) : (
                  <>
                    <span>Claim 500 Coins & Enter VIBE</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800/60 text-center text-xs text-slate-500">
        Rotaract District 3192 • VIBE 2026 Festival Operations
      </footer>
    </div>
  );
}
