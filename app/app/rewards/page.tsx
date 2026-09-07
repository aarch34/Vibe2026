import { getCurrentUserSession } from "@/lib/auth/session";
import { getWalletSummary } from "@/lib/wallet/wallet-service";
import {
  getRewardsCatalog,
  getUserRedemptions,
} from "@/lib/rewards/reward-service";
import { RewardCatalogClient } from "@/components/rewards/reward-catalog";
import { Gift } from "lucide-react";

export default async function RewardsPage() {
  const session = await getCurrentUserSession();
  const walletSummary = await getWalletSummary(
    session.eventId,
    session.profile.id
  );
  const rewards = await getRewardsCatalog(session.eventId, session.profile.id);
  const userRedemptions = await getUserRedemptions(
    session.eventId,
    session.profile.id
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Gift className="w-5 h-5 text-amber-400" />
        <div>
          <h1 className="text-lg font-black text-white tracking-tight">
            Reward Marketplace
          </h1>
          <p className="text-xs text-slate-400">
            Redeem your VIBE Coins for exclusive merchandise & sponsor perks
          </p>
        </div>
      </div>

      <RewardCatalogClient
        rewards={rewards}
        userRedemptions={userRedemptions}
        userBalance={walletSummary.wallet.balance}
      />
    </div>
  );
}
