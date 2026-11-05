"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  onSuccess: (updatedJob: any) => void;
}

export function ApprovalActionDialog({
  isOpen,
  onClose,
  job,
  mode,
  onSuccess,
}: ApprovalActionDialogProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const isApprove = mode === "approve";
  const isScheduled =
    isApprove && job.publishAt && new Date(job.publishAt) > new Date();

  const handleConfirm = async () => {
    if (!isApprove && !comment.trim()) {
      setErrorMessage("Please enter reviewer feedback to explain what needs revision.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const endpoint = isApprove
        ? `/api/admin/careers/jobs/${job.id}/approve`
        : `/api/admin/careers/jobs/${job.id}/return`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isApprove ? {} : { comment: comment.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }

      onSuccess(data.job);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process approval request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-dialog-title"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150"
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
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="space-y-3">
          {isApprove ? (
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              {isScheduled ? (
                <span>
                  This role will transition to <strong>SCHEDULED</strong> and will automatically publish on{" "}
                  <strong>{new Date(job.publishAt!).toLocaleDateString()}</strong>.
                </span>
              ) : (
                <span>
                  This role will immediately transition to <strong>PUBLISHED</strong> and become live on the public careers portal.
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Reviewer Feedback <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="Explain what revisions or additional details are needed before this position can be approved..."
                rows={4}
                className="w-full text-sm bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <p className="text-[11px] text-slate-400">
                The recruiter will see this comment on their dashboard to address requested changes.
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
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || (!isApprove && !comment.trim())}
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
              isScheduled ? "Approve & Schedule" : "Approve & Publish"
            ) : (
              "Return to Draft"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
