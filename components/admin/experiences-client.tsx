"use client";

import { useState, useMemo } from "react";
import {
  Sparkles,
  Search,
  Power,
  Edit2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Coins,
  Trophy,
} from "lucide-react";
import { formatCoins } from "@/lib/utils";
import {
  adminToggleExperienceAction,
  adminUpdateExperienceAction,
} from "@/actions/admin/manage";

interface ExperienceItem {
  id: string;
  title: string;
  description?: string;
  zone_id: string;
  zoneName: string;
  sponsorName: string;
  coin_cost: number;
  xp_reward: number;
  max_attempts: number;
  cooldown_seconds: number;
  is_active?: boolean;
}

interface ExperiencesClientProps {
  initialExperiences: ExperienceItem[];
  availableZones: { id: string; name: string }[];
}

export function ExperiencesClient({
  initialExperiences,
  availableZones,
}: ExperiencesClientProps) {
  const [experiences, setExperiences] = useState<ExperienceItem[]>(initialExperiences);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZoneFilter, setSelectedZoneFilter] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Edit Modal State
  const [editingExp, setEditingExp] = useState<ExperienceItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCoinCost, setEditCoinCost] = useState(0);
  const [editXpReward, setEditXpReward] = useState(100);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredExperiences = useMemo(() => {
    return experiences.filter((exp) => {
      const matchSearch =
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.sponsorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.zoneName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchZone =
        selectedZoneFilter === "all" ||
        exp.zone_id === selectedZoneFilter ||
        exp.zoneName.toLowerCase() === selectedZoneFilter.toLowerCase();

      return matchSearch && matchZone;
    });
  }, [experiences, searchQuery, selectedZoneFilter]);

  const handleToggle = async (exp: ExperienceItem) => {
    const nextStatus = !(exp.is_active ?? true);
    setTogglingId(exp.id);

    try {
      const res = await adminToggleExperienceAction({
        experienceId: exp.id,
        isActive: nextStatus,
      });

      if (res.success) {
        setExperiences((prev) =>
          prev.map((e) => (e.id === exp.id ? { ...e, is_active: nextStatus } : e))
        );
      } else {
        alert(res.message || "Failed to toggle experience status");
      }
    } catch (err: any) {
      alert(err.message || "Failed to toggle experience");
    } finally {
      setTogglingId(null);
    }
  };

  const openEditModal = (exp: ExperienceItem) => {
    setEditingExp(exp);
    setEditTitle(exp.title);
    setEditCoinCost(exp.coin_cost);
    setEditXpReward(exp.xp_reward);
    setEditFeedback(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExp) return;

    setIsSubmittingEdit(true);
    setEditFeedback(null);

    try {
      const res = await adminUpdateExperienceAction({
        experienceId: editingExp.id,
        title: editTitle.trim(),
        coinCost: editCoinCost,
        xpReward: editXpReward,
      });

      if (res.success) {
        setExperiences((prev) =>
          prev.map((e) =>
            e.id === editingExp.id
              ? {
                  ...e,
                  title: editTitle.trim(),
                  coin_cost: editCoinCost,
                  xp_reward: editXpReward,
                }
              : e
          )
        );
        setEditFeedback({ type: "success", text: "Mission updated successfully!" });
        setTimeout(() => {
          setEditingExp(null);
          setEditFeedback(null);
        }, 1200);
      } else {
        setEditFeedback({ type: "error", text: res.message || "Failed to update mission" });
      }
    } catch (err: any) {
      setEditFeedback({ type: "error", text: err.message || "Error saving changes" });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Total Missions
          </span>
          <span className="text-2xl font-black text-foreground">{experiences.length}</span>
        </div>

        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Active Now
          </span>
          <span className="text-2xl font-black text-emerald-500">
            {experiences.filter((e) => e.is_active ?? true).length}
          </span>
        </div>

        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Paused / Under Repair
          </span>
          <span className="text-2xl font-black text-amber-500">
            {experiences.filter((e) => !(e.is_active ?? true)).length}
          </span>
        </div>

        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Total Potential XP
          </span>
          <span className="text-2xl font-black text-primary">
            +{experiences.reduce((sum, e) => sum + (e.xp_reward || 0), 0)} XP
          </span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search missions, stalls, sponsors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border-2 border-border pl-9 pr-3 py-2 text-xs font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-neo"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="flex items-center space-x-1.5 bg-card border-2 border-border px-2.5 py-1.5 shadow-neo">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
              className="bg-transparent text-xs font-black text-foreground uppercase focus:outline-none cursor-pointer"
            >
              <option value="all">All Zones ({experiences.length})</option>
              {availableZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table of Experiences */}
      <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b-2 border-border text-muted-foreground uppercase text-[11px]">
                <th className="pb-3 font-black">Mission / Stall</th>
                <th className="pb-3 font-black">Zone</th>
                <th className="pb-3 font-black">Sponsor</th>
                <th className="pb-3 font-black">Cost</th>
                <th className="pb-3 font-black">XP Reward</th>
                <th className="pb-3 font-black">Attempts</th>
                <th className="pb-3 font-black">Status</th>
                <th className="pb-3 font-black text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border font-medium">
              {filteredExperiences.map((exp) => {
                const isActive = exp.is_active ?? true;
                const isToggling = togglingId === exp.id;

                return (
                  <tr
                    key={exp.id}
                    className={`hover:bg-muted/70 transition-colors ${
                      isActive ? "" : "opacity-70 bg-muted/20"
                    }`}
                  >
                    <td className="py-3 pr-2">
                      <div className="font-black text-foreground">{exp.title}</div>
                      {exp.description && (
                        <div className="text-[10px] text-muted-foreground font-medium truncate max-w-xs">
                          {exp.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 font-black text-primary">{exp.zoneName}</td>
                    <td className="py-3 text-muted-foreground font-bold">{exp.sponsorName}</td>
                    <td className="py-3 font-black text-foreground">
                      {exp.coin_cost > 0 ? `${formatCoins(exp.coin_cost)} Coins` : "Free"}
                    </td>
                    <td className="py-3 font-black text-emerald-500">+{exp.xp_reward} XP</td>
                    <td className="py-3 text-muted-foreground font-bold">
                      {exp.max_attempts} max
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 border border-border text-[10px] font-black ${
                          isActive
                            ? "bg-secondary text-secondary-foreground shadow-[1px_1px_0px_var(--border)]"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isActive ? "ACTIVE" : "PAUSED"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggle(exp)}
                          disabled={isToggling}
                          title={isActive ? "Pause mission" : "Activate mission"}
                          className={`p-1.5 border-2 border-border shadow-[1px_1px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 ${
                            isActive
                              ? "bg-card text-foreground hover:bg-muted"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Power className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(exp)}
                          title="Edit Mission Details"
                          className="p-1.5 border-2 border-border bg-card hover:bg-muted text-foreground shadow-[1px_1px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT EXPERIENCE MODAL */}
      {editingExp && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border-4 border-border shadow-neo w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setEditingExp(null)}
              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-4">
              <div className="w-9 h-9 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground uppercase tracking-tight font-mono">
                  Edit Mission Parameters
                </h3>
                <p className="text-xs font-mono font-bold text-muted-foreground">
                  Zone: {editingExp.zoneName}
                </p>
              </div>
            </div>

            {editFeedback && (
              <div
                className={`p-3 border-2 border-border mb-4 font-mono text-xs font-bold flex items-center space-x-2 ${
                  editFeedback.type === "success"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-destructive text-destructive-foreground"
                }`}
              >
                {editFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{editFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono font-bold uppercase text-muted-foreground block mb-1">
                  Mission Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-background border-2 border-border p-2 text-xs font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono font-bold uppercase text-muted-foreground block mb-1">
                    Entry Cost (Coins)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={editCoinCost}
                    onChange={(e) => setEditCoinCost(parseInt(e.target.value) || 0)}
                    className="w-full bg-background border-2 border-border p-2 font-mono text-sm font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono font-bold uppercase text-muted-foreground block mb-1">
                    Reward (XP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    required
                    value={editXpReward}
                    onChange={(e) => setEditXpReward(parseInt(e.target.value) || 0)}
                    className="w-full bg-background border-2 border-border p-2 font-mono text-sm font-black text-emerald-500 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingExp(null)}
                  disabled={isSubmittingEdit}
                  className="py-2 px-4 text-xs font-mono font-bold border-2 border-border bg-card text-foreground hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="py-2 px-4 text-xs font-mono font-black uppercase tracking-wider bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:opacity-90 flex items-center space-x-1.5"
                >
                  {isSubmittingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
