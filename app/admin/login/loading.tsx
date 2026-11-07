import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoginLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading authentication portal"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#FAFBFD] p-4"
    >
      {/* Background Ambience Waves */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#1155CC]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#22B6F6]/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header Skeleton */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Skeleton className="mb-4 h-14 w-14 rounded-2xl bg-slate-200" />
          <Skeleton className="h-8 w-64 rounded-xl bg-slate-200" />
          <Skeleton className="mt-2 h-4 w-52 rounded-lg bg-slate-100" />
        </div>

        {/* Card Skeleton */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(17,85,204,0.08)] backdrop-blur-xl sm:p-8">
          <div className="space-y-5">
            {/* Field 1: Work Email */}
            <div>
              <Skeleton className="mb-2 h-3.5 w-24 rounded bg-slate-200" />
              <Skeleton className="h-11 w-full rounded-xl bg-slate-100" />
            </div>

            {/* Field 2: Password */}
            <div>
              <Skeleton className="mb-2 h-3.5 w-20 rounded bg-slate-200" />
              <Skeleton className="h-11 w-full rounded-xl bg-slate-100" />
            </div>

            {/* Submit Button */}
            <Skeleton className="mt-2 h-11 w-full rounded-xl bg-slate-200" />
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
            <Skeleton className="h-3.5 w-44 rounded bg-slate-100" />
            <Skeleton className="h-3.5 w-16 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
