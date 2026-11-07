import React from "react";

export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6 sm:p-8">
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-slate-200" />
          <div className="h-4 w-72 rounded-md bg-slate-100" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-slate-200" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-5"
          >
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-8 w-16 rounded bg-slate-300" />
            <div className="h-3 w-32 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Main Content Area skeleton */}
      <div className="h-80 rounded-2xl border border-slate-100 bg-slate-50/30 p-6">
        <div className="mb-6 h-5 w-36 rounded bg-slate-200" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-10 w-full rounded-lg bg-slate-100/70" />
          ))}
        </div>
      </div>
    </div>
  );
}
