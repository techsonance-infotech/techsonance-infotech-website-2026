"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error with context for telemetry
  }, [error]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="mb-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Dashboard Unavailable
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-slate-600">
          We encountered an issue loading studio metrics and operational telemetry. You can try
          refreshing or re-authenticating if your session expired.
        </p>

        {error.digest && (
          <p className="mb-6 font-mono text-xs text-slate-400">
            Reference code: <span className="font-semibold text-slate-600">{error.digest}</span>
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            variant="default"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#1155CC] text-white hover:bg-[#0d44a4]"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Dashboard
          </Button>
          <Button asChild variant="outline" className="flex items-center justify-center gap-2 rounded-xl">
            <Link href="/admin/login">
              <LogIn className="h-4 w-4" />
              Sign In Again
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
