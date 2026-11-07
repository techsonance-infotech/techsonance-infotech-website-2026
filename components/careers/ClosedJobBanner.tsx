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

  const activeSimilarJobs = similarJobs.filter(
    (job) => job.status === "OPEN" || job.status === "PUBLISHED",
  );

  return (
    <aside aria-label="Role status notification" className="mb-8 w-full">
      <div
        className={`rounded-2xl border p-6 ${
          isPaused
            ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
            : "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`rounded-xl p-3 ${
              isPaused
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
            }`}
          >
            {isPaused ? (
              <Clock className="h-6 w-6 animate-pulse" />
            ) : (
              <AlertCircle className="h-6 w-6" />
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <h3 className="text-lg font-bold">
              {isPaused ? "This position is temporarily paused" : "This position is now closed"}
            </h3>
            <p className="font-sans text-sm leading-relaxed opacity-90">
              {isPaused
                ? "This opening is temporarily on hold and not accepting applications. We are reviewing existing candidates. Please check back soon or browse our other active roles."
                : "This opening is now closed and no longer accepting applications. We are actively hiring across multiple departments and would love to review your profile for other opportunities."}
            </p>
            <div className="pt-3">
              <Link
                href="/careers"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900"
              >
                <span>View all open roles</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isClosed && activeSimilarJobs.length > 0 && (
        <div className="mt-8 space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-500 uppercase">
            <Briefcase className="h-4 w-4" />
            <span>Similar Active Positions in {activeSimilarJobs[0]?.department}</span>
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {activeSimilarJobs.slice(0, 2).map((job) => (
              <Link
                key={job.slug}
                href={`/careers/${job.slug}`}
                className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:border-blue-500/40 hover:shadow-lg dark:border-slate-800/80 dark:bg-slate-900/60"
              >
                <div className="mb-1 text-xs font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                  {job.department}
                </div>
                <h5 className="font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100">
                  {job.title}
                </h5>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span>{job.location}</span>
                  <span>•</span>
                  <span>{job.type}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

export default ClosedJobBanner;
