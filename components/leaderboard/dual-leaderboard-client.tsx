"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Crown,
  Medal,
  Sparkles,
  Coins,
  Compass,
  Instagram,
  ShieldCheck,
  Award,
  Info,
  Waves,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { LeaderboardEntry, ZoneLeaderboardEntry } from "@/types/database";
import { formatCoins, formatXP } from "@/lib/utils";

interface DualLeaderboardClientProps {
  entries: LeaderboardEntry[];
  totalParticipants: number;
  currentUserRank: LeaderboardEntry | null;
  zoneEntries: ZoneLeaderboardEntry[];
  currentProfileId: string;
  assignedZoneId?: string | null;
  isFrozen: boolean;
}

export function DualLeaderboardClient({
  entries,
  totalParticipants,
  currentUserRank,
  zoneEntries,
  currentProfileId,
  assignedZoneId,
  isFrozen,
}: DualLeaderboardClientProps) {
  const [activeTab, setActiveTab] = useState<"individual" | "zones" | "stats">("individual");

  const top3 = entries.slice(0, 3);
  const others = entries.slice(3);

  const championZone = zoneEntries[0];

  return (
    <div className="space-y-6">
      {/* Event Frozen / Final Winners Banner */}
      {isFrozen && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 shadow-xl border-2 border-amber-300 space-y-1 text-center">
          <div className="flex items-center justify-center space-x-2 font-black text-sm uppercase tracking-wider">
            <span>🏆</span>
            <span>VIBE HAS CONCLUDED — FINAL FESTIVAL CHAMPIONS</span>
          </div>
          <p className="text-xs font-semibold text-slate-900 leading-snug">
            All coin earnings and rankings are locked. Congratulations to our District 3192 Champions!
          </p>
        </div>
      )}

      {/* Navigation Tabs (Sections 27, 28, 33) */}
      <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 max-w-md">
        <button
          onClick={() => setActiveTab("individual")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === "individual"
              ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Individual XP</span>
        </button>

        <button
          onClick={() => setActiveTab("zones")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === "zones"
              ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          <span>Zone Battle</span>
        </button>

        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === "stats"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Zonal Stats</span>
        </button>
      </div>

      {/* TAB 1: INDIVIDUAL XP LEADERBOARD */}
      {activeTab === "individual" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Current User & Top 3 Podium */}
          <div className="lg:col-span-5 space-y-4">
            {currentUserRank && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-950/60 border-2 border-blue-500/40 shadow-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-black font-mono text-white text-sm shrink-0">
                    #{currentUserRank.rank}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs sm:text-sm font-bold text-white">Your Rank</span>
                      <span className="text-[10px] text-blue-300 font-mono">
                        ({currentUserRank.vibe_id})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium">
                      {currentUserRank.level_name} • {currentUserRank.assigned_zone_name || "Arnava"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm sm:text-base font-black font-mono text-cyan-300">
                    {formatXP(currentUserRank.total_xp)}
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {currentUserRank.completions_count} missions
                  </p>
                </div>
              </div>
            )}

            {/* Top 3 Podium */}
            {top3.length >= 3 && (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block text-center">
                  District Champions Podium
                </span>
                <div className="grid grid-cols-3 gap-2 pt-1 items-end">
                  {/* 2nd Place */}
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700 text-center space-y-1">
                    <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-400 flex items-center justify-center mx-auto text-slate-200 text-xs font-bold">
                      🥈 2
                    </div>
                    <p className="text-xs font-bold text-white truncate">
                      {top3[1].display_name.split(" ")[0]}
                    </p>
                    <p className="text-[10px] font-mono font-bold text-slate-300">
                      {formatXP(top3[1].total_xp)}
                    </p>
                    <span className="text-[9px] text-pink-400 block truncate font-mono">
                      {top3[1].instagram_id || "@user"}
                    </span>
                  </div>

                  {/* 1st Place */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-950/40 to-slate-900 border-2 border-amber-500/60 text-center space-y-1 relative -top-2 shadow-lg shadow-amber-500/10">
                    <Crown className="w-5 h-5 text-amber-400 mx-auto -mt-1" />
                    <div className="w-9 h-9 rounded-full bg-amber-500 border-2 border-amber-300 flex items-center justify-center mx-auto text-slate-950 text-xs font-black">
                      🥇 1
                    </div>
                    <p className="text-xs font-extrabold text-white truncate">
                      {top3[0].display_name.split(" ")[0]}
                    </p>
                    <p className="text-[11px] font-mono font-black text-amber-400">
                      {formatXP(top3[0].total_xp)}
                    </p>
                    <span className="text-[9px] text-amber-300 block truncate font-mono">
                      {top3[0].instagram_id || "@champ"}
                    </span>
                  </div>

                  {/* 3rd Place */}
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-amber-800/40 text-center space-y-1">
                    <div className="w-8 h-8 rounded-full bg-amber-900/50 border border-amber-700 flex items-center justify-center mx-auto text-amber-300 text-xs font-bold">
                      🥉 3
                    </div>
                    <p className="text-xs font-bold text-white truncate">
                      {top3[2].display_name.split(" ")[0]}
                    </p>
                    <p className="text-[10px] font-mono font-bold text-slate-300">
                      {formatXP(top3[2].total_xp)}
                    </p>
                    <span className="text-[9px] text-pink-400 block truncate font-mono">
                      {top3[2].instagram_id || "@user"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tie-Breaker Accordion */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 font-bold text-blue-300">
                <Info className="w-4 h-4 text-blue-400" />
                <span>Ranking Principle: XP Measures Journey</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Rankings are strictly determined by accumulated XP. Spending coins will never reduce your leaderboard standing.
              </p>
            </div>
          </div>

          {/* Right Column: Full Ranked List with Handle, Club, Zone */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between px-1 pb-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Full Rankings ({entries.length} Attendees)
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">Real-time</span>
            </div>

            <div className="space-y-1.5">
              {entries.map((entry) => {
                const isCurrentUser = entry.profile_id === currentProfileId;

                return (
                  <div
                    key={entry.profile_id}
                    className={`p-3 sm:p-3.5 rounded-xl flex items-center justify-between transition-colors ${
                      isCurrentUser
                        ? "bg-blue-950/40 border border-blue-500/50 shadow-sm"
                        : "bg-slate-900/60 border border-slate-800/80 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 text-center font-mono font-bold text-xs text-slate-400">
                        #{entry.rank}
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs sm:text-sm font-bold text-white">
                            {entry.display_name}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[9px] font-bold bg-blue-500/30 text-blue-300 px-1.5 rounded">
                              You
                            </span>
                          )}
                          {entry.instagram_id && (
                            <span className="text-[10px] text-pink-400 font-mono flex items-center space-x-0.5">
                              <Instagram className="w-2.5 h-2.5" />
                              <span>{entry.instagram_id}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                          <span>{entry.club || "Rotaract Club"}</span>
                          <span>•</span>
                          <span className="text-cyan-300 font-medium">
                            🌊 {entry.assigned_zone_name || "Arnava"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-black font-mono text-purple-300">
                        {formatXP(entry.total_xp)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {entry.level_name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VIBE ZONE BATTLE (RANKED BY COINS COLLECTED) */}
      {activeTab === "zones" && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Festival Zone Championship
              </span>
              <h2 className="text-lg font-black text-white">
                VIBE Zone Battle Standings
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Which zone created the most engagement? Ranked strictly by <strong>VIBE Coins collected</strong>!
              </p>
            </div>
            <div className="text-[11px] text-amber-300/90 font-mono bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              6 Official Zones Competing
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zoneEntries.map((z) => {
              const isUserZone = assignedZoneId === z.zone_id;

              return (
                <div
                  key={z.zone_id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-lg ${
                    z.rank === 1
                      ? "bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 border-amber-500/50"
                      : isUserZone
                      ? "bg-gradient-to-br from-blue-950/30 via-slate-900 to-slate-950 border-blue-500/50"
                      : "bg-slate-900/90 border-slate-800"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black font-mono text-xs ${
                          z.rank === 1
                            ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/40"
                            : z.rank === 2
                            ? "bg-slate-300 text-slate-950"
                            : z.rank === 3
                            ? "bg-amber-700 text-white"
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          #{z.rank}
                        </span>
                        <h3 className="text-base font-extrabold text-white">
                          🌊 {z.name.toUpperCase()}
                        </h3>
                      </div>

                      {isUserZone && (
                        <span className="text-[10px] font-black text-cyan-300 bg-cyan-950 border border-cyan-400/40 px-2 py-0.5 rounded-full">
                          YOUR ZONE
                        </span>
                      )}
                    </div>

                    {/* Primary Ranking Metric: Coins Collected */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Total Coins Collected
                        </span>
                        <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                          🪙 {z.coins_collected.toLocaleString()} VIBE
                        </span>
                      </div>
                      <Coins className="w-6 h-6 text-amber-400 animate-pulse" />
                    </div>

                    {/* Zone Engagement Breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Visitors</span>
                        <span className="font-bold text-white">{z.participants_count}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Missions</span>
                        <span className="font-bold text-cyan-300">{z.experiences_completed_count}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">XP Created</span>
                        <span className="font-bold text-purple-300">{formatXP(z.total_xp_generated)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    💡 Spend coins at <strong>{z.name}</strong> to push this zone to the top!
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ZONAL STATS & WINNER CEREMONY */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          {/* Winner Ceremony Announcement Card (Section 26 & 33) */}
          {championZone && (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-950 border-2 border-amber-400 shadow-2xl shadow-amber-500/20 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 border-2 border-amber-300 flex items-center justify-center mx-auto text-slate-950 shadow-xl shadow-amber-500/40 animate-bounce">
                <Crown className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest block">
                  AND THE WINNER IS...
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1">
                  🌊 {championZone.name.toUpperCase()}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                  Champions of the VIBE 2026 Zone Battle with the highest attendee engagement and coin accumulation!
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 max-w-2xl mx-auto text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Coins Collected</span>
                  <span className="text-base sm:text-lg font-black text-amber-400">
                    🪙 {championZone.coins_collected.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Participants</span>
                  <span className="text-base sm:text-lg font-bold text-white">
                    {championZone.participants_count}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Experiences</span>
                  <span className="text-base sm:text-lg font-bold text-cyan-300">
                    {championZone.experiences_completed_count}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Completion Rate</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-400">
                    {championZone.completion_rate_percent}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Statistics Table */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">
              Official Zonal Performance Breakdown
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Rank</th>
                    <th className="pb-3 font-semibold">Zone</th>
                    <th className="pb-3 font-semibold">Coins Collected</th>
                    <th className="pb-3 font-semibold">Participants</th>
                    <th className="pb-3 font-semibold">Experiences</th>
                    <th className="pb-3 font-semibold">Stall Visits</th>
                    <th className="pb-3 font-semibold">Games Played</th>
                    <th className="pb-3 font-semibold">XP Generated</th>
                    <th className="pb-3 font-semibold">Completion %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {zoneEntries.map((z) => (
                    <tr key={z.zone_id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-3 font-bold text-slate-400">#{z.rank}</td>
                      <td className="py-3 font-bold text-white flex items-center space-x-1">
                        <span>🌊</span>
                        <span>{z.name}</span>
                      </td>
                      <td className="py-3 text-amber-400 font-bold">
                        🪙 {z.coins_collected.toLocaleString()}
                      </td>
                      <td className="py-3 text-slate-300">{z.participants_count}</td>
                      <td className="py-3 text-cyan-300">{z.experiences_completed_count}</td>
                      <td className="py-3 text-purple-300">{z.stall_interactions_count}</td>
                      <td className="py-3 text-white">{z.games_played_count}</td>
                      <td className="py-3 text-purple-400 font-bold">{formatXP(z.total_xp_generated)}</td>
                      <td className="py-3 text-emerald-400 font-bold">{z.completion_rate_percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
