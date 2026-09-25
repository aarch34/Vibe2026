"use client";

import React, { useState, useEffect } from "react";
import { LayoutDashboard, Users, MessageSquare } from "lucide-react";
import { Profile } from "@/types/database";

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [postsCount, setPostsCount] = useState(0);

  useEffect(() => {
    fetchAdminData();
    fetchPosts();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setUsersList(data.users || []);
      }
    } catch {}
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/admin/posts");
      if (res.ok) {
        const data = await res.json();
        setPostsCount(data.posts?.length || 0);
      }
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/40 via-card to-pink-900/40 border border-purple-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-black text-foreground">DASHBOARD OVERVIEW</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Platform metrics and top-level summary.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-card border border-border text-center space-y-1 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground block flex items-center justify-center space-x-1">
            <Users className="w-3.5 h-3.5" />
            <span>Total Users</span>
          </span>
          <span className="text-3xl font-black text-foreground font-mono">
            {stats?.users?.totalUsers || usersList.length}
          </span>
        </div>
        
        <div className="p-5 rounded-3xl bg-card border border-border text-center space-y-1 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground block flex items-center justify-center space-x-1">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-400">Active Users</span>
          </span>
          <span className="text-3xl font-black text-cyan-400 font-mono">
            {stats?.users?.activeUsers || usersList.length}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-card border border-border text-center space-y-1 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground block flex items-center justify-center space-x-1">
            <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-pink-400">Total Posts</span>
          </span>
          <span className="text-3xl font-black text-pink-400 font-mono">
            {postsCount}
          </span>
        </div>
      </div>
    </div>
  );
}
