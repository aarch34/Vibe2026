import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
          <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shrink-0" />
          <div className="flex-1 w-full space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-3">
              <div className="space-y-2 flex flex-col items-center sm:items-start w-full sm:w-auto">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-28 rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-xl" />
              </div>
            </div>
            <Skeleton className="h-4 w-64 mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-72 mx-auto sm:mx-0" />
            <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="p-4 rounded-2xl bg-secondary/50 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>

      {/* Leaderboard Link Skeleton */}
      <Skeleton className="h-20 w-full rounded-3xl" />

      {/* Posts Section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-md sm:rounded-xl" />
          ))}
        </div>
      </div>
      
      {/* Friends Section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
