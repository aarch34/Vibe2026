import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoverLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <Skeleton className="h-12 w-full rounded-2xl" />
      
      <div className="flex space-x-2 overflow-hidden">
        <Skeleton className="h-8 w-24 rounded-full shrink-0" />
        <Skeleton className="h-8 w-28 rounded-full shrink-0" />
        <Skeleton className="h-8 w-20 rounded-full shrink-0" />
        <Skeleton className="h-8 w-24 rounded-full shrink-0" />
      </div>

      <div className="space-y-3 mt-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
