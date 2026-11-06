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

export function JobQualityWidget({ data, onApplyFix, className = "" }: JobQualityWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const report: JobQualityReport = auditJobQuality(data);

  const getScoreColor = (score: number) => {
    if (score >= 85)
      return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
    if (score >= 70)
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800";
    return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800";
  };

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
        className="w-full flex items-center justify-between p-3 text-left cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1155CC] rounded-2xl"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white font-sora">
                Job Quality &amp; Inclusive Language Assistant
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getScoreColor(
                  report.score,
                )}`}
              >
                {report.score}/100 · {report.grade}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
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
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-3.5 pt-0 border-t border-slate-200/60 dark:border-slate-800/60 mt-1 space-y-3">
          {/* Detected Issues */}
          {report.issues.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Opportunities to Polish</span>
              </div>
              <div className="space-y-1.5">
                {report.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="text-[9px] uppercase font-mono tracking-wider font-bold"
                        >
                          {issue.type === "inclusive_language"
                            ? "Inclusive Phrasing"
                            : "Best Practice"}
                        </Badge>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 line-through">
                          &quot;{issue.word}&quot;
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          &quot;{issue.suggestion}&quot;
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {issue.reason}
                      </p>
                    </div>

                    {onApplyFix && issue.type === "inclusive_language" && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onApplyFix(issue)}
                        className="rounded-lg text-[10px] font-bold h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shrink-0"
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
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Passed Standards ({report.passedChecks.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {report.passedChecks.map((check, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
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
