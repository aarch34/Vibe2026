"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Instagram,
  UserPlus,
  Heart,
  Loader2,
  Award,
} from "lucide-react";
import { followAndAddFriendAction } from "@/actions/social/friends";
import { FriendItem, AttendeeSearchResult } from "@/types/social";
import confetti from "canvas-confetti";

interface FriendsClientProps {
  initialFriends: FriendItem[];
  allAttendees: AttendeeSearchResult[];
  totalXpEarned: number;
}

export function FriendsClient({
  initialFriends,
  allAttendees,
  totalXpEarned: initialTotalXp,
}: FriendsClientProps) {
  const [friends, setFriends] = useState<FriendItem[]>(initialFriends);
  const [attendees, setAttendees] = useState<AttendeeSearchResult[]>(allAttendees);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"discover" | "my-friends">("discover");
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [totalXp, setTotalXp] = useState(initialTotalXp);

  const filteredAttendees = attendees.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.displayName.toLowerCase().includes(q) ||
      a.vibeId.toLowerCase().includes(q) ||
      (a.college && a.college.toLowerCase().includes(q)) ||
      a.instagramHandle.toLowerCase().includes(q)
    );
  });

  const filteredFriends = friends.filter((f) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      f.displayName.toLowerCase().includes(q) ||
      f.vibeId.toLowerCase().includes(q) ||
      (f.college && f.college.toLowerCase().includes(q)) ||
      (f.instagramHandle && f.instagramHandle.toLowerCase().includes(q))
    );
  });

  async function handleConnect(attendee: AttendeeSearchResult) {
    if (attendee.isFriend || connectingId) return;

    setConnectingId(attendee.id);
    setNotification(null);

    // 1. Open Instagram in new window/tab
    const cleanHandle = attendee.instagramHandle.replace("@", "");
    window.open(`https://instagram.com/${cleanHandle}`, "_blank", "noopener,noreferrer");

    try {
      // 2. Award +25 XP and record friendship
      const res = await followAndAddFriendAction(attendee.id);

      if (res.success) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setNotification(res.message || "Friend added! +25 XP awarded!");

        // Update local state
        setAttendees((prev) =>
          prev.map((a) => (a.id === attendee.id ? { ...a, isFriend: true } : a))
        );

        const newFriendItem: FriendItem = {
          profileId: attendee.id,
          displayName: attendee.displayName,
          vibeId: attendee.vibeId,
          college: attendee.college,
          instagramHandle: attendee.instagramHandle,
          connectedAt: new Date().toISOString(),
        };

        setFriends((prev) => [newFriendItem, ...prev]);
        setTotalXp((prev) => prev + 25);
      } else {
        setNotification(res.message || "Failed to connect");
      }
    } catch (err: any) {
      setNotification(err.message || "Something went wrong");
    } finally {
      setConnectingId(null);
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/50 via-slate-900 to-pink-950/40 border border-purple-500/30 text-center space-y-3 relative overflow-hidden">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold">
          <Instagram className="w-3.5 h-3.5 text-pink-400" />
          <span>ROCCO Fresher Networking</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Find Friends & Connect
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          Follow your fellow Rotaractors on Instagram, become in-app friends, and earn{" "}
          <strong className="text-purple-300 font-bold">+25 XP</strong> for every friend you make!
        </p>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto pt-2">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block font-mono">My Friends</span>
            <span className="text-xl font-black text-white font-mono">{friends.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block font-mono">Friendship XP</span>
            <span className="text-xl font-black text-purple-300 font-mono">+{totalXp} XP</span>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Bar & Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, VIBE ID, college or Instagram..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab("discover")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
              activeTab === "discover"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-purple-400" />
            <span>Discover ({filteredAttendees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("my-friends")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
              activeTab === "my-friends"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-pink-400" />
            <span>My Friends ({friends.length})</span>
          </button>
        </div>
      </div>

      {/* Discover List */}
      {activeTab === "discover" && (
        <div className="space-y-3">
          {filteredAttendees.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs space-y-1">
              <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold">No freshers found matching your search</p>
              <p className="text-[11px] text-slate-500">Try searching for another name or VIBE ID.</p>
            </div>
          ) : (
            filteredAttendees.map((attendee) => {
              const isBusy = connectingId === attendee.id;
              return (
                <div
                  key={attendee.id}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                      {attendee.displayName.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white truncate">
                          {attendee.displayName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 shrink-0">
                          {attendee.vibeId}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 mt-0.5">
                        <a
                          href={`https://instagram.com/${attendee.instagramHandle.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-[11px] text-pink-400 hover:text-pink-300 transition-colors"
                        >
                          <Instagram className="w-3 h-3" />
                          <span>@{attendee.instagramHandle.replace("@", "")}</span>
                        </a>

                        {attendee.college && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            • {attendee.college}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {attendee.isFriend ? (
                    <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Friends</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(attendee)}
                      disabled={isBusy}
                      className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-95 transition-all text-white text-xs font-bold shrink-0 shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
                    >
                      {isBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Instagram className="w-3.5 h-3.5" />
                      )}
                      <span>Follow & Connect (+25 XP)</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* My Friends List */}
      {activeTab === "my-friends" && (
        <div className="space-y-3">
          {filteredFriends.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs space-y-1">
              <Heart className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold">No friends connected yet</p>
              <p className="text-[11px] text-slate-500">
                Switch to the "Discover" tab to follow fellow attendees and earn +25 XP each!
              </p>
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <div
                key={friend.profileId}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                    {friend.displayName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white truncate">
                        {friend.displayName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 shrink-0">
                        {friend.vibeId}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 mt-0.5">
                      <a
                        href={`https://instagram.com/${(friend.instagramHandle || friend.displayName.toLowerCase().replace(/\s+/g, "_")).replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-[11px] text-pink-400 hover:text-pink-300 transition-colors"
                      >
                        <Instagram className="w-3 h-3" />
                        <span>@{friend.instagramHandle || friend.displayName.toLowerCase().replace(/\s+/g, "_")}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-300 text-[11px] font-bold">
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>+25 XP</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
