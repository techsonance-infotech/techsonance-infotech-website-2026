"use client";

import React, { useSyncExternalStore } from "react";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AsyncStateProps<T> {
  loading: boolean;
  error: string | null;
  data: T | null | undefined;
  isEmpty: (data: T) => boolean;
  onRetry: () => void;
  skeleton: React.ReactNode;
  emptyUI: React.ReactNode;
  children: (data: T) => React.ReactNode;
  showSkeletonOnLoading?: boolean;
}

export function AsyncState<T>({
  loading,
  error,
  data,
  isEmpty,
  onRetry,
  skeleton,
  emptyUI,
  children,
  showSkeletonOnLoading = false,
}: AsyncStateProps<T>) {
  const isOnline = useSyncExternalStore(
    (notify) => {
      window.addEventListener("online", notify);
      window.addEventListener("offline", notify);
      return () => {
        window.removeEventListener("online", notify);
        window.removeEventListener("offline", notify);
      };
    },
    () => navigator.onLine,
    () => true,
  );

  if (!isOnline) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center rounded-3xl border border-amber-200 bg-amber-50/70 p-12 text-center dark:border-amber-900/60 dark:bg-amber-950/20"
      >
        <WifiOff className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        <h3 className="mt-3 text-sm font-bold text-amber-900 dark:text-amber-200">
          You are currently offline
        </h3>
        <p className="mt-1 max-w-sm text-xs text-amber-700 dark:text-amber-300">
          Check your network connection. Any updates made right now cannot be saved.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="mt-4 gap-2 rounded-xl text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reconnect
        </Button>
      </div>
    );
  }

  if (loading && (showSkeletonOnLoading || !data || isEmpty(data))) {
    return <>{skeleton}</>;
  }

  if (error && (!data || isEmpty(data))) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex flex-col items-center justify-center rounded-3xl border border-rose-200 bg-rose-50/70 p-12 text-center dark:border-rose-900/60 dark:bg-rose-950/20"
      >
        <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
        <h3 className="mt-3 text-sm font-bold text-rose-900 dark:text-rose-200">
          Failed to load content
        </h3>
        <p className="mt-1 max-w-sm text-xs text-rose-700 dark:text-rose-300">{error}</p>
        <Button
          size="sm"
          onClick={onRetry}
          className="mt-4 gap-2 rounded-xl bg-rose-600 text-xs text-white hover:bg-rose-700"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Try Again
        </Button>
      </div>
    );
  }

  if (!data || isEmpty(data)) {
    return <>{emptyUI}</>;
  }

  return (
    <>
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span>Showing cached data. Background refresh failed: {error}</span>
          </div>
          <button
            onClick={onRetry}
            className="cursor-pointer font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}
      {children(data)}
    </>
  );
}
