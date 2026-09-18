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
      <div className="flex items-center space-x-2 bg-card p-1.5 border-2 border-border shadow-[3px_3px_0px_var(--border)] max-w-md">
        <button
          onClick={() => setActiveTab("individual")}
          className={`flex-1 py-2 px-3 text-xs font-black transition-all flex items-center justify-center space-x-1.5 border-2 ${
            activeTab === "individual"
              ? "bg-primary text-primary-foreground border-border shadow-[2px_2px_0px_var(--border)]"
              : "text-muted-foreground hover:text-foreground border-transparent hover:border-border"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Individual XP</span>
        </button>

        <button
          onClick={() => setActiveTab("zones")}
          className={`flex-1 py-2 px-3 text-xs font-black transition-all flex items-center justify-center space-x-1.5 border-2 ${
            activeTab === "zones"
              ? "bg-secondary text-secondary-foreground border-border shadow-[2px_2px_0px_var(--border)]"
              : "text-muted-foreground hover:text-foreground border-transparent hover:border-border"
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          <span>Zone Battle</span>
        </button>

        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 py-2 px-3 text-xs font-black transition-all flex items-center justify-center space-x-1.5 border-2 ${
            activeTab === "stats"
              ? "bg-accent text-accent-foreground border-border shadow-[2px_2px_0px_var(--border)]"
              : "text-muted-foreground hover:text-foreground border-transparent hover:border-border"
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
              <div className="p-4 bg-secondary text-secondary-foreground border-2 border-border shadow-neo flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center font-black font-mono text-sm shrink-0">
                    #{currentUserRank.rank}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs sm:text-sm font-black text-secondary-foreground">Your Rank</span>
                      <span className="text-[10px] text-secondary-foreground font-mono font-bold">
                        ({currentUserRank.vibe_id})
                      </span>
                    </div>
                    <p className="text-[11px] text-secondary-foreground font-bold">
                      {currentUserRank.level_name} • {currentUserRank.assigned_zone_name || "Arnava"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm sm:text-base font-black font-mono text-primary">
                    {formatXP(currentUserRank.total_xp)}
                  </span>
                  <p className="text-[10px] text-secondary-foreground font-mono font-bold">
                    {currentUserRank.completions_count} missions
                  </p>
                </div>
              </div>
            )}

            {/* Top 3 Podium */}
            {top3.length >= 3 && (
              <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo space-y-3">
                <span className="text-xs uppercase font-black text-muted-foreground tracking-wider block text-center font-mono">
                  District Champions Podium
                </span>
                <div className="grid grid-cols-3 gap-2 pt-1 items-end">
                  {/* 2nd Place */}
                  <div className="p-3 bg-muted text-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] text-center space-y-1">
                    <div className="w-8 h-8 bg-card border-2 border-border shadow-[1px_1px_0px_var(--border)] flex items-center justify-center mx-auto text-foreground text-xs font-black">
                      🥈 2
                    </div>
                    <p className="text-xs font-black text-foreground truncate">
                      {top3[1].display_name.split(" ")[0]}
                    </p>
                    <p className="text-[10px] font-mono font-black text-primary">
                      {formatXP(top3[1].total_xp)}
                    </p>
                    <span className="text-[9px] text-muted-foreground block truncate font-mono font-bold">
                      {top3[1].instagram_id || "@user"}
                    </span>
                  </div>

                  {/* 1st Place */}
                  <div className="p-3.5 bg-secondary text-secondary-foreground border-2 border-border shadow-neo text-center space-y-1 relative -top-2">
                    <Crown className="w-5 h-5 text-primary mx-auto -mt-1" />
                    <div className="w-9 h-9 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center mx-auto text-xs font-black">
                      🥇 1
                    </div>
                    <p className="text-xs font-black text-secondary-foreground truncate">
                      {top3[0].display_name.split(" ")[0]}
                    </p>
                    <p className="text-[11px] font-mono font-black text-primary">
                      {formatXP(top3[0].total_xp)}
                    </p>
                    <span className="text-[9px] text-secondary-foreground block truncate font-mono font-bold">
                      {top3[0].instagram_id || "@champ"}
                    </span>
                  </div>

                  {/* 3rd Place */}
                  <div className="p-3 bg-muted text-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] text-center space-y-1">
                    <div className="w-8 h-8 bg-card border-2 border-border shadow-[1px_1px_0px_var(--border)] flex items-center justify-center mx-auto text-foreground text-xs font-black">
                      🥉 3
                    </div>
                    <p className="text-xs font-black text-foreground truncate">
                      {top3[2].display_name.split(" ")[0]}
                    </p>
                    <p className="text-[10px] font-mono font-black text-primary">
                      {formatXP(top3[2].total_xp)}
                    </p>
                    <span className="text-[9px] text-muted-foreground block truncate font-mono font-bold">
                      {top3[2].instagram_id || "@user"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tie-Breaker Accordion */}
            <div className="p-4 bg-muted text-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] space-y-1 text-xs">
              <div className="flex items-center space-x-1.5 font-black text-foreground font-mono">
                <Info className="w-4 h-4 text-primary" />
                <span>Ranking Principle: XP Measures Journey</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">
                Rankings are strictly determined by accumulated XP. Spending coins will never reduce your leaderboard standing.
              </p>
            </div>
          </div>

          {/* Right Column: Full Ranked List with Handle, Club, Zone */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between px-1 pb-1">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider font-mono">
                Full Rankings ({entries.length} Attendees)
              </h3>
              <span className="text-[11px] text-primary font-mono font-black">● Real-time</span>
            </div>

            <div className="space-y-1.5">
              {entries.map((entry) => {
                const isCurrentUser = entry.profile_id === currentProfileId;

                return (
                  <div
                    key={entry.profile_id}
                    className={`p-3 sm:p-3.5 border-2 border-border flex items-center justify-between transition-colors ${
                      isCurrentUser
                        ? "bg-secondary text-secondary-foreground shadow-neo font-black"
                        : "bg-card text-card-foreground shadow-[2px_2px_0px_var(--border)] hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 text-center font-mono font-black text-xs text-muted-foreground">
                        #{entry.rank}
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs sm:text-sm font-black text-foreground">
                            {entry.display_name}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[9px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 border border-border">
                              You
                            </span>
                          )}
                          {entry.instagram_id && (
                            <span className="text-[10px] text-primary font-mono font-bold flex items-center space-x-0.5">
                              <Instagram className="w-2.5 h-2.5" />
                              <span>{entry.instagram_id}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-[10px] text-muted-foreground font-bold">
                          <span>{entry.club || "Rotaract Club"}</span>
                          <span>•</span>
                          <span className="text-primary font-black">
                            🌊 {entry.assigned_zone_name || "Arnava"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-black font-mono text-primary">
                        {formatXP(entry.total_xp)}
                      </span>
                      <span className="text-[10px] text-muted-foreground block font-mono font-bold">
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
          <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-black text-primary tracking-wider font-mono">
                Festival Zone Championship
              </span>
              <h2 className="text-lg font-black text-foreground font-mono">
                VIBE Zone Battle Standings
              </h2>
              <p className="text-xs text-muted-foreground font-bold mt-0.5">
                Which zone created the most engagement? Ranked strictly by <strong>VIBE Coins collected</strong>!
              </p>
            </div>
            <div className="text-[11px] text-foreground font-mono font-black bg-secondary border-2 border-border shadow-[2px_2px_0px_var(--border)] px-3 py-1.5 self-start sm:self-auto">
              6 Official Zones Competing
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zoneEntries.map((z) => {
              const isUserZone = assignedZoneId === z.zone_id;

              return (
                <div
                  key={z.zone_id}
                  className={`p-5 border-2 border-border transition-all flex flex-col justify-between space-y-4 shadow-neo ${
                    z.rank === 1
                      ? "bg-secondary text-secondary-foreground"
                      : isUserZone
                      ? "bg-muted text-foreground"
                      : "bg-card text-card-foreground"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-8 h-8 border-2 border-border shadow-[1px_1px_0px_var(--border)] flex items-center justify-center font-black font-mono text-xs ${
                          z.rank === 1
                            ? "bg-primary text-primary-foreground"
                            : z.rank === 2
                            ? "bg-muted text-foreground"
                            : z.rank === 3
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-card text-card-foreground"
                        }`}>
                          #{z.rank}
                        </span>
                        <h3 className="text-base font-black text-foreground font-mono">
                          🌊 {z.name.toUpperCase()}
                        </h3>
                      </div>

                      {isUserZone && (
                        <span className="text-[10px] font-black text-primary-foreground bg-primary border-2 border-border px-2 py-0.5">
                          YOUR ZONE
                        </span>
                      )}
                    </div>

                    {/* Primary Ranking Metric: Coins Collected */}
                    <div className="p-3.5 bg-card text-card-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-black text-muted-foreground block font-mono">
                          Total Coins Collected
                        </span>
                        <span className="text-xl sm:text-2xl font-black font-mono text-primary">
                          🪙 {z.coins_collected.toLocaleString()} VIBE
                        </span>
                      </div>
                      <Coins className="w-6 h-6 text-primary" />
                    </div>

                    {/* Zone Engagement Breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="p-2 bg-muted text-foreground border-2 border-border">
                        <span className="text-[10px] text-muted-foreground block font-bold">Visitors</span>
                        <span className="font-black text-foreground">{z.participants_count}</span>
                      </div>
                      <div className="p-2 bg-muted text-foreground border-2 border-border">
                        <span className="text-[10px] text-muted-foreground block font-bold">Missions</span>
                        <span className="font-black text-primary">{z.experiences_completed_count}</span>
                      </div>
                      <div className="p-2 bg-muted text-foreground border-2 border-border">
                        <span className="text-[10px] text-muted-foreground block font-bold">XP Created</span>
                        <span className="font-black text-foreground">{formatXP(z.total_xp_generated)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground pt-2 border-t-2 border-border font-bold">
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
            <div className="p-6 sm:p-8 bg-secondary text-secondary-foreground border-2 border-border shadow-neo text-center space-y-4">
              <div className="w-16 h-16 bg-primary text-primary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] flex items-center justify-center mx-auto">
                <Crown className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-black text-primary uppercase tracking-widest block font-mono">
                  AND THE WINNER IS...
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight mt-1 font-mono">
                  🌊 {championZone.name.toUpperCase()}
                </h2>
                <p className="text-xs sm:text-sm text-foreground/80 max-w-md mx-auto mt-1 font-bold leading-relaxed">
                  Champions of the VIBE 2026 Zone Battle with the highest attendee engagement and coin accumulation!
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-card text-card-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] max-w-2xl mx-auto text-xs font-mono">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Coins Collected</span>
                  <span className="text-base sm:text-lg font-black text-primary">
                    🪙 {championZone.coins_collected.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Participants</span>
                  <span className="text-base sm:text-lg font-black text-foreground">
                    {championZone.participants_count}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Experiences</span>
                  <span className="text-base sm:text-lg font-black text-foreground">
                    {championZone.experiences_completed_count}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Completion Rate</span>
                  <span className="text-base sm:text-lg font-black text-foreground">
                    {championZone.completion_rate_percent}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Statistics Table */}
          <div className="p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4">
            <h3 className="text-base font-black text-foreground font-mono">
              Official Zonal Performance Breakdown
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b-2 border-border text-muted-foreground">
                    <th className="pb-3 font-black">Rank</th>
                    <th className="pb-3 font-black">Zone</th>
                    <th className="pb-3 font-black">Coins Collected</th>
                    <th className="pb-3 font-black">Participants</th>
                    <th className="pb-3 font-black">Experiences</th>
                    <th className="pb-3 font-black">Stall Visits</th>
                    <th className="pb-3 font-black">Games Played</th>
                    <th className="pb-3 font-black">XP Generated</th>
                    <th className="pb-3 font-black">Completion %</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-border">
                  {zoneEntries.map((z) => (
                    <tr key={z.zone_id} className="hover:bg-muted transition-colors">
                      <td className="py-3 font-black text-muted-foreground">#{z.rank}</td>
                      <td className="py-3 font-black text-foreground flex items-center space-x-1">
                        <span>🌊</span>
                        <span>{z.name}</span>
                      </td>
                      <td className="py-3 text-primary font-black">
                        🪙 {z.coins_collected.toLocaleString()}
                      </td>
                      <td className="py-3 text-foreground font-bold">{z.participants_count}</td>
                      <td className="py-3 text-foreground font-bold">{z.experiences_completed_count}</td>
                      <td className="py-3 text-foreground font-bold">{z.stall_interactions_count}</td>
                      <td className="py-3 text-foreground font-bold">{z.games_played_count}</td>
                      <td className="py-3 text-foreground font-black">{formatXP(z.total_xp_generated)}</td>
                      <td className="py-3 text-foreground font-black">{z.completion_rate_percent}%</td>
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
