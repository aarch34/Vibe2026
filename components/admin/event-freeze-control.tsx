"use client";

import React, { useState } from "react";
import { Lock, Unlock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { adminToggleEventFreezeAction } from "@/actions/admin/manage";

export function EventFreezeControl({ initialIsFrozen }: { initialIsFrozen: boolean }) {
  const [isFrozen, setIsFrozen] = useState(initialIsFrozen);
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleToggle() {
    setIsPending(true);
    setFeedback(null);
    const nextState = !isFrozen;

    try {
      const res = await adminToggleEventFreezeAction(nextState);
      if (res.success) {
        setIsFrozen(nextState);
        setFeedback(
          nextState
            ? "🛑 VIBE Event has been CONCLUDED. Leaderboard frozen, coin/experience mutations stopped."
            : "✅ VIBE Event resumed. Transactions & check-ins are active."
        );
      }
    } catch (err: any) {
      setFeedback("Failed to update event state.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isFrozen
              ? "bg-rose-600/20 text-rose-400 border border-rose-500/30"
              : "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
          }`}
        >
          {isFrozen ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-white">Event Freeze & Conclusion Control</h3>
            <span
              className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                isFrozen
                  ? "bg-rose-950 text-rose-300 border border-rose-500/30"
                  : "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {isFrozen ? "FROZEN (GAME OVER)" : "LIVE & ACTIVE"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isFrozen
              ? "All attendee coin mutations and mission completions are locked. Leaderboard is final."
              : "Attendees can freely spend coins, unlock experiences, earn XP, and redeem prizes."}
          </p>
          {feedback && (
            <p className="text-xs font-semibold text-cyan-400 mt-1.5">{feedback}</p>
          )}
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
          isFrozen
            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95"
            : "bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95"
        }`}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFrozen ? (
          <>
            <Unlock className="w-3.5 h-3.5" />
            <span>Resume Event</span>
          </>
        ) : (
          <>
            <Lock className="w-3.5 h-3.5" />
            <span>Freeze Event & Finalize</span>
          </>
        )}
      </button>
    </div>
  );
}
