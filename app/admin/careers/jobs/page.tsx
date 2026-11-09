"use client";

import React, { useState, useEffect, useCallback, useRef, startTransition } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MapPin,
  Trash2,
  RefreshCw,
  Edit3,
  Briefcase,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job } from "@/lib/types/careers";
import { JobStatus } from "@/lib/constants/enums";
import { listAdminJobs, deleteAdminJob } from "@/lib/api/admin-jobs.api";
import { AsyncState } from "@/components/feedback/AsyncState";
import { JobStatusModal } from "@/components/admin/careers/JobStatusModal";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Deletion modal state
  const [jobToDelete, setJobToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Status transition modal state
  const [jobForStatusModal, setJobForStatusModal] = useState<Job | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Request race condition guard
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef<number>(0);

  const fetchJobs = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentSeq = ++requestSeqRef.current;

    try {
      setLoading(true);
      setErrorMsg(null);
      const items = await listAdminJobs({
        status: activeTab,
        search: debouncedSearch.trim() || undefined,
        signal: controller.signal,
      });

      if (currentSeq === requestSeqRef.current) {
        setJobs(items);
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      if (currentSeq === requestSeqRef.current) {
        const msg = err instanceof Error ? err.message : "Failed to load positions.";
        setErrorMsg(msg);
      }
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [activeTab, debouncedSearch]);

  useEffect(() => {
    startTransition(() => {
      void fetchJobs();
    });
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchJobs]);

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteAdminJob(jobToDelete.id);
      setJobToDelete(null);
      await fetchJobs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete position.";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    { label: "All Positions", value: "ALL" },
    { label: "Published", value: JobStatus.PUBLISHED },
    { label: "In Review", value: JobStatus.IN_REVIEW },
    { label: "Drafts", value: JobStatus.DRAFT },
    { label: "Paused", value: JobStatus.PAUSED },
    { label: "Closed", value: JobStatus.CLOSED },
  ];

  return (
    <div className="space-y-6 duration-300 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Careers & Job Openings
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">
            Manage open positions displayed on the agency careers portal and configure live
            application screening.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="default"
            size="sm"
            className="h-10 rounded-2xl bg-[#1155CC] px-4 text-xs font-bold text-white shadow-md shadow-[#1155CC]/20 hover:bg-[#0d44a4]"
          >
            <Link href="/admin/careers/jobs/new">
              <Plus className="mr-1.5 h-4 w-4" />
              <span>Post New Position</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <Card className="rounded-3xl border-slate-200 dark:border-slate-800">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    activeTab === tab.value
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search position by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-2xl pl-8 text-xs"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table Container wrapped in AsyncState */}
          <AsyncState
            loading={loading}
            error={errorMsg}
            data={jobs}
            isEmpty={(items) => items.length === 0}
            onRetry={fetchJobs}
            skeleton={
              <div className="space-y-3 py-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-2xl" />
                ))}
              </div>
            }
            emptyUI={
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
                <Briefcase className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                <h4 className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                  {debouncedSearch || activeTab !== "ALL"
                    ? "No positions match current filter criteria"
                    : "No job positions created yet"}
                </h4>
                <p className="mt-1 max-w-sm text-xs text-slate-400">
                  {debouncedSearch || activeTab !== "ALL"
                    ? "Try adjusting your search terms or selecting 'All Positions'."
                    : "Click 'Post New Position' to author and publish a new job opening."}
                </p>
                {debouncedSearch || activeTab !== "ALL" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setActiveTab("ALL");
                    }}
                    className="mt-4 rounded-xl text-xs"
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="sm"
                    className="mt-4 rounded-xl bg-[#1155CC] text-xs text-white hover:bg-[#0d44a4]"
                  >
                    <Link href="/admin/careers/jobs/new">Post New Position</Link>
                  </Button>
                )}
              </div>
            }
          >
            {(renderedJobs) => (
              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3">Role Title</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {renderedJobs.map((job) => (
                      <tr
                        key={job.id}
                        className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td
                          aria-label={`Position: ${job.title || "Untitled Position"}`}
                          className="px-4 py-3.5 font-bold text-slate-900 dark:text-white"
                        >
                          <Link
                            href={`/admin/careers/jobs/${job.id}`}
                            className="transition-colors hover:text-[#1155CC]"
                          >
                            <span>{job.title || "Untitled Position"}</span>
                            <span className="block font-mono text-[10px] text-slate-400">
                              /{job.slug || "job"}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                          {job.department || "General"}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span>{job.location || "Remote"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                          {job.type || "Full Time"}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => setJobForStatusModal(job)}
                            className="group/status inline-flex cursor-pointer items-center gap-1.5 rounded-full p-0.5 pr-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Click to change position status"
                          >
                            <Badge
                              variant={
                                job.status === JobStatus.OPEN || job.status === JobStatus.PUBLISHED
                                  ? "success"
                                  : job.status === JobStatus.IN_REVIEW
                                    ? "info"
                                    : job.status === JobStatus.PAUSED
                                      ? "warning"
                                      : job.status === JobStatus.CLOSED
                                        ? "destructive"
                                        : "secondary"
                              }
                              dot={
                                job.status === JobStatus.OPEN || job.status === JobStatus.PUBLISHED
                              }
                              className="cursor-pointer transition-all group-hover/status:ring-2 group-hover/status:ring-[#1155CC]/30"
                            >
                              {job.status}
                            </Badge>
                            <ChevronDown className="h-3 w-3 text-slate-400 opacity-60 transition-opacity group-hover/status:text-[#1155CC] group-hover/status:opacity-100" />
                          </button>
                        </td>
                        <td aria-label="Actions" className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/careers/jobs/${job.id}`}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-[#1155CC] dark:hover:bg-slate-800"
                              title="Edit Role"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() =>
                                setJobToDelete({ id: job.id, title: job.title || "Position" })
                              }
                              className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800"
                              title="Delete Role"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AsyncState>
        </CardContent>
      </Card>

      {/* Non-blocking Deletion Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-job-dialog-title"
            className="relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <h3
              id="delete-job-dialog-title"
              className="font-sora text-base font-bold text-slate-900 dark:text-white"
            >
              Permanently Delete Position?
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete{" "}
              <strong className="text-slate-800 dark:text-slate-200">"{jobToDelete.title}"</strong>?
              This will permanently archive candidate routing for this role.
            </p>
            {deleteError && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                {deleteError}
              </div>
            )}
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={deleting}
                onClick={() => {
                  setJobToDelete(null);
                  setDeleteError(null);
                }}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={deleting}
                onClick={confirmDeleteJob}
                className="rounded-xl bg-rose-600 text-xs text-white hover:bg-rose-700"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" /> Deleting…
                  </>
                ) : (
                  "Delete Role"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Status Transition Modal */}
      <JobStatusModal
        isOpen={Boolean(jobForStatusModal)}
        job={jobForStatusModal}
        onClose={() => setJobForStatusModal(null)}
        onSuccess={(updatedJob) => {
          setJobs((prev) =>
            prev.map((j) => (j.id === updatedJob.id ? { ...j, status: updatedJob.status } : j)),
          );
          void fetchJobs();
        }}
      />
    </div>
  );
}
