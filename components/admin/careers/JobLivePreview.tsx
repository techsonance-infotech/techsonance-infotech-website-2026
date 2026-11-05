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
    <div className={`flex flex-col items-center w-full ${className}`}>
      {/* Viewport Control Bar */}
      {showViewportControls && (
        <div className="flex items-center justify-between w-full max-w-4xl mb-3 px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 font-sora">Device Viewport:</span>
            <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  !isMobile
                    ? "bg-white dark:bg-slate-900 text-[#1155CC] shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop (1024px)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  isMobile
                    ? "bg-white dark:bg-slate-900 text-[#1155CC] shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile (375px)</span>
              </button>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {isMobile ? "Viewport: 375 × 667" : "Viewport: 1024 × Responsive"}
          </span>
        </div>
      )}

      {/* Frame Container */}
      <div
        className={`transition-all duration-300 mx-auto ${
          isMobile
            ? "w-[375px] max-w-[390px] border-[8px] border-slate-900 rounded-[48px] shadow-2xl overflow-hidden bg-white dark:bg-slate-950 my-2"
            : "w-full max-w-4xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden"
        }`}
      >
        {/* Browser or Phone Frame Header */}
        {isMobile ? (
          <div className="bg-slate-900 px-6 pt-3 pb-2 flex items-center justify-between text-white text-[10px]">
            <span className="font-semibold">9:41</span>
            <div className="w-20 h-4 bg-black rounded-full mx-auto" />
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px]">5G</span>
              <div className="w-4 h-2 rounded-xs border border-white/60 bg-white" />
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-1 text-[11px] text-slate-500 font-mono flex items-center gap-1.5 w-80 justify-center truncate">
              <span>https://techsonance.co.in/careers/</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">
                {job.slug || "role-preview"}
              </span>
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
              Live Preview
            </div>
          </div>
        )}

        {/* Main Content */}
        <div
          className={`p-6 sm:p-10 space-y-8 ${
            isMobile ? "max-h-[700px] overflow-y-auto text-xs" : ""
          }`}
        >
          {/* Top Badges & Department */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {job.department && (
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 text-xs font-bold text-[#1155CC] border-[#1155CC]/30 bg-[#1155CC]/5"
                >
                  {job.department}
                </Badge>
              )}
              {job.workMode && (
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-1 text-xs font-semibold uppercase font-mono tracking-wider"
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
                <span className="text-[10px] text-slate-400 font-mono ml-auto">
                  REF: {job.referenceCode}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-sora">
              {job.title || "Untitled Role Opening"}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1155CC]" />
                  {job.location}
                </span>
              )}
              {job.experienceLevel && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {job.experienceLevel} Level
                </span>
              )}
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                TechSonance Infotech
              </span>
              {job.openingsCount && job.openingsCount > 1 && (
                <span className="text-[#1155CC] font-bold">
                  {job.openingsCount} Openings
                </span>
              )}
            </div>
          </div>

          {/* Compensation Card */}
          {job.showSalaryPublicly && job.salaryMin && job.salaryMax && (
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-100 dark:border-slate-700 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1155CC] font-mono">
                  Estimated Compensation
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-sora mt-0.5">
                  {formatSalary(job.salaryMin, job.salaryCurrency)} –{" "}
                  {formatSalary(job.salaryMax, job.salaryCurrency)}
                  <span className="text-xs font-normal text-slate-500 ml-1.5">
                    / {job.salaryPeriod?.toLowerCase() || "year"}
                  </span>
                </div>
                {job.compensationNotes && (
                  <p className="text-xs text-slate-500 mt-1">{job.compensationNotes}</p>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {job.summary && (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
              "{job.summary}"
            </div>
          )}

          {/* Description */}
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sora">
              About the Role
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {job.description || "Position description will appear here."}
            </div>
          </div>

          {/* Key Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sora">
                Key Responsibilities
              </h2>
              <ul className="space-y-2">
                {job.responsibilities.map((resp, i) => (
                  <li
                    key={i}
                    className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#1155CC] shrink-0 mt-0.5" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sora">
                Requirements & Qualifications
              </h2>
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li
                    key={i}
                    className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-2" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preferred Qualifications */}
          {job.preferredQualifications && job.preferredQualifications.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sora">
                Bonus Points & Preferred Qualifications
              </h2>
              <ul className="space-y-2">
                {job.preferredQualifications.map((bonus, i) => (
                  <li
                    key={i}
                    className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{bonus}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills Chips */}
          {job.skills && job.skills.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sora">
                Tech Stack & Core Competencies
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
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
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sora">
                Perks & Benefits
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {job.benefits.map((b, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hiring Process */}
          {job.hiringProcess && job.hiringProcess.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sora">
                Hiring Journey
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {job.hiringProcess.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="text-[10px] font-mono font-bold text-[#1155CC] uppercase">
                      Step {step.step || String(idx + 1).padStart(2, "0")}
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                      {step.title}
                    </div>
                    {step.desc && (
                      <p className="text-[11px] text-slate-500 mt-1">{step.desc}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screening Questions Notice */}
          {job.screeningQuestions && job.screeningQuestions.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs flex items-center gap-2.5 text-blue-900 dark:text-blue-300">
              <HelpCircle className="w-4 h-4 text-[#1155CC] shrink-0" />
              <span>
                <strong>{job.screeningQuestions.length} screening questions</strong> will be
                presented to applicants during submission.
              </span>
            </div>
          )}

          {/* Equal Opportunity */}
          {job.equalOpportunityStatement && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed space-y-1">
              <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#1155CC]" />
                Equal Opportunity Employer
              </div>
              <p>{job.equalOpportunityStatement}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white font-sora">
                Ready to create what's next?
              </div>
              <div className="text-[11px] text-slate-400">
                Applications take less than 3 minutes.
              </div>
            </div>
            <Button
              type="button"
              className="rounded-2xl bg-[#1155CC] hover:bg-[#0d44a5] text-white font-bold text-xs h-10 px-6 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              Apply Now
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
