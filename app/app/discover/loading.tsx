import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoverLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      <div className="flex flex-col space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-[80%]" />
      </div>

      <Skeleton className="h-12 w-full rounded-2xl" />
      
      <div className="flex space-x-2 overflow-hidden">
        <Skeleton className="h-8 w-24 rounded-full shrink-0" />
        <Skeleton className="h-8 w-28 rounded-full shrink-0" />
        <Skeleton className="h-8 w-20 rounded-full shrink-0" />
        <Skeleton className="h-8 w-24 rounded-full shrink-0" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-3xl border border-border bg-card p-4 flex flex-col items-center text-center space-y-3">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2 w-full flex flex-col items-center">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-full rounded-xl mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
