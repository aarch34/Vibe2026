import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PostLoading() {
  return (
    <div className="max-w-xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="w-9 h-9 rounded-full" />
        <Skeleton className="h-6 w-40" />
        <div className="w-9" />
      </div>

      {/* Form Skeleton */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-xl space-y-4">
        <Skeleton className="h-6 w-48 rounded-full" />

        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <div className="flex flex-wrap gap-1.5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-20 rounded-full" />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>

        <Skeleton className="h-14 w-full rounded-2xl mt-4" />
      </div>
    </div>
  );
}
