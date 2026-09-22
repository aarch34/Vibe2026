"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Edit3,
  X,
  Mail,
  Instagram,
  Compass,
  User,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Waves,
  Sparkles,
} from "lucide-react";
import { updateAttendeeProfileAction } from "@/actions/profile/update-profile";

interface EditProfileModalProps {
  initialProfile: {
    id: string;
    displayName: string;
    email?: string | null;
    instagramId?: string | null;
    assignedZoneId?: string | null;
    club?: string | null;
    college?: string | null;
    phone?: string | null;
  };
}

const OFFICIAL_ZONES = [
  {
    id: "d0000000-0000-0000-0000-000000000001",
    slug: "arnava",
    name: "Arnava",
    tagline: "The Ocean of Momentum",
    icon: "🌊",
    color: "from-blue-600 to-cyan-500",
  },
  {
    id: "d0000000-0000-0000-0000-000000000002",
    slug: "taranaga",
    name: "Taranaga",
    tagline: "The Rhythm of the Tide",
    icon: "🌊",
    color: "from-pink-600 to-rose-500",
  },
  {
    id: "d0000000-0000-0000-0000-000000000003",
    slug: "sagara",
    name: "Sagara",
    tagline: "The Deep Collective",
    icon: "🌊",
    color: "from-indigo-600 to-purple-500",
  },
  {
    id: "d0000000-0000-0000-0000-000000000004",
    slug: "pravaha",
    name: "Pravaha",
    tagline: "The Relentless Current",
    icon: "🌊",
    color: "from-teal-600 to-emerald-500",
  },
  {
    id: "d0000000-0000-0000-0000-000000000005",
    slug: "samudhra",
    name: "Samudhra",
    tagline: "The Endless Horizon",
    icon: "🌊",
    color: "from-amber-600 to-orange-500",
  },
  {
    id: "d0000000-0000-0000-0000-000000000006",
    slug: "varuna",
    name: "Varuna",
    tagline: "The Cosmic Sovereign",
    icon: "🌊",
    color: "from-violet-600 to-fuchsia-500",
  },
];

export function EditProfileModal({ initialProfile }: EditProfileModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Normalize initial zone
  const matchedZone =
    OFFICIAL_ZONES.find(
      (z) =>
        z.id === initialProfile.assignedZoneId ||
        z.slug === initialProfile.assignedZoneId ||
        `z-${z.slug}` === initialProfile.assignedZoneId
    ) || OFFICIAL_ZONES[0];

  const [formData, setFormData] = useState({
    displayName: initialProfile.displayName || "",
    email: initialProfile.email || "",
    instagramId: initialProfile.instagramId || "",
    zoneId: matchedZone.id,
    club: initialProfile.club || initialProfile.college || "",
    phone: initialProfile.phone || "",
  });

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (formData.email && !formData.email.includes("@")) {
      setFeedback({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    startTransition(async () => {
      const res = await updateAttendeeProfileAction({
        displayName: formData.displayName,
        email: formData.email,
        instagramId: formData.instagramId,
        zoneId: formData.zoneId,
        club: formData.club,
        phone: formData.phone,
      });

      if (res.success) {
        setFeedback({ type: "success", text: res.message || "Profile updated successfully!" });
        setTimeout(() => {
          setIsOpen(false);
          setFeedback(null);
          router.refresh();
        }, 800);
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to update profile." });
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFeedback(null);
          setIsOpen(true);
        }}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-black bg-card text-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:bg-muted active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer font-mono"
        title="Edit your email, Instagram ID, and zone"
      >
        <Edit3 className="w-3.5 h-3.5 text-primary" />
        <span>Edit Profile</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-card text-card-foreground border-4 border-border shadow-neo-lg p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-border">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-foreground uppercase tracking-tight font-mono">
                    Edit Profile Details
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-bold">
                    Update your email, Instagram handle, and assigned zone
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 bg-muted text-muted-foreground hover:text-foreground border-2 border-border shadow-[1px_1px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`p-3 border-2 border-border flex items-center space-x-2 text-xs font-bold ${
                  feedback.type === "success"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-destructive/20 text-destructive-foreground border-destructive"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-black uppercase text-foreground flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Your Name"
                  className="w-full p-2.5 bg-muted text-foreground border-2 border-border font-mono text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-black uppercase text-foreground flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-secondary" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="w-full p-2.5 bg-muted text-foreground border-2 border-border font-mono text-xs focus:outline-none focus:border-secondary"
                />
                <span className="text-[10px] text-muted-foreground block font-mono">
                  Used for account recovery and district credentials
                </span>
              </div>

              {/* Instagram Handle */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-black uppercase text-foreground flex items-center space-x-1.5">
                  <Instagram className="w-3.5 h-3.5 text-pink-500" />
                  <span>Instagram ID / Handle</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-muted-foreground">
                    @
                  </span>
                  <input
                    type="text"
                    value={formData.instagramId.replace(/^@/, "")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instagramId: e.target.value ? `@${e.target.value.replace(/^@/, "")}` : "",
                      })
                    }
                    placeholder="your_handle"
                    className="w-full p-2.5 pl-7 bg-muted text-foreground border-2 border-border font-mono text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground block font-mono">
                  Display on your attendee profile card for friend connections
                </span>
              </div>

              {/* Assigned Zone (Select 1 of 6) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-black uppercase text-foreground flex items-center space-x-1.5">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Assigned Oceanic Zone</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {OFFICIAL_ZONES.map((zone) => {
                    const isSelected =
                      formData.zoneId === zone.id || formData.zoneId === zone.slug;
                    return (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, zoneId: zone.id })}
                        className={`p-2.5 text-left border-2 transition-all flex flex-col justify-between ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-border shadow-[2px_2px_0px_var(--border)]"
                            : "bg-muted text-muted-foreground border-border hover:bg-card hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base">{zone.icon}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
                          )}
                        </div>
                        <div className="mt-1">
                          <div className="font-mono font-black text-xs uppercase leading-tight">
                            {zone.name}
                          </div>
                          <div
                            className={`text-[9px] font-mono truncate mt-0.5 ${
                              isSelected ? "text-primary-foreground/90 font-bold" : "text-muted-foreground"
                            }`}
                          >
                            {zone.tagline}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rotaract Club / College */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-black uppercase text-foreground flex items-center space-x-1.5">
                  <Building className="w-3.5 h-3.5 text-primary" />
                  <span>Rotaract Club / College</span>
                </label>
                <input
                  type="text"
                  value={formData.club}
                  onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                  placeholder="Rotaract Club of..."
                  className="w-full p-2.5 bg-muted text-foreground border-2 border-border font-mono text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t-2 border-border">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-black bg-muted text-foreground border-2 border-border hover:bg-card active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-black bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center space-x-1.5 font-mono"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
