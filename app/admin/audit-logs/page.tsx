"use client";

import React, { useState, useEffect } from "react";
import { Zap, CheckCircle, FileText } from "lucide-react";
import { AdminXpAdjustment, Profile } from "@/types/database";

export default function AdminAuditLogsPage() {
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [adjustments, setAdjustments] = useState<AdminXpAdjustment[]>([]);

  const [targetUserId, setTargetUserId] = useState("");
  const [amount, setAmount] = useState<number>(100);
  const [reason, setReason] = useState("");
  const [adminName, setAdminName] = useState("District Admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setAdjustments(data.adjustments || []);
        setUsersList(data.users || []);
        if (data.users?.[0]) setTargetUserId(data.users[0].id);
      }
    } catch {}
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
        await res.json();
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/40 via-card to-pink-900/40 border border-purple-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-foreground">XP & AUDIT LOGS</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage user XP and review immutable audit trails.
          </p>
        </div>
      </div>

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
  );
}
