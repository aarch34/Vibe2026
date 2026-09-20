"use client";

import React, { useState, useTransition } from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  Search,
  PlusCircle,
  Trash2,
  Lock,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Compass,
  Sparkles,
} from "lucide-react";
import {
  ZoneStaffMatrix,
  AssignedStaffRecord,
  adminSearchAttendeesAction,
  adminAssignZonalStaffAction,
  adminRevokeZonalStaffAction,
} from "@/actions/admin/staff-delegation";

interface StaffDelegationClientProps {
  initialMatrix: ZoneStaffMatrix[];
}

export function StaffDelegationClient({ initialMatrix }: StaffDelegationClientProps) {
  const [matrix, setMatrix] = useState<ZoneStaffMatrix[]>(initialMatrix);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<any | null>(null);

  // Form state
  const [targetZoneId, setTargetZoneId] = useState(initialMatrix[0]?.zoneId || "");
  const [staffType, setStaffType] = useState<"zonal_head" | "zonal_staff">("zonal_head");
  const [customPasscode, setCustomPasscode] = useState("");

  // Feedback
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setStatusMsg(null);
    try {
      const res = await adminSearchAttendeesAction(searchQuery);
      if (res.success && res.results) {
        setSearchResults(res.results);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }

  function handleAssign() {
    if (!selectedAttendee) {
      setStatusMsg({ text: "Please select an attendee first.", isError: true });
      return;
    }

    startTransition(async () => {
      setStatusMsg(null);
      const res = await adminAssignZonalStaffAction({
        targetProfileId: selectedAttendee.id,
        zoneId: targetZoneId,
        staffType,
        passcode: customPasscode.trim() || undefined,
      });

      if (res.success) {
        setStatusMsg({ text: res.message || "Staff assigned successfully!" });
        // Update local matrix
        setMatrix((prev) =>
          prev.map((z) => {
            if (z.zoneId !== targetZoneId) return z;
            const newRecord: AssignedStaffRecord = {
              assignmentId: `asg-${Date.now()}`,
              staffMemberId: `sm-${selectedAttendee.id}`,
              profileId: selectedAttendee.id,
              displayName: selectedAttendee.displayName,
              vibeId: selectedAttendee.vibeId,
              college: selectedAttendee.college,
              zoneId: targetZoneId,
              zoneName: z.zoneName,
              zoneSlug: z.zoneSlug,
              staffType,
              isActive: true,
              assignedAt: new Date().toISOString(),
            };

            return {
              ...z,
              heads: staffType === "zonal_head" ? [...z.heads, newRecord] : z.heads,
              staff: staffType === "zonal_staff" ? [...z.staff, newRecord] : z.staff,
            };
          })
        );
        setSelectedAttendee(null);
        setSearchQuery("");
        setSearchResults([]);
        setCustomPasscode("");
        setIsModalOpen(false);
      } else {
        setStatusMsg({ text: res.message || "Failed to assign staff", isError: true });
      }
    });
  }

  function handleRevoke(assignmentId: string, zoneId: string) {
    if (!confirm("Are you sure you want to revoke this staff member's zonal access?")) return;

    startTransition(async () => {
      const res = await adminRevokeZonalStaffAction(assignmentId);
      if (res.success) {
        setStatusMsg({ text: "Staff assignment revoked successfully." });
        setMatrix((prev) =>
          prev.map((z) => {
            if (z.zoneId !== zoneId) return z;
            return {
              ...z,
              heads: z.heads.filter((h) => h.assignmentId !== assignmentId),
              staff: z.staff.filter((s) => s.assignmentId !== assignmentId),
            };
          })
        );
      } else {
        setStatusMsg({ text: res.message || "Failed to revoke assignment", isError: true });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border-2 border-slate-800 p-6 shadow-[4px_4px_0px_#000]">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-mono font-black uppercase tracking-wider">
              District 3192 Access Control
            </span>
          </div>
          <h2 className="text-2xl font-black text-white font-mono uppercase tracking-tight">
            Zonal Staff Delegation Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Authorize and assign active attendees as Zonal Heads or Volunteers across the 6 Oceanic Zones.
            Delegated heads receive instant station access, stall photo review rights, and duty XP award permissions.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setStatusMsg(null);
          }}
          className="neo-btn-primary px-5 py-2.5 text-xs font-black uppercase flex items-center justify-center space-x-2 whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Delegate Zonal Staff</span>
        </button>
      </div>

      {/* Global Status Message */}
      {statusMsg && (
        <div
          className={`p-4 border-2 font-mono text-xs flex items-center justify-between ${
            statusMsg.isError
              ? "bg-rose-950/80 border-rose-600 text-rose-300"
              : "bg-emerald-950/80 border-emerald-600 text-emerald-300"
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMsg.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 6 Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matrix.map((z) => (
          <div
            key={z.zoneId}
            className="bg-slate-900 border-2 border-slate-800 p-5 shadow-[4px_4px_0px_#000] flex flex-col justify-between"
          >
            <div>
              {/* Zone Title */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-4">
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                    Zone Station
                  </div>
                  <h3 className="text-xl font-black text-white font-mono uppercase tracking-tight">
                    {z.zoneName}
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 font-bold uppercase">
                  {z.zoneSlug}
                </span>
              </div>

              {/* Zonal Heads List */}
              <div className="mb-4">
                <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-amber-400 uppercase mb-2">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Zonal Heads ({z.heads.length})</span>
                </div>
                {z.heads.length === 0 ? (
                  <div className="p-3 bg-slate-950/60 border border-dashed border-slate-800 text-[11px] font-mono text-slate-500 text-center">
                    No Zonal Head currently assigned
                  </div>
                ) : (
                  <div className="space-y-2">
                    {z.heads.map((h) => (
                      <div
                        key={h.assignmentId}
                        className="p-3 bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center space-x-2">
                            <span>{h.displayName}</span>
                            <span className="text-[10px] font-mono text-amber-400 font-bold">
                              [{h.vibeId}]
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {h.college || "Rotaract Member"}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevoke(h.assignmentId, z.zoneId)}
                          disabled={isPending}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          title="Revoke Zonal Head"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Zonal Volunteers List */}
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-400 uppercase mb-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Volunteers & Staff ({z.staff.length})</span>
                </div>
                {z.staff.length === 0 ? (
                  <div className="p-3 bg-slate-950/60 border border-dashed border-slate-800 text-[11px] font-mono text-slate-500 text-center">
                    No staff volunteers assigned
                  </div>
                ) : (
                  <div className="space-y-2">
                    {z.staff.map((s) => (
                      <div
                        key={s.assignmentId}
                        className="p-2.5 bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-200">
                            {s.displayName} <span className="text-[10px] text-cyan-400 font-mono">({s.vibeId})</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                            {s.college || "Rotaract Member"}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevoke(s.assignmentId, z.zoneId)}
                          disabled={isPending}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          title="Revoke Staff"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Assign to this Zone CTA */}
            <button
              onClick={() => {
                setTargetZoneId(z.zoneId);
                setIsModalOpen(true);
                setStatusMsg(null);
              }}
              className="mt-5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold uppercase transition-colors border border-slate-700"
            >
              + Assign to {z.zoneName}
            </button>
          </div>
        ))}
      </div>

      {/* Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 max-w-lg w-full p-6 shadow-[8px_8px_0px_#000] relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-cyan-400 mb-1">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-mono font-bold uppercase">Staff Delegation</span>
            </div>
            <h3 className="text-xl font-black text-white font-mono uppercase tracking-tight mb-4">
              Authorize Zonal Staff Member
            </h3>

            {/* Attendee Search */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                  1. Search Registered Attendee
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search by Name, VIBE ID, or College..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
                      className="w-full bg-slate-950 border border-slate-700 text-white pl-9 pr-3 py-2 text-xs font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSearch()}
                    disabled={isSearching}
                    className="neo-btn-card px-4 py-2 text-xs font-mono font-bold uppercase"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </button>
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto bg-slate-950 border border-slate-800 divide-y divide-slate-800">
                    {searchResults.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setSelectedAttendee(a);
                          setSearchResults([]);
                        }}
                        className="w-full text-left p-2.5 hover:bg-slate-800 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{a.displayName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {a.vibeId} • {a.college || "Rotaract Member"}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                          Select →
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Attendee Card */}
                {selectedAttendee && (
                  <div className="mt-2 p-3 bg-cyan-950/40 border border-cyan-500/50 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-2">
                        <span>{selectedAttendee.displayName}</span>
                        <span className="text-[10px] font-mono text-cyan-400">[{selectedAttendee.vibeId}]</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{selectedAttendee.college}</div>
                    </div>
                    <button
                      onClick={() => setSelectedAttendee(null)}
                      className="text-xs text-rose-400 hover:underline font-mono"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Zone Selector */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                  2. Select Oceanic Zone
                </label>
                <select
                  value={targetZoneId}
                  onChange={(e) => setTargetZoneId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 text-xs font-mono focus:border-cyan-400 focus:outline-none"
                >
                  {matrix.map((z) => (
                    <option key={z.zoneId} value={z.zoneId}>
                      {z.zoneName} ({z.zoneSlug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                  3. Delegation Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStaffType("zonal_head")}
                    className={`p-3 border text-left font-mono text-xs transition-colors ${
                      staffType === "zonal_head"
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Zonal Head</span>
                    </div>
                    <div className="text-[10px] opacity-70 mt-1">
                      Full Station Authority (Duty XP awards, QR codes, photo approvals)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStaffType("zonal_staff")}
                    className={`p-3 border text-left font-mono text-xs transition-colors ${
                      staffType === "zonal_staff"
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Volunteer Staff</span>
                    </div>
                    <div className="text-[10px] opacity-70 mt-1">
                      Check-in and stall photo assist
                    </div>
                  </button>
                </div>
              </div>

              {/* Optional Custom Passcode */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                  4. Kiosk Station Passcode (Optional)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Leave blank for default: <zone>@vibe2026"
                    value={customPasscode}
                    onChange={(e) => setCustomPasscode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white pl-9 pr-3 py-2 text-xs font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] font-mono text-slate-500 mt-1">
                  Allows direct kiosk login on tablets at noisy festival booths without Clerk.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 text-xs font-mono uppercase hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={!selectedAttendee || isPending}
                  className="neo-btn-primary px-5 py-2 text-xs font-mono font-bold uppercase flex items-center space-x-2 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Authorize Staff Access</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
