"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Profile, Post, Level } from "@/types/database";
import { calculateLevel } from "@/lib/db/mock-store";

interface ProfileViewProps {
  profile: Profile;
  isSelf: boolean;
  userPosts: Post[];
  highScores: Record<string, number>;
}

export function ProfileView({
  profile,
  isSelf,
  userPosts,
  highScores,
}: ProfileViewProps) {
  const levelInfo = calculateLevel(profile.xp);
  const [isDiscoverable, setIsDiscoverable] = useState(profile.is_discoverable);

  const minXp = levelInfo.min_xp;
  const maxXp = levelInfo.max_xp || 3000;
  const currentLevelXp = Math.max(0, profile.xp - minXp);
  const totalLevelRange = Math.max(1, maxXp - minXp);
  const progressPercent = Math.min(100, Math.floor((currentLevelXp / totalLevelRange) * 100));

  const toggleDiscoverable = () => {
    setIsDiscoverable(!isDiscoverable);
    // API update call could be made here
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-pink-500/30 shadow-2xl relative overflow-hidden space-y-6">
        {/* Glow BG */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 relative z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={profile.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
              alt={profile.display_name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-pink-500/40 object-cover shadow-xl"
            />
            <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-background border border-border text-xl">
              {levelInfo.badge}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground">{profile.display_name}</h1>
                <span className="text-xs font-mono text-muted-foreground block">@{profile.username}</span>
              </div>

              {/* Instagram Button */}
              {profile.instagram_username && (
                <a
                  href={`https://instagram.com/${profile.instagram_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white font-extrabold text-xs shadow-md inline-flex items-center justify-center space-x-1.5 transition-all self-center sm:self-auto"
                >
                  <Instagram className="w-4 h-4" />
                  <span>VIEW INSTAGRAM</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Academic & Club Details */}
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p className="font-bold text-foreground">{profile.college} • {profile.course_year}</p>
              <p className="font-semibold text-purple-400">{profile.rotaract_club} {profile.city && `• ${profile.city}`}</p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-xs text-foreground/90 leading-relaxed max-w-xl pt-1">
                "{profile.bio}"
              </p>
            )}

            {/* Interests Tags */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 justify-center sm:justify-start">
                {profile.interests.map((tag) => (
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
            <span className="text-amber-400 font-mono text-sm">⭐ {profile.xp} XP</span>
          </div>

          <div className="w-full h-3 rounded-full bg-background overflow-hidden p-0.5 border border-border/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Optional Privacy Settings for Self */}
        {isSelf && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50 text-xs">
            <span className="font-bold text-muted-foreground flex items-center space-x-1.5">
              {isDiscoverable ? <Globe className="w-4 h-4 text-cyan-400" /> : <Lock className="w-4 h-4 text-pink-400" />}
              <span>Discoverable in People Search</span>
            </span>
            <button
              onClick={toggleDiscoverable}
              className={cn(
                "px-3 py-1 rounded-full font-extrabold text-[11px] transition-all",
                isDiscoverable
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "bg-pink-500/20 text-pink-400 border border-pink-500/40"
              )}
            >
              {isDiscoverable ? "PUBLIC" : "PRIVATE"}
            </button>
          </div>
        )}
      </div>

      {/* Profile Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
          <Users className="w-5 h-5 mx-auto text-cyan-400" />
          <span className="text-xs font-bold text-muted-foreground block">Connections</span>
          <span className="text-xl font-black text-foreground font-mono">{profile.connections_count}</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
          <MessageSquare className="w-5 h-5 mx-auto text-pink-400" />
          <span className="text-xs font-bold text-muted-foreground block">VIBE Posts</span>
          <span className="text-xl font-black text-foreground font-mono">{profile.posts_count}</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
          <Gamepad2 className="w-5 h-5 mx-auto text-purple-400" />
          <span className="text-xs font-bold text-muted-foreground block">Games Played</span>
          <span className="text-xl font-black text-foreground font-mono">{profile.games_played_count}</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-1">
          <Trophy className="w-5 h-5 mx-auto text-amber-400" />
          <span className="text-xs font-bold text-muted-foreground block">Total XP</span>
          <span className="text-xl font-black text-amber-400 font-mono">⭐ {profile.xp}</span>
        </div>
      </div>

      {/* Game High Scores Breakdown */}
      <div className="p-5 rounded-3xl bg-card border border-border space-y-3">
        <h3 className="font-black text-base text-foreground flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Game High Scores</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 rounded-2xl bg-secondary/50 border border-border/60">
            <span className="text-muted-foreground block font-semibold mb-1">Rotaract Game</span>
            <span className="font-mono font-black text-purple-400 text-base">{highScores.rotaract_game || 0}</span>
          </div>

          <div className="p-3 rounded-2xl bg-secondary/50 border border-border/60">
            <span className="text-muted-foreground block font-semibold mb-1">Minion Run</span>
            <span className="font-mono font-black text-yellow-400 text-base">{highScores.minion_game || 0}</span>
          </div>

          <div className="p-3 rounded-2xl bg-secondary/50 border border-border/60">
            <span className="text-muted-foreground block font-semibold mb-1">Memory Match</span>
            <span className="font-mono font-black text-pink-400 text-base">{highScores.memory_game || 0}</span>
          </div>

          <div className="p-3 rounded-2xl bg-secondary/50 border border-border/60">
            <span className="text-muted-foreground block font-semibold mb-1">VIBE Quiz</span>
            <span className="font-mono font-black text-cyan-400 text-base">{highScores.vibe_quiz || 0}</span>
          </div>
        </div>
      </div>

      {/* Optional Details (Skills, Hobbies, Music, Movies) */}
      {(profile.skills?.length || profile.hobbies?.length || profile.favorite_music?.length || profile.favorite_movies?.length) ? (
        <div className="p-5 rounded-3xl bg-card border border-border space-y-3 text-xs">
          <h3 className="font-black text-sm text-foreground">Favorites & Skills</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.skills?.length ? (
              <div className="p-3 rounded-2xl bg-secondary/40 border border-border/40">
                <span className="font-bold text-cyan-400 block mb-1">Skills</span>
                <span className="text-foreground">{profile.skills.join(", ")}</span>
              </div>
            ) : null}

            {profile.hobbies?.length ? (
              <div className="p-3 rounded-2xl bg-secondary/40 border border-border/40">
                <span className="font-bold text-pink-400 block mb-1">Hobbies</span>
                <span className="text-foreground">{profile.hobbies.join(", ")}</span>
              </div>
            ) : null}

            {profile.favorite_music?.length ? (
              <div className="p-3 rounded-2xl bg-secondary/40 border border-border/40">
                <span className="font-bold text-purple-400 block mb-1">Favorite Music</span>
                <span className="text-foreground">{profile.favorite_music.join(", ")}</span>
              </div>
            ) : null}

            {profile.favorite_movies?.length ? (
              <div className="p-3 rounded-2xl bg-secondary/40 border border-border/40">
                <span className="font-bold text-amber-400 block mb-1">Favorite Movies</span>
                <span className="text-foreground">{profile.favorite_movies.join(", ")}</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Posts Published */}
      <div className="space-y-3">
        <h3 className="font-black text-base text-foreground">User Posts ({userPosts.length})</h3>

        {userPosts.length === 0 ? (
          <div className="p-6 rounded-2xl bg-card border border-border text-center text-muted-foreground text-xs">
            No posts published yet!
          </div>
        ) : (
          userPosts.map((post) => (
            <div key={post.id} className="p-4 rounded-2xl bg-card border border-border space-y-2 text-xs">
              <p className="text-foreground font-medium">{post.caption}</p>
              {post.image_url && (
                <img src={post.image_url} alt="Post image" className="w-full max-h-60 object-cover rounded-xl" />
              )}
              <div className="flex items-center justify-between text-muted-foreground pt-1">
                <span>{post.likes_count} Likes • {post.comments_count} Comments</span>
                <span className="font-mono text-[10px]">{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
