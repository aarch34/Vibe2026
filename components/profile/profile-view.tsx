"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Instagram,
  UserPlus,
  Users,
  Gamepad2,
  Trophy,
  Award,
  Globe,
  Lock,
  ExternalLink,
  MessageSquare,
  Heart,
  Calendar,
  CheckCircle2,
  Pencil,
  Download,
  ShieldCheck,
  Trash2,
  UserCheck,
  Clock,
  FileText,
  AlertTriangle,
  Loader2,
  X,
  Scale,
  Mail,
  AlertCircle,
  Video,
} from "lucide-react";
import { cn, isVideoMedia } from "@/lib/utils";
import { Profile, Post, Level } from "@/types/database";
import { calculateLevel } from "@/lib/db/mock-store";
import { EditProfileModal } from "@/components/attendee/edit-profile-modal";
import { useOptionalLiveStats } from "@/components/providers/live-stats-provider";
import { InstagramFeedVideo } from "@/components/social/instagram-feed-video";

interface ProfileViewProps {
  profile: Profile;
  isSelf: boolean;
  userPosts: Post[];
  highScores: Record<string, number>;
  initialConnectionStatus?: "connected" | "pending" | "none";
  friends?: Profile[];
  outgoingCount?: number;
  incomingCount?: number;
}

