import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-xl space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        <Skeleton className="h-10 w-32 rounded-2xl shrink-0" />
        <Skeleton className="h-10 w-40 rounded-2xl shrink-0" />
        <Skeleton className="h-10 w-40 rounded-2xl shrink-0" />
      </div>

      {/* Leaderboard Table / List Skeleton */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
        <div className="divide-y divide-border/60">
          <div className="px-6 py-3 bg-secondary/50 flex items-center justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-32 flex-1 ml-6" />
            <Skeleton className="h-4 w-16 hidden sm:block mx-4" />
            <Skeleton className="h-4 w-20 text-right" />
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div className="w-12 text-center flex justify-center shrink-0">
                <Skeleton className="h-6 w-6 rounded-md" />
              </div>
              <div className="flex-1 flex items-center space-x-3 pr-2 min-w-0">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1 min-w-0">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="w-24 hidden sm:flex justify-center shrink-0">
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="w-28 flex justify-end shrink-0">
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
