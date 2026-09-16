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
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
              submission?.status === "approved"
                ? "bg-emerald-950/20 border-emerald-500/40"
                : submission?.status === "pending"
                ? "bg-slate-900/90 border-amber-500/30"
                : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
            }`}
          >
            {/* Top Stall Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                  {stall.category || "FESTIVAL STALL"}
                </span>

                {/* Status Pill */}
                {submission?.status === "approved" ? (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified (+100 XP, +25🪙)</span>
                  </span>
                ) : submission?.status === "pending" ? (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Pending Approval</span>
                  </span>
                ) : submission?.status === "rejected" ? (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Rejected - Try Again</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400">
                    Not Verified
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {stall.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {stall.description}
                </p>
              </div>

              {/* Rewards Box */}
              <div className="flex items-center space-x-3 pt-1 text-xs font-mono">
                <div className="flex items-center space-x-1 text-purple-300 font-bold bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>+{stall.xp_reward} XP</span>
                </div>
                <div className="flex items-center space-x-1 text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                  <Coins className="w-3 h-3" />
                  <span>+{stall.coin_reward} VIBE</span>
                </div>
              </div>
            </div>

            {/* "CAPTURE YOUR VIBE" Photo Verification Section */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  <span>📸 CAPTURE YOUR VIBE</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                  <Instagram className="w-3 h-3 text-pink-400" />
                  <span>{userInstagramId}</span>
                </span>
              </div>

              {/* Upload or View Preview */}
              {submission?.status === "approved" ? (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                  <span>Photo verified by festival volunteer team!</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              ) : submission?.status === "pending" ? (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
                  <span>Photo is in the volunteer verification queue...</span>
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Photo Preview if selected */}
                  {preview && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <label className="flex-1 cursor-pointer py-2 px-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-600 text-center text-xs font-semibold text-slate-300 flex items-center justify-center space-x-2 transition-colors">
                      <Camera className="w-3.5 h-3.5 text-blue-400" />
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
                      className="py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:scale-95 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5 shrink-0"
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
