import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-[#FAFBFD] px-4 pt-32 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        {/* Hero skeleton */}
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Skeleton className="mx-auto h-4 w-32 rounded-full" />
          <Skeleton className="mx-auto h-12 w-3/4 max-w-lg rounded-2xl" />
          <Skeleton className="mx-auto h-4 w-2/3 max-w-md rounded-xl" />
        </div>

        {/* Categories Bar skeleton */}
        <div className="flex justify-center gap-2 border-b border-slate-100 pb-6">
          <Skeleton className="h-9 w-16 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>

        {/* Featured Card skeleton */}
        <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-xs lg:grid-cols-12 lg:p-0">
          <Skeleton className="h-64 sm:h-80 lg:col-span-6 lg:h-96" />
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-8 w-5/6 rounded-xl" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-4/5 rounded-md" />
            </div>
            <div className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-28 rounded-md" />
                  <Skeleton className="h-2.5 w-20 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
          </div>
        </div>

        {/* Grid cards skeleton */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs"
            >
              <Skeleton className="h-48 w-full rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-6 w-full rounded-lg" />
                <Skeleton className="h-3.5 w-4/5 rounded-md" />
              </div>
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
                <Skeleton className="h-3 w-12 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
