"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, MapPin, Trash2, RefreshCw, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { Job } from "@/lib/types/careers";
import { JobStatus } from "@/lib/constants/enums";
import { listAdminJobs, deleteAdminJob } from "@/lib/api/admin-jobs.api";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const items = await listAdminJobs({
        status: activeTab,
        search,
      });
      setJobs(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load positions.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDeleteJob = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }
    try {
      await deleteAdminJob(id);
      await fetchJobs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete position.";
      alert(msg);
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
    <div className="animate-in fade-in space-y-6 duration-300">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Careers & Job Openings
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
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
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              {errorMsg}
            </div>
          )}

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
            </div>
          </div>

          {/* Table */}
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-[#1155CC]" />
                      <span>Loading positions...</span>
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No jobs posted yet. Click "Post New Position" above to author a role!
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr
                      key={job.id}
                      className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        <Link
                          href={`/admin/careers/jobs/${job.id}`}
                          className="transition-colors hover:text-[#1155CC]"
                        >
                          <span>{job.title}</span>
                          <span className="block font-mono text-[10px] text-slate-400">
                            /{job.slug}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                        {job.department}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{job.location}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                        {job.type}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            job.status === JobStatus.OPEN || job.status === JobStatus.PUBLISHED
                              ? "success"
                              : job.status === JobStatus.IN_REVIEW
                                ? "warning"
                                : "secondary"
                          }
                          dot={job.status === JobStatus.OPEN || job.status === JobStatus.PUBLISHED}
                        >
                          {job.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/careers/jobs/${job.id}`}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-[#1155CC] dark:hover:bg-slate-800"
                            title="Edit Role"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteJob(job.id, job.title)}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800"
                            title="Delete Role"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
