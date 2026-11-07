"use client";

import React, { useState, useEffect } from "react";
import { History, X, Loader2, RotateCcw, ChevronDown, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listAdminJobVersions,
  restoreAdminJobVersion,
  type JobVersionItem,
} from "@/lib/api/admin-jobs.api";
import type { Job } from "@/lib/types/careers";

interface VersionHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  currentVersionId?: number | null;
  onRestoreSuccess: (restoredJob: Job) => void;
}

export function VersionHistoryDialog({
  isOpen,
  onClose,
  jobId,
  currentVersionId,
  onRestoreSuccess,
}: VersionHistoryDialogProps) {
  const [versions, setVersions] = useState<JobVersionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isOpen || !jobId) return;

    let isMounted = true;
    async function loadVersions() {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      try {
        const data = await listAdminJobVersions(jobId);
        if (isMounted) {
          setVersions(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Failed to load versions";
          setErrorMessage(msg);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadVersions();
    return () => {
      isMounted = false;
    };
  }, [isOpen, jobId]);

  if (!isOpen) return null;

  const handleRestore = async (version: JobVersionItem) => {
    const confirmMsg = `Are you sure you want to restore snapshot from ${new Date(
      version.createdAt,
    ).toLocaleString()}? Current unsaved changes will be replaced.`;
    if (!window.confirm(confirmMsg)) return;

    setRestoringVersionId(version.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const restored = await restoreAdminJobVersion(jobId, version.id);

      setSuccessMessage("Version successfully restored!");
      onRestoreSuccess(restored);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to restore version";
      setErrorMessage(msg);
    } finally {
      setRestoringVersionId(null);
    }
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-history-dialog-title"
        className="animate-in zoom-in-95 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-150 dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="version-history-dialog-title"
                className="text-base font-semibold text-slate-900 dark:text-white"
              >
                Version History & Snapshots
              </h3>
              <p className="text-xs text-slate-500">
                Track modifications, review past revisions, and roll back to earlier states.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status alerts */}
        {errorMessage && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-600 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Check className="h-4 w-4" />
            {successMessage}
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 space-y-3 overflow-y-auto py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              <p className="text-xs">Loading version history...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No previous version snapshots found for this position.
            </div>
          ) : (
            versions.map((ver, idx) => {
              const isExpanded = expandedVersionId === ver.id;
              const dateStr = new Date(ver.createdAt).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              const isCurrent = Boolean(
                currentVersionId && ver.snapshot?.versionId === currentVersionId,
              );

              return (
                <div
                  key={ver.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/30 dark:hover:border-slate-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedVersionId(isExpanded ? null : ver.id)}
                      className="flex flex-1 items-center gap-2 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Version {ver.snapshot?.versionId || `#${versions.length - idx}`}
                          </span>
                          {isCurrent && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Current Active
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">{dateStr}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                          {ver.snapshot?.title || "Untitled Job"} &bull;{" "}
                          {ver.snapshot?.status || "DRAFT"}
                        </p>
                      </div>
                    </button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(ver)}
                      disabled={restoringVersionId === ver.id || isCurrent}
                      className="h-8 shrink-0 gap-1.5 rounded-xl text-xs hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60"
                    >
                      {restoringVersionId === ver.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      Restore
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 space-y-2 rounded-xl border border-t border-slate-200/60 bg-white p-3 pt-3 font-mono text-xs dark:border-slate-700/60 dark:bg-slate-900/60">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400">Title:</span>{" "}
                          <span className="text-slate-700 dark:text-slate-300">
                            {ver.snapshot?.title}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Department:</span>{" "}
                          <span className="text-slate-700 dark:text-slate-300">
                            {ver.snapshot?.department}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Status:</span>{" "}
                          <span className="text-slate-700 dark:text-slate-300">
                            {ver.snapshot?.status}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Approval:</span>{" "}
                          <span className="text-slate-700 dark:text-slate-300">
                            {ver.snapshot?.approvalStatus || "N/A"}
                          </span>
                        </div>
                      </div>
                      {Boolean(
                        ver.snapshot?.responsibilities && ver.snapshot.responsibilities.length > 0,
                      ) && (
                        <div className="pt-1">
                          <span className="block text-[10px] text-slate-400">
                            Responsibilities: {ver.snapshot.responsibilities?.length} items
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
