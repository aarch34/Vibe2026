"use client";

import React, { useState, useMemo } from "react";
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
  UserPlus,
  Edit2,
  Trash2,
  Download,
  Filter,
  X,
  Phone,
  Instagram,
  GraduationCap,
  Building2,
  MapPin,
} from "lucide-react";
import {
  adminAdjustBalanceAction,
  adminAdjustXpAction,
  adminCreateAttendeeAction,
  adminUpdateAttendeeAction,
  adminDeleteAttendeeAction,
} from "@/actions/admin/manage";
import { formatCoins, formatXP } from "@/lib/utils";

export interface AttendeeRow {
  id: string;
  displayName: string;
  vibeId: string;
  phone?: string;
  instagramId?: string | null;
  college: string | null;
  club?: string | null;
  assignedZoneId?: string;
  zoneName?: string;
  coins: number;
  totalXP: number;
  completionsCount: number;
  registeredAt?: string;
}

interface AttendeesClientProps {
  initialAttendees: AttendeeRow[];
  availableZones?: { id: string; name: string }[];
}

export function AttendeesClient({
  initialAttendees,
  availableZones = [
    { id: "z-arnava", name: "Arnava" },
    { id: "z-taranaga", name: "Taranaga" },
    { id: "z-sagara", name: "Sagara" },
    { id: "z-pravaha", name: "Pravaha" },
    { id: "z-samudhra", name: "Samudhra" },
    { id: "z-varuna", name: "Varuna" },
  ],
}: AttendeesClientProps) {
  const [attendees, setAttendees] = useState<AttendeeRow[]>(initialAttendees);
  const [search, setSearch] = useState("");
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AttendeeRow | null>(
    initialAttendees[0] || null
  );

  // Balance & XP Adjustment state
  const [adjustType, setAdjustType] = useState<"coins" | "xp">("coins");
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [attendeeToEdit, setAttendeeToEdit] = useState<AttendeeRow | null>(null);
  const [attendeeToDelete, setAttendeeToDelete] = useState<AttendeeRow | null>(null);

  // New Attendee Form state
  const [addForm, setAddForm] = useState({
    displayName: "",
    vibeId: "",
    phone: "",
    instagramId: "",
    college: "",
    club: "",
    assignedZoneId: availableZones[0]?.id || "",
    initialCoins: 500,
    clerkUserId: "",
  });
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Edit Form state
  const [editForm, setEditForm] = useState({
    displayName: "",
    phone: "",
    instagramId: "",
    college: "",
    club: "",
    assignedZoneId: "",
  });
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Filtered attendees
  const filtered = useMemo(() => {
    return attendees.filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        a.displayName.toLowerCase().includes(q) ||
        a.vibeId.toLowerCase().includes(q) ||
        (a.college && a.college.toLowerCase().includes(q)) ||
        (a.club && a.club.toLowerCase().includes(q)) ||
        (a.phone && a.phone.toLowerCase().includes(q)) ||
        (a.zoneName && a.zoneName.toLowerCase().includes(q));

      const matchesZone =
        selectedZone === "all" ||
        a.assignedZoneId === selectedZone ||
        a.zoneName?.toLowerCase() === selectedZone.toLowerCase();

      return matchesSearch && matchesZone;
    });
  }, [attendees, search, selectedZone]);

  // Adjust Coins or XP
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
        const updated = attendees.map((a) =>
          a.id === selectedUser.id ? { ...a, coins: res.newBalance! } : a
        );
        setAttendees(updated);
        setSelectedUser({ ...selectedUser, coins: res.newBalance });
        setAdjustReason("");
        setStatusMsg({
          text: `Successfully ${amount >= 0 ? "credited" : "deducted"} ${Math.abs(amount)} Coins! New Balance: ${res.newBalance} Coins.`,
        });
      } else {
        setStatusMsg({ text: res.message || "Failed to adjust balance", isError: true });
      }
    } else {
      const res = await adminAdjustXpAction({
        targetProfileId: selectedUser.id,
        amount,
        reason: adjustReason.trim(),
      });

      if (res.success) {
        const newTotalXp = Math.max(0, selectedUser.totalXP + amount);
        const updated = attendees.map((a) =>
          a.id === selectedUser.id ? { ...a, totalXP: newTotalXp } : a
        );
        setAttendees(updated);
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

  // Handle Add Attendee Submit
  async function handleAddAttendeeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.displayName.trim() || !addForm.college.trim()) {
      setAddFormError("Full Name and College are required.");
      return;
    }

    setIsAdding(true);
    setAddFormError(null);

    const res = await adminCreateAttendeeAction({
      displayName: addForm.displayName.trim(),
      vibeId: addForm.vibeId.trim() || undefined,
      phone: addForm.phone.trim() || undefined,
      instagramId: addForm.instagramId.trim() || undefined,
      college: addForm.college.trim(),
      club: addForm.club.trim() || undefined,
      assignedZoneId: addForm.assignedZoneId,
      initialCoins: addForm.initialCoins,
      clerkUserId: addForm.clerkUserId.trim() || undefined,
    });

    if (res.success && res.profile) {
      const zone = availableZones.find((z) => z.id === addForm.assignedZoneId);
      const newRow: AttendeeRow = {
        id: res.profile.id,
        displayName: res.profile.display_name,
        vibeId: res.profile.vibe_id,
        phone: res.profile.phone || "",
        instagramId: res.profile.instagram_id || "",
        college: res.profile.college,
        club: res.profile.club || "",
        assignedZoneId: res.profile.assigned_zone_id,
        zoneName: zone?.name || "Arnava",
        coins: addForm.initialCoins,
        totalXP: 0,
        completionsCount: 0,
        registeredAt: new Date().toISOString(),
      };

      setAttendees([newRow, ...attendees]);
      setSelectedUser(newRow);
      setIsAddModalOpen(false);
      setAddForm({
        displayName: "",
        vibeId: "",
        phone: "",
        instagramId: "",
        college: "",
        club: "",
        assignedZoneId: availableZones[0]?.id || "",
        initialCoins: 500,
        clerkUserId: "",
      });
    } else {
      setAddFormError(res.message || "Failed to register attendee");
    }

    setIsAdding(false);
  }

  // Open Edit Modal
  function openEditModal(attendee: AttendeeRow) {
    setAttendeeToEdit(attendee);
    setEditForm({
      displayName: attendee.displayName,
      phone: attendee.phone || "",
      instagramId: attendee.instagramId || "",
      college: attendee.college || "",
      club: attendee.club || "",
      assignedZoneId: attendee.assignedZoneId || availableZones[0]?.id || "",
    });
    setEditFormError(null);
    setIsEditModalOpen(true);
  }

  // Handle Edit Submit
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!attendeeToEdit) return;

    setIsEditing(true);
    setEditFormError(null);

    const res = await adminUpdateAttendeeAction({
      targetProfileId: attendeeToEdit.id,
      displayName: editForm.displayName.trim(),
      phone: editForm.phone.trim() || undefined,
      instagramId: editForm.instagramId.trim() || undefined,
      college: editForm.college.trim(),
      club: editForm.club.trim() || undefined,
      assignedZoneId: editForm.assignedZoneId,
    });

    if (res.success) {
      const zone = availableZones.find((z) => z.id === editForm.assignedZoneId);
      const updated = attendees.map((a) =>
        a.id === attendeeToEdit.id
          ? {
              ...a,
              displayName: editForm.displayName.trim(),
              phone: editForm.phone.trim(),
              instagramId: editForm.instagramId.trim(),
              college: editForm.college.trim(),
              club: editForm.club.trim(),
              assignedZoneId: editForm.assignedZoneId,
              zoneName: zone?.name || a.zoneName,
            }
          : a
      );
      setAttendees(updated);
      if (selectedUser?.id === attendeeToEdit.id) {
        setSelectedUser({
          ...selectedUser,
          displayName: editForm.displayName.trim(),
          phone: editForm.phone.trim(),
          instagramId: editForm.instagramId.trim(),
          college: editForm.college.trim(),
          club: editForm.club.trim(),
          assignedZoneId: editForm.assignedZoneId,
          zoneName: zone?.name || selectedUser.zoneName,
        });
      }
      setIsEditModalOpen(false);
    } else {
      setEditFormError(res.message || "Failed to update attendee");
    }

    setIsEditing(false);
  }

  // Open Delete Modal
  function openDeleteModal(attendee: AttendeeRow) {
    setAttendeeToDelete(attendee);
    setIsDeleteModalOpen(true);
  }

  // Confirm Delete Attendee
  async function handleConfirmDelete() {
    if (!attendeeToDelete) return;
    setIsSubmitting(true);

    const res = await adminDeleteAttendeeAction({
      targetProfileId: attendeeToDelete.id,
    });

    if (res.success) {
      const remaining = attendees.filter((a) => a.id !== attendeeToDelete.id);
      setAttendees(remaining);
      if (selectedUser?.id === attendeeToDelete.id) {
        setSelectedUser(remaining[0] || null);
      }
      setIsDeleteModalOpen(false);
      setAttendeeToDelete(null);
    } else {
      alert(res.message || "Failed to delete attendee");
    }

    setIsSubmitting(false);
  }

  // Export Roster as CSV
  function handleExportCSV() {
    const headers = [
      "VIBE ID",
      "Display Name",
      "Phone",
      "Instagram",
      "College",
      "Club",
      "Zone",
      "Coins Balance",
      "Total XP",
      "Completions Count",
      "Registration Date",
    ];

    const rows = attendees.map((a) => [
      `"${a.vibeId}"`,
      `"${a.displayName.replace(/"/g, '""')}"`,
      `"${a.phone || ""}"`,
      `"${a.instagramId || ""}"`,
      `"${(a.college || "").replace(/"/g, '""')}"`,
      `"${(a.club || "").replace(/"/g, '""')}"`,
      `"${a.zoneName || ""}"`,
      a.coins,
      a.totalXP,
      a.completionsCount,
      `"${a.registeredAt ? new Date(a.registeredAt).toLocaleString() : ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vibe-attendees-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar: Search, Zone Filter, Add Attendee & Export */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, VIBE ID, phone, college..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
            />
          </div>

          {/* Zone Filter */}
          <div className="flex items-center space-x-1.5 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Zones ({attendees.length})</option>
              {availableZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center space-x-1.5 transition-colors border border-slate-700/60"
            title="Download full attendee directory spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setAddFormError(null);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center space-x-1.5 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Attendee</span>
          </button>
        </div>
      </div>

      {/* 2. Main Grid: Attendees Roster + Adjustment & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendees Directory Table */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center space-x-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Registered Attendees ({filtered.length})</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Click row to inspect & adjust
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-mono">
                  <th className="pb-2.5 font-bold">Attendee</th>
                  <th className="pb-2.5 font-bold">Zone</th>
                  <th className="pb-2.5 font-bold">Contact / College</th>
                  <th className="pb-2.5 font-bold text-right">Coins</th>
                  <th className="pb-2.5 font-bold text-right">XP</th>
                  <th className="pb-2.5 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filtered.map((a) => {
                  const isSelected = selectedUser?.id === a.id;
                  return (
                    <tr
                      key={a.id}
                      onClick={() => setSelectedUser(a)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-600/10 border-l-2 border-l-blue-500"
                          : "hover:bg-slate-950/60"
                      }`}
                    >
                      <td className="py-3 px-2">
                        <div className="font-bold text-white flex items-center space-x-1.5">
                          <span>{a.displayName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400 block">
                          {a.vibeId}
                        </span>
                      </td>

                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono font-bold text-slate-300 border border-slate-700">
                          {a.zoneName || "Arnava"}
                        </span>
                      </td>

                      <td className="py-3 text-[11px] text-slate-400 max-w-[150px] truncate">
                        <span className="block text-slate-300 font-semibold truncate">
                          {a.college || "District 3192"}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {a.phone || a.instagramId || a.club || "—"}
                        </span>
                      </td>

                      <td className="py-3 text-right font-mono font-bold text-amber-400">
                        {formatCoins(a.coins)}
                      </td>

                      <td className="py-3 text-right font-mono font-bold text-purple-300">
                        {formatXP(a.totalXP)}
                      </td>

                      <td className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => openEditModal(a)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="Edit Attendee"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(a)}
                            className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Attendee"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                      No attendees found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Attendee Inspector & Audited Adjustments */}
        <div className="space-y-4">
          {selectedUser ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
              {/* Profile Card Header */}
              <div className="border-b border-slate-800 pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {selectedUser.zoneName || "Arnava"} Zone
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {selectedUser.vibeId}
                  </span>
                </div>
                <h3 className="text-base font-black text-white">
                  {selectedUser.displayName}
                </h3>
                <p className="text-xs text-slate-400">{selectedUser.college}</p>
                {selectedUser.phone && (
                  <p className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-slate-400 mr-1" />
                    <span>{selectedUser.phone}</span>
                  </p>
                )}
              </div>

              {/* Current Balances */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">VIBE COINS</span>
                  <span className="text-sm font-black text-amber-400">
                    {formatCoins(selectedUser.coins)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">TOTAL XP</span>
                  <span className="text-sm font-black text-purple-300">
                    {formatXP(selectedUser.totalXP)}
                  </span>
                </div>
              </div>

              {/* Adjustment Controls */}
              <div className="space-y-3 pt-1">
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType("coins");
                      setStatusMsg(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
                      adjustType === "coins"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Adjust Coins</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType("xp");
                      setStatusMsg(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
                      adjustType === "xp"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Adjust XP</span>
                  </button>
                </div>

                {/* Amount presets */}
                <div className="flex items-center space-x-1.5">
                  {[25, 50, 100, 250, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAdjustAmount(val)}
                      className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold border transition-colors ${
                        adjustAmount === val
                          ? "bg-blue-600/20 border-blue-500 text-blue-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1 font-mono">
                    Custom Amount ({adjustType.toUpperCase()})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Audit Reason */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1 font-mono">
                    Audit Trail Reason (Mandatory)
                  </label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g. Stage Quiz Win, Offline Correction, Zonal Award"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {statusMsg && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center space-x-1.5 ${
                      statusMsg.isError
                        ? "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                        : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {statusMsg.isError ? (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    )}
                    <span>{statusMsg.text}</span>
                  </div>
                )}

                {/* Credit / Debit Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleAdjust(false)}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Credit +{adjustAmount}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleAdjust(true)}
                    className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-1.5"
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>Deduct -{adjustAmount}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">
              Select an attendee from the table to view details and perform audited adjustments.
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. ADD ATTENDEE MODAL                                              */}
      {/* ------------------------------------------------------------------ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span>Register New Festival Attendee</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAttendeeSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.displayName}
                    onChange={(e) => setAddForm({ ...addForm, displayName: e.target.value })}
                    placeholder="e.g. Rohan Sharma"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    VIBE ID (Auto if blank)
                  </label>
                  <input
                    type="text"
                    value={addForm.vibeId}
                    onChange={(e) => setAddForm({ ...addForm, vibeId: e.target.value })}
                    placeholder="e.g. VIBE-5021"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Assigned Faction Zone *
                  </label>
                  <select
                    value={addForm.assignedZoneId}
                    onChange={(e) => setAddForm({ ...addForm, assignedZoneId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {availableZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} Zone
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Starter Coins Balance
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.initialCoins}
                    onChange={(e) => setAddForm({ ...addForm, initialCoins: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    College / Institution *
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.college}
                    onChange={(e) => setAddForm({ ...addForm, college: e.target.value })}
                    placeholder="e.g. Ramaiah Institute of Technology"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Rotaract Club / Team
                  </label>
                  <input
                    type="text"
                    value={addForm.club}
                    onChange={(e) => setAddForm({ ...addForm, club: e.target.value })}
                    placeholder="e.g. Rotaract Club of Indiranagar"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={addForm.instagramId}
                    onChange={(e) => setAddForm({ ...addForm, instagramId: e.target.value })}
                    placeholder="@username"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {addFormError && (
                <p className="text-xs text-rose-400 font-medium">{addFormError}</p>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isAdding ? "Registering..." : "Create Attendee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. EDIT ATTENDEE MODAL                                             */}
      {/* ------------------------------------------------------------------ */}
      {isEditModalOpen && attendeeToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                <span>Edit Attendee ({attendeeToEdit.vibeId})</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Assigned Zone
                </label>
                <select
                  value={editForm.assignedZoneId}
                  onChange={(e) => setEditForm({ ...editForm, assignedZoneId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {availableZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} Zone
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    College
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.college}
                    onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Club
                  </label>
                  <input
                    type="text"
                    value={editForm.club}
                    onChange={(e) => setEditForm({ ...editForm, club: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={editForm.instagramId}
                    onChange={(e) => setEditForm({ ...editForm, instagramId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {editFormError && (
                <p className="text-xs text-rose-400 font-medium">{editFormError}</p>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isEditing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. DELETE CONFIRMATION MODAL                                       */}
      {/* ------------------------------------------------------------------ */}
      {isDeleteModalOpen && attendeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Delete Attendee?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to remove{" "}
                <strong className="text-white">{attendeeToDelete.displayName}</strong> (
                {attendeeToDelete.vibeId})? This will permanently delete their profile, wallet, and records.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-500/20 active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
