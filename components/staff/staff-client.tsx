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
  Award,
} from "lucide-react";
import { Zone, Experience } from "@/types/database";
import { formatCoins, formatXP } from "@/lib/utils";
import { ZonalStaffUser, logoutZonalStaffAction } from "@/actions/staff/auth";
import {
  searchAttendeeForCheckinAction,
  checkinAttendeeAtZoneAction,
} from "@/actions/staff/checkin";
import { AwardDutyModal } from "@/components/staff/award-duty-modal";

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
  const [activeTab, setActiveTab] = useState<"qr" | "checkin" | "duty" | "feed">("qr");
  const [selectedQrType, setSelectedQrType] = useState<"activity" | "checkpoint">("activity");
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [dutyAwardsList, setDutyAwardsList] = useState<any[]>([]);

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
      {/* Top Zonal Staff Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-border">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center font-black text-xl">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-secondary text-secondary-foreground border border-border font-mono">
                Official Zonal Portal
              </span>
              <span className="text-[10px] font-mono text-muted-foreground font-bold">
                Logged in as <strong className="text-foreground">{staffUser.headName}</strong> ({staffUser.username})
              </span>
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight font-mono flex items-center gap-2 mt-0.5">
              <span>Zone {assignedZone.name}</span>
              <span className="text-xs font-mono font-black px-2.5 py-0.5 bg-muted text-foreground border-2 border-border shadow-[1px_1px_0px_var(--border)]">
                Rank #{zoneRank}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setIsAwardModalOpen(true)}
            className="neo-btn-primary px-3.5 py-2 text-xs font-black flex items-center space-x-1.5 cursor-pointer bg-amber-500 text-black border-2 border-black shadow-[2px_2px_0px_#000]"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>Award Duty XP</span>
          </button>
          <Link
            href="/staff/stalls"
            className="neo-btn-secondary px-3.5 py-2 text-xs font-black flex items-center space-x-1.5"
          >
            <span>📸 Photo Queue</span>
          </Link>
          <form action={logoutZonalStaffAction}>
            <button
              type="submit"
              className="neo-btn-primary px-3.5 py-2 text-xs font-black flex items-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </form>
          <Link
            href="/app"
            className="neo-btn-card px-3.5 py-2 text-xs font-black flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Attendee App</span>
          </Link>
        </div>
      </div>

      {/* Zone Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo space-y-1">
          <div className="flex items-center justify-between text-primary mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider font-mono">Total Zone Coins</span>
            <Coins className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-primary">
            🪙 {formatCoins(zoneCoins)}
          </div>
          <p className="text-[10px] text-muted-foreground font-bold mt-1">Directly contributed by attendees</p>
        </div>

        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo space-y-1">
          <div className="flex items-center justify-between text-foreground mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider font-mono">Zone Battle Rank</span>
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-foreground">
            #{zoneRank}{" "}
            <span className="text-xs font-bold text-muted-foreground">/ 6 Zones</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-bold mt-1">Live Zone Leaderboard standing</p>
        </div>

        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo space-y-1">
          <div className="flex items-center justify-between text-foreground mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider font-mono">Completions</span>
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-foreground">
            {totalComps}
          </div>
          <p className="text-[10px] text-muted-foreground font-bold mt-1">Missions and zone checkpoints</p>
        </div>

        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo space-y-1">
          <div className="flex items-center justify-between text-foreground mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider font-mono">Active Missions</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-foreground">
            {experiences.length}
          </div>
          <p className="text-[10px] text-muted-foreground font-bold mt-1">Configured for {assignedZone.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-border space-x-2">
        <button
          onClick={() => setActiveTab("qr")}
          className={`px-4 py-2.5 text-xs font-black transition-all flex items-center space-x-2 border-2 border-b-0 ${
            activeTab === "qr"
              ? "bg-primary text-primary-foreground border-border shadow-[2px_-2px_0px_var(--border)]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Official Zone QRs</span>
        </button>

        <button
          onClick={() => setActiveTab("checkin")}
          className={`px-4 py-2.5 text-xs font-black transition-all flex items-center space-x-2 border-2 border-b-0 ${
            activeTab === "checkin"
              ? "bg-secondary text-secondary-foreground border-border shadow-[2px_-2px_0px_var(--border)]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Participant Check-in (+75 XP)</span>
        </button>

        <button
          onClick={() => setActiveTab("duty")}
          className={`px-4 py-2.5 text-xs font-black transition-all flex items-center space-x-2 border-2 border-b-0 ${
            activeTab === "duty"
              ? "bg-amber-500 text-black border-border shadow-[2px_-2px_0px_var(--border)]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Volunteer Duty XP ({dutyAwardsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("feed")}
          className={`px-4 py-2.5 text-xs font-black transition-all flex items-center space-x-2 border-2 border-b-0 ${
            activeTab === "feed"
              ? "bg-accent text-accent-foreground border-border shadow-[2px_-2px_0px_var(--border)]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Live Activity ({activityFeed.length})</span>
        </button>
      </div>

      {/* TAB 1: OFFICIAL ZONE QRS (SCREEN DISPLAY) */}
      {activeTab === "qr" && (
        <div className="space-y-6">
          {/* Sub-selector between Activity (Collect Coins) and Checkpoint (XP) */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setSelectedQrType("activity")}
              className={`px-4 py-2 text-xs font-black transition-all flex items-center space-x-2 border-2 ${
                selectedQrType === "activity"
                  ? "bg-secondary text-secondary-foreground border-border shadow-[2px_2px_0px_var(--border)]"
                  : "bg-card text-card-foreground border-border hover:bg-muted"
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Collect VIBE Coins QR</span>
            </button>

            <button
              onClick={() => setSelectedQrType("checkpoint")}
              className={`px-4 py-2 text-xs font-black transition-all flex items-center space-x-2 border-2 ${
                selectedQrType === "checkpoint"
                  ? "bg-primary text-primary-foreground border-border shadow-[2px_2px_0px_var(--border)]"
                  : "bg-card text-card-foreground border-border hover:bg-muted"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Zone Checkpoint QR (+75 XP)</span>
            </button>
          </div>

          {/* QR Display Card */}
          <div className="max-w-xl mx-auto p-6 sm:p-8 bg-card text-card-foreground border-2 border-border shadow-neo text-center space-y-6">
            {selectedQrType === "activity" ? (
              <>
                <div className="space-y-1">
                  <span className="px-3 py-1 bg-secondary text-secondary-foreground border-2 border-border text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-[1px_1px_0px_var(--border)]">
                    <Coins className="w-3.5 h-3.5 text-secondary-foreground" />
                    Send VIBE Coins To {assignedZone.name}
                  </span>
                  <h2 className="text-xl font-black text-foreground pt-1 font-mono">
                    Scan to Cheer & Contribute VIBE Coins
                  </h2>
                  <p className="text-xs text-muted-foreground font-bold max-w-md mx-auto">
                    Display this QR on your phone or laptop screen at your zone. Attendees scan this with their VIBE camera to boost {assignedZone.name}&apos;s rank!
                  </p>
                </div>

                <div className="inline-block p-4 bg-white border-4 border-border shadow-[4px_4px_0px_var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activityQrDataUrl}
                    alt={`Activity QR Code for ${assignedZone.name}`}
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain mx-auto"
                  />
                  <p className="font-mono text-black text-[11px] font-black mt-2 tracking-wider">
                    {activityCode}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <a
                    href={activityQrDataUrl}
                    download={`VIBE-${assignedZone.slug}-activity-qr.png`}
                    className="neo-btn-primary px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR Image</span>
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <span className="px-3 py-1 bg-primary text-primary-foreground border-2 border-border text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-[1px_1px_0px_var(--border)]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Zone Checkpoint (+75 XP)
                  </span>
                  <h2 className="text-xl font-black text-foreground pt-1 font-mono">
                    Scan for {assignedZone.name} Zone Visit
                  </h2>
                  <p className="text-xs text-muted-foreground font-bold max-w-md mx-auto">
                    Official checkpoint QR code. Attendees scanning this earn +75 XP and mark {assignedZone.name} as visited on their interactive map!
                  </p>
                </div>

                <div className="inline-block p-4 bg-white border-4 border-border shadow-[4px_4px_0px_var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={checkpointQrDataUrl}
                    alt={`Checkpoint QR Code for ${assignedZone.name}`}
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain mx-auto"
                  />
                  <p className="font-mono text-black text-[11px] font-black mt-2 tracking-wider">
                    {checkpointCode}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <a
                    href={checkpointQrDataUrl}
                    download={`VIBE-${assignedZone.slug}-checkpoint-qr.png`}
                    className="neo-btn-primary px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5"
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
          <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo space-y-4">
            <div>
              <h2 className="text-base font-black text-foreground font-mono flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Search Fresher / Attendee for Check-in</span>
              </h2>
              <p className="text-xs text-muted-foreground font-bold mt-1">
                Enter attendee name or VIBE ID (e.g. &ldquo;VIBE-&rdquo; or &ldquo;John&rdquo;). Tap check-in to award +75 XP directly to their profile.
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, VIBE-ID, or college..."
                  className="w-full bg-muted border-2 border-border pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none font-mono font-bold"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="neo-btn-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </form>

            {checkinMessage && (
              <div
                className={`p-3.5 border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs flex items-center space-x-2 font-bold ${
                  checkinMessage.type === "success"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {checkinMessage.type === "success" ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{checkinMessage.text}</span>
              </div>
            )}
          </div>

          {/* Search Results */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-foreground uppercase tracking-wider font-mono">
              Search Results ({searchResults.length})
            </h3>

            {searchResults.length === 0 && !isSearching && searchQuery && (
              <div className="p-8 bg-card text-card-foreground border-2 border-border shadow-neo text-center text-xs text-muted-foreground font-bold">
                No attendees found matching &ldquo;{searchQuery}&rdquo;. Check spelling or try VIBE ID.
              </div>
            )}

            {searchResults.length === 0 && !isSearching && !searchQuery && (
              <div className="p-8 bg-card text-card-foreground border-2 border-dashed border-border text-center text-xs text-muted-foreground font-bold">
                Type above to search across registered participants.
              </div>
            )}

            {searchResults.map((att) => (
              <div
                key={att.id}
                className="p-4 bg-card text-card-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-foreground text-sm font-mono">{att.displayName}</span>
                    <span className="font-mono text-xs px-2 py-0.5 bg-muted text-foreground font-black border-2 border-border">
                      {att.vibeId}
                    </span>
                    {att.isCheckedInToZone && (
                      <span className="text-[10px] font-black px-2 py-0.5 bg-secondary text-secondary-foreground border border-border">
                        Already Checked In
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-bold">{att.college}</p>
                </div>

                <div>
                  <button
                    onClick={() => handleCheckin(att.id, att.displayName)}
                    disabled={isPending}
                    className={`px-4 py-2 text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                      att.isCheckedInToZone
                        ? "neo-btn-card"
                        : "neo-btn-secondary"
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
            <div className="p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-3">
              <h2 className="text-xs font-black text-foreground font-mono flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Zone Experiences & Missions ({experiences.length})</span>
              </h2>
              <div className="space-y-2">
                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 bg-muted text-foreground border-2 border-border flex items-center justify-between text-xs font-mono"
                  >
                    <div className="space-y-0.5">
                      <h3 className="font-black text-foreground">{exp.title}</h3>
                      <span className="text-[10px] text-muted-foreground block font-bold">
                        Cost: {exp.coin_cost} Coins • Reward: +{exp.xp_reward} XP
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-secondary-foreground bg-secondary px-2 py-0.5 border border-border">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Live Activity Feed */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-3">
              <h2 className="text-xs font-black text-foreground font-mono flex items-center space-x-2">
                <Flame className="w-3.5 h-3.5 text-primary" />
                <span>Recent Zone Check-ins & Completions</span>
              </h2>

              {activityFeed.length === 0 ? (
                <p className="text-xs text-muted-foreground font-bold text-center py-8">
                  No completions recorded in this zone yet today.
                </p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {activityFeed.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 bg-muted text-foreground border-2 border-border flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <h3 className="font-black text-foreground">{act.attendeeName}</h3>
                        <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
                          {act.experienceTitle} •{" "}
                          <span className="font-black text-primary">{act.vibeId}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-primary font-black">
                          +{act.xpEarned} XP
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold block">
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

      {/* TAB 4: VOLUNTEER DUTY AWARDS */}
      {activeTab === "duty" && (
        <div className="space-y-6">
          <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-mono font-bold uppercase">Duty Reward Disbursement</span>
              </div>
              <h2 className="text-xl font-black text-foreground font-mono uppercase tracking-tight">
                Authorize Volunteer & Task XP
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl font-mono">
                Award verified XP and Coins to volunteers for crowd control, stage management, stall hosting,
                and logistics. Each award is logged to the District Admin audit trail.
              </p>
            </div>

            <button
              onClick={() => setIsAwardModalOpen(true)}
              className="neo-btn-primary px-5 py-3 text-xs font-mono font-black uppercase flex items-center justify-center space-x-2 bg-amber-500 text-black border-2 border-black shadow-[4px_4px_0px_#000]"
            >
              <Sparkles className="w-4 h-4" />
              <span>+ Issue Duty Award</span>
            </button>
          </div>

          {/* Recent Duty Awards List */}
          <div className="p-5 bg-card text-card-foreground border-2 border-border shadow-neo space-y-3">
            <h3 className="text-xs font-black text-foreground font-mono flex items-center space-x-2 uppercase">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Recent Duty Awards Issued at {assignedZone.name} Station</span>
            </h3>

            {dutyAwardsList.length === 0 ? (
              <div className="p-8 text-center bg-muted border-2 border-border">
                <p className="text-xs text-muted-foreground font-bold font-mono mb-2">
                  No volunteer duty rewards issued yet today.
                </p>
                <button
                  onClick={() => setIsAwardModalOpen(true)}
                  className="px-4 py-2 bg-amber-500 text-black text-xs font-mono font-bold uppercase border-2 border-black shadow-[2px_2px_0px_#000]"
                >
                  Issue First Award →
                </button>
              </div>
            ) : (
              <div className="divide-y-2 divide-border">
                {dutyAwardsList.map((award, idx) => (
                  <div key={award.id || idx} className="py-3 flex items-center justify-between font-mono text-xs">
                    <div>
                      <div className="font-bold text-foreground flex items-center space-x-2">
                        <span>{award.recipientName}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {award.dutyCategory}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{award.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-amber-400">+{award.xpAwarded} XP</div>
                      <div className="text-[11px] text-cyan-400 font-bold">+{award.coinsAwarded} Coins</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Award Duty Modal */}
      {isAwardModalOpen && (
        <AwardDutyModal
          zoneId={assignedZone.id}
          zoneName={assignedZone.name}
          onClose={() => setIsAwardModalOpen(false)}
          onSuccess={(newAward) => {
            setDutyAwardsList((prev) => [newAward, ...prev]);
            setActiveTab("duty");
          }}
        />
      )}
    </div>
  );
}

