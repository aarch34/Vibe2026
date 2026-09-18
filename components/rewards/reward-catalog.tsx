"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gift,
  Coins,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Loader2,
  Tag,
  Copy,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { redeemRewardAction } from "@/actions/rewards/redeem";
import { RewardWithUserStatus } from "@/lib/rewards/reward-service";
import { RewardRedemption } from "@/types/database";
import { formatCoins } from "@/lib/utils";

interface RewardCatalogProps {
  rewards: RewardWithUserStatus[];
  userRedemptions: (RewardRedemption & { rewardName: string })[];
  userBalance: number;
}

export function RewardCatalogClient({
  rewards,
  userRedemptions,
  userBalance,
}: RewardCatalogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"store" | "vouchers">("store");
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function handleRedeem(reward: RewardWithUserStatus) {
    if (userBalance < reward.coin_cost) {
      setErrorMsg(`Insufficient Coins. You need ${reward.coin_cost} Coins.`);
      return;
    }

    setRedeemingId(reward.id);
    setErrorMsg(null);

    const idempotencyKey = `rdm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      const res = await redeemRewardAction({
        rewardId: reward.id,
        idempotencyKey,
      });

      if (!res.success) {
        setErrorMsg(res.message || "Failed to redeem reward.");
      } else {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#F59E0B", "#10B981", "#3B82F6"],
        });
        setActiveTab("vouchers");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to redeem reward");
    } finally {
      setRedeemingId(null);
    }
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex justify-center sm:justify-start">
        <div className="grid grid-cols-2 p-1.5 bg-card border-2 border-border shadow-[3px_3px_0px_var(--border)] w-full sm:w-80">
          <button
            onClick={() => setActiveTab("store")}
            className={`py-2 text-xs font-black transition-all border-2 ${
              activeTab === "store"
                ? "bg-primary text-primary-foreground border-border shadow-[2px_2px_0px_var(--border)]"
                : "text-muted-foreground hover:text-foreground border-transparent hover:border-border"
            }`}
          >
            Reward Store ({rewards.length})
          </button>
          <button
            onClick={() => setActiveTab("vouchers")}
            className={`py-2 text-xs font-black transition-all border-2 ${
              activeTab === "vouchers"
                ? "bg-secondary text-secondary-foreground border-border shadow-[2px_2px_0px_var(--border)]"
                : "text-muted-foreground hover:text-foreground border-transparent hover:border-border"
            }`}
          >
            My Vouchers ({userRedemptions.length})
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-secondary text-secondary-foreground border-2 border-border shadow-[3px_3px_0px_var(--border)] text-xs flex items-center space-x-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab 1: Reward Store */}
      {activeTab === "store" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => {
            const hasEnoughCoins = userBalance >= reward.coin_cost;
            const isOutOfStock = reward.stock <= 0;
            const isLimitReached = !reward.canRedeem && !isOutOfStock;

            return (
              <div
                key={reward.id}
                className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-black text-foreground tracking-tight leading-snug font-mono">
                      {reward.name}
                    </h3>
                    <div className="text-right shrink-0 ml-2">
                      <span className="flex items-center justify-end space-x-1 text-sm font-black font-mono text-primary">
                        <Coins className="w-4 h-4" />
                        <span>{formatCoins(reward.coin_cost)}</span>
                      </span>
                    </div>
                  </div>

                  {reward.sponsorName && (
                    <span className="inline-block text-[10px] font-black text-secondary-foreground bg-secondary px-2 py-0.5 border-2 border-border shadow-[1px_1px_0px_var(--border)]">
                      Presented by {reward.sponsorName}
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground leading-relaxed font-bold">{reward.description}</p>
                  <span className="text-[10px] text-muted-foreground block font-mono font-bold">
                    Stock remaining: <strong className="text-foreground">{reward.stock}</strong>
                  </span>
                </div>

                <div className="pt-3 border-t-2 border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-mono font-bold">
                    Claimed: {reward.userRedemptionsCount}
                    {reward.redemption_limit && ` / ${reward.redemption_limit}`}
                  </span>

                  {isOutOfStock ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-muted text-muted-foreground border-2 border-border text-xs font-black cursor-not-allowed opacity-60"
                    >
                      Sold Out
                    </button>
                  ) : isLimitReached ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-muted text-muted-foreground border-2 border-border text-xs font-black cursor-not-allowed opacity-60"
                    >
                      Limit Reached
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={redeemingId === reward.id || !hasEnoughCoins}
                      className={`px-4 py-2 text-xs font-black transition-all flex items-center space-x-1.5 ${
                        hasEnoughCoins
                          ? "neo-btn-secondary"
                          : "bg-muted text-muted-foreground border-2 border-border text-xs font-bold cursor-not-allowed opacity-60"
                      }`}
                    >
                      {redeemingId === reward.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>
                          {hasEnoughCoins
                            ? `Redeem (${reward.coin_cost} 🪙)`
                            : "Need More Coins"}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: User's Claimed Vouchers */}
      {activeTab === "vouchers" && (
        <div className="space-y-4">
          {userRedemptions.length === 0 ? (
            <div className="p-8 text-center bg-card text-card-foreground border-2 border-border shadow-neo max-w-md mx-auto space-y-2">
              <Gift className="w-10 h-10 text-primary mx-auto" />
              <h3 className="text-sm font-black text-foreground font-mono">No Vouchers Yet</h3>
              <p className="text-xs text-muted-foreground font-bold">
                Spend your earned VIBE Coins in the store to claim exclusive event
                merchandise and sponsor perks!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRedemptions.map((voucher) => (
                <div
                  key={voucher.id}
                  className="p-4 bg-card text-card-foreground border-2 border-border shadow-neo space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-black text-primary tracking-wider font-mono">
                        VIBE Event Voucher
                      </span>
                      <h4 className="text-sm font-black text-foreground mt-0.5 font-mono">
                        {voucher.rewardName}
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-bold">
                        Redeemed on {new Date(voucher.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 border-2 border-border uppercase ${
                        voucher.status === "claimed"
                          ? "bg-muted text-muted-foreground"
                          : "bg-secondary text-secondary-foreground shadow-[1px_1px_0px_var(--border)]"
                      }`}
                    >
                      {voucher.status}
                    </span>
                  </div>

                  {/* Unique Code Display Box */}
                  <div className="p-3 bg-muted border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-black text-muted-foreground block font-mono">
                        Voucher Code (Show to Staff)
                      </span>
                      <span className="text-sm font-mono font-black tracking-wider text-foreground">
                        {voucher.code}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(voucher.code)}
                      className="p-2 bg-card hover:bg-muted text-card-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] text-xs flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      {copiedCode === voucher.code ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
