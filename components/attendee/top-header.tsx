import Link from "next/link";
import { Coins, Sparkles } from "lucide-react";
import { formatCoins } from "@/lib/utils";

interface TopHeaderProps {
  vibeId: string;
  coins: number;
  levelName: string;
}

export function TopHeader({ vibeId, coins, levelName }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#070B14]/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-2">
          <Link href="/app" className="flex items-center space-x-1.5">
            <span className="text-lg font-black tracking-wider bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              VIBE
            </span>
            <span className="text-[10px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/30 text-blue-300">
              '26
            </span>
          </Link>
          <span className="text-xs font-mono text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
            {vibeId}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Level Pill */}
          <div className="flex items-center space-x-1 text-[11px] font-semibold text-purple-300 bg-purple-950/40 border border-purple-500/30 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>{levelName.replace("VIBE ", "")}</span>
          </div>

          {/* Coins Pill */}
          <Link
            href="/app/rewards"
            className="flex items-center space-x-1.5 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 transition-all duration-150 border border-amber-500/30 px-2.5 py-1 rounded-full text-amber-400"
          >
            <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold tracking-tight font-mono">
              {formatCoins(coins)}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
