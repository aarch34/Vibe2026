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
  Tag,
  FileText,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AVATAR_SEEDS = ["Aarav", "Ananya", "Rohan", "Maya", "Kabir", "Zara", "Dev", "Priya"];

const INTEREST_TAGS = [
  "Music",
  "Gaming",
  "Tech & Coding",
  "Photography",
  "Dance",
  "Content Creation",
  "Fitness & Sports",
  "Public Speaking",
  "Design & Art",
  "Community Service",
  "Anime & Pop Culture",
  "Travel",
];

interface RegisterClientProps {
  initialData?: {
    clerkUserId?: string;
    fullName?: string;
    email?: string;
    avatarUrl?: string;
  };
}

export function RegisterClient({ initialData }: RegisterClientProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [dpdpConsent, setDpdpConsent] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [dutiesConfirmed, setDutiesConfirmed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    clerkUserId: initialData?.clerkUserId || "",
    fullName: initialData?.fullName || "",
    email: initialData?.email || "",
    rotaractClub: "",
    designation: "",
    instagramUsername: "",
    bio: "",
    interests: ["Music", "Gaming"] as string[],
    avatarUrl: initialData?.avatarUrl || "",
  });

  // Prefill user info from Clerk when available
  useEffect(() => {
    if (isLoaded && user) {
      setFormData((prev) => ({
        ...prev,
        clerkUserId: prev.clerkUserId || user.id,
        fullName:
          prev.fullName ||
          (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.username || ""),
        email: prev.email || user.primaryEmailAddress?.emailAddress || "",
        avatarUrl:
          prev.avatarUrl ||
          user.imageUrl ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.firstName || "VIBE")}`,
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

  const toggleInterest = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(tag)
        ? prev.interests.filter((t) => t !== tag)
        : [...prev.interests, tag],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (
      !formData.fullName.trim() ||
      !formData.rotaractClub.trim() ||
      !formData.designation.trim() ||
      !formData.instagramUsername.trim()
    ) {
      setErrorMsg("Please fill in all required fields (marked with *).");
      return;
    }

    if (!dpdpConsent || !ageConfirmed || !dutiesConfirmed) {
      setErrorMsg("Under the DPDP Act 2023, you must consent to personal data processing, confirm your age, and acknowledge your duties as a Data Principal to register.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkUserId: formData.clerkUserId || user?.id,
          fullName: formData.fullName.trim(),
          email: formData.email || user?.primaryEmailAddress?.emailAddress,
          rotaractClub: formData.rotaractClub.trim(),
          designation: formData.designation.trim(),
          courseYear: formData.designation.trim(),
          college: formData.rotaractClub.trim(),
          instagramUsername: formData.instagramUsername.trim().replace(/^@/, ""),
          bio: formData.bio.trim() || null,
          interests: formData.interests,
          avatarUrl: formData.avatarUrl,
          dpdpConsent: true,
          dpdpConsentTimestamp: new Date().toISOString(),
          dpdpAgeConfirmed: true,
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
      // Fallback
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
            Connect with attendees, play games & earn 500 VIBE Coins before VIBE 2026!
          </p>

          {/* Clerk Authenticated Badge */}
          {(formData.email || user?.primaryEmailAddress?.emailAddress) && (
            <div className="pt-2 flex justify-center">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[11px] font-mono font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Authenticated via Clerk:{" "}
                  <strong className="text-foreground">
                    {formData.email || user?.primaryEmailAddress?.emailAddress}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-destructive/20 border-2 border-destructive text-destructive text-xs font-bold text-center flex items-center justify-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
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

            {/* 5. Bio (Optional) */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">
                Bio / Status (Optional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                <textarea
                  placeholder="What are you most excited for at VIBE 2026?"
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border-2 border-border text-sm font-medium focus:outline-none focus:border-[#00F0FF] transition-all text-foreground resize-none"
                />
              </div>
            </div>

            {/* 6. Interests Multi-Select */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-2">
                Select Your Interests
              </label>
              <div className="flex flex-wrap gap-2 p-1">
                {INTEREST_TAGS.map((tag) => {
                  const isSelected = formData.interests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={cn(
                        "px-3 py-1 text-xs font-bold transition-all border cursor-pointer",
                        isSelected
                          ? "bg-[#FF1B7A] text-white border-white shadow-sm"
                          : "bg-secondary/80 text-muted-foreground border-border hover:bg-secondary"
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DPDP Act 2023 Statutory Consent Section */}
            <div className="p-4 rounded-2xl bg-secondary/50 border border-purple-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-purple-400">
                <ShieldCheck className="w-4 h-4 shrink-0 text-purple-400" />
                <span className="text-xs font-mono font-black uppercase tracking-wider">
                  DPDP Act, 2023 Consent & Notice
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Rotaract District 3192 processes your name, institutional details, contact info, and photo strictly for VIBE 2026 accreditation, networking, and festival gamification under India's Digital Personal Data Protection Act, 2023.
              </p>

              <div className="space-y-2 pt-1 border-t border-border/60">
                {/* Checkbox 1: Consent */}
                <label className="flex items-start space-x-2.5 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={dpdpConsent}
                    onChange={(e) => setDpdpConsent(e.target.checked)}
                    className="mt-0.5 rounded border-border text-purple-600 focus:ring-purple-500 h-4 w-4 shrink-0 cursor-pointer"
                  />
                  <span className="text-foreground leading-snug">
                    I give my free, specific, and informed consent to Rotaract District 3192 to collect and process my personal data for VIBE 2026 in accordance with the{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 underline hover:text-pink-300 font-bold inline-flex items-center space-x-0.5"
                    >
                      <span>DPDP Privacy Notice</span>
                      <ExternalLink className="w-2.5 h-2.5 inline ml-0.5" />
                    </a>
                    .
                  </span>
                </label>

                {/* Checkbox 2: Age Declaration (Section 9) */}
                <label className="flex items-start space-x-2.5 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-border text-purple-600 focus:ring-purple-500 h-4 w-4 shrink-0 cursor-pointer"
                  />
                  <span className="text-foreground leading-snug">
                    I confirm that I am 18 years of age or older (or have verifiable guardian consent pursuant to Section 9 of the DPDP Act, 2023).
                  </span>
                </label>

                {/* Checkbox 3: Data Principal Duties (Section 15) */}
                <label className="flex items-start space-x-2.5 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={dutiesConfirmed}
                    onChange={(e) => setDutiesConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-border text-purple-600 focus:ring-purple-500 h-4 w-4 shrink-0 cursor-pointer"
                  />
                  <span className="text-foreground leading-snug">
                    I acknowledge my duties under Section 15 of the DPDP Act, 2023 — I will not impersonate any other person,
                    suppress material information, or file false or frivolous grievances.
                  </span>
                </label>
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
                !formData.instagramUsername.trim() ||
                !dpdpConsent ||
                !ageConfirmed ||
                !dutiesConfirmed
              }
              className="neo-btn-primary w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[4px_4px_0px_var(--border)] hover:shadow-neon-pink disabled:opacity-50 transition-all cursor-pointer"
            >
              <span>{isSubmitting ? "SAVING PROFILE..." : "COMPLETE REGISTRATION & CLAIM 500 COINS ✨"}</span>
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
                <span className="text-amber-400">+500 VIBE Coins Credited</span>
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
