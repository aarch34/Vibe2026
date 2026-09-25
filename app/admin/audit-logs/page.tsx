"use client";

import React, { useState, useEffect } from "react";
import { Zap, CheckCircle, FileText, AlertTriangle, RefreshCw } from "lucide-react";
import { AdminXpAdjustment, Profile } from "@/types/database";

export default function AdminAuditLogsPage() {
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [adjustments, setAdjustments] = useState<AdminXpAdjustment[]>([]);

  const [targetUserId, setTargetUserId] = useState("");
  const [amount, setAmount] = useState<number>(100);
  const [reason, setReason] = useState("");
  const [adminName, setAdminName] = useState("District Admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setAdjustments(data.adjustments || []);
        const users = data.users || [];
        setUsersList(users);
        if (users[0] && !targetUserId) {
          setTargetUserId(users[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustXp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!targetUserId) {
      setErrorMsg("Please select a target user.");
      return;
    }
    if (!reason.trim()) {
      setErrorMsg("Please provide a mandatory reason for this XP adjustment.");
      return;
    }
    if (isNaN(Number(amount)) || Number(amount) === 0) {
      setErrorMsg("Please enter a valid non-zero XP amount.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/xp-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          amount: Number(amount),
          reason: reason.trim(),
          adminName: adminName.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(
          data.message ||
            `Successfully adjusted ${amount >= 0 ? "+" : ""}${amount} XP! Record logged to audit trail.`
        );
        setReason("");
        await fetchAdminData();
      } else {
        setErrorMsg(data.error || "Failed to apply XP adjustment. Please check inputs and try again.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error while applying XP adjustment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserDisplay = (profileId: string) => {
    const user = usersList.find((u) => u.id === profileId);
    if (!user) return profileId;
    return `${user.display_name} (@${user.username || ""})`;
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
            Manage user XP and review immutable audit trails with zero silent overwrites.
          </p>
        </div>
        <button
          onClick={fetchAdminData}
          disabled={isLoading}
          className="self-start sm:self-auto px-3 py-2 bg-secondary/80 hover:bg-secondary border border-border rounded-xl text-xs font-bold text-foreground flex items-center space-x-1.5 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      <div className="p-6 rounded-3xl bg-card border border-purple-500/30 shadow-xl space-y-4">
        <h3 className="font-black text-lg text-foreground flex items-center space-x-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span>Manual XP Adjustment Tool</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          Admins can award or deduct XP with mandatory reason logging. Every action immediately updates the profile's live XP in the database and creates an immutable audit trail entry.
        </p>

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-rose-400 text-xs font-bold flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAdjustXp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">Target User *</label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-purple-500/40 rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-400"
            >
              {usersList.map((u) => (
                <option key={u.id} value={u.id} className="bg-card text-foreground">
                  {u.display_name} (@{u.username || "user"}) — Current: {u.xp} XP
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
              placeholder="e.g. 100 or -50"
              className="w-full px-3 py-2.5 bg-background border border-purple-500/40 rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">Admin Name *</label>
            <input
              type="text"
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-purple-500/40 rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-400"
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
              className="w-full px-3 py-2.5 bg-background border border-purple-500/40 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-purple-400"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting || !targetUserId}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-black text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? "APPLYING..." : "APPLY XP ADJUSTMENT"}
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
            <div className="text-center py-8 text-xs text-muted-foreground">
              No manual adjustments recorded yet.
            </div>
          ) : (
            adjustments.map((adj) => (
              <div key={adj.id} className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="font-bold text-foreground">{getUserDisplay(adj.target_profile_id)}</span>
                    <span className={`font-mono font-black ${adj.amount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {adj.amount >= 0 ? "+" : ""}{adj.amount} XP
                    </span>
                    {adj.xp_before !== undefined && adj.xp_after !== undefined && (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        ({adj.xp_before} → {adj.xp_after} XP)
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[11px]">Reason: &ldquo;{adj.reason}&rdquo;</p>
                </div>

                <div className="sm:text-right text-[10px] text-muted-foreground font-mono shrink-0">
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
