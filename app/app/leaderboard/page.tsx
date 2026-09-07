import { getCurrentUserSession } from "@/lib/auth/session";
import {
  getLeaderboard,
  getUserLeaderboardRank,
} from "@/lib/leaderboard/leaderboard-service";
import { Trophy, Medal, Crown, Sparkles, User } from "lucide-react";
import { formatXP } from "@/lib/utils";

export default async function LeaderboardPage() {
  const session = await getCurrentUserSession();
  const { entries, totalParticipants } = await getLeaderboard(
    session.eventId,
    50,
    0
  );
  const currentUserRank = await getUserLeaderboardRank(
    session.eventId,
    session.profile.id
  );

  const top3 = entries.slice(0, 3);
  const others = entries.slice(3);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">
              District Leaderboard
            </h1>
            <p className="text-xs text-slate-400">
              Rotaract District 3192 Live Standings
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
          {totalParticipants} Attendees
        </span>
      </div>

      {/* Current User Rank Sticky Banner */}
      {currentUserRank && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-950/60 border-2 border-blue-500/40 shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-black font-mono text-white text-sm">
              #{currentUserRank.rank}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-white">Your Rank</span>
                <span className="text-[10px] text-blue-300 font-mono">
                  ({currentUserRank.vibe_id})
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {currentUserRank.level_name}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-black font-mono text-cyan-300">
              {formatXP(currentUserRank.total_xp)}
            </span>
            <p className="text-[10px] text-slate-400">
              {currentUserRank.completions_count} missions
            </p>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 pt-2 items-end">
          {/* 2nd Place (Silver) */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700 text-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-400 flex items-center justify-center mx-auto text-slate-200 text-xs font-bold">
              2
            </div>
            <p className="text-xs font-bold text-white truncate">
              {top3[1].display_name.split(" ")[0]}
            </p>
            <p className="text-[10px] font-mono font-bold text-slate-300">
              {formatXP(top3[1].total_xp)}
            </p>
            <span className="text-[9px] text-slate-400 block truncate">
              {top3[1].level_name}
            </span>
          </div>

          {/* 1st Place (Gold Champion) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-950/40 to-slate-900 border-2 border-amber-500/60 text-center space-y-1 relative -top-2 shadow-lg shadow-amber-500/10">
            <Crown className="w-5 h-5 text-amber-400 mx-auto -mt-1" />
            <div className="w-9 h-9 rounded-full bg-amber-500 border-2 border-amber-300 flex items-center justify-center mx-auto text-slate-950 text-xs font-black">
              1
            </div>
            <p className="text-xs font-extrabold text-white truncate">
              {top3[0].display_name.split(" ")[0]}
            </p>
            <p className="text-[11px] font-mono font-black text-amber-400">
              {formatXP(top3[0].total_xp)}
            </p>
            <span className="text-[9px] font-semibold text-amber-300 block truncate">
              {top3[0].level_name}
            </span>
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-amber-800/40 text-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-amber-900/50 border border-amber-700 flex items-center justify-center mx-auto text-amber-300 text-xs font-bold">
              3
            </div>
            <p className="text-xs font-bold text-white truncate">
              {top3[2].display_name.split(" ")[0]}
            </p>
            <p className="text-[10px] font-mono font-bold text-slate-300">
              {formatXP(top3[2].total_xp)}
            </p>
            <span className="text-[9px] text-slate-400 block truncate">
              {top3[2].level_name}
            </span>
          </div>
        </div>
      )}

      {/* Ranked List */}
      <div className="space-y-1.5">
        {others.map((entry) => {
          const isCurrentUser = entry.profile_id === session.profile.id;

          return (
            <div
              key={entry.profile_id}
              className={`p-3 rounded-xl flex items-center justify-between transition-colors ${
                isCurrentUser
                  ? "bg-blue-950/40 border border-blue-500/50"
                  : "bg-slate-900/60 border border-slate-800/80"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="w-6 text-center font-mono font-bold text-xs text-slate-400">
                  {entry.rank}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>{entry.display_name}</span>
                    {isCurrentUser && (
                      <span className="text-[9px] font-semibold bg-blue-500/30 text-blue-300 px-1.5 rounded">
                        You
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {entry.level_name} • {entry.vibe_id}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black font-mono text-purple-300">
                  {formatXP(entry.total_xp)}
                </span>
                <p className="text-[10px] text-slate-400 font-mono">
                  {entry.completions_count} missions
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
