"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
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
  Building,
  CheckCircle2,
  LogIn,
} from "lucide-react";

const OFFICIAL_ZONES = [
  { id: "z-arnava", name: "Arnava", tagline: "The Ocean of Momentum", icon: "🌊" },
  { id: "z-taranaga", name: "Taranaga", tagline: "The Rhythm of the Tide", icon: "🌊" },
  { id: "z-sagara", name: "Sagara", tagline: "The Deep Collective", icon: "🌊" },
  { id: "z-pravaha", name: "Pravaha", tagline: "The Relentless Current", icon: "🌊" },
  { id: "z-samudhra", name: "Samudhra", tagline: "The Endless Horizon", icon: "🌊" },
  { id: "z-varuna", name: "Varuna", tagline: "The Cosmic Sovereign", icon: "🌊" },
];

export function RegisterClient() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    college: "",
    club: "",
    instagramId: "",
    registrationId: "",
    assignedZoneId: "z-arnava",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-fill authenticated Clerk user details
  useEffect(() => {
    if (user) {
      const clerkName = user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim();
      const clerkEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "";

      setFormData((prev) => ({
        ...prev,
        name: prev.name || clerkName,
        email: prev.email || clerkEmail,
      }));
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg("Please enter your mobile phone number.");
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
        body: JSON.stringify({ ...formData, clerkUserId: user?.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.requireAuth) {
          router.push("/sign-in?redirect_url=/register");
          return;
        }
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
            Skip to App →
          </Link>
        </div>
      </header>

      {/* Main Registration Area */}
      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12 w-full">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Rotaract District 3192 Registration</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground font-mono">
              Festival Onboarding
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-bold max-w-md mx-auto">
              Get assigned to your festival zone, claim your <strong className="text-primary font-black">500 VIBE Coins</strong> starter wallet, and dive into the live competition!
            </p>
          </div>

          {/* If user is NOT signed in with Clerk: Show Mandatory Step 1 Sign-In Gate */}
          {isLoaded && !isSignedIn && (
            <div className="p-6 sm:p-8 bg-card text-card-foreground border-2 border-border shadow-neo space-y-6 text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground border-2 border-border shadow-neo flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-black uppercase text-primary tracking-widest block">
                  Step 1 of 2 • Identity Verification
                </span>
                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
                  Sign In First To Register
                </h2>
                <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto">
                  To secure your festival account, claim your 500 starting VIBE coins, and record your live XP, please sign in or create an account with Clerk first.
                </p>
              </div>

              <div className="space-y-3 pt-2 max-w-xs mx-auto">
                <a
                  href="/sign-in?redirect_url=/register"
                  className="neo-btn-primary w-full py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[3px_3px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Create Account with Clerk</span>
                </a>
              </div>
            </div>
          )}

          {/* When Authenticated with Clerk: Show Step 2 Details Form */}
          {isLoaded && isSignedIn && (
            <>
              {/* Authenticated User Badge */}
              <div className="p-3 bg-muted border-2 border-border flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="font-bold text-foreground truncate">
                    Authenticated: <strong className="text-primary">{user?.fullName || "Attendee"}</strong> ({user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress})
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase text-primary border border-primary px-1.5 py-0.5 shrink-0">
                  Verified
                </span>
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
                    name="name"
                    id="name"
                    autoComplete="name"
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
                      name="phone"
                      id="phone"
                      autoComplete="tel"
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
                      name="email"
                      id="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="aarcha@example.com"
                      className="w-full bg-muted border-2 border-border px-3.5 py-2.5 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* College & Rotaract Club Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-foreground flex items-center space-x-1.5">
                      <Building className="w-3.5 h-3.5 text-primary" />
                      <span>College / Institution *</span>
                    </label>
                    <input
                      type="text"
                      name="college"
                      id="college"
                      required
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      placeholder="e.g. RV College of Engineering"
                      className="w-full bg-muted border-2 border-border px-3.5 py-2.5 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-foreground flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      <span>Rotaract Club *</span>
                    </label>
                    <input
                      type="text"
                      name="club"
                      id="club"
                      required
                      value={formData.club}
                      onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                      placeholder="e.g. Rotaract Club of Bangalore"
                      className="w-full bg-muted border-2 border-border px-3.5 py-2.5 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Instagram & Ticket ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-foreground flex items-center space-x-1.5">
                      <Instagram className="w-3.5 h-3.5 text-primary" />
                      <span>Instagram ID (Handle)</span>
                    </label>
                    <input
                      type="text"
                      name="instagramId"
                      id="instagramId"
                      value={formData.instagramId}
                      onChange={(e) => setFormData({ ...formData, instagramId: e.target.value })}
                      placeholder="@aarcha.u"
                      className="w-full bg-muted border-2 border-border px-3.5 py-2.5 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-foreground flex items-center space-x-1.5">
                      <Hash className="w-3.5 h-3.5 text-primary" />
                      <span>Ticket / Registration ID (Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="registrationId"
                      id="registrationId"
                      value={formData.registrationId}
                      onChange={(e) => setFormData({ ...formData, registrationId: e.target.value })}
                      placeholder="REG-2026-0042 (optional)"
                      className="w-full bg-muted border-2 border-border px-3.5 py-2.5 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none font-mono transition-colors"
                    />
                  </div>
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
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t-2 border-border text-center text-xs font-bold text-muted-foreground font-mono">
        Rotaract District 3192 • VIBE 2026 Festival Operations
      </footer>
    </div>
  );
}
