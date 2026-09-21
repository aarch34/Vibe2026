"use client";

import { useState } from "react";
import { Zone } from "@/types/database";
import {
  MapPin,
  Coins,
  Users,
  Power,
  Award,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { formatCoins } from "@/lib/utils";
import { adminToggleZoneAction, adminAwardZoneCoinsAction } from "@/actions/admin/manage";

interface ZoneWithStats extends Zone {
  attendeesCount: number;
  experiencesCount: number;
}

interface ZonesClientProps {
  initialZones: ZoneWithStats[];
}

export function ZonesClient({ initialZones }: ZonesClientProps) {
  const [zones, setZones] = useState<ZoneWithStats[]>(initialZones);
  const [togglingZoneId, setTogglingZoneId] = useState<string | null>(null);

  // Bonus coins modal state
  const [bonusModalZone, setBonusModalZone] = useState<ZoneWithStats | null>(null);
  const [bonusAmount, setBonusAmount] = useState<number>(250);
  const [bonusReason, setBonusReason] = useState<string>("District Rally Spirit Bonus");
  const [isSubmittingBonus, setIsSubmittingBonus] = useState(false);
  const [bonusFeedback, setBonusFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleToggleZone = async (zone: ZoneWithStats) => {
    const nextStatus = !(zone.is_active ?? true);
    setTogglingZoneId(zone.id);

    try {
      const res = await adminToggleZoneAction({
        zoneId: zone.id,
        isActive: nextStatus,
      });

      if (res.success) {
        setZones((prev) =>
          prev.map((z) => (z.id === zone.id ? { ...z, is_active: nextStatus } : z))
        );
      } else {
        alert(res.message || "Failed to update zone status");
      }
    } catch (err: any) {
      alert(err.message || "Failed to toggle zone");
    } finally {
      setTogglingZoneId(null);
    }
  };

  const handleAwardBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusModalZone) return;

    if (bonusAmount <= 0) {
      setBonusFeedback({ type: "error", text: "Coin amount must be greater than 0." });
      return;
    }
    if (!bonusReason.trim()) {
      setBonusFeedback({ type: "error", text: "Please enter an audit reason for the bonus." });
      return;
    }

    setIsSubmittingBonus(true);
    setBonusFeedback(null);

    try {
      const res = await adminAwardZoneCoinsAction({
        zoneId: bonusModalZone.id,
        coins: bonusAmount,
        reason: bonusReason,
      });

      if (res.success && typeof res.newCoins === "number") {
        setZones((prev) =>
          prev.map((z) =>
            z.id === bonusModalZone.id ? { ...z, coins_collected: res.newCoins } : z
          )
        );
        setBonusFeedback({
          type: "success",
          text: `Successfully granted +${bonusAmount} coins to ${bonusModalZone.name}!`,
        });
        setTimeout(() => {
          setBonusModalZone(null);
          setBonusFeedback(null);
        }, 1200);
      } else {
        setBonusFeedback({
          type: "error",
          text: res.message || "Failed to award zone bonus coins.",
        });
      }
    } catch (err: any) {
      setBonusFeedback({
        type: "error",
        text: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmittingBonus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Statistics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Official Zones
          </span>
          <span className="text-2xl font-black text-foreground">{zones.length}</span>
        </div>

        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Active Status
          </span>
          <span className="text-2xl font-black text-emerald-500">
            {zones.filter((z) => z.is_active ?? true).length} / {zones.length}
          </span>
        </div>

        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Assigned Attendees
          </span>
          <span className="text-2xl font-black text-primary">
            {zones.reduce((sum, z) => sum + (z.attendeesCount || 0), 0)}
          </span>
        </div>

        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Total Coins Banked
          </span>
          <span className="text-2xl font-black text-amber-500">
            {formatCoins(zones.reduce((sum, z) => sum + (z.coins_collected || 0), 0))}
          </span>
        </div>
      </div>

      {/* Zone Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {zones.map((zone) => {
          const isActive = zone.is_active ?? true;
          const isToggling = togglingZoneId === zone.id;

          return (
            <div
              key={zone.id}
              className={`relative bg-card text-card-foreground border-2 border-border shadow-neo transition-all ${
                isActive ? "" : "opacity-75 border-dashed"
              }`}
            >
              {/* Card Header */}
              <div className="p-5 border-b-2 border-border flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-black bg-primary text-primary-foreground border border-border">
                      Z{zone.sort_order}
                    </span>
                    <h2 className="text-lg font-black text-foreground tracking-tight">
                      {zone.name}
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-bold text-primary">
                    {zone.slug}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-black border border-border font-mono shadow-[1px_1px_0px_var(--border)] ${
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isActive ? "ACTIVE" : "PAUSED"}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                <p className="text-xs text-muted-foreground font-medium line-clamp-2">
                  {zone.description || "Official oceanic zone for District 3192 festival events."}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-muted border border-border">
                    <div className="flex items-center space-x-1 text-muted-foreground text-[10px] uppercase font-bold">
                      <Users className="w-3 h-3 text-primary" />
                      <span>Attendees</span>
                    </div>
                    <span className="text-base font-black text-foreground">
                      {zone.attendeesCount || 0}
                    </span>
                  </div>

                  <div className="p-2.5 bg-muted border border-border">
                    <div className="flex items-center space-x-1 text-muted-foreground text-[10px] uppercase font-bold">
                      <Coins className="w-3 h-3 text-amber-500" />
                      <span>Banked Coins</span>
                    </div>
                    <span className="text-base font-black text-amber-500">
                      {formatCoins(zone.coins_collected || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground font-bold pt-1">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span>
                      Coords: ({zone.map_data?.x ?? 0}, {zone.map_data?.y ?? 0})
                    </span>
                  </span>
                  <span>{zone.experiencesCount || 0} Missions</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-4 bg-muted/40 border-t-2 border-border flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleZone(zone)}
                  disabled={isToggling}
                  className={`flex-1 py-2 px-3 text-xs font-black font-mono uppercase tracking-wider border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 ${
                    isActive
                      ? "bg-card text-foreground hover:bg-muted"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  {isToggling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Power className="w-3.5 h-3.5" />
                  )}
                  <span>{isActive ? "Pause Zone" : "Activate"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBonusModalZone(zone);
                    setBonusAmount(250);
                    setBonusReason("District Spirit & Cheer Rally Bonus");
                    setBonusFeedback(null);
                  }}
                  className="flex-1 py-2 px-3 text-xs font-black font-mono uppercase tracking-wider bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 hover:opacity-95 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Award Bonus</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AWARD BONUS COINS MODAL */}
      {bonusModalZone && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border-4 border-border shadow-neo w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setBonusModalZone(null)}
              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-4">
              <div className="w-9 h-9 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground uppercase tracking-tight">
                  Award Zone Bonus Coins
                </h3>
                <p className="text-xs font-mono font-bold text-primary">
                  Target Zone: {bonusModalZone.name}
                </p>
              </div>
            </div>

            {bonusFeedback && (
              <div
                className={`p-3 border-2 border-border mb-4 font-mono text-xs font-bold flex items-center space-x-2 ${
                  bonusFeedback.type === "success"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-destructive text-destructive-foreground"
                }`}
              >
                {bonusFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{bonusFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleAwardBonus} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono font-bold uppercase text-muted-foreground block mb-1">
                  Preset Coin Bonus
                </label>
                <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                  {[100, 250, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBonusAmount(amt)}
                      className={`py-1.5 border-2 border-border font-black ${
                        bonusAmount === amt
                          ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_var(--border)]"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold uppercase text-muted-foreground block mb-1">
                  Custom Coin Amount
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-background border-2 border-border p-2 font-mono text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold uppercase text-muted-foreground block mb-1">
                  Audit Reason (Permanent Log)
                </label>
                <input
                  type="text"
                  required
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  placeholder="e.g. Zone Spirit Award, Dance Battle Winner..."
                  className="w-full bg-background border-2 border-border p-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setBonusModalZone(null)}
                  disabled={isSubmittingBonus}
                  className="py-2 px-4 text-xs font-mono font-bold border-2 border-border bg-card text-foreground hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingBonus}
                  className="py-2 px-4 text-xs font-mono font-black uppercase tracking-wider bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:opacity-90 flex items-center space-x-1.5"
                >
                  {isSubmittingBonus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Grant</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
