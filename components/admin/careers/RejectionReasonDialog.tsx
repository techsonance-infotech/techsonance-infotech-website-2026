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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-dialog-title"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center text-rose-600">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="reject-dialog-title"
                className="text-base font-bold text-slate-900 dark:text-white font-sora"
              >
                Reject Candidate
              </h3>
              {candidateName && (
                <p className="text-xs text-slate-500 font-medium">{candidateName}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
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
                className={`w-full text-left text-xs p-3 rounded-2xl border transition-all cursor-pointer font-medium flex items-center justify-between ${
                  isSelected
                    ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <span>{reason}</span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? "border-rose-600 bg-rose-600 text-white"
                      : "border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
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
              className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 mt-2"
            />
          )}

          {validationError && (
            <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              {validationError}
            </p>
          )}
        </div>

        {/* Optional notification toggle */}
        <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 cursor-pointer">
          <input
            type="checkbox"
            checked={notifyCandidate}
            onChange={(e) => setNotifyCandidate(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Send polite status update email
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Notifies candidate their application has not progressed at this time.
            </span>
          </div>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
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
