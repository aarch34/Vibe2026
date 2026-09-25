"use client";

import React, { useState, useEffect } from "react";
import { Users, UserCheck, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Profile } from "@/types/database";
import Image from "next/image";

export default function AdminAttendeesPage() {
  const [usersList, setUsersList] = useState<Profile[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch {}
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/40 via-card to-pink-900/40 border border-purple-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-black text-foreground">ATTENDEES & MODERATION</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage users, view profiles, and enforce bans.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-card border border-border space-y-4 overflow-x-auto">
        <h3 className="font-black text-lg text-foreground flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-purple-400" />
          <span>User Directory</span>
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
                    <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden shrink-0 relative">
                      {user.avatar_url ? (
                        <Image src={user.avatar_url} alt={user.display_name} fill sizes="32px" className="object-cover" />
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
  );
}
