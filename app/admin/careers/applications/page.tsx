"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  ShieldCheck,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationStatus } from "@/lib/constants/enums";
import {
  ApplicationsTable,
  type ApplicationItem,
} from "@/components/admin/careers/ApplicationsTable";
import { ApplicationsKanban } from "@/components/admin/careers/ApplicationsKanban";
import { CandidateDrawer } from "@/components/admin/careers/CandidateDrawer";
import { ComplianceAuditModal } from "@/components/admin/careers/ComplianceAuditModal";
import {
  listAdminApplications,
  updateAdminApplication,
  getAdminApplicationsExportUrl,
} from "@/lib/api/admin-applications.api";
import { listAdminJobs } from "@/lib/api/admin-jobs.api";
import { AsyncState } from "@/components/feedback/AsyncState";

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
  const [actionError, setActionError] = useState<string | null>(null);

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
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load jobs filter list safely via listAdminJobs
  useEffect(() => {
    const controller = new AbortController();
    setLoadingJobs(true);

    listAdminJobs({ limit: 100, signal: controller.signal })
      .then((items) => {
        const mappedJobs = (items ?? []).map((j) => ({
          id: j.id,
          title: j.title || "Untitled Role",
          department: j.department || "General",
        }));
        setJobs(mappedJobs);
      })
      .catch(() => {
        // Fallback gracefully without breaking candidate view
      })
      .finally(() => {
        setLoadingJobs(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  // Request race condition guard
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef<number>(0);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentSeq = ++requestSeqRef.current;

    setLoading(true);
    setError(null);

    try {
      const data = await listAdminApplications(
        {
          jobId: selectedJobId || undefined,
          status: selectedStatus ? (selectedStatus as ApplicationStatus) : undefined,
          search: debouncedSearch.trim() || undefined,
          knockoutTriggered: knockoutOnly ? true : undefined,
          limit: 100,
        },
        { signal: controller.signal },
      );

      if (currentSeq === requestSeqRef.current) {
        setApplications(data.applications ?? []);
        setTotalCount(data.total ?? 0);
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      if (currentSeq === requestSeqRef.current) {
        const msg = err instanceof Error ? err.message : "Failed to load candidate applications";
        setError(msg);
      }
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [selectedJobId, selectedStatus, debouncedSearch, knockoutOnly]);

  useEffect(() => {
    fetchApplications();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchApplications]);

  // Handle stage change (e.g. from Kanban drag or advance)
  const handleStageChange = async (
    id: string,
    newStage: ApplicationStatus,
    rejectionReason?: string,
  ) => {
    try {
      setActionError(null);
      await updateAdminApplication(id, {
        status: newStage,
        rejectionReason: rejectionReason || undefined,
      });

      await fetchApplications();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update candidate stage";
      setActionError(msg);
    }
  };

  // Handle CSV export
  const handleExportCsv = () => {
    try {
      const exportUrl = getAdminApplicationsExportUrl(selectedJobId || undefined);
      window.open(exportUrl, "_blank");
    } catch {
      setActionError("Unable to open export URL. Please verify popup permissions.");
    }
  };

  // Defensive metrics calculation
  const safeApps = Array.isArray(applications) ? applications : [];
  const newCount = safeApps.filter((a) => a.status === ApplicationStatus.NEW).length;
  const interviewCount = safeApps.filter(
    (a) => a.status === ApplicationStatus.INTERVIEW,
  ).length;
  const knockoutCount = safeApps.filter((a) => a.knockoutTriggered).length;

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Job Applications Inbox
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">
            Review candidate resumes, candidate portfolios, and hiring submissions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setComplianceModalOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-2xl border-slate-200 text-xs text-slate-700 dark:border-slate-800 dark:text-slate-300"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#1155CC]" />
            Privacy & GDPR
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex h-9 items-center gap-1.5 rounded-2xl border-slate-200 text-xs dark:border-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchApplications()}
            className="h-9 w-9 rounded-2xl border-slate-200 p-2 dark:border-slate-800"
            title="Refresh applications"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Non-blocking action error notification */}
      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="cursor-pointer font-bold text-rose-800 hover:opacity-80 dark:text-rose-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-1 flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              Total In Pipeline
            </span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="font-sora text-2xl font-black text-slate-900 dark:text-white">
            {totalCount}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-1 flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold tracking-wider uppercase">New Unreviewed</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="font-sora text-2xl font-black text-amber-600 dark:text-amber-400">
            {newCount}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-1 flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold tracking-wider uppercase">Interview Stage</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="font-sora text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {interviewCount}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-1 flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              Knockouts Flagged
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="font-sora text-2xl font-black text-rose-600 dark:text-rose-400">
            {knockoutCount}
          </p>
        </div>
      </div>

      {/* Control Bar: Filters & View Toggle */}
      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs md:flex-row md:items-center dark:border-slate-800 dark:bg-slate-900">
        {/* Left Side: Search & Filter Inputs */}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative max-w-sm min-w-[220px] flex-1">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pr-8 pl-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/20 focus:outline-none dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Job Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-xs text-slate-700 focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/20 focus:outline-none dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300"
            >
              <option value="">All Open Roles</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter Dropdown */}
          {viewMode === "table" && (
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-xs text-slate-700 focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/20 focus:outline-none dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300"
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
          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/60">
            <input
              type="checkbox"
              checked={knockoutOnly}
              onChange={(e) => setKnockoutOnly(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Knockouts Only
            </span>
          </label>
        </div>

        {/* Right Side: View Toggle Buttons */}
        <div className="flex items-center gap-1 self-start rounded-2xl border border-slate-200/60 bg-slate-100 p-1 md:self-auto dark:border-slate-700/60 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-700 text-[#1155CC] dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === "kanban"
                ? "bg-white dark:bg-slate-700 text-[#1155CC] dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Kanban
          </button>
        </div>
      </div>

      {/* Main View Area wrapped in AsyncState */}
      <AsyncState
        loading={loading}
        error={error}
        data={applications}
        isEmpty={(items) => items.length === 0}
        onRetry={fetchApplications}
        skeleton={
          <div className="space-y-3 py-12">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        }
        emptyUI={
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 text-center dark:border-slate-800 dark:bg-slate-900">
            <Users className="h-10 w-10 text-slate-300 dark:text-slate-600" />
            <h4 className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
              {debouncedSearch || selectedJobId || selectedStatus || knockoutOnly
                ? "No applications match current filters"
                : "No candidate applications received yet"}
            </h4>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              {debouncedSearch || selectedJobId || selectedStatus || knockoutOnly
                ? "Try clearing your search query or selecting 'All Open Roles'."
                : "Public submissions from the careers portal will populate your candidate pipeline automatically."}
            </p>
            {(debouncedSearch || selectedJobId || selectedStatus || knockoutOnly) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedJobId("");
                  setSelectedStatus("");
                  setKnockoutOnly(false);
                }}
                className="mt-4 rounded-xl text-xs"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        }
      >
        {(renderedApps) =>
          viewMode === "table" ? (
            <ApplicationsTable
              applications={renderedApps}
              onSelectApplication={(id) => setSelectedAppId(id)}
            />
          ) : (
            <ApplicationsKanban
              applications={renderedApps}
              onSelectApplication={(id) => setSelectedAppId(id)}
              onStageChange={handleStageChange}
            />
          )
        }
      </AsyncState>

      {/* Candidate Profile Evaluation Drawer */}
      <CandidateDrawer
        applicationId={selectedAppId}
        isOpen={!!selectedAppId}
        onClose={() => setSelectedAppId(null)}
        onApplicationUpdated={() => fetchApplications()}
      />

      {/* GDPR / Privacy Compliance Modal */}
      <ComplianceAuditModal
        isOpen={complianceModalOpen}
        onClose={() => setComplianceModalOpen(false)}
        onPurgeSuccess={() => fetchApplications()}
      />
    </div>
  );
}
