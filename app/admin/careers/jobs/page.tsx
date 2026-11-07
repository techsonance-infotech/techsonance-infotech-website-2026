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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-sora">
            Careers & Job Openings
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Manage open positions displayed on the agency careers portal and configure live
            application screening.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="default"
            size="sm"
            className="rounded-2xl bg-[#1155CC] hover:bg-[#0d44a4] text-white shadow-md shadow-[#1155CC]/20 font-bold text-xs h-10 px-4"
          >
            <Link href="/admin/careers/jobs/new">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Post New Position</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <Card className="rounded-3xl border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800 rounded-2xl overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
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
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search position by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs rounded-2xl"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Role Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1155CC]" />
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
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <Link
                          href={`/admin/careers/jobs/${job.id}`}
                          className="hover:text-[#1155CC] transition-colors"
                        >
                          <span>{job.title}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            /{job.slug}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {job.department}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{job.location}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {job.type}
                      </td>
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/careers/jobs/${job.id}`}
                            className="p-1.5 text-slate-400 hover:text-[#1155CC] rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Role"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteJob(job.id, job.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete Role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
