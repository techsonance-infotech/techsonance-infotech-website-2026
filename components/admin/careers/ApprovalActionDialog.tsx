"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, AlertTriangle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateAdminJobStatus } from "@/lib/api/admin-jobs.api";
import type { Job } from "@/lib/types/careers";
import { JobStatus } from "@/lib/constants/enums";

interface ApprovalFormData {
  comment: string;
}

interface ApprovalActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    status: string;
    publishAt?: string | Date | null;
  };
  mode: "approve" | "return";
  onSuccess: (updatedJob: Job) => void;
}

export function ApprovalActionDialog({
  isOpen,
  onClose,
  job,
  mode,
  onSuccess,
}: ApprovalActionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [now] = useState(() => Date.now());

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ApprovalFormData>({
    mode: "onChange",
    defaultValues: {
      comment: "",
    },
  });

  const isApprove = mode === "approve";
  const isScheduled = Boolean(
    isApprove && job.publishAt && new Date(job.publishAt).getTime() > now,
  );

  if (!isOpen) return null;

  const onSubmit = async (data: ApprovalFormData) => {
    if (!isApprove && !data.comment.trim()) {
      setErrorMessage("Please enter reviewer feedback to explain what needs revision.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const targetStatus = isApprove
        ? isScheduled
          ? JobStatus.SCHEDULED
          : JobStatus.PUBLISHED
        : JobStatus.DRAFT;

      const updatedJob = await updateAdminJobStatus(job.id, {
        targetStatus,
        comment: data.comment.trim() || undefined,
      });

      onSuccess(updatedJob);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process approval request";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <dialog
        open
        aria-modal="true"
        aria-labelledby="approval-dialog-title"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 m-0 block"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isApprove
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
              }`}
            >
              {isApprove ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3
                id="approval-dialog-title"
                className="text-base font-semibold text-slate-900 dark:text-white"
              >
                {isApprove
                  ? isScheduled
                    ? "Approve & Schedule Role"
                    : "Approve & Publish Role"
                  : "Return Role to Draft"}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">{job.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            {isApprove ? (
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                {isScheduled ? (
                  <span>
                    This role will transition to <strong>SCHEDULED</strong> and will automatically
                    publish on <strong>{new Date(job.publishAt!).toLocaleDateString()}</strong>.
                  </span>
                ) : (
                  <span>
                    This role will immediately transition to <strong>PUBLISHED</strong> and become
                    live on the public careers portal.
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label
                  htmlFor="approval-comment"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Reviewer Feedback <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="approval-comment"
                  {...register("comment", {
                    required: !isApprove ? "Reviewer feedback is required" : false,
                  })}
                  placeholder="Explain what revisions or additional details are needed before this position can be approved..."
                  rows={4}
                  className="w-full text-sm bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                {errors.comment && (
                  <p className="text-xs text-rose-500">{errors.comment.message}</p>
                )}
                <p className="text-[11px] text-slate-400">
                  The recruiter will see this comment on their dashboard to address requested
                  changes.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!isApprove && !isValid)}
              className={`rounded-xl font-medium ${
                isApprove
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : isApprove ? (
                isScheduled ? (
                  "Approve & Schedule"
                ) : (
                  "Approve & Publish"
                )
              ) : (
                "Return to Draft"
              )}
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
