"use client";

import { useState, useMemo } from "react";
import {
  Gift,
  Search,
  Power,
  PackagePlus,
  Coins,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { formatCoins } from "@/lib/utils";
import { adminUpdateRewardAction } from "@/actions/admin/manage";

interface RewardItem {
  id: string;
  name: string;
  description?: string;
  sponsorName: string;
  coin_cost: number;
  stock: number;
  redemption_limit?: number;
  is_active?: boolean;
}

interface RewardsClientProps {
  initialRewards: RewardItem[];
}

export function RewardsClient({ initialRewards }: RewardsClientProps) {
  const [rewards, setRewards] = useState<RewardItem[]>(initialRewards);
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Restock / Edit Modal
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);
  const [stockAddAmount, setStockAddAmount] = useState<number>(10);
  const [newStockDirect, setNewStockDirect] = useState<number>(0);
  const [editCoinCost, setEditCoinCost] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredRewards = useMemo(() => {
    return rewards.filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.sponsorName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rewards, searchQuery]);

  const handleToggle = async (reward: RewardItem) => {
    const nextStatus = !(reward.is_active ?? true);
    setTogglingId(reward.id);

    try {
      const res = await adminUpdateRewardAction({
        rewardId: reward.id,
        isActive: nextStatus,
      });

      if (res.success) {
        setRewards((prev) =>
          prev.map((r) => (r.id === reward.id ? { ...r, is_active: nextStatus } : r))
        );
      } else {
        alert(res.message || "Failed to update reward status");
      }
    } catch (err: any) {
      alert(err.message || "Failed to toggle reward");
    } finally {
      setTogglingId(null);
    }
  };

  const openRestockModal = (reward: RewardItem) => {
    setEditingReward(reward);
    setStockAddAmount(10);
    setNewStockDirect(reward.stock);
    setEditCoinCost(reward.coin_cost);
    setFeedback(null);
  };

  const handleSaveRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await adminUpdateRewardAction({
        rewardId: editingReward.id,
        stockSet: newStockDirect,
        coinCost: editCoinCost,
      });

      if (res.success) {
        setRewards((prev) =>
          prev.map((r) =>
            r.id === editingReward.id
              ? { ...r, stock: newStockDirect, coin_cost: editCoinCost }
              : r
          )
        );
        setFeedback({ type: "success", text: "Reward stock and pricing saved!" });
        setTimeout(() => {
          setEditingReward(null);
          setFeedback(null);
        }, 1200);
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to update reward" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Error saving reward changes" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Reward Catalog
          </span>
          <span className="text-2xl font-black text-foreground">{rewards.length} Items</span>
        </div>

        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Total Inventory Units
          </span>
          <span className="text-2xl font-black text-primary">
            {rewards.reduce((sum, r) => sum + (r.stock || 0), 0)} Units
          </span>
        </div>

        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Sold Out Items
          </span>
          <span className="text-2xl font-black text-destructive">
            {rewards.filter((r) => (r.stock || 0) <= 0).length}
          </span>
        </div>

        <div className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Active Catalog
          </span>
          <span className="text-2xl font-black text-emerald-500">
            {rewards.filter((r) => r.is_active ?? true).length}
          </span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3 font-mono">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search swag, apparel, stickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border-2 border-border pl-9 pr-3 py-2 text-xs font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-neo"
          />
        </div>
      </div>

      {/* Rewards Table */}
      <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b-2 border-border text-muted-foreground uppercase text-[11px]">
                <th className="pb-3 font-black">Reward Swag</th>
                <th className="pb-3 font-black">Sponsor</th>
                <th className="pb-3 font-black">Coin Cost</th>
                <th className="pb-3 font-black">Current Stock</th>
                <th className="pb-3 font-black">Per-User Limit</th>
                <th className="pb-3 font-black">Status</th>
                <th className="pb-3 font-black text-right">Inventory Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border font-medium">
              {filteredRewards.map((r) => {
                const isActive = r.is_active ?? true;
                const isToggling = togglingId === r.id;
                const isOutOfStock = (r.stock || 0) <= 0;

                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-muted/70 transition-colors ${
                      isActive ? "" : "opacity-70 bg-muted/20"
                    }`}
                  >
                    <td className="py-3 pr-2">
                      <div className="font-black text-foreground">{r.name}</div>
                      {r.description && (
                        <div className="text-[10px] text-muted-foreground font-medium truncate max-w-xs">
                          {r.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-muted-foreground font-bold">{r.sponsorName}</td>
                    <td className="py-3 font-black text-primary">
                      {formatCoins(r.coin_cost)} Coins
                    </td>
                    <td className="py-3 font-black">
                      {isOutOfStock ? (
                        <span className="text-destructive flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 inline" />
                          <span>SOLD OUT</span>
                        </span>
                      ) : (
                        <span className="text-foreground">{r.stock} remaining</span>
                      )}
                    </td>
                    <td className="py-3 text-muted-foreground font-bold">
                      {r.redemption_limit ? `${r.redemption_limit} max` : "Unlimited"}
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
                          onClick={() => handleToggle(r)}
                          disabled={isToggling}
                          title={isActive ? "Pause Redemptions" : "Activate Reward"}
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
                          onClick={() => openRestockModal(r)}
                          title="Restock & Update Price"
                          className="px-2 py-1 border-2 border-border bg-card hover:bg-muted text-foreground font-mono text-[11px] font-black uppercase tracking-wider shadow-[1px_1px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 flex items-center space-x-1"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>Restock</span>
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

      {/* RESTOCK & PRICING MODAL */}
      {editingReward && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border-4 border-border shadow-neo w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setEditingReward(null)}
              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-4">
              <div className="w-9 h-9 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
                <Gift className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground uppercase tracking-tight font-mono">
                  Restock & Price Configuration
                </h3>
                <p className="text-xs font-mono font-bold text-muted-foreground">
                  Item: {editingReward.name}
                </p>
              </div>
            </div>

            {feedback && (
              <div
                className={`p-3 border-2 border-border mb-4 font-mono text-xs font-bold flex items-center space-x-2 ${
                  feedback.type === "success"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-destructive text-destructive-foreground"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveRestock} className="space-y-4 font-mono">
              <div>
                <label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                  Quick Add Units
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[5, 10, 25, 50].map((units) => (
                    <button
                      key={units}
                      type="button"
                      onClick={() => setNewStockDirect((prev) => prev + units)}
                      className="py-1.5 border-2 border-border bg-muted text-foreground font-black hover:bg-muted/80"
                    >
                      +{units}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                    Total Inventory Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={newStockDirect}
                    onChange={(e) => setNewStockDirect(parseInt(e.target.value) || 0)}
                    className="w-full bg-background border-2 border-border p-2 text-sm font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                    Cost in VIBE Coins
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={editCoinCost}
                    onChange={(e) => setEditCoinCost(parseInt(e.target.value) || 0)}
                    className="w-full bg-background border-2 border-border p-2 text-sm font-black text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingReward(null)}
                  disabled={isSubmitting}
                  className="py-2 px-4 text-xs font-bold border-2 border-border bg-card text-foreground hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-4 text-xs font-black uppercase tracking-wider bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:opacity-90 flex items-center space-x-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Inventory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
