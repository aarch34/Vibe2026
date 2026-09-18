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
          <Trophy className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-lg font-black text-foreground tracking-tight uppercase">
              Event Quests
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Complete festival milestones for bonus Coins & XP
            </p>
          </div>
        </div>

        <div className="bg-card px-3 py-1.5 border-2 border-border shadow-[2px_2px_0px_var(--border)] text-right">
          <span className="text-[10px] uppercase font-black text-muted-foreground block">
            Completed
          </span>
          <span className="text-xs font-mono font-black text-foreground">
            {completedCount} / {quests.length}
          </span>
        </div>
      </div>

      {/* Quests List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quests.map(({ quest, progress, isCompleted, percent }) => (
          <div
            key={quest.id}
            className={`p-4 border-2 border-border shadow-neo transition-all ${
              isCompleted
                ? "bg-secondary/20"
                : "bg-card text-card-foreground"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1 pr-3">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-black text-foreground tracking-tight">
                    {quest.title}
                  </h3>
                  {isCompleted && (
                    <span className="flex items-center space-x-1 text-[10px] font-black px-2 py-0.5 bg-secondary text-secondary-foreground border border-border">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completed</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-medium">{quest.description}</p>
              </div>

              {/* Reward Tags */}
              <div className="flex flex-col items-end space-y-1 shrink-0">
                {quest.coin_reward > 0 && (
                  <span className="flex items-center space-x-1 text-[11px] font-mono font-black bg-secondary text-secondary-foreground px-2 py-0.5 border border-border shadow-[1px_1px_0px_var(--border)]">
                    <Coins className="w-3 h-3" />
                    <span>+{formatCoins(quest.coin_reward)}</span>
                  </span>
                )}
                {quest.xp_reward > 0 && (
                  <span className="flex items-center space-x-1 text-[11px] font-mono font-black bg-primary text-primary-foreground px-2 py-0.5 border border-border shadow-[1px_1px_0px_var(--border)]">
                    <Sparkles className="w-3 h-3" />
                    <span>+{quest.xp_reward} XP</span>
                  </span>
                )}
              </div>
            </div>

            {/* Progress Meter */}
            <div className="mt-3 pt-2.5 border-t-2 border-border">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono font-bold mb-1">
                <span>Progress</span>
                <span className="text-foreground font-black">
                  {progress.progress_value} / {progress.target_value}
                </span>
              </div>
              <div className="w-full h-2.5 bg-muted border-2 border-border p-0.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCompleted
                      ? "bg-secondary"
                      : "bg-primary"
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
