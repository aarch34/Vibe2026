"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, UserCheck, Clock, UserPlus, Instagram, Sparkles, Check, X, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Profile, ConnectionRequest } from "@/types/database";

interface FriendsClientProps {
  currentProfile: Profile;
  incomingRequests: { request: ConnectionRequest; sender?: Profile }[];
  outgoingRequests: { request: ConnectionRequest; receiver?: Profile }[];
  initialFriends: Profile[];
}

export function FriendsClient({
  currentProfile,
  incomingRequests: initialIncoming,
  outgoingRequests: initialOutgoing,
  initialFriends,
}: FriendsClientProps) {
  const [activeTab, setActiveTab] = useState<"requests" | "friends" | "sent">(
    initialIncoming.length > 0 ? "requests" : "friends"
  );
  const [incoming, setIncoming] = useState(initialIncoming);
  const [outgoing, setOutgoing] = useState(initialOutgoing);
  const [friends, setFriends] = useState<Profile[]>(initialFriends);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [acceptedNotice, setAcceptedNotice] = useState<string | null>(null);

  const handleRespond = async (requestId: string, action: "accept" | "decline") => {
    setRespondingId(requestId);
    setAcceptedNotice(null);

    const target = incoming.find((item) => item.request.id === requestId);

    try {
      const res = await fetch("/api/connections/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });

      if (res.ok) {
        setIncoming((prev) => prev.filter((item) => item.request.id !== requestId));

        if (action === "accept" && target?.sender) {
          setFriends((prev) => [target.sender!, ...prev]);
          setAcceptedNotice(`Connected with ${target.sender.display_name}! +25 XP earned 🎉`);
        }
      }
    } catch (err) {
      console.error("Connection respond error:", err);
    } finally {
      setRespondingId(null);
    }
  };

  const filteredFriends = friends.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.display_name?.toLowerCase().includes(q) ||
      f.username?.toLowerCase().includes(q) ||
      f.college?.toLowerCase().includes(q) ||
      f.rotaract_club?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-amber-500/15 border border-purple-500/25 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center space-x-2">
              <Users className="w-7 h-7 text-purple-400" />
              <span>Network & Connections</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage your VIBE 2026 connections, respond to requests, and view your circle.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/app/discover"
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-black text-xs rounded-2xl shadow-lg transition-all flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Discover People</span>
            </Link>
          </div>
        </div>

        {acceptedNotice && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center space-x-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{acceptedNotice}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-border/80 pb-3">
        <button
          onClick={() => setActiveTab("requests")}
          className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 border",
            activeTab === "requests"
              ? "bg-purple-600 text-white border-purple-500 shadow-md"
              : "bg-card text-muted-foreground border-border hover:bg-secondary"
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Connection Requests</span>
          {incoming.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-pink-500 text-white animate-pulse">
              {incoming.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("friends")}
          className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 border",
            activeTab === "friends"
              ? "bg-purple-600 text-white border-purple-500 shadow-md"
              : "bg-card text-muted-foreground border-border hover:bg-secondary"
          )}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>My Connections</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-secondary text-foreground">
            {friends.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("sent")}
          className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 border",
            activeTab === "sent"
              ? "bg-purple-600 text-white border-purple-500 shadow-md"
              : "bg-card text-muted-foreground border-border hover:bg-secondary"
          )}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Sent Requests</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-secondary text-muted-foreground">
            {outgoing.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Connection Requests */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {incoming.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-card border border-border/70 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Users className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-base text-foreground">No Pending Requests</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When someone requests to connect with you, they will appear here with an instant +25 XP reward on accept!
                </p>
              </div>
              <Link
                href="/app/discover"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-secondary hover:bg-secondary/80 font-bold text-xs text-foreground transition-all"
              >
                <UserPlus className="w-4 h-4 text-purple-400" />
                <span>Find People on Discover</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incoming.map(({ request, sender }) => (
                <div
                  key={request.id}
                  className="p-5 rounded-3xl bg-card border border-purple-500/30 shadow-lg space-y-4 flex flex-col justify-between hover:border-purple-400 transition-all"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="relative shrink-0">
                      <img
                        src={sender?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender?.username || request.sender_id}`}
                        alt={sender?.display_name || "Sender"}
                        className="w-14 h-14 rounded-2xl border-2 border-purple-500/40 object-cover"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-purple-600 text-[10px] text-white px-1.5 py-0.5 rounded-full font-black">
                        L{sender?.level_number || 1}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/app/profile?id=${sender?.id || request.sender_id}`}
                          className="font-black text-sm text-foreground hover:text-purple-400 transition-colors truncate block"
                        >
                          {sender?.display_name || "Fellow Attendee"}
                        </Link>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                          +25 XP
                        </span>
                      </div>

                      <p className="text-[11px] font-mono text-muted-foreground truncate">
                        @{sender?.username || "attendee"}
                      </p>

                      <p className="text-[11px] text-muted-foreground truncate">
                        🏫 {sender?.college || "Rotaract District 3192"}
                      </p>

                      {sender?.rotaract_club && (
                        <p className="text-[11px] text-purple-400/90 truncate font-semibold">
                          ⚙️ {sender.rotaract_club}
                        </p>
                      )}

                      {sender?.instagram_username && (
                        <a
                          href={`https://instagram.com/${sender.instagram_username.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-[10px] font-bold text-pink-400 hover:text-pink-300 transition-colors pt-0.5"
                        >
                          <Instagram className="w-3 h-3" />
                          <span>@{sender.instagram_username.replace("@", "")}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                    <button
                      onClick={() => handleRespond(request.id, "accept")}
                      disabled={respondingId === request.id}
                      className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{respondingId === request.id ? "Connecting..." : "ACCEPT (+25 XP)"}</span>
                    </button>

                    <button
                      onClick={() => handleRespond(request.id, "decline")}
                      disabled={respondingId === request.id}
                      className="py-2.5 px-3 rounded-2xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground font-bold text-xs flex items-center justify-center space-x-1 transition-all disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Connected Friends */}
      {activeTab === "friends" && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search your connections by name, college, or club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-2xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500"
            />
          </div>

          {filteredFriends.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-card border border-border/70 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <UserCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-base text-foreground">
                  {searchQuery ? "No matching connections found" : "No Connections Yet"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchQuery
                    ? "Try adjusting your search terms to find your friends."
                    : "Meet attendees, accept requests, and grow your VIBE 2026 circle to earn milestone rewards!"}
                </p>
              </div>
              {!searchQuery && (
                <Link
                  href="/app/discover"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 font-black text-xs text-white transition-all shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Discover People</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-5 rounded-3xl bg-card border border-border hover:border-purple-500/40 shadow-lg space-y-4 flex flex-col justify-between transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <Link href={`/app/profile?id=${friend.id}`} className="relative shrink-0">
                        <img
                          src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username || friend.id}`}
                          alt={friend.display_name}
                          className="w-14 h-14 rounded-2xl border-2 border-border group-hover:border-purple-500/60 object-cover transition-colors"
                        />
                      </Link>

                      <div className="text-right">
                        <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 block font-mono">
                          ⭐ {friend.xp || 0} XP
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground block mt-1">
                          {friend.level_name || "VIBE NEWBIE"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Link
                        href={`/app/profile?id=${friend.id}`}
                        className="font-black text-sm text-foreground hover:text-purple-400 transition-colors block truncate"
                      >
                        {friend.display_name}
                      </Link>
                      <p className="text-[11px] font-mono text-muted-foreground truncate">
                        @{friend.username}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        🏫 {friend.college || "Rotaract District 3192"}
                      </p>
                      {friend.rotaract_club && (
                        <p className="text-[11px] text-purple-400/90 truncate font-semibold">
                          ⚙️ {friend.rotaract_club}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    {friend.instagram_username ? (
                      <a
                        href={`https://instagram.com/${friend.instagram_username.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-400 text-[11px] font-bold flex items-center space-x-1.5 transition-colors truncate"
                      >
                        <Instagram className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">@{friend.instagram_username.replace("@", "")}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-mono">Connected</span>
                    )}

                    <Link
                      href={`/app/profile?id=${friend.id}`}
                      className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-[11px] font-bold transition-colors shrink-0"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Sent Requests */}
      {activeTab === "sent" && (
        <div className="space-y-4">
          {outgoing.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-card border border-border/70 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                <Clock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-base text-foreground">No Pending Outgoing Requests</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When you send connection requests from the Discover page, they will show here while waiting for approval.
                </p>
              </div>
              <Link
                href="/app/discover"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-secondary hover:bg-secondary/80 font-bold text-xs text-foreground transition-all"
              >
                <UserPlus className="w-4 h-4 text-purple-400" />
                <span>Discover People</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outgoing.map(({ request, receiver }) => (
                <div
                  key={request.id}
                  className="p-5 rounded-3xl bg-card border border-border shadow-md space-y-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <img
                      src={receiver?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${receiver?.username || request.receiver_id}`}
                      alt={receiver?.display_name || "Receiver"}
                      className="w-12 h-12 rounded-2xl border border-border object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-black text-sm text-foreground truncate">
                        {receiver?.display_name || "Fellow Attendee"}
                      </h4>
                      <p className="text-[11px] font-mono text-muted-foreground truncate">
                        @{receiver?.username || "attendee"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        🏫 {receiver?.college || "Rotaract District 3192"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shrink-0">
                    <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
                    <span>Pending</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
