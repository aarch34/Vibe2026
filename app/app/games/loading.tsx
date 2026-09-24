import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function GamesLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* Header */}
      <Skeleton className="h-28 w-full rounded-3xl" />
      
      {/* Score History */}
      <Skeleton className="h-40 w-full rounded-3xl" />
      
      {/* Game Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
