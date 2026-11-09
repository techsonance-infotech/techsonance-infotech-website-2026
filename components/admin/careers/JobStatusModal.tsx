"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Clock,
  FileEdit,
  Archive,
  AlertTriangle,
  Loader2,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { JobStatus } from "@/lib/constants/enums";
import { updateAdminJobStatus } from "@/lib/api/admin-jobs.api";
import type { Job } from "@/lib/types/careers";

interface JobStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    slug?: string;
    status: JobStatus | string;
    department?: string;
  } | null;
  onSuccess: (updatedJob: Job) => void;
}

const STATUS_DETAILS: Record<
  string,
  {
    label: string;
    description: string;
    variant: "success" | "warning" | "destructive" | "info" | "secondary" | "outline" | "purple";
    icon: React.ComponentType<{ className?: string }>;
    impactNotice?: string;
  }
> = {
  [JobStatus.PUBLISHED]: {
    label: "Published",
    description: "Live on portal and actively accepting candidate applications.",
    variant: "success",
    icon: CheckCircle2,
    impactNotice: "Role will be publicly visible and indexed on Google for Jobs.",
  },
  [JobStatus.PAUSED]: {
    label: "Paused",
    description: "Temporarily freeze hiring. Role is unlisted and submissions paused.",
    variant: "warning",
    icon: PauseCircle,
    impactNotice: "Candidates cannot apply while paused. Can be resumed anytime.",
  },
  [JobStatus.CLOSED]: {
    label: "Closed",
    description: "Conclude hiring for this opening. Marked closed with SEO noindex.",
    variant: "destructive",
    icon: XCircle,
    impactNotice: "Marks position as closed on careers portal and blocks submissions.",
  },
  [JobStatus.IN_REVIEW]: {
    label: "In Review",
    description: "Submit for hiring manager review and formal approval before publishing.",
    variant: "info",
    icon: Clock,
  },
  [JobStatus.DRAFT]: {
    label: "Draft",
    description: "Offline editing mode. Invisible to prospective applicants.",
    variant: "secondary",
    icon: FileEdit,
  },
  [JobStatus.ARCHIVED]: {
    label: "Archived",
    description: "Permanently retire this requisition from active administration.",
    variant: "outline",
    icon: Archive,
  },
};

function getAllowedTransitions(currentStatus: string): JobStatus[] {
  switch (currentStatus) {
    case JobStatus.DRAFT:
      return [JobStatus.PUBLISHED, JobStatus.IN_REVIEW];
    case JobStatus.IN_REVIEW:
      return [JobStatus.PUBLISHED, JobStatus.DRAFT];
    case JobStatus.SCHEDULED:
      return [JobStatus.PUBLISHED, JobStatus.DRAFT];
    case JobStatus.PUBLISHED:
    case JobStatus.OPEN:
      return [JobStatus.PAUSED, JobStatus.CLOSED, JobStatus.DRAFT, JobStatus.IN_REVIEW];
    case JobStatus.PAUSED:
      return [JobStatus.PUBLISHED, JobStatus.CLOSED, JobStatus.DRAFT];
    case JobStatus.CLOSED:
      return [JobStatus.PUBLISHED, JobStatus.IN_REVIEW, JobStatus.DRAFT, JobStatus.ARCHIVED];
    case JobStatus.ARCHIVED:
      return [JobStatus.DRAFT];
    default:
      return [JobStatus.PUBLISHED, JobStatus.PAUSED, JobStatus.CLOSED, JobStatus.DRAFT];
  }
}

