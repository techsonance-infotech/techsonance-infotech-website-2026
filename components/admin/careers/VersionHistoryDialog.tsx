"use client";

import React, { useState, useEffect } from "react";
import { History, X, Loader2, RotateCcw, ChevronDown, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VersionItem {
  id: string;
  entityType: string;
  entityId: string;
  snapshot: Record<string, any>;
  changedBy?: string | null;
  createdAt: string | Date;
}

interface VersionHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  currentVersionId?: number | null;
  onRestoreSuccess: (restoredJob: any) => void;
}

export function VersionHistoryDialog({
  isOpen,
  onClose,
  jobId,
  currentVersionId,
  onRestoreSuccess,
}: VersionHistoryDialogProps) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
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
        const res = await fetch(`/api/admin/careers/jobs/${jobId}/versions`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load version history");
        if (isMounted) {
          setVersions(data.versions || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || "Failed to load versions");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadVersions();
    return () => {
      isMounted = false;
    };
  }, [isOpen, jobId]);

  if (!isOpen) return null;

  const handleRestore = async (version: VersionItem) => {
    const confirmMsg = `Are you sure you want to restore snapshot from ${new Date(
      version.createdAt,
    ).toLocaleString()}? Current unsaved changes will be replaced.`;
    if (!window.confirm(confirmMsg)) return;

    setRestoringVersionId(version.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/admin/careers/jobs/${jobId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: version.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore version");

      setSuccessMessage("Version successfully restored!");
      onRestoreSuccess(data.job);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to restore version");
    } finally {
      setRestoringVersionId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-history-dialog-title"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <History className="w-5 h-5" />
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
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status alerts */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
            <Check className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-xs">Loading version history...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
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
                  className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-colors hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedVersionId(isExpanded ? null : ver.id)}
                      className="flex items-center gap-2 text-left flex-1"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Version {ver.snapshot?.versionId || `#${versions.length - idx}`}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Current Active
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">{dateStr}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
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
                      className="rounded-xl text-xs gap-1.5 h-8 shrink-0 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600"
                    >
                      {restoringVersionId === ver.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      Restore
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2 font-mono bg-white dark:bg-slate-900/60 p-3 rounded-xl border">
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
                      {ver.snapshot?.responsibilities?.length > 0 && (
                        <div className="pt-1">
                          <span className="text-slate-400 text-[10px] block">
                            Responsibilities: {ver.snapshot.responsibilities.length} items
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
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
