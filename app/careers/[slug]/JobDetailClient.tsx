"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Share2,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  Users,
  ChevronRight,
} from "lucide-react";
import type { JobPosting } from "@/lib/content/types";
import { ClosedJobBanner } from "@/components/careers/ClosedJobBanner";

interface JobDetailClientProps {
  job: JobPosting;
  similarJobs?: JobPosting[];
}

export function JobDetailClient({ job, similarJobs = [] }: JobDetailClientProps) {
  const [copied, setCopied] = useState(false);
  const isAvailable = job.status === "PUBLISHED" || job.status === "OPEN";

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${job.title} at TechSonance Infotech`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Ignore user cancellation
    }
  };

  const formattedSalary = () => {
    if (!job.showSalaryPublicly) return null;
    if (!job.salaryMin && !job.salaryMax) return null;

    const currencySymbol = job.salaryCurrency === "USD" ? "$" : job.salaryCurrency === "EUR" ? "€" : "₹";
    const period = job.salaryPeriod ? ` / ${job.salaryPeriod}` : "";

    if (job.salaryMin && job.salaryMax) {
      return `${currencySymbol}${job.salaryMin.toLocaleString()} - ${currencySymbol}${job.salaryMax.toLocaleString()}${period}`;
    }
    if (job.salaryMin) {
      return `From ${currencySymbol}${job.salaryMin.toLocaleString()}${period}`;
    }
    return `Up to ${currencySymbol}${job.salaryMax?.toLocaleString()}${period}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-8 overflow-x-auto pb-2">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href="/careers" className="hover:text-blue-600 transition-colors">
            Careers
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-200 truncate">{job.title}</span>
        </nav>

        {/* Closed or Paused Banner */}
        <ClosedJobBanner status={job.status} similarJobs={similarJobs} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Role Content */}
          <div className="lg:col-span-8 space-y-10">
            {/* Header Section */}
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {job.department}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {job.workMode || "Hybrid"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {job.type}
                </span>
                {job.referenceCode && (
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-400 border border-slate-200 dark:border-slate-800">
                    Ref: {job.referenceCode}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-sora tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                {job.title}
              </h1>

              {/* Meta details bar */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{job.location}</span>
                </div>
                {job.experienceLevel && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>{job.experienceLevel}</span>
                  </div>
                )}
                {formattedSalary() && (
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                    <span>{formattedSalary()}</span>
                  </div>
                )}
              </div>

              {job.summary && (
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-sans pt-2">
                  {job.summary}
                </p>
              )}
            </header>

            {/* Description */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold font-sora text-slate-900 dark:text-white">
                About the Role
              </h2>
              <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {job.description}
              </div>
            </section>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold font-sora text-slate-900 dark:text-white">
                  Key Responsibilities
                </h2>
                <ul className="space-y-3">
                  {job.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold font-sora text-slate-900 dark:text-white">
                  Required Skills & Experience
                </h2>
                <ul className="space-y-3">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Preferred Qualifications */}
            {job.preferredQualifications && job.preferredQualifications.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold font-sora text-slate-900 dark:text-white">
                  Preferred Qualifications
                </h2>
                <ul className="space-y-3">
                  {job.preferredQualifications.map((pref, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-2.5" />
                      <span>{pref}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Skills & Tech Stack */}
            {job.skills && job.skills.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold font-sora text-slate-900 dark:text-white">
                  Skills & Technologies
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold font-sora text-slate-900 dark:text-white">
                  Perks & Benefits
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {job.benefits.map((benefit, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Hiring Process */}
            {job.hiringProcess && job.hiringProcess.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold font-sora text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span>Our Hiring Process</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {job.hiringProcess.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 relative"
                    >
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        Step {step.step || `0${idx + 1}`}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {step.title}
                      </h4>
                      {step.desc && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {step.desc}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Equal Opportunity Statement */}
            <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
              <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Equal Opportunity Employer</span>
              </div>
              <p>
                {job.equalOpportunityStatement ||
                  "TechSonance Infotech provides equal employment opportunities to all employees and applicants without regard to race, color, religion, sex, sexual orientation, gender identity, national origin, disability, veteran status, or any other legally protected status."}
              </p>
            </footer>
          </div>

          {/* Sidebar Action Card */}
          <aside className="lg:col-span-4 sticky top-24 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-900/5 space-y-6">
              <div>
                <h3 className="text-lg font-bold font-sora text-slate-900 dark:text-white">
                  Apply for this Position
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isAvailable
                    ? "Submit your application in 2 minutes."
                    : "Applications for this position are currently closed."}
                </p>
              </div>

              {formattedSalary() && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <div className="text-[11px] uppercase tracking-wider font-bold">Estimated Compensation</div>
                  <div className="text-lg font-black font-sora mt-0.5">{formattedSalary()}</div>
                </div>
              )}

              {isAvailable ? (
                job.applicationMethod === "external" && job.externalApplyUrl ? (
                  <a
                    href={job.externalApplyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#1155CC] hover:bg-[#0d44a4] text-white font-bold text-sm shadow-lg shadow-[#1155CC]/25 transition-all"
                  >
                    <span>Apply on External Site</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <Link
                    href={`/careers/${job.slug}#apply-form`}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#1155CC] hover:bg-[#0d44a4] text-white font-bold text-sm shadow-lg shadow-[#1155CC]/25 transition-all"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold text-sm cursor-not-allowed"
                >
                  Position Closed
                </button>
              )}

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <div className="flex justify-between py-1">
                  <span>Department</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{job.department}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Location</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{job.location}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Workplace Type</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{job.workMode || "Hybrid"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Employment Type</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{job.type}</span>
                </div>
              </div>

              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? "Link Copied!" : "Share this Opening"}</span>
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky CTA Bar */}
      {isAvailable && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
              {job.title}
            </div>
            <div className="text-[11px] text-slate-500">{job.location}</div>
          </div>
          {job.applicationMethod === "external" && job.externalApplyUrl ? (
            <a
              href={job.externalApplyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-5 rounded-xl bg-[#1155CC] text-white text-xs font-bold shadow-md shadow-[#1155CC]/25 flex items-center gap-1.5"
            >
              <span>Apply</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <Link
              href={`/careers/${job.slug}#apply-form`}
              className="py-2.5 px-5 rounded-xl bg-[#1155CC] text-white text-xs font-bold shadow-md shadow-[#1155CC]/25 flex items-center gap-1.5"
            >
              <span>Apply Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default JobDetailClient;
