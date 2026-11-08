import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8 p-6">
      {/* Header skeleton */}
      <div className="flex flex-col justify-between gap-4 pb-2 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* 4 KPI cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-slate-200/80 bg-white p-5 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
              <Skeleton className="h-3 w-28 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </CardHeader>
            <CardContent className="space-y-3 p-0 pt-2">
              <Skeleton className="h-9 w-20 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* In-review alert banner skeleton */}
      <Card className="border-amber-200/80 bg-amber-50/20 p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-6 w-48 rounded-md" />
          </div>
          <Skeleton className="h-4 w-2/3 max-w-md rounded-md" />
        </div>
      </Card>

      {/* Table skeleton */}
      <Card className="border-slate-200/80 bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-40 rounded-lg" />
            <Skeleton className="h-3.5 w-60 rounded-md" />
          </div>
          <Skeleton className="h-4 w-24 rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-48 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-4 w-12 rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
