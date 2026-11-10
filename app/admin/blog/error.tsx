"use client";

import React, { useEffect } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default function AdminBlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("[Blog Boundary Crash Caught]", {
      error: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
        <AlertOctagon className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-sora text-xl font-black text-slate-900 dark:text-white">
        Blog Workspace Interrupted
      </h2>
      <p className="mt-1.5 max-w-md text-xs text-slate-500 dark:text-slate-400">
        The editorial blog workspace encountered an unexpected rendering or data fault. Your draft
        progress is safely isolated.
      </p>
      {error.digest && (
        <code className="mt-2 rounded bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          Ref: {error.digest}
        </code>
      )}
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => reset()} className="gap-2 rounded-xl text-xs font-bold">
          <RotateCcw className="h-3.5 w-3.5" /> Recover Blog Studio
        </Button>
      </div>
    </div>
  );
}
