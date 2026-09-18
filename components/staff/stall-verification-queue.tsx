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
            className="neo-btn-card p-2 text-foreground flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight flex items-center space-x-2 font-mono">
              <Camera className="w-5 h-5 text-primary" />
              <span>Stall Photo Verification Queue</span>
            </h1>
            <p className="text-xs text-muted-foreground font-bold">
              Verify attendee stall photos to disburse ⭐ +100 XP & 🪙 +25 VIBE
            </p>
          </div>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div className="text-xs font-black px-3 py-1.5 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)]">
            {statusMsg}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b-2 border-border pb-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-3.5 py-1.5 text-xs font-black transition-all flex items-center space-x-1.5 border-2 ${
            activeTab === "pending"
              ? "bg-secondary text-secondary-foreground border-border shadow-[2px_2px_0px_var(--border)]"
              : "text-muted-foreground hover:text-foreground border-transparent hover:border-border"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Review</span>
          {pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-card text-card-foreground border border-border font-mono font-black">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("approved")}
          className={`px-3.5 py-1.5 text-xs font-black transition-all flex items-center space-x-1.5 border-2 ${
            activeTab === "approved"
              ? "bg-primary text-primary-foreground border-border shadow-[2px_2px_0px_var(--border)]"
              : "text-muted-foreground hover:text-foreground border-transparent hover:border-border"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Approved</span>
        </button>

        <button
          onClick={() => setActiveTab("rejected")}
          className={`px-3.5 py-1.5 text-xs font-black transition-all flex items-center space-x-1.5 border-2 ${
            activeTab === "rejected"
              ? "bg-muted text-foreground border-border shadow-[2px_2px_0px_var(--border)]"
              : "text-muted-foreground hover:text-foreground border-transparent hover:border-border"
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected</span>
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-card text-card-foreground border-2 border-border shadow-neo space-y-2">
          <Camera className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-black text-foreground font-mono">
            No submissions in this queue
          </h3>
          <p className="text-xs text-muted-foreground font-bold">
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
                className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  {/* Photo Preview */}
                  <div className="relative w-full aspect-video border-2 border-border bg-muted overflow-hidden">
                    <img
                      src={sub.photo_url}
                      alt="Attendee Submission"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-secondary text-secondary-foreground border-2 border-border text-[10px] font-mono font-black shadow-[1px_1px_0px_var(--border)]">
                      {sub.stallName || "Stall Checkpoint"}
                    </div>
                  </div>

                  {/* Attendee Info */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-foreground font-mono">
                        {sub.attendeeName || "Attendee"}
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-mono font-bold">
                        {new Date(sub.submitted_at || sub.created_at || Date.now()).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs text-primary font-bold">
                      <Instagram className="w-3.5 h-3.5" />
                      <span>{sub.instagram_id}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {sub.status === "pending" ? (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t-2 border-border">
                    <button
                      onClick={() => handleReject(sub.id)}
                      disabled={isProcessing}
                      className="neo-btn-card py-2 text-xs font-black flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>[ REJECT ]</span>
                    </button>

                    <button
                      onClick={() => handleApprove(sub.id)}
                      disabled={isProcessing}
                      className="neo-btn-primary py-2 text-xs font-black flex items-center justify-center space-x-1 cursor-pointer"
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
                  <div className="pt-2 border-t-2 border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-bold">Status:</span>
                    <span
                      className={`font-black font-mono capitalize px-2 py-0.5 border-2 border-border ${
                        sub.status === "approved"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground"
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
