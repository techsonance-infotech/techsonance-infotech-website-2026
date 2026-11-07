import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function JobDetailLoading() {
  return (
    <div className="min-h-screen bg-[#FAFBFD] px-4 pt-32 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <Skeleton className="h-4 w-32 rounded-md" />

        {/* Role Header card */}
        <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-xs">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-10 w-2/3 max-w-md rounded-2xl" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        {/* Two-column specifications and application preview */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-8 shadow-xs">
              <Skeleton className="h-6 w-36 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-4/6 rounded-md" />
            </div>

            <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-8 shadow-xs">
              <Skeleton className="h-6 w-44 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-11/12 rounded-md" />
              <Skeleton className="h-4 w-4/5 rounded-md" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs">
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
