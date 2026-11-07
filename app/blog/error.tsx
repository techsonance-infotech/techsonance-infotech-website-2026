"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BlogError({
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
    <main
      role="alert"
      aria-live="assertive"
      className="flex min-h-[70vh] flex-col items-center justify-center bg-[#FAFBFD] px-4 py-16 text-center text-slate-800"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="mb-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Articles Currently Unavailable
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-slate-600">
          We encountered an issue loading our architecture and engineering articles. You can try
          reloading the directory or head back to our homepage.
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
            Try again
          </Button>
          <Button asChild variant="outline" className="flex items-center justify-center gap-2 rounded-xl">
            <Link href="/">
              <Home className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
