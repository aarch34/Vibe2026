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
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              The Four Playable Games
            </h1>
            <p className="text-xs text-slate-400">
              Compete in interactive challenges to earn XP, level up, and win bonus VIBE Coins!
            </p>
          </div>
        </div>

        {/* User Balance & Stats Badge */}
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl self-start sm:self-auto font-mono text-xs">
          <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
            <Coins className="w-4 h-4" />
            <span>{formatCoins(walletSummary.wallet.balance)} VIBE</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="text-slate-400">
            Played: <strong className="text-white">{playerStats.gamesPlayedCount}</strong>
          </div>
        </div>
      </div>

      {/* Playable Games Grid */}
      <GamesHubClient userBalance={walletSummary.wallet.balance} />
    </div>
  );
}
