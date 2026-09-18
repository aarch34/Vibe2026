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
      <div className="flex items-center space-x-2.5">
        <div className="w-10 h-10 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
          <Gift className="w-5 h-5 text-secondary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight font-mono">
            Reward Marketplace
          </h1>
          <p className="text-xs text-muted-foreground font-bold">
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
