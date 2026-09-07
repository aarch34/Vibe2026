import { getCurrentUserSession } from "@/lib/auth/session";
import { getUserQuests } from "@/lib/gameplay/progression-service";
import { Trophy, CheckCircle2, Zap, Coins, Sparkles } from "lucide-react";
import { formatCoins, formatXP } from "@/lib/utils";

export default async function QuestsPage() {
  const session = await getCurrentUserSession();
  const quests = await getUserQuests(session.eventId, session.profile.id);

  const completedCount = quests.filter((q) => q.isCompleted).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">
              Event Quests
            </h1>
            <p className="text-xs text-slate-400">
              Complete festival milestones for bonus Coins & XP
            </p>
          </div>
        </div>

        <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Completed
          </span>
          <span className="text-xs font-mono font-bold text-white">
            {completedCount} / {quests.length}
          </span>
        </div>
      </div>

      {/* Quests List */}
      <div className="space-y-2.5">
        {quests.map(({ quest, progress, isCompleted, percent }) => (
          <div
            key={quest.id}
            className={`p-4 rounded-2xl border transition-all ${
              isCompleted
                ? "bg-emerald-950/20 border-emerald-500/30"
                : "bg-slate-900/90 border-slate-800"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1 pr-3">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {quest.title}
                  </h3>
                  {isCompleted && (
                    <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completed</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{quest.description}</p>
              </div>

              {/* Reward Tags */}
              <div className="flex flex-col items-end space-y-1 shrink-0">
                {quest.coin_reward > 0 && (
                  <span className="flex items-center space-x-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/20">
                    <Coins className="w-3 h-3" />
                    <span>+{formatCoins(quest.coin_reward)}</span>
                  </span>
                )}
                {quest.xp_reward > 0 && (
                  <span className="flex items-center space-x-1 text-[11px] font-mono font-bold text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-500/20">
                    <Sparkles className="w-3 h-3" />
                    <span>+{quest.xp_reward} XP</span>
                  </span>
                )}
              </div>
            </div>

            {/* Progress Meter */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                <span>Progress</span>
                <span className="text-white font-semibold">
                  {progress.progress_value} / {progress.target_value}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted
                      ? "bg-emerald-400 shadow-[0_0_8px_#10b981]"
                      : "bg-gradient-to-r from-blue-500 to-cyan-400"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
