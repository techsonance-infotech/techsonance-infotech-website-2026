"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  auditJobQuality,
  type DetectedIssue,
  type JobQualityReport,
} from "@/lib/utils/job-quality-assistant";

interface JobQualityWidgetProps {
  data: {
    title?: string;
    summary?: string;
    description?: string;
    responsibilities?: string[];
    requirements?: string[];
    showSalaryPublicly?: boolean;
  };
  onApplyFix?: (issue: DetectedIssue) => void;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 85)
    return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
  if (score >= 70)
    return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800";
  return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800";
}

export function JobQualityWidget({ data, onApplyFix, className = "" }: JobQualityWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const report: JobQualityReport = auditJobQuality(data);

  return (
    <div
      className={`rounded-2xl border transition-all ${
        report.score >= 85
          ? "border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20"
          : "border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20"
      } ${className}`}
    >
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center justify-between rounded-2xl p-3 text-left focus-visible:ring-2 focus-visible:ring-[#1155CC] focus-visible:outline-hidden"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sora text-xs font-bold text-slate-900 dark:text-white">
                Job Quality &amp; Inclusive Language Assistant
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getScoreColor(
                  report.score,
                )}`}
              >
                {report.score}/100 · {report.grade}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              {report.issues.length === 0
                ? "All language and quality guidelines met. Role reads professional and inclusive."
                : `${report.issues.length} recommendation${
                    report.issues.length > 1 ? "s" : ""
                  } to improve candidate engagement.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="text-[10px] font-semibold">{expanded ? "Hide" : "Details"}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-1 space-y-3 border-t border-slate-200/60 p-3.5 pt-0 dark:border-slate-800/60">
          {/* Detected Issues */}
          {report.issues.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Opportunities to Polish</span>
              </div>
              <div className="space-y-1.5">
                {report.issues.map((issue) => (
                  <div
                    key={`${issue.type}-${issue.word}-${issue.reason}`}
                    className="flex flex-col items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] font-bold tracking-wider uppercase"
                        >
                          {issue.type === "inclusive_language"
                            ? "Inclusive Phrasing"
                            : "Best Practice"}
                        </Badge>
                        <span className="text-xs font-bold text-rose-600 line-through dark:text-rose-400">
                          &quot;{issue.word}&quot;
                        </span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          &quot;{issue.suggestion}&quot;
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                        {issue.reason}
                      </p>
                    </div>

                    {onApplyFix && issue.type === "inclusive_language" && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onApplyFix(issue)}
                        className="h-7 shrink-0 cursor-pointer rounded-lg bg-emerald-600 px-2.5 text-[10px] font-bold text-white hover:bg-emerald-700"
                      >
                        Apply Fix
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Passed Checks */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Passed Standards ({report.passedChecks.length})</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {report.passedChecks.map((check) => (
                <div
                  key={check}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span>{check}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