export function JobStatusModal({
  isOpen,
  onClose,
  job,
  onSuccess,
}: JobStatusModalProps): React.JSX.Element | null {
  const currentStatus = job?.status || JobStatus.DRAFT;
  const allowedTransitions = getAllowedTransitions(currentStatus);

  const [selectedStatus, setSelectedStatus] = useState<JobStatus | null>(() =>
    job ? getAllowedTransitions(job.status)[0] || null : null,
  );
  const [comment, setComment] = useState("");
  const [closesAt, setClosesAt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (job) {
      const allowed = getAllowedTransitions(job.status);
      setSelectedStatus(allowed[0] || null);
      setComment("");
      setClosesAt("");
      setErrorMessage("");
    }
  }, [job]);

  // Lock background scroll while modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStatus) {
      setErrorMessage("Please select a target status.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const updatedJob = await updateAdminJobStatus(job.id, {
        targetStatus: selectedStatus,
        comment: comment.trim() || undefined,
        closesAt: closesAt ? new Date(closesAt) : null,
      });

      onSuccess(updatedJob);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update position status.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDetails = selectedStatus ? STATUS_DETAILS[selectedStatus] : null;

  const modalElement = (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs duration-200 animate-in fade-in"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-status-modal-title"
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl duration-150 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Header - Pinned at top */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h3
              id="job-status-modal-title"
              className="font-sora text-base font-bold text-slate-900 dark:text-white"
            >
              Update Position Status
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Change the operational lifecycle stage for{" "}
              <strong className="text-slate-800 dark:text-slate-200">{job.title}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 scrollbar-thin space-y-3.5 overflow-y-auto px-6 py-4">
            {/* Current Status Pill */}
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-2.5 text-xs dark:bg-slate-800/50">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Current Stage:
              </span>
              <Badge
                variant={
                  currentStatus === JobStatus.PUBLISHED || currentStatus === JobStatus.OPEN
                    ? "success"
                    : currentStatus === JobStatus.IN_REVIEW
                      ? "info"
                      : currentStatus === JobStatus.PAUSED
                        ? "warning"
                        : currentStatus === JobStatus.CLOSED
                          ? "destructive"
                          : "secondary"
                }
                dot={currentStatus === JobStatus.PUBLISHED || currentStatus === JobStatus.OPEN}
              >
                {currentStatus}
              </Badge>
            </div>

            {/* Target Status Options */}
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                Select New Status
              </label>
              <div className="space-y-1.5">
                {allowedTransitions.map((statusKey) => {
                  const details = STATUS_DETAILS[statusKey];
                  const isSelected = selectedStatus === statusKey;
                  const Icon = details?.icon || Sparkles;

                  return (
                    <button
                      key={statusKey}
                      type="button"
                      onClick={() => setSelectedStatus(statusKey)}
                      className={`flex w-full cursor-pointer items-start gap-2.5 rounded-2xl border p-2.5 text-left transition-all ${
                        isSelected
                          ? "border-[#1155CC] bg-[#1155CC]/5 ring-2 ring-[#1155CC]/30 dark:bg-blue-950/20"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                          isSelected
                            ? "bg-[#1155CC] text-white"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {details?.label || statusKey}
                          </span>
                          {details?.variant && (
                            <Badge variant={details.variant} className="py-0 text-[10px]">
                              {statusKey}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {details?.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Impact Warning Notice */}
            {selectedDetails?.impactNotice && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/70 p-2.5 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span>{selectedDetails.impactNotice}</span>
              </div>
            )}

            {/* Schedule Close Time (Application Deadline) when Reliving a Closed Role */}
            {currentStatus === JobStatus.CLOSED &&
              (selectedStatus === JobStatus.PUBLISHED || selectedStatus === JobStatus.OPEN) && (
                <div className="space-y-2 rounded-2xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Calendar className="h-4 w-4 text-[#1155CC]" />
                    <span>Schedule Application Deadline (Close Time)</span>
                  </div>
                  <p className="text-[11px] text-blue-800/90 dark:text-blue-300">
                    This role was previously closed. Pick a new closing date/time or leave empty to
                    keep open indefinitely, then make it live.
                  </p>
                  <Input
                    id="status-modal-closes-at"
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    value={closesAt}
                    onChange={(e) => setClosesAt(e.target.value)}
                    className="rounded-xl bg-white font-mono text-xs dark:bg-slate-900"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-semibold text-slate-500">Quick set:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                        setClosesAt(d.toISOString().slice(0, 16));
                      }}
                      className="cursor-pointer rounded-lg bg-blue-100/90 px-2 py-0.5 text-[11px] font-bold text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300"
                    >
                      +7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
                        setClosesAt(d.toISOString().slice(0, 16));
                      }}
                      className="cursor-pointer rounded-lg bg-blue-100/90 px-2 py-0.5 text-[11px] font-bold text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300"
                    >
                      +14 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                        setClosesAt(d.toISOString().slice(0, 16));
                      }}
                      className="cursor-pointer rounded-lg bg-blue-100/90 px-2 py-0.5 text-[11px] font-bold text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300"
                    >
                      +30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setClosesAt("")}
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      No Deadline
                    </button>
                  </div>
                </div>
              )}

            {/* Optional Reason / Comment */}
            <div>
              <label
                htmlFor="status-comment"
                className="mb-1 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
              >
                Reason / Notes{" "}
                <span className="font-normal text-slate-400 lowercase">(optional)</span>
              </label>
              <Textarea
                id="status-comment"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Target candidate identified, temporarily pausing for applicant backlog..."
                className="rounded-xl text-xs"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Sticky Footer Controls - Pinned at bottom */}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-900/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={onClose}
              className="cursor-pointer rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !selectedStatus}
              className="cursor-pointer rounded-xl bg-[#1155CC] text-xs font-bold text-white shadow-xs hover:bg-[#0d44a4]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Updating…
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  if (mounted && typeof document !== "undefined") {
    return createPortal(modalElement, document.body);
  }

  return modalElement;
}
