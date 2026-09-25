"use client";

import React, { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { Profile } from "@/types/database";
import Image from "next/image";

export default function AdminLeaderboardPage() {
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/40 via-card to-pink-900/40 border border-purple-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-foreground">GLOBAL LEADERBOARD</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Top users ranked by total XP.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-card border border-border space-y-4 overflow-x-auto">
        <h3 className="font-black text-lg text-foreground flex items-center space-x-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>XP Leaderboard</span>
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
                    <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0 border-2 border-border relative">
                      {user.avatar_url ? (
                        <Image src={user.avatar_url} alt={user.display_name} fill sizes="40px" className="object-cover" />
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
            {usersList.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">
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
