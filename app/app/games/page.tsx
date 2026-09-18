import { getCurrentUserSession } from "@/lib/auth/session";
import { getWalletSummary } from "@/lib/wallet/wallet-service";
import { getUserPlayerStats } from "@/lib/gameplay/progression-service";
import { GamesHubClient } from "@/components/games/games-hub-client";
import { Gamepad2, Coins, Sparkles, Trophy } from "lucide-react";
import { formatCoins } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GamesHubPage() {
  const session = await getCurrentUserSession();
  const walletSummary = await getWalletSummary(session.eventId, session.profile.id);
  const playerStats = await getUserPlayerStats(session.profile.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight font-mono">
              The Four Playable Games
            </h1>
            <p className="text-xs text-muted-foreground font-bold">
              Compete in interactive challenges to earn XP, level up, and win bonus VIBE Coins!
            </p>
          </div>
        </div>

        {/* User Balance & Stats Badge */}
        <div className="flex items-center space-x-3 bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)] px-3.5 py-1.5 self-start sm:self-auto font-mono text-xs text-foreground">
          <div className="flex items-center space-x-1.5 text-primary font-black">
            <Coins className="w-4 h-4" />
            <span>{formatCoins(walletSummary.wallet.balance)} VIBE</span>
          </div>
          <span className="text-border font-black">•</span>
          <div className="text-muted-foreground font-bold">
            Played: <strong className="text-foreground font-black">{playerStats.gamesPlayedCount}</strong>
          </div>
        </div>
      </div>

      {/* Playable Games Grid */}
      <GamesHubClient userBalance={walletSummary.wallet.balance} />
    </div>
  );
}
