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
      <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo text-center space-y-3 relative">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-black">
          <Instagram className="w-3.5 h-3.5 text-primary" />
          <span>ROCCO Fresher Networking</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight font-mono">
          Find Friends & Connect
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed font-bold">
          Follow your fellow Rotaractors on Instagram, become in-app friends, and earn{" "}
          <strong className="text-primary font-black">+25 XP</strong> for every friend you make!
        </p>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto pt-2">
          <div className="p-3 bg-muted border-2 border-border shadow-[2px_2px_0px_var(--border)] text-center">
            <span className="text-[10px] text-muted-foreground block font-mono font-bold">My Friends</span>
            <span className="text-xl font-black text-foreground font-mono">{friends.length}</span>
          </div>
          <div className="p-3 bg-muted border-2 border-border shadow-[2px_2px_0px_var(--border)] text-center">
            <span className="text-[10px] text-muted-foreground block font-mono font-bold">Friendship XP</span>
            <span className="text-xl font-black text-primary font-mono">+{totalXp} XP</span>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 bg-secondary text-secondary-foreground border-2 border-border shadow-neo text-xs font-black flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-secondary-foreground hover:opacity-75 text-xs px-1 font-black cursor-pointer"
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
            className="w-full pl-10 pr-4 py-2.5 bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors font-bold"
          />
        </div>

        <div className="flex bg-card p-1.5 border-2 border-border shadow-[3px_3px_0px_var(--border)]">
          <button
            onClick={() => setActiveTab("discover")}
            className={`flex-1 py-2 text-xs font-black transition-colors flex items-center justify-center space-x-1.5 border-2 ${
              activeTab === "discover"
                ? "bg-primary text-primary-foreground border-border shadow-[2px_2px_0px_var(--border)]"
                : "text-muted-foreground hover:text-foreground border-transparent hover:border-border"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Discover ({filteredAttendees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("my-friends")}
            className={`flex-1 py-2 text-xs font-black transition-colors flex items-center justify-center space-x-1.5 border-2 ${
              activeTab === "my-friends"
                ? "bg-secondary text-secondary-foreground border-border shadow-[2px_2px_0px_var(--border)]"
                : "text-muted-foreground hover:text-foreground border-transparent hover:border-border"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>My Friends ({friends.length})</span>
          </button>
        </div>
      </div>

      {/* Discover List */}
      {activeTab === "discover" && (
        <div className="space-y-3">
          {filteredAttendees.length === 0 ? (
            <div className="p-8 text-center bg-card text-card-foreground border-2 border-border shadow-neo text-xs space-y-1">
              <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-bold">No freshers found matching your search</p>
              <p className="text-[11px] text-muted-foreground">Try searching for another name or VIBE ID.</p>
            </div>
          ) : (
            filteredAttendees.map((attendee) => {
              const isBusy = connectingId === attendee.id;
              return (
                <div
                  key={attendee.id}
                  className="p-3.5 bg-card text-card-foreground border-2 border-border shadow-neo flex items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-11 h-11 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center font-black text-xs shrink-0">
                      {attendee.displayName.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm text-foreground truncate">
                          {attendee.displayName}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-muted text-foreground border border-border shrink-0">
                          {attendee.vibeId}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 mt-0.5">
                        <a
                          href={`https://instagram.com/${attendee.instagramHandle.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-[11px] text-primary hover:underline font-bold transition-colors"
                        >
                          <Instagram className="w-3 h-3" />
                          <span>@{attendee.instagramHandle.replace("@", "")}</span>
                        </a>

                        {attendee.college && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[120px] font-bold">
                            • {attendee.college}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {attendee.isFriend ? (
                    <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] text-xs font-black shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Friends</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(attendee)}
                      disabled={isBusy}
                      className="neo-btn-primary px-3.5 py-2 text-xs font-black shrink-0 disabled:opacity-50 cursor-pointer space-x-1.5"
                    >
                      {isBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Instagram className="w-3.5 h-3.5" />
                      )}
                      <span>Connect (+25 XP)</span>
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
            <div className="p-8 text-center bg-card text-card-foreground border-2 border-border shadow-neo text-xs space-y-1">
              <Heart className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="font-black text-foreground font-mono">No friends connected yet</p>
              <p className="text-[11px] text-muted-foreground font-bold">
                Switch to the "Discover" tab to follow fellow attendees and earn +25 XP each!
              </p>
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <div
                key={friend.profileId}
                className="p-3.5 bg-card text-card-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-11 h-11 bg-primary text-primary-foreground border-2 border-border shadow-[1px_1px_0px_var(--border)] flex items-center justify-center font-black text-xs shrink-0 font-mono">
                    {friend.displayName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm text-foreground truncate font-mono">
                        {friend.displayName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-muted text-foreground border border-border shrink-0 font-bold">
                        {friend.vibeId}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 mt-0.5">
                      <a
                        href={`https://instagram.com/${(friend.instagramHandle || friend.displayName.toLowerCase().replace(/\s+/g, "_")).replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-[11px] text-primary hover:underline font-bold transition-colors"
                      >
                        <Instagram className="w-3 h-3" />
                        <span>@{friend.instagramHandle || friend.displayName.toLowerCase().replace(/\s+/g, "_")}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-secondary text-secondary-foreground border-2 border-border shadow-[1px_1px_0px_var(--border)] text-[11px] font-black font-mono">
                    <Award className="w-3 h-3 text-secondary-foreground" />
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
