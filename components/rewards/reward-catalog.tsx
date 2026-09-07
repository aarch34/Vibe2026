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
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 w-full sm:w-80">
          <button
            onClick={() => setActiveTab("store")}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "store"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Reward Store ({rewards.length})
          </button>
          <button
            onClick={() => setActiveTab("vouchers")}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "vouchers"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            My Vouchers ({userRedemptions.length})
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
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
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                      {reward.name}
                    </h3>
                    <div className="text-right shrink-0 ml-2">
                      <span className="flex items-center justify-end space-x-1 text-sm font-black font-mono text-amber-400">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span>{formatCoins(reward.coin_cost)}</span>
                      </span>
                    </div>
                  </div>

                  {reward.sponsorName && (
                    <span className="inline-block text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/20">
                      Presented by {reward.sponsorName}
                    </span>
                  )}
                  <p className="text-xs text-slate-400 leading-relaxed">{reward.description}</p>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Stock remaining: <strong className="text-slate-200">{reward.stock}</strong>
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Claimed: {reward.userRedemptionsCount}
                    {reward.redemption_limit && ` / ${reward.redemption_limit}`}
                  </span>

                  {isOutOfStock ? (
                    <button
                      disabled
                      className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold cursor-not-allowed"
                    >
                      Sold Out
                    </button>
                  ) : isLimitReached ? (
                    <button
                      disabled
                      className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold cursor-not-allowed"
                    >
                      Limit Reached
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={redeemingId === reward.id || !hasEnoughCoins}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 flex items-center space-x-1.5 ${
                        hasEnoughCoins
                          ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                          : "bg-slate-800 text-slate-400 cursor-not-allowed"
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

      {/* Tab 2: My Vouchers */}
      {activeTab === "vouchers" && (
        <div>
          {userRedemptions.length === 0 ? (
            <div className="text-center p-8 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2 max-w-md mx-auto">
              <Gift className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Vouchers Yet</h3>
              <p className="text-xs text-slate-400">
                Spend your earned VIBE Coins in the store to claim exclusive event
                merchandise and sponsor perks!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRedemptions.map((voucher) => (
                <div
                  key={voucher.id}
                  className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 space-y-3 shadow-md"
                >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                      VIBE Event Voucher
                    </span>
                    <h4 className="text-sm font-black text-white mt-0.5">
                      {voucher.rewardName}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Redeemed on {new Date(voucher.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      voucher.status === "claimed"
                        ? "bg-slate-800 text-slate-400"
                        : "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {voucher.status}
                  </span>
                </div>

                {/* Unique Code Display Box */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">
                      Voucher Code (Show to Staff)
                    </span>
                    <span className="text-sm font-mono font-black tracking-wider text-amber-300">
                      {voucher.code}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(voucher.code)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 active:scale-95 transition-all"
                  >
                    {copiedCode === voucher.code ? (
                      <Check className="w-4 h-4 text-emerald-400" />
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
