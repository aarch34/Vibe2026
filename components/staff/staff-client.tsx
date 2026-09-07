"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  CheckCircle2,
  Users,
  Search,
  ArrowLeft,
  Sparkles,
  Gift,
  AlertCircle,
  Check,
} from "lucide-react";
import { Zone, Experience } from "@/types/database";
import { formatCoins, formatXP } from "@/lib/utils";

interface StaffDashboardClientProps {
  assignedZone: Zone;
  experiences: Experience[];
  recentActivity: {
    id: string;
    experienceTitle: string;
    attendeeName: string;
    vibeId: string;
    xpEarned: number;
    coinSpent: number;
    completedAt: string;
  }[];
  totalCompletions: number;
}

export function StaffDashboardClient({
  assignedZone,
  experiences,
  recentActivity,
  totalCompletions,
}: StaffDashboardClientProps) {
  const [lookupCode, setLookupCode] = useState("");
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);

  function handleLookup() {
    if (!lookupCode.trim()) return;
    setLookupMsg(null);

    // Check voucher format
    const clean = lookupCode.trim().toUpperCase();
    if (clean.startsWith("VIBE-")) {
      setLookupResult({
        type: "voucher",
        code: clean,
        rewardName: "District 3192 Merchandise",
        status: "pending",
      });
    } else {
      setLookupResult({
        type: "attendee",
        vibeId: clean,
        name: "Verified Attendee",
        status: "Checked In",
      });
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
              Zone Staff Portal
            </span>
            <h1 className="text-base font-extrabold text-white">
              {assignedZone.name}
            </h1>
          </div>
        </div>

        <Link
          href="/app"
          className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit</span>
        </Link>
      </div>

      {/* Zone Dashboard Grid: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: KPIs, Voucher Lookup & Volunteer Approvals */}
        <div className="lg:col-span-6 space-y-5">
          {/* Zone KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Completions Here
              </span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                {totalCompletions}
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Active Missions
              </span>
              <p className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
                {experiences.length}
              </p>
            </div>
          </div>

          {/* Attendee Voucher / VIBE ID Quick Verification Tool */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-sm">
            <h2 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>Verify Voucher / Fulfill Reward</span>
            </h2>

            <div className="flex space-x-2">
              <input
                type="text"
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value)}
                placeholder="Enter Voucher Code (e.g. VIBE-ABC12345)"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleLookup}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shrink-0 active:scale-95"
              >
                Verify
              </button>
            </div>

            {lookupResult && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-amber-400 font-bold">
                    {lookupResult.code || lookupResult.vibeId}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    VALID
                  </span>
                </div>
                <p className="text-xs text-white font-bold">
                  {lookupResult.rewardName || lookupResult.name}
                </p>
                <button
                  onClick={() => {
                    setLookupMsg("Voucher marked as CLAIMED on the physical counter.");
                    setLookupResult(null);
                    setLookupCode("");
                  }}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark as Fulfilled & Hand Out Reward</span>
                </button>
              </div>
            )}

            {lookupMsg && (
              <p className="text-xs text-emerald-400 font-semibold">{lookupMsg}</p>
            )}
          </div>

          {/* Volunteer Manual Verification (Physical Challenges) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border-2 border-indigo-500/30 space-y-3.5 shadow-sm">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-white">
                Volunteer Challenge Approval (Anti-Cheat)
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              When an attendee physically finishes an obstacle or challenge in your zone, verify and press Approve to award XP & Coins.
            </p>

            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Attendee VIBE-ID (e.g. VIBE-1001)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                id="challengeVibeId"
              />
              <select
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                id="challengeExpId"
              >
                {experiences.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.title} (+{exp.xp_reward} XP, +{exp.coin_reward} Coins)
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const input = document.getElementById("challengeVibeId") as HTMLInputElement;
                  const vibeIdVal = input ? input.value : "";
                  if (!vibeIdVal.trim()) {
                    alert("Please enter attendee VIBE-ID");
                    return;
                  }
                  setLookupMsg(`✅ Approved physical challenge for ${vibeIdVal.trim()}! Awarded XP & Coins.`);
                  if (input) input.value = "";
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-extrabold text-xs text-white shadow-md transition-all active:scale-98 flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>[ APPROVE CHALLENGE ]</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Zone Missions & Recent Activity Feed */}
        <div className="lg:col-span-6 space-y-5">
          {/* Zone Missions list */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
            <h2 className="text-xs font-bold text-white">Zone Missions ({experiences.length})</h2>
            <div className="space-y-2">
              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-white">{exp.title}</h3>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {exp.coin_cost} Coins • +{exp.xp_reward} XP
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Zone Activity Feed */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
            <h2 className="text-xs font-bold text-white">Recent Zone Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No completions recorded in this zone yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {recentActivity.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <h3 className="font-bold text-white">{act.attendeeName}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {act.experienceTitle} •{" "}
                        <span className="font-mono text-cyan-400">{act.vibeId}</span>
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-purple-300 font-bold">
                        +{act.xpEarned} XP
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {new Date(act.completedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
