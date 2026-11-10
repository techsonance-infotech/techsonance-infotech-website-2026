"use client";

import React, { useEffect } from "react";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected root crash
    console.error("Critical root global error caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <AlertOctagon className="h-8 w-8" />
          </div>

          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            TechSonance Web Engine
          </span>

          <h1 className="mt-2 font-mono text-xl font-bold tracking-tight text-white">
            System Fault Detected
          </h1>

          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            An unexpected error occurred during root execution. The platform has intercepted the fault to protect session integrity.
          </p>

          {error.digest && (
            <div className="mt-4 rounded-xl bg-slate-950/80 p-2 font-mono text-[10px] text-slate-500">
              Error Digest: {error.digest}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#1155CC] py-3 text-xs font-bold text-white transition-all hover:bg-blue-600 shadow-md"
            >
              <RotateCcw className="h-4 w-4" />
              Try Recovery
            </button>

            <a
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 py-3 text-xs font-bold text-slate-300 transition-all hover:bg-slate-800"
            >
              <Home className="h-4 w-4" />
              Return to Homepage
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
