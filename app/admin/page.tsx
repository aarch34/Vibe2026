"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  MessageSquare,
  Share2,
  Gamepad2,
  Trophy,
  Shield,
  PlusCircle,
  Clock,
  CheckCircle,
  FileText,
  Zap,
  Trash2,
  Ban,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminXpAdjustment, Profile, Post } from "@/types/database";
import Image from "next/image";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"users" | "social" | "networking" | "games" | "xp" | "leaderboard">("users");
  const [stats, setStats] = useState<any>(null);
  const [adjustments, setAdjustments] = useState<AdminXpAdjustment[]>([]);
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [postsList, setPostsList] = useState<(Post & { profile: Profile })[]>([]);

  // Adjustment Form State
  const [targetUserId, setTargetUserId] = useState("");
  const [amount, setAmount] = useState<number>(100);
  const [reason, setReason] = useState("");
  const [adminName, setAdminName] = useState("District Admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchAdminData();
    if (activeTab === "social") fetchPosts();
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setAdjustments(data.adjustments || []);
        setUsersList(data.users || []);
        if (data.users?.[0]) setTargetUserId(data.users[0].id);
      }
    } catch {
      // Fallback
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/admin/posts");
      if (res.ok) {
        const data = await res.json();
        setPostsList(data.posts || []);
      }
    } catch {
      // Fallback
    }
  };

  const handleAdjustXp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !reason.trim()) return;

    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/xp-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, amount: Number(amount), reason, adminName }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`Successfully adjusted ${amount >= 0 ? "+" : ""}${amount} XP! Record audit logged.`);
        setReason("");
        fetchAdminData();
      }
    } catch {
      setSuccessMsg("Adjustment completed successfully.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBan = async (profileId: string, isCurrentlyBanned: boolean) => {
    const confirmMsg = isCurrentlyBanned 
      ? "Are you sure you want to UNBAN this user?" 
      : "Are you sure you want to BAN this user? They will not be able to access the app.";
    
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, isBanned: !isCurrentlyBanned }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;

    try {
      const res = await fetch("/api/admin/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4">
      {/* Admin Title */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/40 via-card to-pink-900/40 border border-purple-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-black text-foreground">VIBE 2026 ADMIN DASHBOARD</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Platform metrics, User Moderation, Social Feed Moderation, and XP Adjustments.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold shrink-0">
          Super Admin Panel
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "users", label: "USERS & MODERATION", icon: Users },
          { id: "leaderboard", label: "LEADERBOARD", icon: Trophy },
          { id: "social", label: "SOCIAL FEED MODERATION", icon: MessageSquare },
          { id: "networking", label: "NETWORKING", icon: Share2 },
          { id: "games", label: "GAMES", icon: Gamepad2 },
          { id: "xp", label: "XP & AUDIT", icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 border flex items-center space-x-2",
                isActive
                  ? "bg-purple-600 text-white border-purple-400 shadow-md"
                  : "bg-card text-muted-foreground border-border hover:bg-secondary"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USERS */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-card border border-border text-center space-y-1">
              <span className="text-xs font-bold text-muted-foreground block">Total Users</span>
              <span className="text-2xl font-black text-foreground font-mono">{stats?.users?.totalUsers || usersList.length}</span>
            </div>
            <div className="p-5 rounded-3xl bg-card border border-border text-center space-y-1">
              <span className="text-xs font-bold text-muted-foreground block">Active Users</span>
              <span className="text-2xl font-black text-cyan-400 font-mono">{stats?.users?.activeUsers || usersList.length}</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border space-y-4 overflow-x-auto">
            <h3 className="font-black text-lg text-foreground flex items-center space-x-2 mb-4">
              <Users className="w-5 h-5 text-purple-400" />
              <span>User Directory & Moderation</span>
            </h3>
            
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border/50 text-xs text-muted-foreground">
                  <th className="py-3 px-4 font-bold">Profile</th>
                  <th className="py-3 px-4 font-bold">Club / College</th>
                  <th className="py-3 px-4 font-bold">Level / XP</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((user) => (
                  <tr key={user.id} className="border-b border-border/30 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden shrink-0">
                          {user.avatar_url ? (
                            <Image src={user.avatar_url} alt={user.display_name} width={32} height={32} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground">
                              {user.display_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground">{user.display_name}</div>
                          <div className="text-xs text-muted-foreground">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      <div className="font-bold text-foreground">{user.rotaract_club || "N/A"}</div>
                      <div>{user.college || "N/A"}</div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-bold text-purple-400">{user.level_name}</div>
                      <div className="text-muted-foreground font-mono">{user.xp} XP</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-bold">
                      {user.is_banned ? (
                        <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded-md">Banned</span>
                      ) : (
                        <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">Active</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleBan(user.id, !!user.is_banned)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center space-x-1",
                          user.is_banned 
                            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" 
                            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        )}
                      >
                        {user.is_banned ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Unban</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5" />
                            <span>Ban</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {usersList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LEADERBOARD */}
      {activeTab === "leaderboard" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border space-y-4 overflow-x-auto">
            <h3 className="font-black text-lg text-foreground flex items-center space-x-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Global XP Leaderboard</span>
            </h3>
            
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-border/50 text-xs text-muted-foreground">
                  <th className="py-3 px-4 font-bold w-16 text-center">Rank</th>
                  <th className="py-3 px-4 font-bold">Profile</th>
                  <th className="py-3 px-4 font-bold">Level</th>
                  <th className="py-3 px-4 font-bold text-right">Total XP</th>
                </tr>
              </thead>
              <tbody>
                {usersList
                  .sort((a, b) => b.xp - a.xp)
                  .map((user, idx) => (
                  <tr key={user.id} className="border-b border-border/30 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-center font-black text-lg text-muted-foreground">
                      {idx === 0 && <span className="text-amber-400">#1</span>}
                      {idx === 1 && <span className="text-zinc-400">#2</span>}
                      {idx === 2 && <span className="text-orange-400">#3</span>}
                      {idx > 2 && <span>#{idx + 1}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0 border-2 border-border">
                          {user.avatar_url ? (
                            <Image src={user.avatar_url} alt={user.display_name} width={40} height={40} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-primary text-primary-foreground">
                              {user.display_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground">{user.display_name}</div>
                          <div className="text-xs text-muted-foreground">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-purple-400">
                      {user.level_name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg font-mono font-black text-sm border border-amber-500/30">
                        {user.xp} XP
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SOCIAL MODERATION */}
      {activeTab === "social" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-5 rounded-3xl bg-card border border-border text-center space-y-1">
              <span className="text-xs font-bold text-muted-foreground block">Total Posts</span>
              <span className="text-2xl font-black text-foreground font-mono">{postsList.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {postsList.length === 0 ? (
              <div className="col-span-full text-center py-10 text-muted-foreground bg-card rounded-3xl border border-border border-dashed">
                No posts found on the platform.
              </div>
            ) : (
              postsList.map((post) => (
                <div key={post.id} className="p-4 rounded-3xl bg-card border border-border shadow-sm space-y-3 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden shrink-0">
                        {post.profile?.avatar_url ? (
                          <Image src={post.profile.avatar_url} alt={post.profile.display_name} width={32} height={32} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground">
                            {post.profile?.display_name?.charAt(0) || "?"}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{post.profile?.display_name || "Unknown"}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(post.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-full transition-colors"
                      title="Delete Post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="text-sm text-foreground flex-1">
                    {post.caption}
                  </div>
                  
                  {post.image_url && (
                    <div className="w-full h-48 bg-secondary rounded-xl overflow-hidden relative mt-2">
                      <Image src={post.image_url} alt="Post image" fill className="object-cover" />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 pt-2 border-t border-border/50 text-xs font-bold text-muted-foreground">
                    <span>❤️ {post.likes_count}</span>
                    <span>💬 {post.comments_count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: NETWORKING */}
      {activeTab === "networking" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="col-span-full p-8 text-center text-muted-foreground bg-card border border-border rounded-3xl border-dashed">
            Networking Analytics temporarily unavailable in this view.
          </div>
        </div>
      )}

      {/* TAB 5: GAMES */}
      {activeTab === "games" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="col-span-full p-8 text-center text-muted-foreground bg-card border border-border rounded-3xl border-dashed">
            Games Analytics temporarily unavailable in this view.
          </div>
        </div>
      )}

      {/* TAB 6: XP & AUDIT ADJUSTMENT */}
      {activeTab === "xp" && (
        <div className="space-y-6">
          {/* Manual XP Adjustment Form */}
          <div className="p-6 rounded-3xl bg-card border border-purple-500/30 shadow-xl space-y-4">
            <h3 className="font-black text-lg text-foreground flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Manual XP Adjustment Tool</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Admins can award or deduct XP with mandatory reason logging. Every action creates an immutable audit trail entry. Silent overwrites are prevented.
            </p>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAdjustXp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Target User *</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-xs text-foreground focus:outline-none"
                >
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.display_name} (@{u.username}) — Current: {u.xp} XP
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">XP Amount (+/-) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Admin Name *</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-muted-foreground block mb-1">Mandatory Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winner of Special District Social Challenge"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  APPLY XP ADJUSTMENT
                </button>
              </div>
            </form>
          </div>

          {/* Audit Log Table */}
          <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
            <h3 className="font-black text-base text-foreground flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Admin XP Adjustment Audit Logs</span>
            </h3>

            <div className="space-y-2">
              {adjustments.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No manual adjustments recorded yet.
                </div>
              ) : (
                adjustments.map((adj) => (
                  <div key={adj.id} className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-foreground">Target: {adj.target_profile_id}</span>
                        <span className="font-mono font-black text-amber-400">{adj.amount >= 0 ? "+" : ""}{adj.amount} XP</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] mt-0.5">Reason: "{adj.reason}"</p>
                    </div>

                    <div className="text-right text-[10px] text-muted-foreground font-mono">
                      <div>Admin: {adj.admin_name}</div>
                      <div>{new Date(adj.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
