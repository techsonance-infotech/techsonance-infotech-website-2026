"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface JobCompletenessState {
  title?: string;
  slug?: string;
  department?: string;
  location?: string;
  workMode?: string;
  type?: string;
  openingsCount?: number;
  summary?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  preferredQualifications?: string[];
  skills?: string[];
  benefits?: string[];
  equalOpportunityStatement?: string;
  salaryMin?: number;
  salaryMax?: number;
  closesAt?: string | Date | null;
}

export interface CompletenessEvaluation {
  isComplete: boolean;
  missingFields: string[];
  warnings: string[];
}

export function evaluateCompleteness(job: Partial<JobCompletenessState>): CompletenessEvaluation {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Mandatory fields
  if (!job.title || job.title.trim().length < 3) {
    missingFields.push("Job Title");
  }

  if (!job.department || job.department.trim().length < 2) {
    missingFields.push("Department");
  }

  if (!job.location || job.location.trim().length < 2) {
    missingFields.push("Location");
  }

  if (!job.description || job.description.trim().length < 10) {
    missingFields.push("Role Description");
  }

  if (!job.responsibilities || job.responsibilities.length < 1) {
    missingFields.push("Key Responsibilities (at least 1)");
  }

  if (!job.requirements || job.requirements.length < 1) {
    missingFields.push("Requirements & Qualifications (at least 1)");
  }

  if (job.openingsCount !== undefined && job.openingsCount < 1) {
    missingFields.push("Openings count must be at least 1");
  }

  if (
    job.salaryMin !== undefined &&
    job.salaryMax !== undefined &&
    job.salaryMin > 0 &&
    job.salaryMax > 0 &&
    job.salaryMin > job.salaryMax
  ) {
    missingFields.push("Salary minimum cannot exceed maximum");
  }

  if (job.closesAt) {
    const deadlineTime = new Date(job.closesAt).getTime();
    if (!isNaN(deadlineTime) && deadlineTime <= Date.now()) {
      missingFields.push("Application deadline must be in the future");
    }
  }

  // Warnings / non-blocking recommendations
  if (!job.summary || job.summary.trim().length < 5) {
    warnings.push("Short summary helps card snippets and social preview");
  }
  if (!job.equalOpportunityStatement || job.equalOpportunityStatement.trim().length < 10) {
    warnings.push("Equal opportunity statement recommended for compliance");
  }
  if (!job.benefits || job.benefits.length === 0) {
    warnings.push("Listing benefits improves candidate conversion");
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

export interface ChecklistItem {
  id: string;
  label: string;
  category: "basics" | "content" | "compensation" | "compliance";
  required: boolean;
  passed: boolean;
  hint: string;
  error?: string;
}

export interface CompletenessResult {
  percentage: number;
  isReady: boolean;
  passedCount: number;
  totalRequired: number;
  items: ChecklistItem[];
}

export function computeCompleteness(job: Partial<JobCompletenessState>): CompletenessResult {
  const evalResult = evaluateCompleteness(job);

  const items: ChecklistItem[] = [
    {
      id: "title",
      label: "Role Title",
      category: "basics",
      required: true,
      passed: Boolean(job.title && job.title.trim().length >= 3),
      hint: "At least 3 characters",
    },
    {
      id: "department",
      label: "Department",
      category: "basics",
      required: true,
      passed: Boolean(job.department && job.department.trim().length >= 2),
      hint: "Assign to an agency department",
    },
    {
      id: "location",
      label: "Workplace Location",
      category: "basics",
      required: true,
      passed: Boolean(job.location && job.location.trim().length >= 2),
      hint: "Specify primary city or office hub (or 'Remote')",
    },
    {
      id: "description",
      label: "Role Description",
      category: "content",
      required: true,
      passed: Boolean(job.description && job.description.trim().length >= 10),
      hint: "Comprehensive position overview (10+ characters)",
    },
    {
      id: "responsibilities",
      label: "Key Responsibilities",
      category: "content",
      required: true,
      passed: Boolean(job.responsibilities && job.responsibilities.length >= 1),
      hint: "Add at least 1 core duty or day-to-day focus",
    },
    {
      id: "requirements",
      label: "Requirements & Qualifications",
      category: "content",
      required: true,
      passed: Boolean(job.requirements && job.requirements.length >= 1),
      hint: "Add at least 1 core skill or requirement",
    },
  ];

  // Openings check
  let openingsPassed = true;
  let openingsError: string | undefined;
  if (job.openingsCount !== undefined && job.openingsCount < 1) {
    openingsPassed = false;
    openingsError = "Openings count must be at least 1";
  }
  items.push({
    id: "openings",
    label: "Openings Count",
    category: "basics",
    required: false,
    passed: openingsPassed,
    hint: "Must be a positive integer",
    error: openingsError,
  });

  // Salary validity rule
  let salaryPassed = true;
  let salaryError: string | undefined;
  if (
    job.salaryMin !== undefined &&
    job.salaryMax !== undefined &&
    job.salaryMin > 0 &&
    job.salaryMax > 0 &&
    job.salaryMin > job.salaryMax
  ) {
    salaryPassed = false;
    salaryError = "Salary minimum cannot exceed maximum";
  }
  items.push({
    id: "salary",
    label: "Compensation Band",
    category: "compensation",
    required: false,
    passed: salaryPassed,
    hint: "Optional pay transparency range",
    error: salaryError,
  });

  // Deadline validity rule
  let deadlinePassed = true;
  let deadlineError: string | undefined;
  if (job.closesAt) {
    const deadlineTime = new Date(job.closesAt).getTime();
    if (!isNaN(deadlineTime) && deadlineTime <= Date.now()) {
      deadlinePassed = false;
      deadlineError = "Application deadline must be in the future";
    }
  }
  items.push({
    id: "deadline",
    label: "Closing Date",
    category: "compliance",
    required: false,
    passed: deadlinePassed,
    hint: "Optional closing deadline",
    error: deadlineError,
  });

  // Equal opportunity statement rule
  items.push({
    id: "eeoc",
    label: "Equal Opportunity Statement",
    category: "compliance",
    required: false,
    passed: Boolean(
      job.equalOpportunityStatement && job.equalOpportunityStatement.trim().length > 10,
    ),
    hint: "Standard diversity & non-discrimination declaration",
  });

  const requiredItems = items.filter((i) => i.required);
  const passedRequired = requiredItems.filter((i) => i.passed);

  const percentage = Math.round(
    (items.filter((i) => i.passed && !i.error).length / items.length) * 100,
  );

  return {
    percentage,
    isReady: evalResult.isComplete,
    passedCount: passedRequired.length,
    totalRequired: requiredItems.length,
    items,
  };
}

export interface CompletenessChecklistProps {
  job: Partial<JobCompletenessState>;
  onSubmitForReview?: () => void;
  onPublish?: () => void;
  onJumpToField?: (tab: string, fieldId: string) => void;
  canPublishDirectly?: boolean;
  isSaving?: boolean;
  isDirty?: boolean;
  hasBlockingError?: boolean;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  className?: string;
}

export function CompletenessChecklist({
  job,
  onSubmitForReview,
  onPublish,
  onJumpToField,
  canPublishDirectly = false,
  isSaving = false,
  isDirty = false,
  hasBlockingError = false,
  saveStatus = "idle",
  className = "",
}: CompletenessChecklistProps) {
  const result = computeCompleteness(job);
  const evalResult = evaluateCompleteness(job);

  const requiredItems = result.items.filter((i) => i.required);
  const optionalItems = result.items.filter((i) => !i.required);
  const passedRequiredCount = requiredItems.filter((i) => i.passed && !i.error).length;
  const passedOptionalCount = optionalItems.filter((i) => i.passed && !i.error).length;

  const isPublishDisabled =
    !evalResult.isComplete || isSaving || saveStatus === "saving" || isDirty || hasBlockingError;

  return (
    <div
      className={`space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h3 className="flex items-center gap-2 font-sora text-sm font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="h-4 w-4 text-[#1155CC]" />
            Completeness Checklist
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Readiness Checklist &bull;{" "}
            {job.title ? `Auditing: "${job.title}"` : "Auditing role draft"}
          </p>
        </div>
        <div className="text-right">
          <span
            className={`font-mono text-base font-black ${
              evalResult.isComplete ? "text-emerald-600" : "text-amber-500"
            }`}
          >
            {result.percentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              evalResult.isComplete ? "bg-emerald-500" : "bg-[#1155CC]"
            }`}
            style={{ width: `${result.percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
          <span>
            {result.passedCount} of {result.totalRequired} required checks passed
          </span>
          <span>{evalResult.isComplete ? "Ready for review" : "Requirements pending"}</span>
        </div>
      </div>

      {/* Missing Fields Alert */}
      {!evalResult.isComplete && evalResult.missingFields.length > 0 && (
        <div className="space-y-1.5 rounded-2xl border border-rose-200/80 bg-rose-50/80 p-3 text-xs dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700 dark:text-rose-400">
            <XCircle className="h-3.5 w-3.5" />
            <span>Missing Required Items ({evalResult.missingFields.length})</span>
          </div>
          <ul className="list-inside list-disc space-y-0.5 text-[11px] text-rose-600 dark:text-rose-300">
            {evalResult.missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings Alert */}
      {evalResult.warnings.length > 0 && (
        <div className="space-y-1.5 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-3 text-xs dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Recommendations</span>
          </div>
          <ul className="list-inside list-disc space-y-0.5 text-[11px] text-amber-600 dark:text-amber-300">
            {evalResult.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Mandatory Requirements Section (Finding 9, Spec 4.4) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="font-mono text-[10px] tracking-wider text-slate-400 uppercase">
            Mandatory Requirements ({passedRequiredCount}/{requiredItems.length})
          </span>
          {evalResult.isComplete && (
            <span className="font-mono text-[10px] font-bold text-emerald-600">All Met</span>
          )}
        </div>
        <div className="space-y-2">
          {requiredItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-2.5 rounded-2xl border p-2.5 text-xs transition-colors ${
                item.error
                  ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300"
                  : item.passed
                    ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-slate-700 dark:text-slate-300"
                    : "bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/60 dark:border-amber-900/40 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {item.error ? (
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                ) : item.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5 font-bold">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate">{item.label}</span>
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-amber-700 uppercase dark:bg-amber-900/50 dark:text-amber-300">
                      Required
                    </span>
                  </div>
                  {(!item.passed || item.error) && onJumpToField && (
                    <button
                      type="button"
                      onClick={() => onJumpToField(item.category, item.id)}
                      className="flex shrink-0 cursor-pointer items-center gap-0.5 text-[10px] font-bold text-[#1155CC] hover:underline"
                    >
                      <span>Fix</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {item.error ? item.error : item.hint}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Recommendations Section (Finding 9, Spec 4.4) */}
      <div className="space-y-2 border-t border-slate-100 pt-2 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="font-mono text-[10px] tracking-wider text-slate-400 uppercase">
            Quality Recommendations ({passedOptionalCount}/{optionalItems.length})
          </span>
        </div>
        <div className="space-y-2">
          {optionalItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-2.5 rounded-2xl border p-2.5 text-xs transition-colors ${
                item.error
                  ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300"
                  : item.passed
                    ? "bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    : "bg-slate-50/30 dark:bg-slate-800/20 border-dashed border-slate-200 dark:border-slate-800 text-slate-400"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {item.error ? (
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                ) : item.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-[#1155CC]" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-600" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5 font-bold">
                  <span className="truncate">{item.label}</span>
                  {!item.passed && onJumpToField && (
                    <button
                      type="button"
                      onClick={() => onJumpToField(item.category, item.id)}
                      className="shrink-0 cursor-pointer text-[10px] text-slate-400 hover:text-[#1155CC] hover:underline"
                    >
                      Add
                    </button>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {item.error ? item.error : item.hint}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        {canPublishDirectly ? (
          <Button
            type="button"
            onClick={onPublish}
            disabled={isPublishDisabled}
            className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Publish Role Now
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onSubmitForReview}
            disabled={isPublishDisabled}
            className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-[#1155CC] text-xs font-bold text-white shadow-xs hover:bg-[#0d44a5] disabled:opacity-50"
          >
            Submit for Review
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}

        {isPublishDisabled && (
          <p className="text-center text-[10px] text-slate-400">
            {!evalResult.isComplete
              ? "Complete all required checklist items to unlock publishing."
              : hasBlockingError
                ? "Resolve active system error before publishing."
                : isDirty
                  ? "Save draft before publishing role."
                  : isSaving || saveStatus === "saving"
                    ? "Saving changes in progress..."
                    : "Action disabled until requirements pass."}
          </p>
        )}
      </div>
    </div>
  );
}
