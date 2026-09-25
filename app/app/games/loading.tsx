import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function GamesLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center justify-center space-y-3 py-6">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      {/* Game Cards */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-80 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
