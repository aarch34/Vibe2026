"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Coins,
  Sparkles,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  Check,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { adminAdjustBalanceAction, adminAdjustXpAction } from "@/actions/admin/manage";
import { formatCoins, formatXP } from "@/lib/utils";

interface AttendeeRow {
  id: string;
  displayName: string;
  vibeId: string;
  college: string | null;
  instagramId?: string | null;
  zoneName?: string;
  coins: number;
  totalXP: number;
  completionsCount: number;
  registeredAt?: string;
}

export function AttendeesClient({
  initialAttendees,
}: {
  initialAttendees: AttendeeRow[];
}) {
  const [attendees, setAttendees] = useState(initialAttendees);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AttendeeRow | null>(
    initialAttendees[0] || null
  );
  const [adjustType, setAdjustType] = useState<"coins" | "xp">("coins");
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const filtered = attendees.filter(
    (a) =>
      a.displayName.toLowerCase().includes(search.toLowerCase()) ||
      a.vibeId.toLowerCase().includes(search.toLowerCase()) ||
      (a.college && a.college.toLowerCase().includes(search.toLowerCase())) ||
      (a.zoneName && a.zoneName.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleAdjust(isDebit = false) {
    if (!selectedUser || !adjustReason.trim()) {
      setStatusMsg({ text: "Please provide an explicit audit reason.", isError: true });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    const amount = isDebit ? -Math.abs(adjustAmount) : Math.abs(adjustAmount);

    if (adjustType === "coins") {
      const res = await adminAdjustBalanceAction({
        targetProfileId: selectedUser.id,
        amount,
        reason: adjustReason.trim(),
      });

      if (res.success && res.newBalance !== undefined) {
        setAttendees(
          attendees.map((a) =>
            a.id === selectedUser.id ? { ...a, coins: res.newBalance } : a
          )
        );
        setSelectedUser({ ...selectedUser, coins: res.newBalance });
        setAdjustReason("");
        setStatusMsg({
          text: `Successfully ${amount >= 0 ? "credited" : "deducted"} ${Math.abs(amount)} Coins! New Balance: ${res.newBalance} Coins.`,
        });
      } else {
        setStatusMsg({ text: res.message || "Failed to adjust balance", isError: true });
      }
    } else {
      // XP Adjustment
      const res = await adminAdjustXpAction({
        targetProfileId: selectedUser.id,
        amount,
        reason: adjustReason.trim(),
      });

      if (res.success) {
        const newTotalXp = Math.max(0, selectedUser.totalXP + amount);
        setAttendees(
          attendees.map((a) =>
            a.id === selectedUser.id ? { ...a, totalXP: newTotalXp } : a
          )
        );
        setSelectedUser({ ...selectedUser, totalXP: newTotalXp });
        setAdjustReason("");
        setStatusMsg({
          text: `Successfully ${amount >= 0 ? "awarded" : "deducted"} ${Math.abs(amount)} XP! New Total: ${newTotalXp} XP.`,
        });
      } else {
        setStatusMsg({ text: res.message || "Failed to adjust XP", isError: true });
      }
    }

    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      {/* Search Bar & Total Counts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, VIBE ID, college, zone..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <span>Registered Accounts:</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold">
            {attendees.length}
          </span>
        </div>
      </div>

      {/* Attendees Table + Adjustment Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              All Registered Accounts ({filtered.length})
            </h2>
            <span className="text-[10px] text-slate-400">Click any row to adjust</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                  <th className="pb-3">VIBE ID</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">College / Club</th>
                  <th className="pb-3">Zone</th>
                  <th className="pb-3">Coins</th>
                  <th className="pb-3">XP</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((user) => {
                  const isSelected = selectedUser?.id === user.id;
                  return (
                    <tr
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setStatusMsg(null);
                      }}
                      className={`hover:bg-slate-800/60 cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-950/40 border-l-2 border-blue-500" : ""
                      }`}
                    >
                      <td className="py-3 font-mono font-bold text-cyan-400">
                        {user.vibeId}
                      </td>
                      <td className="py-3 font-medium text-white">
                        {user.displayName}
                      </td>
                      <td className="py-3 text-slate-400 truncate max-w-[130px]">
                        {user.college || "Rotaract District 3192"}
                      </td>
                      <td className="py-3 font-medium text-slate-300">
                        {user.zoneName || "Arnava"}
                      </td>
                      <td className="py-3 font-mono font-bold text-amber-400">
                        {formatCoins(user.coins)}
                      </td>
                      <td className="py-3 font-mono font-bold text-purple-400">
                        {formatXP(user.totalXP)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                            setStatusMsg(null);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                          }`}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected User Balance & XP Adjustment Panel */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Manual Adjustments</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Audited</span>
          </div>

          {selectedUser ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">
                    {selectedUser.vibeId}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                    {selectedUser.zoneName || "Arnava"}
                  </span>
                </div>

                <h4 className="text-base font-black text-white">
                  {selectedUser.displayName}
                </h4>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Balance</span>
                    <span className="font-bold text-amber-400">
                      {formatCoins(selectedUser.coins)} 🪙
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total XP</span>
                    <span className="font-bold text-purple-300">
                      {formatXP(selectedUser.totalXP)} ⭐
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggle Coins vs XP */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType("coins");
                    setStatusMsg(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                    adjustType === "coins"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>VIBE Coins</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdjustType("xp");
                    setStatusMsg(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                    adjustType === "xp"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>XP Points</span>
                </button>
              </div>

              {/* Presets */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 block font-mono">
                  Quick Amount Presets
                </label>
                <div className="flex items-center space-x-1.5">
                  {[25, 50, 100, 250, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAdjustAmount(val)}
                      className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        adjustAmount === val
                          ? "bg-slate-800 border-cyan-500 text-cyan-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1 font-mono">
                    Custom Amount ({adjustType === "coins" ? "Coins" : "XP"})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1 font-mono">
                    Audit Reason (Required)
                  </label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder={
                      adjustType === "coins"
                        ? "e.g. Stage Quiz Win, Offline Purchase, Correction"
                        : "e.g. Special Volunteer Challenge, Zone Check-in Correction"
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {statusMsg && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-medium flex items-center space-x-2 ${
                      statusMsg.isError
                        ? "bg-rose-950/80 border border-rose-500/40 text-rose-300"
                        : "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"
                    }`}
                  >
                    {statusMsg.isError ? (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    )}
                    <span>{statusMsg.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAdjust(false)}
                    disabled={isSubmitting}
                    className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white flex items-center justify-center space-x-1 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <PlusCircle className="w-3.5 h-3.5" />
                    )}
                    <span>
                      Add {adjustType === "coins" ? "Coins" : "XP"} +
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjust(true)}
                    disabled={isSubmitting}
                    className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-xs font-bold text-white flex items-center justify-center space-x-1 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <MinusCircle className="w-3.5 h-3.5" />
                    )}
                    <span>
                      Deduct {adjustType === "coins" ? "Coins" : "XP"} -
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">
              Select an attendee from the table to manage their Coins or XP.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
