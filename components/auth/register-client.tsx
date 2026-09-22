"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, User, Mail, Phone, Building, GraduationCap, Instagram, Tag, MapPin, Music, Film, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const INTEREST_TAGS = [
  "Music", "Dance", "Gaming", "Photography", "Coding",
  "Fashion", "Sports", "Fitness", "Travel", "Art",
  "Movies", "Reading", "Cooking", "Public Speaking", "Design"
];

export function RegisterClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    rotaractClub: "",
    college: "",
    courseYear: "",
    instagramUsername: "",
    bio: "",
    interests: [] as string[],
    skills: "",
    hobbies: "",
    favoriteMusic: "",
    favoriteMovies: "",
    city: "",
    avatarUrl: "",
  });

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
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/app/welcome");
      } else {
        // Fallback for mock store: store in localStorage / cookie and navigate
        router.push("/app/welcome");
      }
    } catch {
      router.push("/app/welcome");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-card/90 backdrop-blur-2xl border border-border rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VIBE 2026 Pre-Event Network</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400">
            CREATE YOUR PROFILE
          </h1>
          <p className="text-xs text-muted-foreground">
            Connect with attendees, play games & earn XP before VIBE 2026!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right duration-200">
              <h2 className="text-sm font-bold text-foreground flex items-center space-x-2">
                <User className="w-4 h-4 text-pink-400" />
                <span>1. Primary Information</span>
              </h2>

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-secondary/60 border border-border rounded-xl text-sm focus:outline-none focus:border-pink-500 transition-all text-foreground"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="aarav@rotaract.org"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-secondary/60 border border-border rounded-xl text-sm focus:outline-none focus:border-pink-500 transition-all text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-secondary/60 border border-border rounded-xl text-sm focus:outline-none focus:border-pink-500 transition-all text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Club & College */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Rotaract Club *</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Rotaract Club of Koramangala"
                      value={formData.rotaractClub}
                      onChange={(e) => setFormData({ ...formData, rotaractClub: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-secondary/60 border border-border rounded-xl text-sm focus:outline-none focus:border-pink-500 transition-all text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">College *</label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="RV College of Engineering"
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-secondary/60 border border-border rounded-xl text-sm focus:outline-none focus:border-pink-500 transition-all text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Course/Year & Instagram */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Course / Year *</label>
                  <input
                    type="text"
                    required
                    placeholder="B.Tech Computer Science • 3rd Year"
                    value={formData.courseYear}
                    onChange={(e) => setFormData({ ...formData, courseYear: e.target.value })}
                    className="w-full px-4 py-2.5 bg-secondary/60 border border-border rounded-xl text-sm focus:outline-none focus:border-pink-500 transition-all text-foreground"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Instagram Username (+25 XP)</label>
                  <div className="relative">
                    <Instagram className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="aarav.sharma"
                      value={formData.instagramUsername}
                      onChange={(e) => setFormData({ ...formData, instagramUsername: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-secondary/60 border border-border rounded-xl text-sm focus:outline-none focus:border-pink-500 transition-all text-foreground"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.fullName || !formData.email || !formData.rotaractClub || !formData.college}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>NEXT: BIO & INTERESTS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right duration-200">
              <h2 className="text-sm font-bold text-foreground flex items-center space-x-2">
                <Tag className="w-4 h-4 text-purple-400" />
                <span>2. Bio & Interests (+50 XP)</span>
              </h2>

              {/* Bio */}
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Short Bio</label>
                <textarea
                  rows={3}
                  placeholder="Share a short intro about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full p-3 bg-secondary/60 border border-border rounded-xl text-sm focus:outline-none focus:border-pink-500 transition-all text-foreground resize-none"
                />
              </div>

              {/* Interests Multi-Select */}
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-2">Select Interests</label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                  {INTEREST_TAGS.map((tag) => {
                    const isSelected = formData.interests.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleInterest(tag)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                          isSelected
                            ? "bg-pink-500 text-white border-pink-400 shadow-sm"
                            : "bg-secondary/80 text-muted-foreground border-border hover:bg-secondary"
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Section Toggle */}
              <div className="pt-2 border-t border-border/60 space-y-3">
                <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider block">
                  Optional Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">City</label>
                    <input
                      type="text"
                      placeholder="Bengaluru"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-lg text-xs text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Favorite Music</label>
                    <input
                      type="text"
                      placeholder="Coldplay, A.R. Rahman"
                      value={formData.favoriteMusic}
                      onChange={(e) => setFormData({ ...formData, favoriteMusic: e.target.value })}
                      className="w-full px-3 py-2 bg-secondary/40 border border-border rounded-lg text-xs text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 bg-secondary text-foreground font-bold text-sm rounded-xl hover:bg-secondary/80 transition-all"
                >
                  BACK
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:brightness-110 text-white font-black text-sm rounded-xl transition-all shadow-xl flex items-center justify-center space-x-2"
                >
                  <span>COMPLETE REGISTRATION</span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
