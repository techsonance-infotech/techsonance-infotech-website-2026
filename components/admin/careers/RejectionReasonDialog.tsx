"use client";

import React, { useState } from "react";
import { UserX, X, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MANAGED_REJECTION_REASONS = [
  "Qualifications mismatch",
  "Salary expectation",
  "Location mismatch",
  "Position filled",
  "Other",
] as const;

export type RejectionReasonOption = (typeof MANAGED_REJECTION_REASONS)[number];

interface RejectionReasonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notifyCandidate: boolean) => Promise<void> | void;
  isSubmitting?: boolean;
  candidateName?: string;
}

export function RejectionReasonDialog({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  candidateName,
}: RejectionReasonDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [notifyCandidate, setNotifyCandidate] = useState(false);
  const [validationError, setValidationError] = useState("");

  if (!isOpen) return null;

  const handleConfirm = async () => {
    const finalReason = selectedReason === "Other" ? customReason.trim() : selectedReason.trim();

    if (!finalReason) {
      setValidationError("Please select or enter a rejection reason.");
      return;
    }

    setValidationError("");
    await onConfirm(finalReason, notifyCandidate);
  };

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-dialog-title"
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-150 dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200/60 bg-rose-50 text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/50">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="reject-dialog-title"
                className="font-sora text-base font-bold text-slate-900 dark:text-white"
              >
                Reject Candidate
              </h3>
              {candidateName && (
                <p className="text-xs font-medium text-slate-500">{candidateName}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          Please record the primary reason for rejecting this candidate. This will be stored for
          compliance reporting and candidate history.
        </p>

        {/* Reason Selection */}
        <div className="space-y-2">
          {MANAGED_REJECTION_REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <button
                key={reason}
                type="button"
                onClick={() => {
                  setSelectedReason(reason);
                  setValidationError("");
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-2xl border p-3 text-left text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <span>{reason}</span>
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-rose-600 bg-rose-600 text-white"
                      : "border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}

          {selectedReason === "Other" && (
            <textarea
              rows={3}
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value);
                setValidationError("");
              }}
              placeholder="Specify custom reason..."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200"
            />
          )}

          {validationError && (
            <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              {validationError}
            </p>
          )}
        </div>

        {/* Optional notification toggle */}
        <label
          htmlFor="notify-candidate-checkbox"
          aria-label="Send polite status update email"
          className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/60 bg-slate-50 p-3 dark:border-slate-800/60 dark:bg-slate-800/40"
        >
          <input
            id="notify-candidate-checkbox"
            type="checkbox"
            checked={notifyCandidate}
            onChange={(e) => setNotifyCandidate(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
          />
          <span className="text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              Send polite status update email
            </span>
            <span className="mt-0.5 block text-[11px] text-slate-500">
              Notifies candidate their application has not progressed at this time.
            </span>
          </span>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSubmitting || !selectedReason}
            onClick={handleConfirm}
            className="rounded-xl bg-rose-600 font-medium text-white hover:bg-rose-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Updating...
              </>
            ) : (
              "Confirm Rejection"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
