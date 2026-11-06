"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Download,
  LayoutGrid,
  List,
  AlertTriangle,
  RefreshCw,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationStatus } from "@/lib/constants/enums";
import {
  ApplicationsTable,
  type ApplicationItem,
} from "@/components/admin/careers/ApplicationsTable";
import { ApplicationsKanban } from "@/components/admin/careers/ApplicationsKanban";
import { CandidateDrawer } from "@/components/admin/careers/CandidateDrawer";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

interface JobOption {
  id: string;
  title: string;
  department?: string;
}

export default function ApplicationsInboxPage() {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [knockoutOnly, setKnockoutOnly] = useState(false);

  // Available jobs for dropdown
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Selected candidate drawer
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load jobs filter list
  useEffect(() => {
    let isMounted = true;
    setLoadingJobs(true);
    fetch(`${API_ENDPOINTS.ADMIN.JOBS}?limit=100`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.items) {
          const mappedJobs = data.items.map(
            (j: { id: string; title: string; department?: string }) => ({
              id: j.id,
              title: j.title,
              department: j.department,
            }),
          );
          setJobs(mappedJobs);
        }
      })
      .catch(() => {
        // Fallback to empty if jobs cannot be loaded
      })
      .finally(() => {
        if (isMounted) setLoadingJobs(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedJobId) params.set("jobId", selectedJobId);
      if (selectedStatus) params.set("status", selectedStatus);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (knockoutOnly) params.set("knockoutTriggered", "true");
      params.set("limit", "100");

      const res = await fetch(`${API_ENDPOINTS.ADMIN.APPLICATIONS}?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load candidate applications");
      }
      const data = await res.json();
      setApplications(data.applications || []);
      setTotalCount(data.total ?? (data.applications?.length || 0));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load candidate applications";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedJobId, selectedStatus, debouncedSearch, knockoutOnly]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Handle stage change (e.g. from Kanban drag or advance)
  const handleStageChange = async (
    id: string,
    newStage: ApplicationStatus,
    rejectionReason?: string,
  ) => {
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.APPLICATION(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStage,
          rejectionReason: rejectionReason || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update candidate stage");
      }

      // Optimistically or refetch
      await fetchApplications();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update candidate stage";
      alert(msg);
    }
  };

  // Handle CSV export
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (selectedJobId) params.set("jobId", selectedJobId);
    const exportUrl = `/api/admin/careers/applications/export${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    window.open(exportUrl, "_blank");
  };

  // Quick stats
  const newCount = applications.filter((a) => a.status === ApplicationStatus.NEW).length;
  const interviewCount = applications.filter(
    (a) => a.status === ApplicationStatus.INTERVIEW,
  ).length;
  const knockoutCount = applications.filter((a) => a.knockoutTriggered).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-sora">
            Job Applications Inbox
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Review candidate resumes, candidate portfolios, and hiring submissions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="rounded-2xl flex items-center gap-1.5 text-xs h-9 border-slate-200 dark:border-slate-800"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchApplications()}
            className="rounded-2xl p-2 h-9 w-9 border-slate-200 dark:border-slate-800"
            title="Refresh applications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total In Pipeline
            </span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-sora">
            {totalCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">New Unreviewed</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-sora">
            {newCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Interview Stage</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-sora">
            {interviewCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Knockouts Flagged
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-sora">
            {knockoutCount}
          </p>
        </div>
      </div>

      {/* Control Bar: Filters & View Toggle */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Side: Search & Filter Inputs */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1155CC]/20 focus:border-[#1155CC] text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>

          {/* Job Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="text-xs py-2 px-3 pr-8 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1155CC]/20 focus:border-[#1155CC] cursor-pointer"
            >
              <option value="">All Open Roles</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter Dropdown (Active primarily in table view) */}
          {viewMode === "table" && (
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs py-2 px-3 pr-8 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1155CC]/20 focus:border-[#1155CC] cursor-pointer"
              >
                <option value="">All Stages</option>
                {Object.values(ApplicationStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Knockout Filter Checkbox */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer px-2.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
            <input
              type="checkbox"
              checked={knockoutOnly}
              onChange={(e) => setKnockoutOnly(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Knockouts Only
            </span>
          </label>
        </div>

        {/* Right Side: View Toggle Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl self-start md:self-auto border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-700 text-[#1155CC] dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "kanban"
                ? "bg-white dark:bg-slate-700 text-[#1155CC] dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Kanban
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {loading && applications.length === 0 ? (
        <div className="py-24 text-center space-y-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#1155CC]" />
          <p className="text-xs text-slate-500 font-medium">Loading candidate applications...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-3xl text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Failed to load applications</span>
          </div>
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchApplications()}
            className="rounded-xl mt-2 text-xs"
          >
            Try Again
          </Button>
        </div>
      ) : viewMode === "table" ? (
        <ApplicationsTable
          applications={applications}
          onSelectApplication={(id) => setSelectedAppId(id)}
        />
      ) : (
        <ApplicationsKanban
          applications={applications}
          onSelectApplication={(id) => setSelectedAppId(id)}
          onStageChange={handleStageChange}
        />
      )}

      {/* Candidate Profile Evaluation Drawer */}
      <CandidateDrawer
        applicationId={selectedAppId}
        isOpen={!!selectedAppId}
        onClose={() => setSelectedAppId(null)}
        onApplicationUpdated={() => fetchApplications()}
      />
    </div>
  );
}
