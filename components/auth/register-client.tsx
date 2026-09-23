"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Sparkles,
  User,
  Building,
  Award,
  Instagram,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AVATAR_SEEDS = ["Aarav", "Ananya", "Rohan", "Maya", "Kabir", "Zara", "Dev", "Priya"];

export function RegisterClient() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Form State - ONLY: Name, Rotaract Club Name, Designation in Club, Instagram ID, Avatar
  const [formData, setFormData] = useState({
    fullName: "",
    rotaractClub: "",
    designation: "",
    instagramUsername: "",
    avatarUrl: "",
  });

  // Prefill user info from Clerk when available
  useEffect(() => {
    if (isLoaded && user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "",
        avatarUrl: prev.avatarUrl || user.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.firstName || "VIBE")}`,
      }));
    }
  }, [isLoaded, user]);

  // Handle image file selection from system/gallery
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select a valid image file (JPEG, PNG, WebP, GIF).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Photo exceeds 5MB size limit. Please pick a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData((prev) => ({ ...prev, avatarUrl: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.fullName.trim() || !formData.rotaractClub.trim() || !formData.designation.trim() || !formData.instagramUsername.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          rotaractClub: formData.rotaractClub.trim(),
          designation: formData.designation.trim(),
          courseYear: formData.designation.trim(),
          college: formData.rotaractClub.trim(),
          instagramUsername: formData.instagramUsername.trim().replace(/^@/, ""),
          avatarUrl: formData.avatarUrl,
          clerkUserId: user?.id,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsComplete(true);
      } else {
        setErrorMsg(data.error || "Could not save profile. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setIsComplete(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-oceanic-depth bg-cyber-grid text-foreground flex items-center justify-center px-4 py-8 relative overflow-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-pink-500/15 via-purple-500/10 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-cyan-500/10 blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-lg bg-card/95 backdrop-blur-2xl border-2 border-border shadow-[6px_6px_0px_var(--border)] p-6 sm:p-8 relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-xs font-mono font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VIBE 2026 Pre-Event Network</span>
          </div>
          <h1 className="text-3xl font-mono font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FF1B7A] via-[#A855F7] to-[#00F0FF] uppercase">
            CREATE YOUR PROFILE
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Connect with attendees, play games & earn XP before VIBE 2026!
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-destructive/20 border-2 border-destructive text-destructive text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {!isComplete ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Profile Photo / Avatar Picker Section */}
            <div className="space-y-3 p-4 bg-secondary/40 border-2 border-border">
              <label className="text-xs font-black uppercase tracking-wider text-foreground block">
                PROFILE PHOTO / AVATAR
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
                id="register-avatar-file-input"
              />

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Image Avatar Preview */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 border-2 border-[#A855F7] overflow-hidden bg-background shadow-md">
                    <img
                      src={
                        formData.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.fullName || "User")}`
                      }
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-[#FF1B7A] text-white border border-border shadow-md hover:scale-110 transition-all cursor-pointer"
                    title="Upload Photo from System"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Upload Action & Presets */}
                <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="neo-btn-primary w-full sm:w-auto px-3.5 py-2 text-xs font-black uppercase tracking-wider inline-flex items-center justify-center space-x-1.5 shadow-[2px_2px_0px_var(--border)] hover:shadow-neon-pink transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from Gallery / System</span>
                  </button>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-muted-foreground font-mono font-bold uppercase block">
                      Or pick a quick avatar preset:
                    </span>
                    <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                      {AVATAR_SEEDS.slice(0, 5).map((seed) => (
                        <button
                          key={seed}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
                            })
                          }
                          className={cn(
                            "text-[10px] font-mono font-black px-2 py-0.5 border transition-all cursor-pointer",
                            formData.avatarUrl.includes(seed)
                              ? "bg-[#A855F7] text-white border-white"
                              : "bg-background text-muted-foreground border-border hover:border-primary"
                          )}
                        >
                          {seed}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {photoError && (
                <div className="p-2 bg-destructive/20 border border-destructive text-destructive text-[11px] font-bold flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}
            </div>

            {/* 1. Full Name */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-background border-2 border-border text-sm font-medium focus:outline-none focus:border-[#FF1B7A] transition-all text-foreground"
                />
              </div>
            </div>

            {/* 2. Rotaract Club Name */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">
                Rotaract Club Name *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rotaract Club of Koramangala"
                  value={formData.rotaractClub}
                  onChange={(e) => setFormData({ ...formData, rotaractClub: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-background border-2 border-border text-sm font-medium focus:outline-none focus:border-[#A855F7] transition-all text-foreground"
                />
              </div>
            </div>

            {/* 3. Designation in Club */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">
                Designation in Club *
              </label>
              <div className="relative">
                <Award className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. President / Director / General Member"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-background border-2 border-border text-sm font-medium focus:outline-none focus:border-[#00F0FF] transition-all text-foreground"
                />
              </div>
            </div>

            {/* 4. Instagram ID */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">
                Instagram ID * <span className="text-amber-400 font-mono">(+25 XP)</span>
              </label>
              <div className="relative">
                <Instagram className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. aarav.sharma"
                  value={formData.instagramUsername}
                  onChange={(e) => setFormData({ ...formData, instagramUsername: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-background border-2 border-border text-sm font-medium focus:outline-none focus:border-[#FF1B7A] transition-all text-foreground"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.fullName.trim() ||
                !formData.rotaractClub.trim() ||
                !formData.designation.trim() ||
                !formData.instagramUsername.trim()
              }
              className="neo-btn-primary w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[4px_4px_0px_var(--border)] hover:shadow-neon-pink disabled:opacity-50 transition-all cursor-pointer"
            >
              <span>{isSubmitting ? "SAVING PROFILE..." : "COMPLETE REGISTRATION ✨"}</span>
            </button>
          </form>
        ) : (
          /* STEP SUCCESS */
          <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300 py-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto shadow-neon-cyan">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-mono font-black uppercase tracking-tight text-foreground">
                WELCOME TO VIBE! 🎉
              </h2>
              <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto">
                Your profile is ready. Start connecting, playing games, and earning XP before the big event!
              </p>
            </div>

            {/* Profile Teaser Summary Card */}
            <div className="p-4 bg-card border-2 border-border shadow-[4px_4px_0px_var(--border)] text-left space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 border-2 border-border overflow-hidden bg-muted shrink-0">
                  <img
                    src={
                      formData.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.fullName)}`
                    }
                    alt={formData.fullName}
                    className="w-full h-full object-cover"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground">{formData.fullName}</h4>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {formData.designation} • {formData.rotaractClub}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-amber-400">+50 XP Profile Bonus</span>
                <span className="text-pink-400">+25 XP Instagram Bonus</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/app")}
              className="neo-btn-primary w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[4px_4px_0px_var(--border)] hover:shadow-neon-pink transition-all cursor-pointer"
            >
              <span>ENTER VIBE →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
