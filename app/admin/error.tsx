"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors cleanly
    console.error("[Admin Boundary Caught Error]:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="font-sora text-xl font-bold text-slate-900 sm:text-2xl">
        Admin Studio Temporarily Unavailable
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        The studio encountered a temporary synchronization error with backend services.
      </p>
      {error.digest && (
        <code className="mt-2 rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
          Ref: {error.digest}
        </code>
      )}
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => reset()} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          <span>Try Again</span>
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    </div>
  );
}