export function ProfileView({
  profile,
  isSelf,
  userPosts,
  highScores,
  initialConnectionStatus = "none",
  friends = [],
  outgoingCount = 0,
  incomingCount = 0,
}: ProfileViewProps) {
  const router = useRouter();
  const liveStats = useOptionalLiveStats();
  const effectiveIncomingCount = liveStats?.incomingRequests?.length ?? incomingCount;
  const [currentProfile, setCurrentProfile] = useState<Profile>(profile);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDiscoverable, setIsDiscoverable] = useState(currentProfile.is_discoverable);
  const [connectionStatus, setConnectionStatus] = useState<"none" | "pending" | "connected">(
    initialConnectionStatus
  );
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postComments, setPostComments] = useState<{ id?: string; authorName: string; authorAvatar?: string; comment: string }[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const openPostModal = async (post: Post) => {
    setSelectedPost(post);
    setLoadingComments(true);
    setPostComments([]);
    try {
      const res = await fetch(`/api/posts/${post.id}/comment`);
      if (res.ok) {
        const data = await res.json();
        if (data.comments) {
          setPostComments(data.comments);
        }
      }
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setLoadingComments(false);
    }
  };

  // DPDP Modals & State
  const [isErasureModalOpen, setIsErasureModalOpen] = useState(false);
  const [isNomineeModalOpen, setIsNomineeModalOpen] = useState(false);
  const [isGrievanceModalOpen, setIsGrievanceModalOpen] = useState(false);

  const [isDownloadingData, setIsDownloadingData] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [privacyNotice, setPrivacyNotice] = useState<string | null>(null);

  // Nominee form state
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeEmail, setNomineeEmail] = useState("");
  const [nomineePhone, setNomineePhone] = useState("");
  const [nomineeRelationship, setNomineeRelationship] = useState("Family / Legal Heir");
  const [nomineeSuccess, setNomineeSuccess] = useState<string | null>(null);
  const [nomineeLoading, setNomineeLoading] = useState(false);

  // Grievance form state
  const [grievanceCategory, setGrievanceCategory] = useState("Right to Access");
  const [grievanceSubject, setGrievanceSubject] = useState("");
  const [grievanceDesc, setGrievanceDesc] = useState("");
  const [grievanceResult, setGrievanceResult] = useState<{ id: string; message: string } | null>(null);
  const [grievanceLoading, setGrievanceLoading] = useState(false);


  
  // Sync internal state when server-passed profile prop updates
  useEffect(() => {
    setCurrentProfile(profile);
    setIsDiscoverable(profile.is_discoverable);
    if (initialConnectionStatus) {
      setConnectionStatus(initialConnectionStatus);
    }
  }, [profile, initialConnectionStatus]);

  // Use global live XP if this is the user's own profile, otherwise use the static profile XP
  const displayXp = isSelf ? (liveStats?.xp ?? currentProfile.xp) : currentProfile.xp;
  const levelInfo = calculateLevel(displayXp);
  const minXp = levelInfo.min_xp;
  const maxXp = levelInfo.max_xp || 3000;
  const currentLevelXp = Math.max(0, displayXp - minXp);
  const totalLevelRange = Math.max(1, maxXp - minXp);
  const progressPercent = Math.min(100, Math.floor((currentLevelXp / totalLevelRange) * 100));

  const toggleDiscoverable = async () => {
    const nextVal = !isDiscoverable;
    setIsDiscoverable(nextVal);
    setPrivacyNotice(nextVal ? "Profile is now PUBLIC on Discover page." : "Profile is now PRIVATE and hidden from search.");

    try {
      await fetch("/api/profile/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_discoverable: nextVal }),
      });
    } catch {
      // Keep optimistic
    }

    setTimeout(() => setPrivacyNotice(null), 3500);
  };

  const handleSendRequest = async () => {
    setConnectionStatus("pending");
    try {
      await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: currentProfile.id }),
      });
    } catch {
      // fallback
    }
  };

  // DPDP Section 11: Download Personal Data
  const handleDownloadPersonalData = async () => {
    setIsDownloadingData(true);
    try {
      const res = await fetch("/api/dpdp/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vibe2026-data-principal-${currentProfile.username || "me"}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Data export error:", err);
    } finally {
      setIsDownloadingData(false);
    }
  };

  // DPDP Section 12: Erase Account and Data
  const handleEraseAccountData = async () => {
    setIsErasing(true);
    try {
      const res = await fetch("/api/dpdp/delete", { method: "POST" });
      if (res.ok) {
        setIsErasureModalOpen(false);
        router.push("/sign-in");
      }
    } catch (err) {
      console.error("Account erasure error:", err);
    } finally {
      setIsErasing(false);
    }
  };

  // DPDP Section 14: Register Nominee
  const handleNomineeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomineeName.trim() || !nomineeEmail.trim()) return;

    setNomineeLoading(true);
    setNomineeSuccess(null);
    try {
      const res = await fetch("/api/dpdp/nominee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomineeName: nomineeName.trim(),
          nomineeEmail: nomineeEmail.trim(),
          nomineePhone: nomineePhone.trim(),
          nomineeRelationship: nomineeRelationship.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNomineeSuccess(data.message || "Nominee designated successfully under Section 14.");
      }
    } catch (err) {
      console.error("Nominee submission error:", err);
    } finally {
      setNomineeLoading(false);
    }
  };

  // DPDP Section 13: Submit Grievance
  const handleGrievanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grievanceSubject.trim() || !grievanceDesc.trim()) return;

    setGrievanceLoading(true);
    setGrievanceResult(null);
    try {
      const res = await fetch("/api/dpdp/grievance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: grievanceCategory,
          subject: grievanceSubject.trim(),
          description: grievanceDesc.trim(),
          contactEmail: currentProfile.email,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGrievanceResult({
          id: data.trackingId,
          message: data.message,
        });
        setGrievanceSubject("");
        setGrievanceDesc("");
      }
    } catch (err) {
      console.error("Grievance submission error:", err);
    } finally {
      setGrievanceLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isSelf && (
        <div className="flex items-center justify-between pb-1">
          <Link
            href="/app/discover"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>← Back to Discover People</span>
          </Link>
          <span className="text-[11px] font-mono font-bold text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
            Attendee Profile
          </span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-pink-500/30 shadow-2xl relative overflow-hidden space-y-6">
        {/* Glow BG */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 relative z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={
                currentProfile.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentProfile.display_name || "user")}`
              }
              alt={currentProfile.display_name}
              onError={(e) => {
                const fallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentProfile.display_name || "user")}`;
                if (e.currentTarget.src !== fallback) {
                  e.currentTarget.src = fallback;
                }
              }}
              width={112}
              height={112}
              style={{ width: "112px", height: "112px", maxWidth: "112px", maxHeight: "112px" }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-pink-500/40 object-cover shadow-xl shrink-0 bg-secondary/40"
            />
            <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-background border border-border text-xl">
              {levelInfo.badge}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                  {currentProfile.display_name}
                </h1>
                <span className="text-xs font-mono text-muted-foreground block">
                  @{currentProfile.instagram_username || currentProfile.username}
                </span>
              </div>

              {/* Action Buttons: Edit Profile & View Instagram */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 self-center sm:self-auto">
                {isSelf && (
                  <>
                    <Link
                      href="/app/friends"
                      className="px-4 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-extrabold text-xs shadow-md inline-flex items-center justify-center space-x-1.5 transition-all cursor-pointer relative"
                    >
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>FRIENDS</span>
                      {effectiveIncomingCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-pink-500 text-white animate-pulse">
                          {effectiveIncomingCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/app/leaderboard"
                      className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-extrabold text-xs shadow-md inline-flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>LEADERBOARD</span>
                    </Link>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-400 font-extrabold text-xs shadow-md inline-flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>EDIT PROFILE</span>
                    </button>
                  </>
                )}

                {!isSelf && (
                  <button
                    onClick={handleSendRequest}
                    disabled={connectionStatus !== "none"}
                    className={cn(
                      "px-4 py-2 rounded-xl font-extrabold text-xs shadow-md inline-flex items-center justify-center space-x-1.5 transition-all cursor-pointer",
                      connectionStatus === "connected"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default"
                        : connectionStatus === "pending"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 cursor-default"
                        : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white"
                    )}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>
                      {connectionStatus === "connected"
                        ? "CONNECTED"
                        : connectionStatus === "pending"
                        ? "REQUEST SENT"
                        : "CONNECT"}
                    </span>
                  </button>
                )}

                {currentProfile.instagram_username && (
                  <a
                    href={`https://instagram.com/${currentProfile.instagram_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (!isSelf) {
                        fetch("/api/profile/instagram-click", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ targetProfileId: currentProfile.id }),
                        }).catch(() => {});
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white font-extrabold text-xs shadow-md inline-flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>VIEW INSTAGRAM</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Academic & Club Details */}
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p className="font-bold text-foreground">
                {currentProfile.college || "Delegate"}{" "}
                {currentProfile.course_year && `• ${currentProfile.course_year}`}
              </p>
              <p className="font-semibold text-purple-400">
                {currentProfile.rotaract_club || "Rotaract District 3192"}{" "}
                {currentProfile.city && `• ${currentProfile.city}`}
              </p>
            </div>

            {/* Bio */}
            {currentProfile.bio && (
              <p className="text-xs text-foreground/90 leading-relaxed max-w-xl pt-1">
                "{currentProfile.bio}"
              </p>
            )}

            {/* Interests Tags */}
            {currentProfile.interests && currentProfile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 justify-center sm:justify-start">
                {currentProfile.interests.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-secondary text-pink-400 border border-pink-500/20 text-[11px] font-bold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Level & XP Progress Bar */}
        <div className="p-4 rounded-2xl bg-secondary/50 border border-border/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-black">
            <span className="text-foreground flex items-center space-x-1.5">
              <span>{levelInfo.badge}</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400">
                Level {levelInfo.level_number}: {levelInfo.level_name}
              </span>
            </span>
            <span className="text-amber-400 font-mono text-sm">⭐ {displayXp} XP</span>
          </div>

          <div className="w-full h-3 rounded-full bg-background overflow-hidden p-0.5 border border-border/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Discoverability Privacy Toggle */}
        {isSelf && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/40 border border-border text-xs">
              <span className="font-bold text-foreground flex items-center space-x-2">
                {isDiscoverable ? (
                  <Globe className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Lock className="w-4 h-4 text-pink-400" />
                )}
                <span>Discoverable in People Search (DPDP Opt-In)</span>
              </span>
              <button
                onClick={toggleDiscoverable}
                className={cn(
                  "px-3 py-1 rounded-full font-extrabold text-[11px] transition-all cursor-pointer",
                  isDiscoverable
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    : "bg-pink-500/20 text-pink-400 border border-pink-500/40"
                )}
              >
                {isDiscoverable ? "PUBLIC" : "PRIVATE"}
              </button>
            </div>
            {privacyNotice && (
              <p className="text-[11px] text-cyan-400 font-mono font-bold animate-in fade-in">
                ✓ {privacyNotice}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Profile Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {isSelf ? (
          <Link
            href="/app/friends?tab=friends"
            className="p-4 rounded-2xl bg-card border border-border hover:border-purple-500/50 hover:bg-purple-500/5 text-center space-y-1 transition-all group block cursor-pointer"
          >
            <Users className="w-5 h-5 mx-auto text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground block">
              Connections
            </span>
            <span className="text-xl font-black text-foreground font-mono">
              {currentProfile.connections_count}
            </span>
            <span className="text-[10px] font-bold text-purple-400 block opacity-80 group-hover:opacity-100">
              View All & Sent →
            </span>
          </Link>
        ) : (
          <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
            <Users className="w-5 h-5 mx-auto text-cyan-400" />
            <span className="text-xs font-bold text-muted-foreground block">Connections</span>
            <span className="text-xl font-black text-foreground font-mono">
              {currentProfile.connections_count}
            </span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
          <MessageSquare className="w-5 h-5 mx-auto text-pink-400" />
          <span className="text-xs font-bold text-muted-foreground block">VIBE Posts</span>
          <span className="text-xl font-black text-foreground font-mono">
            {currentProfile.posts_count}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
          <Gamepad2 className="w-5 h-5 mx-auto text-purple-400" />
          <span className="text-xs font-bold text-muted-foreground block">Games Played</span>
          <span className="text-xl font-black text-foreground font-mono">
            {currentProfile.games_played_count}
          </span>
        </div>

        <Link
          href="/app/leaderboard"
          className={cn(
            "p-4 rounded-2xl bg-card border border-border text-center space-y-1 transition-all block",
            isSelf && "hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer group"
          )}
        >
          <Trophy className={cn("w-5 h-5 mx-auto text-amber-400", isSelf && "group-hover:scale-110 transition-transform")} />
          <span className={cn("text-xs font-bold text-muted-foreground block", isSelf && "group-hover:text-foreground")}>
            Total XP
          </span>
          <span className="text-xl font-black text-amber-400 font-mono">
            ⭐ {displayXp}
          </span>
          {isSelf && (
            <span className="text-[10px] font-bold text-amber-400/80 block">
              Rankings →
            </span>
          )}
        </Link>
      </div>

      {/* Prominent Friends Hub, Sent Requests & Leaderboard Banner */}
      {isSelf && (
        <div className="space-y-3">
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-900/20 via-pink-900/15 to-indigo-900/20 border border-purple-500/30 shadow-xl space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                      MY CONNECTIONS & REQUESTS
                    </h3>
                    {effectiveIncomingCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-500 text-white animate-pulse">
                        {effectiveIncomingCount} NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    See who you're connected with, review received requests, and track who you sent requests to.
                  </p>
                </div>
              </div>

              <Link
                href="/app/friends"
                className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-lg inline-flex items-center justify-center space-x-2 transition-all shrink-0 self-stretch sm:self-auto"
              >
                <Users className="w-4 h-4" />
                <span>OPEN FRIENDS HUB</span>
              </Link>
            </div>

            {/* Quick 3-Tab Shortcuts for Mobile & Desktop */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
              <Link
                href="/app/friends?tab=friends"
                className="p-3 rounded-2xl bg-card/70 hover:bg-purple-500/15 border border-border/80 hover:border-purple-500/40 text-center transition-all group flex flex-col items-center justify-center"
              >
                <span className="text-base sm:text-lg font-black text-foreground font-mono group-hover:text-purple-400">
                  {currentProfile.connections_count}
                </span>
                <span className="text-[11px] font-bold text-muted-foreground flex items-center space-x-1 mt-0.5 group-hover:text-foreground">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400 inline shrink-0" />
                  <span>Connections</span>
                </span>
              </Link>

              <Link
                href="/app/friends?tab=requests"
                className="p-3 rounded-2xl bg-card/70 hover:bg-pink-500/15 border border-border/80 hover:border-pink-500/40 text-center transition-all group flex flex-col items-center justify-center relative"
              >
                <span className="text-base sm:text-lg font-black text-foreground font-mono group-hover:text-pink-400">
                  {effectiveIncomingCount}
                </span>
                <span className="text-[11px] font-bold text-muted-foreground flex items-center space-x-1 mt-0.5 group-hover:text-foreground">
                  <Clock className="w-3.5 h-3.5 text-pink-400 inline shrink-0" />
                  <span>Received</span>
                </span>
                {effectiveIncomingCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                )}
              </Link>

              <Link
                href="/app/friends?tab=sent"
                className="p-3 rounded-2xl bg-card/70 hover:bg-amber-500/15 border border-border/80 hover:border-amber-500/40 text-center transition-all group flex flex-col items-center justify-center"
              >
                <span className="text-base sm:text-lg font-black text-foreground font-mono group-hover:text-amber-400">
                  {outgoingCount}
                </span>
                <span className="text-[11px] font-bold text-muted-foreground flex items-center space-x-1 mt-0.5 group-hover:text-foreground">
                  <UserPlus className="w-3.5 h-3.5 text-amber-400 inline shrink-0" />
                  <span>Sent Requests</span>
                </span>
              </Link>
            </div>
          </div>

          {/* Prominent Leaderboard Link */}
          <Link
            href="/app/leaderboard"
            className="w-full p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/30 flex items-center justify-between group hover:bg-amber-500/20 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40 text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-amber-400 tracking-tight">GLOBAL LEADERBOARD</h3>
                <p className="text-xs text-muted-foreground font-medium">⭐ {displayXp} XP • Check where you rank among all attendees!</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-amber-400/50 group-hover:text-amber-400 transition-colors shrink-0" />
          </Link>
        </div>
      )}

      {/* User Posts Section */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-foreground flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-pink-400" />
          <span>Posts by {isSelf ? "You" : currentProfile.display_name}</span>
        </h3>

        {userPosts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-card border border-border text-muted-foreground text-xs space-y-2">
            <p>No posts published yet.</p>
            {isSelf && (
              <Link
                href="/app/post"
                className="inline-block px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl mt-2 hover:brightness-110 transition-all"
              >
                Create Your First Post (+50 XP)
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {userPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => openPostModal(post)}
                className="relative aspect-square group cursor-pointer overflow-hidden rounded-md sm:rounded-xl bg-secondary/50 border border-border/50"
              >
                {post.image_url ? (
                  isVideoMedia(post.image_url) ? (
                    <div className="relative w-full h-full bg-black">
                      <video
                        src={post.image_url}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                      />
                      <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 text-white shadow pointer-events-none">
                        <Video className="w-3 h-3" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2 bg-gradient-to-br from-purple-900/40 to-pink-900/40">
                    <p className="text-[10px] sm:text-xs text-foreground font-medium text-center line-clamp-4">
                      {post.caption}
                    </p>
                  </div>
                )}
                
                {/* Hover overlay with likes and comments */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs sm:text-sm font-bold">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 fill-white" />
                    <span>{post.likes_count}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 fill-white" />
                    <span>{post.comments_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Friends Section */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-foreground flex items-center space-x-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Friends ({currentProfile.connections_count})</span>
        </h3>

        {friends.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-card border border-border text-muted-foreground text-xs space-y-2">
            <p>No friends added yet.</p>
            {isSelf && (
              <Link
                href="/app/discover"
                className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl mt-2 hover:brightness-110 transition-all"
              >
                Discover New Friends
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/app/profile?id=${friend.id}`}
                className="p-3 rounded-2xl bg-card border border-border flex flex-col items-center text-center space-y-2 hover:bg-secondary/60 hover:border-cyan-500/40 transition-all"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500/30">
                  <img
                    src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                    alt={friend.display_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`;
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground line-clamp-1">{friend.display_name}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">
                    {friend.rotaract_club || friend.college || "Vibe Attendee"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* DPDP ACT 2023: DATA PRINCIPAL RIGHTS & PRIVACY HUB */}
      {isSelf && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950/20 via-card to-pink-950/20 border-2 border-purple-500/30 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>DPDP ACT, 2023 COMPLIANT (INDIA)</span>
              </div>
              <h3 className="text-lg font-black text-foreground">
                Your Privacy & Data Principal Rights
              </h3>
              <p className="text-xs text-muted-foreground">
                Exercise your statutory rights under Sections 11, 12, 13, and 14 of the Digital Personal Data Protection Act, 2023.
              </p>
            </div>

            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-pink-400 hover:text-pink-300 underline flex items-center space-x-1"
            >
              <span>Statutory DPDP Notice</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* 4 Interactive Rights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Right to Access (Section 11) */}
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/80 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-cyan-400">
                  <Download className="w-4 h-4" />
                  <h4 className="font-black text-xs uppercase tracking-wider text-foreground">
                    Section 11: Export Data
                  </h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Download a digital copy of all personal data, game sessions, XP history, and connections held about you.
                </p>
              </div>

              <button
                onClick={handleDownloadPersonalData}
                disabled={isDownloadingData}
                className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-400 font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDownloadingData ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isDownloadingData ? "Exporting Data..." : "Download Personal Data (JSON)"}</span>
              </button>
            </div>

            {/* 2. Right to Nominate (Section 14) */}
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/80 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-amber-400">
                  <UserCheck className="w-4 h-4" />
                  <h4 className="font-black text-xs uppercase tracking-wider text-foreground">
                    Section 14: Data Nominee
                  </h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Designate an individual who shall exercise your data rights in the event of death or incapacity.
                </p>
              </div>

              <button
                onClick={() => setIsNomineeModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Designate Nominee</span>
              </button>
            </div>

            {/* 3. Right of Grievance Redressal (Section 13) */}
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/80 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-purple-400">
                  <Scale className="w-4 h-4" />
                  <h4 className="font-black text-xs uppercase tracking-wider text-foreground">
                    Section 13: File Grievance
                  </h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Submit an inquiry or complaint directly to our Grievance Redressal Officer (48h acknowledgment, 7d resolution).
                </p>
              </div>

              <button
                onClick={() => setIsGrievanceModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-400 font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Submit Grievance</span>
              </button>
            </div>

            {/* 4. Right to Erasure / Deletion (Section 12) */}
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/80 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-rose-400">
                  <Trash2 className="w-4 h-4" />
                  <h4 className="font-black text-xs uppercase tracking-wider text-foreground">
                    Section 12: Erase All Data
                  </h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Permanently delete your profile, accreditation pass, social posts, comments, and game scores from all systems.
                </p>
              </div>

              <button
                onClick={() => setIsErasureModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Erase My Account & Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal Dialog */}
      {isSelf && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={currentProfile}
          onProfileUpdated={(updated) => setCurrentProfile(updated)}
        />
      )}

      {/* DPDP Section 12: Erasure Confirmation Modal */}
      {isErasureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-card border-2 border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="font-black text-sm uppercase">Permanent Data Erasure</h3>
              </div>
              <button
                onClick={() => setIsErasureModalOpen(false)}
                className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              In accordance with Section 12 of the DPDP Act 2023, confirming this request will immediately and permanently erase:
            </p>

            <ul className="text-xs space-y-1 text-foreground/90 list-disc list-inside bg-secondary/40 p-3 rounded-2xl font-mono">
              <li>Your VIBE ID and event entry credentials</li>
              <li>All uploaded posts, images, and captions</li>
              <li>All posted comments and likes</li>
              <li>Your arcade high scores and earned XP</li>
              <li>Your connections and pending requests</li>
            </ul>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setIsErasureModalOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEraseAccountData}
                disabled={isErasing}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isErasing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isErasing ? "Erasing Data..." : "Confirm Deletion"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DPDP Section 14: Nominee Modal */}
      {isNomineeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2 text-amber-400">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm uppercase">Section 14: Designate Nominee</h3>
              </div>
              <button
                onClick={() => setIsNomineeModalOpen(false)}
                className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Under Section 14 of the DPDP Act 2023, you can nominate a person who may exercise your rights in case of death or incapacity.
            </p>

            {nomineeSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-2xl">
                ✓ {nomineeSuccess}
              </div>
            )}

            <form onSubmit={handleNomineeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-muted-foreground block mb-1">Nominee Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Nominee Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya.sharma@example.com"
                  value={nomineeEmail}
                  onChange={(e) => setNomineeEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Nominee Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Parent, Sibling, Legal Heir"
                  value={nomineeRelationship}
                  onChange={(e) => setNomineeRelationship(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNomineeModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-secondary text-foreground font-bold hover:bg-secondary/80 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={nomineeLoading || !nomineeName.trim() || !nomineeEmail.trim()}
                  className="flex-1 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {nomineeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  <span>{nomineeLoading ? "Saving..." : "Save Nominee"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DPDP Section 13: Grievance Modal */}
      {isGrievanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2 text-purple-400">
                <Scale className="w-5 h-5 text-purple-400" />
                <h3 className="font-black text-sm uppercase">Section 13: File DPDP Grievance</h3>
              </div>
              <button
                onClick={() => setIsGrievanceModalOpen(false)}
                className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Submit your inquiry or complaint to the Data Protection Grievance Officer of Rotaract District 3192. Guaranteed acknowledgment in 48 hours.
            </p>

            {grievanceResult && (
              <div className="p-3 bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs rounded-2xl space-y-1">
                <p className="font-black text-white">Tracking ID: {grievanceResult.id}</p>
                <p>{grievanceResult.message}</p>
              </div>
            )}

            <form onSubmit={handleGrievanceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-muted-foreground block mb-1">Grievance Category</label>
                <select
                  value={grievanceCategory}
                  onChange={(e) => setGrievanceCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-purple-400"
                >
                  <option value="Right to Access">Right to Access Personal Data (Sec 11)</option>
                  <option value="Correction / Erasure">Correction or Erasure Request (Sec 12)</option>
                  <option value="Consent Withdrawal">Consent Withdrawal (Sec 6)</option>
                  <option value="Security / Breach Concern">Data Security or Misuse Concern (Sec 8)</option>
                  <option value="Other">Other Data Protection Inquiry</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="Summary of your request or issue"
                  value={grievanceSubject}
                  onChange={(e) => setGrievanceSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide complete context regarding your data protection request..."
                  value={grievanceDesc}
                  onChange={(e) => setGrievanceDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGrievanceModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-secondary text-foreground font-bold hover:bg-secondary/80 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={grievanceLoading || !grievanceSubject.trim() || !grievanceDesc.trim()}
                  className="flex-1 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {grievanceLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5" />}
                  <span>{grievanceLoading ? "Submitting..." : "Submit Grievance"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-lg max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <img
                  src={currentProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentProfile.id}`}
                  alt={currentProfile.display_name}
                  className="w-8 h-8 rounded-full border border-pink-500/30 bg-secondary"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentProfile.id}`;
                  }}
                />
                <span className="font-bold text-sm">{currentProfile.display_name}</span>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {selectedPost.image_url ? (
                isVideoMedia(selectedPost.image_url) ? (
                  <InstagramFeedVideo
                    src={selectedPost.image_url}
                    postId={selectedPost.id}
                    autoPlayOnScroll={false}
                    className="max-h-96"
                  />
                ) : (
                  <img src={selectedPost.image_url} alt="Post image" className="w-full object-cover max-h-96" />
                )
              ) : (
                <div className="w-full h-48 flex items-center justify-center p-4 bg-gradient-to-br from-purple-900/40 to-pink-900/40">
                  <p className="text-foreground text-center italic opacity-70">No media attached</p>
                </div>
              )}
              
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-4 text-sm font-bold text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-5 h-5 text-pink-500 fill-pink-500/20" />
                    <span>{selectedPost.likes_count} likes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                    <span>{selectedPost.comments_count} comments</span>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="font-bold mr-2">{currentProfile.display_name}</span>
                  <span className="text-foreground/90 leading-relaxed">{selectedPost.caption}</span>
                </div>
                
                <div className="text-[10px] text-muted-foreground font-mono">
                  {new Date(selectedPost.created_at).toLocaleString()}
                </div>

                <div className="border-t border-border/50 pt-4 space-y-3">
                  <h4 className="font-bold text-xs text-muted-foreground uppercase">Comments</h4>
                  {loadingComments ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : postComments.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">No comments yet. Be the first to comment on the Discover feed!</p>
                  ) : (
                    <div className="space-y-3">
                      {postComments.map((comment, i) => (
                        <div key={comment.id || i} className="flex gap-2 text-xs">
                          <img
                            src={comment.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorName}`}
                            alt={comment.authorName}
                            className="w-6 h-6 rounded-full shrink-0 border border-border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorName}`;
                            }}
                          />
                          <div>
                            <span className="font-bold mr-1">{comment.authorName}</span>
                            <span className="text-foreground/80 break-words">{comment.comment}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Action Footer indicating where to comment/like */}
            <div className="p-3 bg-secondary/30 border-t border-border text-center text-[10px] text-muted-foreground">
              Like or comment on this post by finding it in the <Link href="/app/discover" className="text-pink-400 hover:underline">Discover Feed</Link>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
