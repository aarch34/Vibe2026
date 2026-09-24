import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* Cover and Avatar */}
      <div className="relative">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <Skeleton className="h-24 w-24 rounded-full border-4 border-background" />
        </div>
      </div>
      
      {/* Name and info */}
      <div className="mt-12 text-center space-y-3 flex flex-col items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64 rounded-full mt-2" />
      </div>

      {/* Action buttons */}
      <div className="flex justify-center space-x-3 mt-4">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-12 w-full rounded-xl mt-6" />

      {/* Stats and Feed/Content */}
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
