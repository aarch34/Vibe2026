import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FriendsLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      <Skeleton className="h-12 w-full rounded-xl" />
      
      <div className="space-y-3 mt-6">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
