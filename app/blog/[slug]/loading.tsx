import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogPostLoading() {
  return (
    <div className="min-h-screen bg-[#FAFBFD] px-4 pt-32 pb-20 sm:px-6 lg:px-8">
      {/* Top progress bar placeholder */}
      <div className="fixed top-0 right-0 left-0 z-50 h-[3px] bg-slate-200" />

      {/* Hero section skeleton */}
      <div className="mx-auto max-w-4xl space-y-6 text-center">
        <Skeleton className="mx-auto h-4 w-28 rounded-md" />
        <Skeleton className="mx-auto h-4 w-32 rounded-full" />
        <Skeleton className="mx-auto h-12 w-4/5 max-w-2xl rounded-2xl" />
        <div className="flex items-center justify-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
      </div>

      {/* Content layout skeleton */}
      <div className="mx-auto mt-16 max-w-7xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Sidebar */}
          <div className="hidden space-y-6 lg:col-span-3 lg:block">
            <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs">
              <Skeleton className="h-4 w-20 rounded-md" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              </div>
            </div>
            <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs">
              <Skeleton className="h-4 w-16 rounded-md" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-14 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-6 w-12 rounded-md" />
              </div>
            </div>
          </div>

          {/* Main article body */}
          <div className="col-span-1 space-y-6 rounded-3xl border border-slate-100 bg-white p-8 shadow-xs lg:col-span-9">
            <Skeleton className="h-6 w-3/4 rounded-xl" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <Skeleton className="my-6 h-64 w-full rounded-2xl" />
            <Skeleton className="h-5 w-1/2 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-11/12 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
