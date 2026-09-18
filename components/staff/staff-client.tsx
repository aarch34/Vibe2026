"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  MapPin,
  CheckCircle2,
  Users,
  Search,
  ArrowLeft,
  Sparkles,
  QrCode,
  Trophy,
  Coins,
  LogOut,
  Download,
  Check,
  AlertCircle,
  Clock,
  Flame,
} from "lucide-react";
import { Zone, Experience } from "@/types/database";
import { formatCoins, formatXP } from "@/lib/utils";
import { ZonalStaffUser, logoutZonalStaffAction } from "@/actions/staff/auth";
import {
  searchAttendeeForCheckinAction,
  checkinAttendeeAtZoneAction,
} from "@/actions/staff/checkin";

interface StaffDashboardClientProps {
  assignedZone: Zone;
  staffUser: ZonalStaffUser;
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
  zoneCoins: number;
  zoneRank: number;
  checkpointCode: string;
  checkpointQrDataUrl: string;
  activityCode: string;
  activityQrDataUrl: string;
}

export function StaffDashboardClient({
  assignedZone,
  staffUser,
  experiences,
  recentActivity: initialRecentActivity,
  totalCompletions: initialTotalCompletions,
  zoneCoins,
  zoneRank,
  checkpointCode,
  checkpointQrDataUrl,
  activityCode,
  activityQrDataUrl,
}: StaffDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"qr" | "checkin" | "feed">("qr");
  const [selectedQrType, setSelectedQrType] = useState<"activity" | "checkpoint">("activity");

  // Search & check-in state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    { id: string; displayName: string; vibeId: string; college: string; isCheckedInToZone: boolean }[]
  >([]);
  const [checkinMessage, setCheckinMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Local activity list for instant updates
  const [activityFeed, setActivityFeed] = useState(initialRecentActivity);
  const [totalComps, setTotalComps] = useState(initialTotalCompletions);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setCheckinMessage(null);
    try {
      const res = await searchAttendeeForCheckinAction(searchQuery, assignedZone.id);
      if (res.success && res.results) {
        setSearchResults(res.results);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }

  function handleCheckin(attendeeId: string, attendeeName: string) {
    setCheckinMessage(null);
    startTransition(async () => {
      const res = await checkinAttendeeAtZoneAction({
        targetProfileId: attendeeId,
        zoneId: assignedZone.id,
        xpAmount: 75,
      });

      if (res.success) {
        setCheckinMessage({
          type: "success",
          text: res.message || `Checked in ${attendeeName}! +75 XP awarded.`,
        });

        // Update local search results
        setSearchResults((prev) =>
          prev.map((item) =>
            item.id === attendeeId ? { ...item, isCheckedInToZone: true } : item
          )
        );

        // Prepend to activity feed
        setActivityFeed((prev) => [
          {
            id: `local-${Date.now()}`,
            experienceTitle: `${assignedZone.name} Check-in`,
            attendeeName: res.attendeeName || attendeeName,
            vibeId: res.vibeId || "VIBE",
            xpEarned: res.xpAwarded || 75,
            coinSpent: 0,
            completedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setTotalComps((c) => c + 1);
      } else {
        setCheckinMessage({
          type: "error",
          text: res.message || "Check-in failed. Please try again.",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-black text-xl shadow-lg">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Official Zonal Portal
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Logged in as <strong className="text-white">{staffUser.headName}</strong> ({staffUser.username})
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
              <span>Zone {assignedZone.name}</span>
              <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                Rank #{zoneRank}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Link
            href="/staff/stalls"
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            <span>📸 Photo Queue</span>
          </Link>
          <form action={logoutZonalStaffAction}>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center space-x-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </form>
          <Link
            href="/app"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Attendee App</span>
          </Link>
        </div>
      </div>

      {/* Zone Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Zone Coins</span>
            <Coins className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            🪙 {formatCoins(zoneCoins)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Directly contributed by attendees</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/30">
          <div className="flex items-center justify-between text-indigo-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Zone Battle Rank</span>
            <Trophy className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            #{zoneRank}{" "}
            <span className="text-xs font-normal text-slate-400">/ 6 Zones</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Live Zone Leaderboard standing</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completions & Check-ins</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {totalComps}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Missions and zone checkpoints</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/30">
          <div className="flex items-center justify-between text-cyan-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Missions</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
            {experiences.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Configured for {assignedZone.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab("qr")}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center space-x-2 border-t border-x ${
            activeTab === "qr"
              ? "bg-slate-900 border-indigo-500/50 text-white shadow-lg"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <QrCode className="w-4 h-4 text-indigo-400" />
          <span>Official Zone QRs (Display on Screen)</span>
        </button>

        <button
          onClick={() => setActiveTab("checkin")}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center space-x-2 border-t border-x ${
            activeTab === "checkin"
              ? "bg-slate-900 border-indigo-500/50 text-white shadow-lg"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Participant Check-in (+75 XP)</span>
        </button>

        <button
          onClick={() => setActiveTab("feed")}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center space-x-2 border-t border-x ${
            activeTab === "feed"
              ? "bg-slate-900 border-indigo-500/50 text-white shadow-lg"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Live Zone Activity ({activityFeed.length})</span>
        </button>
      </div>

      {/* TAB 1: OFFICIAL ZONE QRS (SCREEN DISPLAY) */}
      {activeTab === "qr" && (
        <div className="space-y-6">
          {/* Sub-selector between Activity (Collect Coins) and Checkpoint (XP) */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setSelectedQrType("activity")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
                selectedQrType === "activity"
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-105"
                  : "bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-600"
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Collect VIBE Coins QR</span>
            </button>

            <button
              onClick={() => setSelectedQrType("checkpoint")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
                selectedQrType === "checkpoint"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 scale-105"
                  : "bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-600"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Zone Checkpoint QR (+75 XP)</span>
            </button>
          </div>

          {/* QR Display Card */}
          <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-indigo-500/40 shadow-2xl text-center space-y-6">
            {selectedQrType === "activity" ? (
              <>
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5" />
                    Send VIBE Coins To {assignedZone.name}
                  </span>
                  <h2 className="text-xl font-black text-white pt-1">
                    Scan to Cheer & Contribute VIBE Coins
                  </h2>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Display this QR on your phone or laptop screen at your zone. Attendees scan this with their VIBE camera to boost {assignedZone.name}&apos;s rank!
                  </p>
                </div>

                <div className="inline-block p-4 bg-white rounded-2xl shadow-2xl border-4 border-amber-400">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activityQrDataUrl}
                    alt={`Activity QR Code for ${assignedZone.name}`}
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain mx-auto"
                  />
                  <p className="font-mono text-slate-900 text-[11px] font-black mt-2 tracking-wider">
                    {activityCode}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <a
                    href={activityQrDataUrl}
                    download={`VIBE-${assignedZone.slug}-activity-qr.png`}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 flex items-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR Image</span>
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Zone Checkpoint (+75 XP)
                  </span>
                  <h2 className="text-xl font-black text-white pt-1">
                    Scan for {assignedZone.name} Zone Visit
                  </h2>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Official checkpoint QR code. Attendees scanning this earn +75 XP and mark {assignedZone.name} as visited on their interactive map!
                  </p>
                </div>

                <div className="inline-block p-4 bg-white rounded-2xl shadow-2xl border-4 border-indigo-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={checkpointQrDataUrl}
                    alt={`Checkpoint QR Code for ${assignedZone.name}`}
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain mx-auto"
                  />
                  <p className="font-mono text-slate-900 text-[11px] font-black mt-2 tracking-wider">
                    {checkpointCode}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <a
                    href={checkpointQrDataUrl}
                    download={`VIBE-${assignedZone.slug}-checkpoint-qr.png`}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 flex items-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR Image</span>
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PARTICIPANT CHECK-IN & AWARD XP */}
      {activeTab === "checkin" && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Search Fresher / Attendee for Check-in</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter attendee name or VIBE ID (e.g. &ldquo;VIBE-&rdquo; or &ldquo;John&rdquo;). Tap check-in to award +75 XP directly to their profile.
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, VIBE-ID, or college..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-all disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </form>

            {checkinMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
                  checkinMessage.type === "success"
                    ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"
                    : "bg-rose-950/80 border border-rose-500/40 text-rose-300"
                }`}
              >
                {checkinMessage.type === "success" ? (
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{checkinMessage.text}</span>
              </div>
            )}
          </div>

          {/* Search Results */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Search Results ({searchResults.length})
            </h3>

            {searchResults.length === 0 && !isSearching && searchQuery && (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
                No attendees found matching &ldquo;{searchQuery}&rdquo;. Check spelling or try VIBE ID.
              </div>
            )}

            {searchResults.length === 0 && !isSearching && !searchQuery && (
              <div className="p-8 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                Type above to search across registered participants.
              </div>
            )}

            {searchResults.map((att) => (
              <div
                key={att.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-slate-700 transition-all"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{att.displayName}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold border border-slate-700">
                      {att.vibeId}
                    </span>
                    {att.isCheckedInToZone && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        Already Checked In
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{att.college}</p>
                </div>

                <div>
                  <button
                    onClick={() => handleCheckin(att.id, att.displayName)}
                    disabled={isPending}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      att.isCheckedInToZone
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md active:scale-95"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {att.isCheckedInToZone ? "Check-in Again (+75 XP)" : "Check-in & Award +75 XP"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE ZONE ACTIVITY & MISSIONS */}
      {activeTab === "feed" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Zone Missions */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
              <h2 className="text-xs font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zone Experiences & Missions ({experiences.length})</span>
              </h2>
              <div className="space-y-2">
                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-white">{exp.title}</h3>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Cost: {exp.coin_cost} Coins • Reward: +{exp.xp_reward} XP
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Live Activity Feed */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
              <h2 className="text-xs font-bold text-white flex items-center space-x-2">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Recent Zone Check-ins & Completions</span>
              </h2>

              {activityFeed.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  No completions recorded in this zone yet today.
                </p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {activityFeed.map((act) => (
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
      )}
    </div>
  );
}

