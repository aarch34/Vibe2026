"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Filter, Users, UserPlus, CheckCircle, Clock, Instagram, Sparkles, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Profile, ConnectionRequest } from "@/types/database";

interface DiscoverClientProps {
  currentProfile: Profile;
  initialProfiles: Profile[];
  incomingRequests: { request: ConnectionRequest; sender?: Profile }[];
}

const INTEREST_FILTERS = ["all", "Music", "Dance", "Gaming", "Photography", "Coding", "Fashion", "Sports", "Art"];

export function DiscoverClient({
  currentProfile,
  initialProfiles,
  incomingRequests: initialIncoming,
}: DiscoverClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInterest, setSelectedInterest] = useState("all");
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [incoming, setIncoming] = useState(initialIncoming);
  const [connectionStates, setConnectionStates] = useState<Record<string, "none" | "pending" | "connected">>({});

  const filteredProfiles = profiles.filter((p) => {
    if (p.id === currentProfile.id) return false;

    const matchesSearch =
      !searchQuery.trim() ||
      p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.rotaract_club.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesInterest =
      selectedInterest === "all" || p.interests.includes(selectedInterest);

    return matchesSearch && matchesInterest;
  });

  const handleSendRequest = async (receiverId: string) => {
    setConnectionStates((prev) => ({ ...prev, [receiverId]: "pending" }));

    try {
      await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });
    } catch {
      // Fallback local update
    }
  };

  const handleRespondRequest = async (requestId: string, action: "accept" | "decline") => {
    const target = incoming.find((item) => item.request.id === requestId);
    setIncoming((prev) => prev.filter((item) => item.request.id !== requestId));

    if (action === "accept" && target?.sender) {
      setConnectionStates((prev) => ({ ...prev, [target.sender!.id]: "connected" }));
    }

    try {
      await fetch("/api/connections/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center space-x-2">
              <Users className="w-6 h-6 text-cyan-400" />
              <span>Discover People</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              People You May Want To Meet at VIBE 2026. Send connection requests & earn milestone XP!
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 bg-card px-3 py-1.5 rounded-full border border-border">
            <span>Your Connections:</span>
            <span className="font-mono text-foreground font-black text-sm">{currentProfile.connections_count}</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-muted-foreground absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by name, college, or Rotaract club..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-card border border-border/80 rounded-2xl text-sm focus:outline-none focus:border-cyan-400 transition-all text-foreground shadow-sm"
          />
        </div>

        {/* Interest Filter Tags */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-bold text-muted-foreground flex items-center space-x-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          {INTEREST_FILTERS.map((interest) => (
            <button
              key={interest}
              onClick={() => setSelectedInterest(interest)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-extrabold capitalize transition-all shrink-0 border",
                selectedInterest === interest
                  ? "bg-cyan-500 text-black border-cyan-400 shadow-md"
                  : "bg-card text-muted-foreground border-border/60 hover:bg-secondary"
              )}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* Connection Requests Pending */}
      {incoming.length > 0 && (
        <div className="p-5 rounded-3xl bg-card border border-pink-500/30 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-foreground flex items-center space-x-2">
              <UserPlus className="w-4 h-4 text-pink-400" />
              <span>Pending Connection Requests ({incoming.length})</span>
            </h3>
            <span className="text-[11px] font-bold text-pink-400">+25 XP on 1st Accepted Connection!</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {incoming.map(({ request, sender }) => {
              if (!sender) return null;

              return (
                <div
                  key={request.id}
                  className="p-3.5 rounded-2xl bg-secondary/50 border border-border/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={sender.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=sender"}
                      alt={sender.display_name}
                      width={40}
                      height={40}
                      style={{ width: "40px", height: "40px", maxWidth: "40px", maxHeight: "40px" }}
                      className="w-10 h-10 rounded-full border border-pink-500/40 object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-foreground truncate">{sender.display_name}</h4>
                      <p className="text-[10px] text-muted-foreground truncate">{sender.college}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleRespondRequest(request.id, "accept")}
                      className="px-3 py-1 rounded-xl bg-pink-500 text-white font-bold text-xs hover:bg-pink-600 transition-all shadow-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespondRequest(request.id, "decline")}
                      className="px-3 py-1 rounded-xl bg-secondary text-muted-foreground font-bold text-xs hover:bg-secondary/80 transition-all"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profile Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfiles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground space-y-2">
            <Users className="w-10 h-10 mx-auto opacity-30 text-cyan-400" />
            <p className="font-bold text-sm">No profiles found matching your search!</p>
            <p className="text-xs">Try clearing filters or searching for another college or club.</p>
          </div>
        ) : (
          filteredProfiles.map((person) => {
            const state = connectionStates[person.id] || "none";

            return (
              <div
                key={person.id}
                className="p-5 rounded-3xl bg-card border border-border/80 shadow-md space-y-4 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
              >
                {/* Profile Card Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Link href={`/app/profile?id=${person.id}`}>
                        <img
                          src={person.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
                          alt={person.display_name}
                          width={56}
                          height={56}
                          style={{ width: "56px", height: "56px", maxWidth: "56px", maxHeight: "56px" }}
                          className="w-14 h-14 rounded-full border-2 border-cyan-400/40 object-cover hover:scale-105 transition-transform shrink-0"
                        />
                      </Link>
                      <div>
                        <Link
                          href={`/app/profile?id=${person.id}`}
                          className="font-black text-base text-foreground hover:text-cyan-400 transition-colors block"
                        >
                          {person.display_name}
                        </Link>
                        <span className="text-xs font-mono text-muted-foreground block">@{person.username}</span>
                        <div className="flex items-center space-x-1 text-[11px] font-bold text-amber-400 font-mono mt-0.5">
                          <span>⭐</span>
                          <span>{person.xp} XP</span>
                          <span className="text-muted-foreground font-normal">• {person.level_name}</span>
                        </div>
                      </div>
                    </div>

                    {person.instagram_username && (
                      <a
                        href={`https://instagram.com/${person.instagram_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[10px] font-extrabold flex items-center space-x-1 transition-all"
                        title="VIEW INSTAGRAM"
                      >
                        <Instagram className="w-3 h-3" />
                        <span>INSTAGRAM</span>
                      </a>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1 bg-secondary/40 p-3 rounded-2xl border border-border/40 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold">College:</span>
                      <span className="font-bold text-foreground truncate max-w-[150px]">{person.college}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold">Club:</span>
                      <span className="font-bold text-foreground truncate max-w-[150px]">{person.rotaract_club}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/30">
                      <span className="font-semibold">Connections:</span>
                      <span className="font-mono font-bold text-cyan-400">{person.connections_count}</span>
                    </div>
                  </div>

                  {/* Interests */}
                  {person.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {person.interests.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-bold text-muted-foreground border border-border/40"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2">
                  {state === "connected" ? (
                    <button
                      disabled
                      className="w-full py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Connected</span>
                    </button>
                  ) : state === "pending" ? (
                    <button
                      disabled
                      className="w-full py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-1"
                    >
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Request Sent</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(person.id)}
                      className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-black font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>CONNECT</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
