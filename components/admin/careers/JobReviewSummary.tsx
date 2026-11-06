"use client";

import React, { useState } from "react";
import {
  Briefcase,
  MapPin,
  FileText,
  DollarSign,
  Settings2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Globe,
  Search,
  Eye,
  Calendar,
  Layers,
  Edit3,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormSelect } from "./FormSelect";
import { JobLivePreview } from "./JobLivePreview";
import type { JobFormData } from "./JobEditorForm";

interface JobReviewSummaryProps {
  job: JobFormData;
  updateField: <K extends keyof JobFormData>(key: K, value: JobFormData[K]) => void;
  onNavigateToTab: (
    tab: "basics" | "location" | "content" | "compensation" | "application",
  ) => void;
  className?: string;
}

export function JobReviewSummary({
  job,
  updateField,
  onNavigateToTab,
  className = "",
}: JobReviewSummaryProps) {
  const [viewMode, setViewMode] = useState<"summary" | "candidate">("summary");

  // Format compensation for review card
  const formatSalaryText = () => {
    const currency = job.salaryCurrency || "INR";
    const period = job.salaryPeriod || "year";
    const min = job.salaryMin;
    const max = job.salaryMax;

    if (min === undefined && max === undefined) {
      return "Compensation not disclosed";
    }

    const fmt = (val: number) => {
      try {
        return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(val);
      } catch {
        return `${currency} ${val.toLocaleString()}`;
      }
    };

    const periodStr = period === "year" ? "year" : period === "month" ? "month" : "hour";

    if (min !== undefined && max !== undefined) {
      return `${fmt(min)} – ${fmt(max)} / ${periodStr}`;
    }
    if (min !== undefined) {
      return `From ${fmt(min)} / ${periodStr}`;
    }
    return `Up to ${fmt(max!)} / ${periodStr}`;
  };

  // Plain-English publication schedule sentence
  const getScheduleSentence = () => {
    const parts: string[] = [];

    if (job.publishAt) {
      const pubDate = new Date(job.publishAt);
      if (!isNaN(pubDate.getTime())) {
        if (pubDate.getTime() > Date.now()) {
          parts.push(
            `This role is scheduled to automatically publish on ${pubDate.toLocaleDateString(
              undefined,
              {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
              },
            )} at ${pubDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}.`,
          );
        } else {
          parts.push(
            `Scheduled publication date was ${pubDate.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}.`,
          );
        }
      }
    } else if (job.status === "PUBLISHED") {
      parts.push("This position is currently LIVE on the public careers portal.");
    } else {
      parts.push(
        "Upon confirmation, this position will be published immediately to the public careers portal.",
      );
    }

    if (job.closesAt) {
      const closeDate = new Date(job.closesAt);
      if (!isNaN(closeDate.getTime())) {
        parts.push(
          `Applications will automatically close on ${closeDate.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })} at ${closeDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}.`,
        );
      }
    }

    if (job.visibility === "unlisted") {
      parts.push("Access is unlisted: reachable only via direct URL, excluded from sitemap.");
    } else {
      parts.push("Access is public: indexed in sitemap and discoverable in portal search.");
    }

    return parts.join(" ");
  };

  const serpTitle = job.seoTitle || `${job.title || "Job Title"} | Careers at TechSonance Infotech`;
  const serpSnippet =
    job.seoDescription ||
    job.summary ||
    "Explore career opportunities at TechSonance Infotech. Join our engineering, design, and enterprise solutions teams.";

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Bar with View Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-sora">
            Review, SEO &amp; Publishing Schedule
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit step summaries, inspect real candidate live view, and finalize SEO parameters.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setViewMode("summary")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              viewMode === "summary"
                ? "bg-white dark:bg-slate-900 text-[#1155CC] shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Step Summaries &amp; SEO</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("candidate")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              viewMode === "candidate"
                ? "bg-white dark:bg-slate-900 text-[#1155CC] shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Candidate Live View</span>
          </button>
        </div>
      </div>

      {viewMode === "candidate" ? (
        /* Full Candidate Portal Simulation */
        <div className="p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
          <JobLivePreview job={job} />
        </div>
      ) : (
        /* Step Summaries & Publishing Settings */
        <div className="space-y-6">
          {/* 5 Step Summary Cards */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Step Verification Cards
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Step 1 Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#1155CC] flex items-center justify-center font-bold">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white font-sora">
                        Step 1: Role Identity &amp; Overview
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {job.title ? `"${job.title}"` : "Untitled"} &bull;{" "}
                        {job.department || "No Department"} &bull; {job.openingsCount || 1}{" "}
                        opening(s)
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateToTab("basics")}
                    className="text-xs font-bold text-[#1155CC] hover:bg-blue-50 dark:hover:bg-blue-950/40 h-8 gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Step 1</span>
                  </Button>
                </div>
                {job.summary ? (
                  <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2 pl-3 border-l-2 border-blue-500/30">
                    &ldquo;{job.summary}&rdquo;
                  </p>
                ) : (
                  <p className="mt-2.5 text-xs text-amber-600 dark:text-amber-400 pl-3 border-l-2 border-amber-500/30">
                    No card summary snippet configured yet.
                  </p>
                )}
              </div>

              {/* Step 2 Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white font-sora">
                        Step 2: Workplace Location &amp; Mode
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {job.workMode?.toUpperCase() || "HYBRID"} &bull; Primary Hub:{" "}
                        {job.location || "Unspecified"} &bull;{" "}
                        {job.remoteEligibility || "No remote region"}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateToTab("location")}
                    className="text-xs font-bold text-[#1155CC] hover:bg-blue-50 dark:hover:bg-blue-950/40 h-8 gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Step 2</span>
                  </Button>
                </div>
              </div>

              {/* Step 3 Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center font-bold">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white font-sora">
                        Step 3: Role Content &amp; Requirements
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {(job.responsibilities || []).length} responsibilities &bull;{" "}
                        {(job.requirements || []).length} requirements &bull;{" "}
                        {(job.skills || []).length} skill tags &bull; {(job.benefits || []).length}{" "}
                        benefits
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateToTab("content")}
                    className="text-xs font-bold text-[#1155CC] hover:bg-blue-50 dark:hover:bg-blue-950/40 h-8 gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Step 3</span>
                  </Button>
                </div>
              </div>

              {/* Step 4 Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white font-sora">
                        Step 4: Compensation &amp; Pay Transparency
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatSalaryText()} &bull;{" "}
                        {job.showSalaryPublicly ? "Public Band" : "Confidential"}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateToTab("compensation")}
                    className="text-xs font-bold text-[#1155CC] hover:bg-blue-50 dark:hover:bg-blue-950/40 h-8 gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Step 4</span>
                  </Button>
                </div>
              </div>

              {/* Step 5 Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                      <Settings2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white font-sora">
                        Step 5: Application Settings &amp; Screening
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {job.applicationMethod === "external"
                          ? "External ATS Link"
                          : "Built-in Agency Portal"}{" "}
                        &bull; Resume: {job.resumeRequired !== false ? "Required" : "Optional"}{" "}
                        &bull; {(job.screeningQuestions || []).length} screening question(s)
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateToTab("application")}
                    className="text-xs font-bold text-[#1155CC] hover:bg-blue-50 dark:hover:bg-blue-950/40 h-8 gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Step 5</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Google SERP Preview (Finding 5, Finding 6) */}
          <div className="p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                <Search className="w-3.5 h-3.5 text-[#1155CC]" />
                <span>Google Search Snippet Preview</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                Rich Result JobPosting
              </Badge>
            </div>

            {/* Google Search Card Simulation */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 font-sans shadow-2xs">
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="w-4 h-4 rounded-full bg-[#1155CC] text-white flex items-center justify-center text-[9px] font-bold">
                  T
                </span>
                <span className="truncate">
                  TechSonance Infotech &rsaquo; careers &rsaquo; {job.slug || "job-slug"}
                </span>
              </div>
              <div className="text-sm font-semibold text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer">
                {serpTitle}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                {serpSnippet}
              </div>
            </div>

            {/* SEO Field Editors with Character Counters */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    SEO Meta Title
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      (job.seoTitle?.length || 0) > 60
                        ? "text-amber-500 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {job.seoTitle?.length || 0} / 60 characters
                  </span>
                </div>
                <Input
                  placeholder="e.g. Lead Distributed Systems Engineer Careers | TechSonance"
                  value={job.seoTitle || ""}
                  onChange={(e) => updateField("seoTitle", e.target.value)}
                  className="rounded-xl text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Optimal Google title length is 50–60 characters. Defaults to role title + agency
                  suffix if empty.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    SEO Meta Description (Decoupled from Card Summary)
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      (job.seoDescription?.length || 0) > 155
                        ? "text-amber-500 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {job.seoDescription?.length || 0} / 155 characters
                  </span>
                </div>
                <textarea
                  rows={2}
                  placeholder="Compelling snippet specifically engineered for search engine result pages (SERPs)."
                  value={job.seoDescription || ""}
                  onChange={(e) => updateField("seoDescription", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Optimal Google snippet length is 120–155 characters. Falls back to role summary if
                  empty.
                </p>
              </div>
            </div>
          </div>

          {/* Publication Schedule & Plain-English Outcome (Finding 18, Finding 20) */}
          <div className="space-y-4 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Publication Schedule &amp; Lifecycle Controls
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                label="Lifecycle Status"
                value={job.status || "DRAFT"}
                onChange={(e) => updateField("status", e.target.value)}
                className="font-bold font-mono"
              >
                <option value="DRAFT">DRAFT (Internal drafting)</option>
                <option value="IN_REVIEW">IN_REVIEW (Pending approval)</option>
                <option value="SCHEDULED">SCHEDULED (Automatic release)</option>
                <option value="PUBLISHED">PUBLISHED (Live on portal)</option>
                <option value="PAUSED">PAUSED (Temporarily on hold)</option>
                <option value="CLOSED">CLOSED (Archived / Closed)</option>
              </FormSelect>

              <FormSelect
                label="Portal Visibility"
                value={job.visibility || "public"}
                onChange={(e) => updateField("visibility", e.target.value)}
              >
                <option value="public">Public (Visible in search &amp; sitemap)</option>
                <option value="unlisted">Unlisted (Direct link only, excluded from sitemap)</option>
              </FormSelect>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Scheduled Publish Date
                </label>
                <Input
                  type="datetime-local"
                  value={job.publishAt ? new Date(job.publishAt).toISOString().slice(0, 16) : ""}
                  onChange={(e) =>
                    updateField("publishAt", e.target.value ? new Date(e.target.value) : null)
                  }
                  className="rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Application Deadline (closesAt)
                </label>
                <Input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={job.closesAt ? new Date(job.closesAt).toISOString().slice(0, 16) : ""}
                  onChange={(e) =>
                    updateField("closesAt", e.target.value ? new Date(e.target.value) : null)
                  }
                  className="rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Featured Role Placement
                </div>
                <div className="text-[10px] text-slate-400">
                  Pins role to top of the careers portal with special agency highlights.
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(job.featured)}
                onChange={(e) => updateField("featured", e.target.checked)}
                className="w-4 h-4 rounded text-[#1155CC] focus:ring-[#1155CC] cursor-pointer"
              />
            </div>

            {/* Plain-English Schedule Sentence Callout */}
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 font-medium leading-relaxed flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-[#1155CC] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#1155CC] dark:text-blue-300 text-[11px] font-bold uppercase tracking-wider mb-0.5">
                  Publication Schedule Summary
                </strong>
                <span>{getScheduleSentence()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
