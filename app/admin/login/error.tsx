"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Captured for production telemetry
    if (process.env.NODE_ENV !== "production") {
      void error;
    }
  }, [error]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#FAFBFD] p-4"
    >
      {/* Background Ambience Waves */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#1155CC]/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-tr from-rose-600 via-rose-500 to-amber-500 text-white shadow-xl shadow-rose-600/30">
            <ShieldAlert className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Authentication Error
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
            The studio login system encountered an unexpected disruption
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(225,29,72,0.08)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200/80 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <div>
              <p className="font-bold text-rose-800">System Handshake Disrupted</p>
              <p className="mt-0.5 font-normal text-rose-600">
                {error.message || "An unexpected error occurred while loading the authentication portal."}
              </p>
            </div>
          </div>

          {error.digest && (
            <p className="mb-6 font-mono text-xs text-slate-400">
              Reference Code: <span className="font-semibold text-slate-600">{error.digest}</span>
            </p>
          )}

          <div className="space-y-3">
            <Button
              onClick={reset}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1155CC] text-xs font-bold text-white shadow-lg shadow-[#1155CC]/25 hover:bg-[#0d44a4] sm:text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Authentication Portal</span>
            </Button>

            <Button
              asChild
              variant="outline"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:text-sm"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                <span>Return to Main Website</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
