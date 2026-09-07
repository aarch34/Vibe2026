"use client";

import React, { useState } from "react";
import { Users, Search, Coins, PlusCircle, MinusCircle, AlertCircle, Check } from "lucide-react";
import { adminAdjustBalanceAction } from "@/actions/admin/manage";
import { formatCoins, formatXP } from "@/lib/utils";

interface AttendeeRow {
  id: string;
  displayName: string;
  vibeId: string;
  college: string | null;
  coins: number;
  totalXP: number;
  completionsCount: number;
}

export function AttendeesClient({
  initialAttendees,
}: {
  initialAttendees: AttendeeRow[];
}) {
  const [attendees, setAttendees] = useState(initialAttendees);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AttendeeRow | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const filtered = attendees.filter(
    (a) =>
      a.displayName.toLowerCase().includes(search.toLowerCase()) ||
      a.vibeId.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdjust(isDebit = false) {
    if (!selectedUser || !adjustReason.trim()) {
      setStatusMsg("Please provide an explicit audit reason.");
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    const amount = isDebit ? -Math.abs(adjustAmount) : Math.abs(adjustAmount);
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
      setStatusMsg(`Balance successfully updated to ${res.newBalance} Coins!`);
    } else {
      setStatusMsg(res.message || "Failed to adjust balance");
    }

    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or VIBE ID (e.g. VIBE-1001)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Attendees Table */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                  <th className="pb-3">VIBE ID</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">College / Club</th>
                  <th className="pb-3">Coins</th>
                  <th className="pb-3">XP</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-800/30 cursor-pointer ${
                      selectedUser?.id === user.id ? "bg-blue-950/30" : ""
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="py-3 font-mono font-bold text-cyan-400">
                      {user.vibeId}
                    </td>
                    <td className="py-3 text-white font-bold">
                      {user.displayName}
                    </td>
                    <td className="py-3 text-slate-400 max-w-[140px] truncate">
                      {user.college || "—"}
                    </td>
                    <td className="py-3 font-mono font-bold text-amber-400">
                      {formatCoins(user.coins)}
                    </td>
                    <td className="py-3 font-mono font-bold text-purple-400">
                      {formatXP(user.totalXP)}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected User Balance Adjustment Panel */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Attendee Ledger Adjustment</span>
          </h3>

          {selectedUser ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono text-cyan-400 font-bold block">
                  {selectedUser.vibeId}
                </span>
                <h4 className="text-sm font-black text-white">
                  {selectedUser.displayName}
                </h4>
                <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">Current Balance:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatCoins(selectedUser.coins)} Coins
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Amount (Coins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Reason (Required for Audit Log)
                  </label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g. Stage Quiz Winner / Venue Refund"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                {statusMsg && (
                  <p className="text-xs text-emerald-400 font-medium">{statusMsg}</p>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleAdjust(false)}
                    disabled={isSubmitting}
                    className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center space-x-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Credit +</span>
                  </button>
                  <button
                    onClick={() => handleAdjust(true)}
                    disabled={isSubmitting}
                    className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white flex items-center justify-center space-x-1"
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>Debit -</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">
              Select an attendee from the table to view details or make an audited balance adjustment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
