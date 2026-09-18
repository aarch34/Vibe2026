"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Coins,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  Loader2,
  Instagram,
  ShoppingBag,
  Gamepad2,
  Utensils,
  Eye,
} from "lucide-react";
import { Stall, StallPhotoSubmission } from "@/types/database";
import { submitStallPhotoAction } from "@/actions/stalls/verify";
import confetti from "canvas-confetti";

interface StallsClientProps {
  stalls: Stall[];
  initialSubmissions: StallPhotoSubmission[];
  userInstagramId: string;
}

export function StallsClient({
  stalls,
  initialSubmissions,
  userInstagramId,
}: StallsClientProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<StallPhotoSubmission[]>(initialSubmissions);
  const [uploadingStallId, setUploadingStallId] = useState<string | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ stallId: string; text: string; error?: boolean } | null>(null);

  // Helper to get latest submission for a stall
  function getSubmissionForStall(stallId: string) {
    return submissions.find((s) => s.stall_id === stallId);
  }

  function handleFileSelect(stallId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const url = uploadEvent.target?.result as string;
        setPhotoPreviews((prev) => ({ ...prev, [stallId]: url }));
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleUploadPhoto(stallId: string) {
    const photoData = photoPreviews[stallId] || "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80";
    setUploadingStallId(stallId);
    setMsg(null);

    try {
      const res = await submitStallPhotoAction({
        stallId,
        photoUrl: photoData,
        instagramId: userInstagramId,
      });

      if (!res.success) {
        setMsg({ stallId, text: res.message || "Failed to submit photo", error: true });
      } else {
        setMsg({ stallId, text: "📸 Photo submitted to volunteer queue! Awaiting approval." });
        if (res.submission) {
          setSubmissions((prev) => [res.submission, ...prev.filter((s) => s.stall_id !== stallId)]);
        }
        router.refresh();
      }
    } catch (err: any) {
      setMsg({ stallId, text: err.message || "An error occurred", error: true });
    } finally {
      setUploadingStallId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {stalls.map((stall) => {
        const submission = getSubmissionForStall(stall.id);
        const preview = photoPreviews[stall.id];
        const isUploading = uploadingStallId === stall.id;
        const currentMsg = msg?.stallId === stall.id ? msg : null;

        return (
          <div
            key={stall.id}
            className="p-5 bg-card text-card-foreground border-2 border-border shadow-neo flex flex-col justify-between space-y-4"
          >
            {/* Top Stall Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-secondary-foreground bg-secondary px-2 py-0.5 border-2 border-border shadow-[1px_1px_0px_var(--border)]">
                  {stall.category || "FESTIVAL STALL"}
                </span>

                {/* Status Pill */}
                {submission?.status === "approved" ? (
                  <span className="flex items-center space-x-1 text-[11px] font-black text-primary-foreground bg-primary px-2.5 py-0.5 border-2 border-border shadow-[1px_1px_0px_var(--border)]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified (+100 XP, +25🪙)</span>
                  </span>
                ) : submission?.status === "pending" ? (
                  <span className="flex items-center space-x-1 text-[11px] font-black text-secondary-foreground bg-secondary px-2.5 py-0.5 border-2 border-border shadow-[1px_1px_0px_var(--border)]">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Pending Approval</span>
                  </span>
                ) : submission?.status === "rejected" ? (
                  <span className="flex items-center space-x-1 text-[11px] font-black text-primary-foreground bg-primary px-2.5 py-0.5 border-2 border-border shadow-[1px_1px_0px_var(--border)]">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Rejected - Try Again</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-bold text-muted-foreground">
                    Not Verified
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-black text-foreground tracking-tight font-mono">
                  {stall.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-bold">
                  {stall.description}
                </p>
              </div>

              {/* Rewards Box */}
              <div className="flex items-center space-x-3 pt-1 text-xs font-mono">
                <div className="flex items-center space-x-1 text-foreground font-black bg-muted px-2 py-0.5 border-2 border-border shadow-[1px_1px_0px_var(--border)]">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>+{stall.xp_reward} XP</span>
                </div>
                <div className="flex items-center space-x-1 text-secondary-foreground font-black bg-secondary px-2 py-0.5 border-2 border-border shadow-[1px_1px_0px_var(--border)]">
                  <Coins className="w-3 h-3" />
                  <span>+{stall.coin_reward} VIBE</span>
                </div>
              </div>
            </div>

            {/* "CAPTURE YOUR VIBE" Photo Verification Section */}
            <div className="pt-3 border-t-2 border-border space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-foreground flex items-center space-x-1.5 font-mono">
                  <Camera className="w-3.5 h-3.5 text-primary" />
                  <span>📸 CAPTURE YOUR VIBE</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-muted-foreground flex items-center space-x-1">
                  <Instagram className="w-3 h-3 text-primary" />
                  <span>{userInstagramId}</span>
                </span>
              </div>

              {/* Upload or View Preview */}
              {submission?.status === "approved" ? (
                <div className="p-3 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-bold flex items-center justify-between">
                  <span>Photo verified by festival volunteer team!</span>
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
              ) : submission?.status === "pending" ? (
                <div className="p-3 bg-muted text-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-bold flex items-center justify-between">
                  <span>Photo is in the volunteer verification queue...</span>
                  <Clock className="w-4 h-4 text-primary animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Photo Preview if selected */}
                  {preview && (
                    <div className="relative w-full h-32 overflow-hidden border-2 border-border bg-card">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <label className="flex-1 cursor-pointer py-2 px-3 bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:bg-muted text-center text-xs font-black text-card-foreground flex items-center justify-center space-x-2 transition-colors active:translate-x-[1px] active:translate-y-[1px]">
                      <Camera className="w-3.5 h-3.5 text-primary" />
                      <span>{preview ? "Change Photo" : "📷 Choose / Snap Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileSelect(stall.id, e)}
                      />
                    </label>

                    <button
                      onClick={() => handleUploadPhoto(stall.id)}
                      disabled={isUploading}
                      className="neo-btn-primary py-2 px-4 text-xs font-black shrink-0 space-x-1.5"
                    >
                      {isUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>Submit</span>
                    </button>
                  </div>
                </div>
              )}

              {currentMsg && (
                <p className={`text-xs ${currentMsg.error ? "text-rose-400" : "text-emerald-400"}`}>
                  {currentMsg.text}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
