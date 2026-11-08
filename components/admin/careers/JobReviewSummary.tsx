"use client";

import React, { useState } from "react";
import {
  Briefcase,
  MapPin,
  FileText,
  DollarSign,
  Settings2,
  Search,
  Eye,
  Calendar,
  Layers,
  Edit3,
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

const clientLoadedTime = typeof window !== "undefined" ? Date.now() : 0;
const clientMinDateIso = typeof window !== "undefined" ? new Date().toISOString().slice(0, 16) : "";

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
        if (pubDate.getTime() > clientLoadedTime) {
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
      <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center dark:border-slate-800">
        <div>
          <h3 className="font-sora text-base font-bold text-slate-900 dark:text-white">
            Review, SEO &amp; Publishing Schedule
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Audit step summaries, inspect real candidate live view, and finalize SEO parameters.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setViewMode("summary")}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === "summary"
                ? "bg-white dark:bg-slate-900 text-[#1155CC] shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Step Summaries &amp; SEO</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("candidate")}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === "candidate"
                ? "bg-white dark:bg-slate-900 text-[#1155CC] shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Candidate Live View</span>
          </button>
        </div>
      </div>

      {viewMode === "candidate" ? (
        /* Full Candidate Portal Simulation */
        <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <JobLivePreview job={job} />
        </div>
      ) : (
        /* Step Summaries & Publishing Settings */
        <div className="space-y-6">
          {/* 5 Step Summary Cards */}
          <div className="space-y-3">
            <div className="font-mono text-xs font-bold tracking-wider text-slate-400 uppercase">
              Step Verification Cards
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Step 1 Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/20 dark:hover:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 font-bold text-[#1155CC]">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-sora text-xs font-bold text-slate-900 dark:text-white">
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
                    className="h-8 cursor-pointer gap-1 text-xs font-bold text-[#1155CC] hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit Step 1</span>
                  </Button>
                </div>
                {job.summary ? (
                  <p className="mt-2.5 line-clamp-2 border-l-2 border-blue-500/30 pl-3 text-xs text-slate-600 italic dark:text-slate-300">
                    &ldquo;{job.summary}&rdquo;
                  </p>
                ) : (
                  <p className="mt-2.5 border-l-2 border-amber-500/30 pl-3 text-xs text-amber-600 dark:text-amber-400">
                    No card summary snippet configured yet.
                  </p>
                )}
              </div>

              {/* Step 2 Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/20 dark:hover:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 font-bold text-indigo-600">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-sora text-xs font-bold text-slate-900 dark:text-white">
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
                    className="h-8 cursor-pointer gap-1 text-xs font-bold text-[#1155CC] hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit Step 2</span>
                  </Button>
                </div>
              </div>

              {/* Step 3 Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/20 dark:hover:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 font-bold text-violet-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-sora text-xs font-bold text-slate-900 dark:text-white">
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
                    className="h-8 cursor-pointer gap-1 text-xs font-bold text-[#1155CC] hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit Step 3</span>
                  </Button>
                </div>
              </div>

              {/* Step 4 Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/20 dark:hover:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 font-bold text-emerald-600">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-sora text-xs font-bold text-slate-900 dark:text-white">
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
                    className="h-8 cursor-pointer gap-1 text-xs font-bold text-[#1155CC] hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit Step 4</span>
                  </Button>
                </div>
              </div>

              {/* Step 5 Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/20 dark:hover:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 font-bold text-amber-600">
                      <Settings2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-sora text-xs font-bold text-slate-900 dark:text-white">
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
                    className="h-8 cursor-pointer gap-1 text-xs font-bold text-[#1155CC] hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit Step 5</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Google SERP Preview (Finding 5, Finding 6) */}
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                <Search className="h-3.5 w-3.5 text-[#1155CC]" />
                <span>Google Search Snippet Preview</span>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                Rich Result JobPosting
              </Badge>
            </div>

            {/* Google Search Card Simulation */}
            <div className="space-y-1 rounded-2xl border border-slate-200 bg-white p-4 font-sans shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1155CC] text-[9px] font-bold text-white">
                  T
                </span>
                <span className="truncate">
                  TechSonance Infotech &rsaquo; careers &rsaquo; {job.slug || "job-slug"}
                </span>
              </div>
              <div className="cursor-pointer text-sm font-semibold text-[#1a0dab] hover:underline dark:text-[#8ab4f8]">
                {serpTitle}
              </div>
              <div className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                {serpSnippet}
              </div>
            </div>

            {/* SEO Field Editors with Character Counters */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="review-seo-title"
                    className="text-[11px] font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                  >
                    SEO Meta Title
                  </label>
                  <span
                    className={`font-mono text-[10px] ${
                      (job.seoTitle?.length || 0) > 60
                        ? "text-amber-500 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {job.seoTitle?.length || 0} / 60 characters
                  </span>
                </div>
                <Input
                  id="review-seo-title"
                  placeholder="e.g. Lead Distributed Systems Engineer Careers | TechSonance"
                  value={job.seoTitle || ""}
                  onChange={(e) => updateField("seoTitle", e.target.value)}
                  className="rounded-xl text-xs"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Optimal Google title length is 50–60 characters. Defaults to role title + agency
                  suffix if empty.
                </p>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="review-seo-desc"
                    className="text-[11px] font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                  >
                    SEO Meta Description (Decoupled from Card Summary)
                  </label>
                  <span
                    className={`font-mono text-[10px] ${
                      (job.seoDescription?.length || 0) > 155
                        ? "text-amber-500 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {job.seoDescription?.length || 0} / 155 characters
                  </span>
                </div>
                <textarea
                  id="review-seo-desc"
                  rows={2}
                  placeholder="Compelling snippet specifically engineered for search engine result pages (SERPs)."
                  value={job.seoDescription || ""}
                  onChange={(e) => updateField("seoDescription", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Optimal Google snippet length is 120–155 characters. Falls back to role summary if
                  empty.
                </p>
              </div>
            </div>
          </div>

          {/* Publication Schedule & Plain-English Outcome (Finding 18, Finding 20) */}
          <div className="space-y-4 pt-2">
            <div className="font-mono text-xs font-bold tracking-wider text-slate-400 uppercase">
              Publication Schedule &amp; Lifecycle Controls
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormSelect
                label="Lifecycle Status"
                value={job.status || "DRAFT"}
                onChange={(e) => updateField("status", e.target.value)}
                className="font-mono font-bold"
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="review-publish-at"
                  className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Scheduled Publish Date
                </label>
                <Input
                  id="review-publish-at"
                  type="datetime-local"
                  value={job.publishAt ? new Date(job.publishAt).toISOString().slice(0, 16) : ""}
                  onChange={(e) =>
                    updateField("publishAt", e.target.value ? new Date(e.target.value) : null)
                  }
                  className="rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label
                  htmlFor="review-closes-at"
                  className="mb-1.5 block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Application Deadline (closesAt)
                </label>
                <Input
                  id="review-closes-at"
                  type="datetime-local"
                  min={clientMinDateIso}
                  value={job.closesAt ? new Date(job.closesAt).toISOString().slice(0, 16) : ""}
                  onChange={(e) =>
                    updateField("closesAt", e.target.value ? new Date(e.target.value) : null)
                  }
                  className="rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
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
                className="h-4 w-4 cursor-pointer rounded text-[#1155CC] focus:ring-[#1155CC]"
              />
            </div>

            {/* Plain-English Schedule Sentence Callout */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-blue-200/80 bg-blue-50/70 p-4 text-xs leading-relaxed font-medium text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#1155CC]" />
              <div>
                <strong className="mb-0.5 block text-[11px] font-bold tracking-wider text-[#1155CC] uppercase dark:text-blue-300">
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
