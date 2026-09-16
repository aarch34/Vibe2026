"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  Instagram,
  Sparkles,
  Coins,
  Loader2,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { StallPhotoSubmission } from "@/types/database";
import { approveStallPhotoAction, rejectStallPhotoAction } from "@/actions/stalls/verify";

interface ExtendedSubmission extends StallPhotoSubmission {
  attendeeName?: string;
  stallName?: string;
}

interface StallVerificationQueueProps {
  initialSubmissions: ExtendedSubmission[];
}

export function StallVerificationQueue({
  initialSubmissions,
}: StallVerificationQueueProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<ExtendedSubmission[]>(initialSubmissions);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const filtered = submissions.filter((s) => s.status === activeTab);
  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  async function handleApprove(id: string) {
    setProcessingId(id);
    setStatusMsg(null);
    try {
      const res = await approveStallPhotoAction(id);
      if (res.success) {
        setStatusMsg("✅ Photo approved! Awarded ⭐ +100 XP and 🪙 +25 VIBE.");
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: "approved" } : s))
        );
        router.refresh();
      } else {
        setStatusMsg(`❌ Error: ${res.message}`);
      }
    } catch (err: any) {
      setStatusMsg(`❌ Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    setProcessingId(id);
    setStatusMsg(null);
    try {
      const res = await rejectStallPhotoAction(id);
      if (res.success) {
        setStatusMsg("Photo submission rejected.");
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: "rejected" } : s))
        );
        router.refresh();
      } else {
        setStatusMsg(`❌ Error: ${res.message}`);
      }
    } catch (err: any) {
      setStatusMsg(`❌ Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Link
            href="/staff"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
              <Camera className="w-5 h-5 text-purple-400" />
              <span>Stall Photo Verification Queue</span>
            </h1>
            <p className="text-xs text-slate-400">
              Verify attendee stall photos to disburse ⭐ +100 XP & 🪙 +25 VIBE
            </p>
          </div>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-950/80 border border-blue-500/30 text-cyan-300">
            {statusMsg}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === "pending"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-400 hover:text-white bg-slate-900/60"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Review</span>
          {pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-amber-300 font-mono">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("approved")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === "approved"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-white bg-slate-900/60"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Approved</span>
        </button>

        <button
          onClick={() => setActiveTab("rejected")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === "rejected"
              ? "bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20"
              : "text-slate-400 hover:text-white bg-slate-900/60"
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected</span>
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <Camera className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">
            No submissions in this queue
          </h3>
          <p className="text-xs text-slate-500">
            {activeTab === "pending"
              ? "All photos have been processed! Great job."
              : `No ${activeTab} submissions yet.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sub) => {
            const isProcessing = processingId === sub.id;

            return (
              <div
                key={sub.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-2">
                  {/* Photo Preview */}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-700">
                    <img
                      src={sub.photo_url}
                      alt="Attendee Submission"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[10px] font-mono text-cyan-300">
                      {sub.stallName || "Stall Checkpoint"}
                    </div>
                  </div>

                  {/* Attendee Info */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">
                        {sub.attendeeName || "Attendee"}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(sub.submitted_at || sub.created_at || Date.now()).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs text-pink-400 font-medium">
                      <Instagram className="w-3.5 h-3.5" />
                      <span>{sub.instagram_id}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {sub.status === "pending" ? (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleReject(sub.id)}
                      disabled={isProcessing}
                      className="py-2 rounded-xl bg-slate-950 hover:bg-rose-950 border border-slate-700 hover:border-rose-500/50 text-xs font-bold text-rose-300 transition-colors flex items-center justify-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>[ REJECT ]</span>
                    </button>

                    <button
                      onClick={() => handleApprove(sub.id)}
                      disabled={isProcessing}
                      className="py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center space-x-1"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>[ APPROVE ]</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Status:</span>
                    <span
                      className={`font-bold capitalize ${
                        sub.status === "approved"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
