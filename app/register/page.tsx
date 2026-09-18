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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
      {/* Top Header */}
      <header className="px-6 py-4 border-b-2 border-border bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-black tracking-wider text-foreground font-mono">
              VIBE
            </span>
            <span className="text-[10px] uppercase tracking-widest font-black px-2 py-0.5 bg-primary text-primary-foreground border-2 border-border shadow-[1px_1px_0px_var(--border)]">
              Freshers '26
            </span>
          </Link>
          <Link
            href="/app"
            className="neo-btn-card px-3 py-1.5 text-xs font-black uppercase tracking-wider"
          >
            Already registered? Skip to App →
          </Link>
        </div>
      </header>

      {/* Main Registration Form */}
      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12 w-full">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Rotaract District 3192 Registration</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground font-mono">
              Create Your VIBE Profile
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-bold max-w-md mx-auto">
              Get assigned to your festival zone, claim your <strong className="text-primary font-black">500 VIBE Coins</strong> starter wallet, and dive into the live competition!
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-primary text-primary-foreground border-2 border-border shadow-neo text-xs flex items-center space-x-2 font-black">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-5 sm:p-7 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-foreground flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Full Name *</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Aarcha U"
                className="w-full bg-muted border-2 border-border px-3.5 py-2.5 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
              />
            </div>

            {/* Phone & Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-foreground flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-muted border-2 border-border px-3.5 py-2.5 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-foreground flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="aarcha@example.com"
                  className="w-full bg-muted border-2 border-border px-3.5 py-2.5 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Rotaract Club & Instagram */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-foreground flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Rotaract Club *</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.club}
                  onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                  placeholder="e.g. Rotaract Club of Bangalore"
                  className="w-full bg-muted border-2 border-border px-3.5 py-2.5 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-foreground flex items-center space-x-1.5">
                  <Instagram className="w-3.5 h-3.5 text-primary" />
                  <span>Instagram ID (Handle)</span>
                </label>
                <input
                  type="text"
                  value={formData.instagramId}
                  onChange={(e) => setFormData({ ...formData, instagramId: e.target.value })}
                  placeholder="@aarcha.u"
                  className="w-full bg-muted border-2 border-border px-3.5 py-2.5 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Registration ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-foreground flex items-center space-x-1.5">
                <Hash className="w-3.5 h-3.5 text-primary" />
                <span>Ticket / Registration ID (Optional)</span>
              </label>
              <input
                type="text"
                value={formData.registrationId}
                onChange={(e) => setFormData({ ...formData, registrationId: e.target.value })}
                placeholder="REG-2026-0042 (optional)"
                className="w-full bg-muted border-2 border-border px-3.5 py-2.5 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none font-mono transition-colors"
              />
            </div>

            {/* Zone Assignment Selection */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-black text-foreground flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Waves className="w-3.5 h-3.5 text-primary" />
                  <span>Assigned VIBE Zone</span>
                </span>
                <span className="text-[10px] text-primary font-black font-mono">
                  6 Official Zones
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OFFICIAL_ZONES.map((zone) => {
                  const isSelected = formData.assignedZoneId === zone.id;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, assignedZoneId: zone.id })}
                      className={`p-3 text-left border-2 border-border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-secondary text-secondary-foreground shadow-[3px_3px_0px_var(--border)] font-black"
                          : "bg-card text-card-foreground hover:bg-muted shadow-[1px_1px_0px_var(--border)] font-bold"
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sm">{zone.icon}</span>
                        <span className="text-xs font-black">{zone.name}</span>
                      </div>
                      <p className="text-[10px] opacity-80 mt-0.5 truncate font-bold">
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
                className="w-full py-3.5 neo-btn-primary text-sm font-black uppercase tracking-wider space-x-2 cursor-pointer flex items-center justify-center"
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
      <footer className="px-6 py-4 border-t-2 border-border text-center text-xs font-bold text-muted-foreground font-mono">
        Rotaract District 3192 • VIBE 2026 Festival Operations
      </footer>
    </div>
  );
}
