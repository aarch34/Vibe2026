import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* Dashboard Welcome Skeleton */}
      <div className="flex items-center space-x-4 mb-2">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      
      {/* Level Progress Skeleton */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>

      {/* Suggested People Skeleton */}
      <div className="space-y-3 mt-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </div>

      {/* XP Guide Skeleton */}
      <Skeleton className="h-40 w-full rounded-3xl" />

      {/* Feed Skeleton */}
      <div className="space-y-4 mt-8">
        <Skeleton className="h-6 w-32" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
