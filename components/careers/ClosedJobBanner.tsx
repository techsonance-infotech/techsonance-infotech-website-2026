import React from "react";
import Link from "next/link";
import { AlertCircle, Clock, ArrowRight, Briefcase } from "lucide-react";
import type { JobPosting } from "@/lib/content/types";

interface ClosedJobBannerProps {
  status: string;
  similarJobs?: JobPosting[];
}

export function ClosedJobBanner({ status, similarJobs = [] }: ClosedJobBannerProps) {
  const isPaused = status === "PAUSED";
  const isClosed = status === "CLOSED";

  if (!isPaused && !isClosed) {
    return null;
  }

  return (
    <div className="w-full mb-8">
      <div
        className={`rounded-2xl p-6 border ${
          isPaused
            ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
            : "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl ${
              isPaused
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
            }`}
          >
            {isPaused ? (
              <Clock className="w-6 h-6 animate-pulse" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-lg font-bold font-sora">
              {isPaused
                ? "This position is temporarily paused"
                : "This position is now closed"}
            </h3>
            <p className="text-sm opacity-90 leading-relaxed font-sans">
              {isPaused
                ? "We have temporarily paused applications for this opening while our hiring team reviews existing candidates. Please check back soon or browse our other active roles."
                : "We are no longer accepting new applications for this specific position. However, we are actively hiring across multiple departments and would love to review your profile for other opportunities."}
            </p>
            <div className="pt-3">
              <Link
                href="/careers"
                className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity"
              >
                <span>View all open roles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isClosed && similarJobs.length > 0 && (
        <div className="mt-8 space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span>Similar Active Positions in {similarJobs[0]?.department}</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {similarJobs.slice(0, 2).map((job) => (
              <Link
                key={job.slug}
                href={`/careers/${job.slug}`}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/40 hover:shadow-lg transition-all"
              >
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                  {job.department}
                </div>
                <h5 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                  {job.title}
                </h5>
                <div className="mt-2 text-xs text-slate-500 flex items-center gap-3">
                  <span>{job.location}</span>
                  <span>•</span>
                  <span>{job.type}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClosedJobBanner;
