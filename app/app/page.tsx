import React from "react";
import Link from "next/link";
import { Sparkles, Gamepad2, Users, ArrowRight, UserPlus, Instagram, Flame, Zap } from "lucide-react";
import { getCurrentUserSession } from "@/lib/auth/session";
import { mockDb, calculateLevel } from "@/lib/db/mock-store";
import { getAllDiscoverableProfiles } from "@/lib/db/profiles";
import { VibeFeed } from "@/components/social/vibe-feed";
import { socialStore } from "@/lib/db/social-store";
import { DashboardWelcome } from "@/components/attendee/dashboard-welcome";

export const dynamic = "force-dynamic";

export default async function AttendeeHomePage() {
  const session = await getCurrentUserSession();
  const currentProfile = mockDb.getProfile(session.profile.id) || session.profile;
  const levelInfo = calculateLevel(currentProfile.xp);

  // Level progress math
  const minXp = levelInfo.min_xp;
  const maxXp = levelInfo.max_xp || 3000;
  const currentLevelXp = Math.max(0, currentProfile.xp - minXp);
  const totalLevelRange = Math.max(1, maxXp - minXp);
  const progressPercent = Math.min(100, Math.floor((currentLevelXp / totalLevelRange) * 100));

  const posts = await socialStore.getPostsWithAuthors();
  const likedPostIds = await socialStore.getUserLikedPostIds(currentProfile.id);
  const suggestedPeople = (await getAllDiscoverableProfiles(currentProfile.id, 8)).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome & Level Progress Header */}
      <DashboardWelcome 
        initialDisplayName={currentProfile.display_name} 
        initialConnectionsCount={currentProfile.connections_count}
        initialXp={currentProfile.xp}
      />

      {/* Suggested Connections Carousel / Preview */}
      {suggestedPeople.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="font-black text-sm text-foreground">Suggested People to Meet</h3>
            </div>
            <Link
              href="/app/discover"
              className="text-xs font-bold text-pink-400 hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {suggestedPeople.map((person) => (
              <div
                key={person.id}
                className="p-3 rounded-2xl bg-card border border-border/80 text-center space-y-2 hover:border-pink-500/40 transition-all"
              >
                <Link href={`/app/profile?id=${person.id}`}>
                  <img
                    src={person.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
                    alt={person.display_name}
                    width={48}
                    height={48}
                    style={{ width: "48px", height: "48px", maxWidth: "48px", maxHeight: "48px" }}
                    className="w-12 h-12 rounded-full mx-auto border border-purple-500/30 object-cover hover:scale-105 transition-transform shrink-0"
                  />
                </Link>
                <div>
                  <h4 className="font-extrabold text-xs text-foreground truncate">{person.display_name}</h4>
                  <p className="text-[10px] text-muted-foreground truncate">{person.college}</p>
                </div>
                <div className="flex items-center justify-center space-x-1 text-[10px] font-bold text-amber-400 font-mono">
                  <span>⭐</span>
                  <span>{person.xp} XP</span>
                </div>
                <Link
                  href={`/app/profile?id=${person.id}`}
                  className="w-full py-1.5 rounded-xl bg-secondary/80 hover:bg-pink-500 hover:text-white text-foreground text-[11px] font-bold transition-all block text-center"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real VIBE XP Activities Guide */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 border border-purple-500/20 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            <h3 className="font-black text-sm text-foreground">EARN XP & LEVEL UP</h3>
          </div>
          <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
            Real Engagement Only
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 rounded-2xl bg-secondary/50 border border-border/60 text-center space-y-1">
            <span className="text-xl">📸</span>
            <div className="text-[11px] font-bold text-foreground">Post & Likes</div>
            <div className="text-[10px] font-mono text-pink-400 font-extrabold">+20 XP post / +5 XP like</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-secondary/50 border border-border/60 text-center space-y-1">
            <span className="text-xl">💬</span>
            <div className="text-[11px] font-bold text-foreground">Comments</div>
            <div className="text-[10px] font-mono text-cyan-400 font-extrabold">+10 XP comment</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-secondary/50 border border-border/60 text-center space-y-1">
            <span className="text-xl">🎮</span>
            <div className="text-[11px] font-bold text-foreground">Play ROCO & Quiz</div>
            <div className="text-[10px] font-mono text-amber-400 font-extrabold">Up to +125 XP</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-secondary/50 border border-border/60 text-center space-y-1">
            <span className="text-xl">🤝</span>
            <div className="text-[11px] font-bold text-foreground">Connect & Follow</div>
            <div className="text-[10px] font-mono text-emerald-400 font-extrabold">+25 XP / +15 XP Instagram</div>
          </div>
        </div>
      </div>

      {/* Games Quick Launcher */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-sm text-foreground">Casual Games Arena</h3>
            <p className="text-xs text-muted-foreground">Play ROCO Flappie & the Rotaract Quiz to earn XP!</p>
          </div>
        </div>
        <Link
          href="/app/games"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shrink-0"
        >
          PLAY GAMES
        </Link>
      </div>

      {/* VIBE Social Feed */}
      <div className="space-y-3">
        <h3 className="font-black text-base text-foreground flex items-center space-x-2">
          <Flame className="w-5 h-5 text-pink-500" />
          <span>VIBE 2026 Feed</span>
        </h3>
        <VibeFeed initialPosts={posts} initialLikedPostIds={likedPostIds} currentProfile={currentProfile} />
      </div>
    </div>
  );
}
