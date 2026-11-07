import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CareersLoading() {
  return (
    <div className="min-h-screen bg-[#FAFBFD] px-4 pt-36 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Hero header skeleton */}
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-4 w-32 rounded-full" />
          <Skeleton className="mx-auto h-10 w-3/4 max-w-md rounded-2xl" />
          <Skeleton className="mx-auto h-4 w-2/3 max-w-lg rounded-xl" />
        </div>

        {/* Filter bar skeleton */}
        <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <div className="flex gap-2 overflow-hidden pt-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </div>

        {/* Job cards skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="space-y-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-xs"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-64 rounded-xl" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-28 rounded-xl" />
                  <Skeleton className="h-9 w-28 rounded-xl" />
                </div>
              </div>
              <Skeleton className="h-14 w-full rounded-xl" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-6 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
