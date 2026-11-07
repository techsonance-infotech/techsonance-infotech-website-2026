"use client";

import React, { useState } from "react";
import {
  MapPin,
  Briefcase,
  DollarSign,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  Building2,
  Monitor,
  Smartphone,
  HelpCircle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface JobLivePreviewData {
  title?: string;
  slug?: string;
  referenceCode?: string;
  department?: string;
  location?: string;
  workMode?: string;
  type?: string;
  experienceLevel?: string;
  openingsCount?: number;
  summary?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  preferredQualifications?: string[];
  skills?: string[];
  benefits?: string[];
  aboutTeam?: string;
  hiringProcess?: Array<{ step: string; title: string; desc?: string }>;
  equalOpportunityStatement?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  showSalaryPublicly?: boolean;
  compensationNotes?: string;
  applicationMethod?: string;
  externalApplyUrl?: string;
  screeningQuestions?: any[];
  status?: string;
}

interface JobLivePreviewProps {
  job: Partial<JobLivePreviewData>;
  viewport?: "desktop" | "mobile";
  onViewportChange?: (viewport: "desktop" | "mobile") => void;
  showViewportControls?: boolean;
  className?: string;
}

export function JobLivePreview({
  job,
  viewport: controlledViewport,
  onViewportChange,
  showViewportControls = true,
  className = "",
}: JobLivePreviewProps) {
  const [internalViewport, setInternalViewport] = useState<"desktop" | "mobile">("desktop");
  const activeViewport = controlledViewport !== undefined ? controlledViewport : internalViewport;
  const isMobile = activeViewport === "mobile";

  const setViewport = (vp: "desktop" | "mobile") => {
    if (onViewportChange) {
      onViewportChange(vp);
    } else {
      setInternalViewport(vp);
    }
  };

  const formatSalary = (amount: number, currency = "INR") => {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toLocaleString()}`;
    }
  };

  return (
    <div className={`flex w-full flex-col items-center ${className}`}>
      {/* Viewport Control Bar */}
      {showViewportControls && (
        <div className="mb-3 flex w-full max-w-4xl items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="font-sora text-xs font-bold text-slate-500">Device Viewport:</span>
            <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  !isMobile
                    ? "bg-white dark:bg-slate-900 text-[#1155CC] shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>Desktop (1024px)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  isMobile
                    ? "bg-white dark:bg-slate-900 text-[#1155CC] shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile (375px)</span>
              </button>
            </div>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {isMobile ? "Viewport: 375 × 667" : "Viewport: 1024 × Responsive"}
          </span>
        </div>
      )}

      {/* Frame Container */}
      <div
        className={`mx-auto transition-all duration-300 ${
          isMobile
            ? "w-[375px] max-w-[390px] border-[8px] border-slate-900 rounded-[48px] shadow-2xl overflow-hidden bg-white dark:bg-slate-950 my-2"
            : "w-full max-w-4xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden"
        }`}
      >
        {/* Browser or Phone Frame Header */}
        {isMobile ? (
          <div className="flex items-center justify-between bg-slate-900 px-6 pt-3 pb-2 text-[10px] text-white">
            <span className="font-semibold">9:41</span>
            <div className="mx-auto h-4 w-20 rounded-full bg-black" />
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px]">5G</span>
              <div className="h-2 w-4 rounded-xs border border-white/60 bg-white" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex w-80 items-center justify-center gap-1.5 truncate rounded-xl border border-slate-200 bg-white px-4 py-1 font-mono text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              <span>https://techsonance.co.in/careers/</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {job.slug || "role-preview"}
              </span>
            </div>
            <div className="font-mono text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Live Preview
            </div>
          </div>
        )}

        {/* Main Content */}
        <div
          className={`space-y-8 p-6 sm:p-10 ${
            isMobile ? "max-h-[700px] overflow-y-auto text-xs" : ""
          }`}
        >
          {/* Top Badges & Department */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {job.department && (
                <Badge
                  variant="outline"
                  className="rounded-full border-[#1155CC]/30 bg-[#1155CC]/5 px-3 py-1 text-xs font-bold text-[#1155CC]"
                >
                  {job.department}
                </Badge>
              )}
              {job.workMode && (
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-1 font-mono text-xs font-semibold tracking-wider uppercase"
                >
                  {job.workMode.toUpperCase().replace(/_/g, " ")}
                </Badge>
              )}
              {job.type && (
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
                  {job.type.replace(/_/g, " ")}
                </Badge>
              )}
              {job.referenceCode && (
                <span className="ml-auto font-mono text-[10px] text-slate-400">
                  REF: {job.referenceCode}
                </span>
              )}
            </div>

            <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              {job.title || "Untitled Role Opening"}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#1155CC]" />
                  {job.location}
                </span>
              )}
              {job.experienceLevel && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  {job.experienceLevel} Level
                </span>
              )}
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                TechSonance Infotech
              </span>
              {job.openingsCount && job.openingsCount > 1 && (
                <span className="font-bold text-[#1155CC]">{job.openingsCount} Openings</span>
              )}
            </div>
          </div>

          {/* Compensation Card */}
          {job.showSalaryPublicly && job.salaryMin && job.salaryMax && (
            <div className="flex items-center justify-between rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 p-5 dark:border-slate-700 dark:from-slate-800/80 dark:to-slate-800/40">
              <div>
                <span className="font-mono text-[10px] font-bold tracking-wider text-[#1155CC] uppercase">
                  Estimated Compensation
                </span>
                <div className="mt-0.5 font-sora text-xl font-black text-slate-900 sm:text-2xl dark:text-white">
                  {formatSalary(job.salaryMin, job.salaryCurrency)} –{" "}
                  {formatSalary(job.salaryMax, job.salaryCurrency)}
                  <span className="ml-1.5 text-xs font-normal text-slate-500">
                    / {job.salaryPeriod?.toLowerCase() || "year"}
                  </span>
                </div>
                {job.compensationNotes && (
                  <p className="mt-1 text-xs text-slate-500">{job.compensationNotes}</p>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {job.summary && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs leading-relaxed font-medium text-slate-600 italic sm:text-sm dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
              "{job.summary}"
            </div>
          )}

          {/* Description */}
          <div className="space-y-3">
            <h2 className="font-sora text-base font-bold text-slate-900 sm:text-lg dark:text-white">
              About the Role
            </h2>
            <div className="text-xs leading-relaxed whitespace-pre-line text-slate-600 sm:text-sm dark:text-slate-300">
              {job.description || "Position description will appear here."}
            </div>
          </div>

          {/* Key Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-sora text-base font-bold text-slate-900 sm:text-lg dark:text-white">
                Key Responsibilities
              </h2>
              <ul className="space-y-2">
                {job.responsibilities.map((resp, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs text-slate-600 sm:text-sm dark:text-slate-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1155CC]" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-sora text-base font-bold text-slate-900 sm:text-lg dark:text-white">
                Requirements & Qualifications
              </h2>
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs text-slate-600 sm:text-sm dark:text-slate-300"
                  >
                    <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preferred Qualifications */}
          {job.preferredQualifications && job.preferredQualifications.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-sora text-base font-bold text-slate-900 sm:text-lg dark:text-white">
                Bonus Points & Preferred Qualifications
              </h2>
              <ul className="space-y-2">
                {job.preferredQualifications.map((bonus, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs text-slate-600 sm:text-sm dark:text-slate-300"
                  >
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span>{bonus}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills Chips */}
          {job.skills && job.skills.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-sora text-base font-bold text-slate-900 sm:text-lg dark:text-white">
                Tech Stack & Core Competencies
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-sora text-base font-bold text-slate-900 sm:text-lg dark:text-white">
                Perks & Benefits
              </h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {job.benefits.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hiring Process */}
          {job.hiringProcess && job.hiringProcess.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-sora text-base font-bold text-slate-900 sm:text-lg dark:text-white">
                Hiring Journey
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {job.hiringProcess.map((step, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="font-mono text-[10px] font-bold text-[#1155CC] uppercase">
                      Step {step.step || String(idx + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
                      {step.title}
                    </div>
                    {step.desc && <p className="mt-1 text-[11px] text-slate-500">{step.desc}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screening Questions Notice */}
          {job.screeningQuestions && job.screeningQuestions.length > 0 && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
              <HelpCircle className="h-4 w-4 shrink-0 text-[#1155CC]" />
              <span>
                <strong>{job.screeningQuestions.length} screening questions</strong> will be
                presented to applicants during submission.
              </span>
            </div>
          )}

          {/* Equal Opportunity */}
          {job.equalOpportunityStatement && (
            <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[11px] leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Shield className="h-3.5 w-3.5 text-[#1155CC]" />
                Equal Opportunity Employer
              </div>
              <p>{job.equalOpportunityStatement}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <div>
              <div className="font-sora text-xs font-bold text-slate-900 dark:text-white">
                Ready to create what's next?
              </div>
              <div className="text-[11px] text-slate-400">
                Applications take less than 3 minutes.
              </div>
            </div>
            <Button
              type="button"
              className="flex h-10 cursor-pointer items-center gap-1.5 rounded-2xl bg-[#1155CC] px-6 text-xs font-bold text-white shadow-md hover:bg-[#0d44a5]"
            >
              Apply Now
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
