"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  History,
  CheckCheck,
  Undo2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  JobEditorForm,
  type JobFormData,
  DEFAULT_JOB_FORM,
} from "@/components/admin/careers/JobEditorForm";
import { evaluateCompleteness } from "@/components/admin/careers/CompletenessChecklist";
import { ApprovalActionDialog } from "@/components/admin/careers/ApprovalActionDialog";
import { VersionHistoryDialog } from "@/components/admin/careers/VersionHistoryDialog";

interface JobEditorPageProps {
  params: Promise<{ id: string }>;
}

export default function JobEditorPage({ params }: JobEditorPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const isNew = id === "new";
  const [loading, setLoading] = useState(!isNew);
  const [jobData, setJobData] = useState<JobFormData>(DEFAULT_JOB_FORM);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalMode, setApprovalMode] = useState<"approve" | "return">("approve");
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  // Fetch existing job if not "new"
  const fetchJob = useCallback(async () => {
    if (isNew) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/jobs/${id}`);
      const data = await res.json();
      if (data.ok && data.job) {
        setJobData(data.job);
      } else {
        setAlertMessage({ type: "error", text: data.error || "Failed to load position." });
      }
    } catch (err: any) {
      console.error("Fetch job error:", err);
      setAlertMessage({ type: "error", text: "Network error loading position data." });
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // Save handler (Create new or update existing)
  const handleSave = async (updatedData: JobFormData) => {
    setSaving(true);
    setSaveStatus("saving");
    setAlertMessage(null);

    try {
      if (isNew) {
        const res = await fetch("/api/admin/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });
        const data = await res.json();
        if (res.ok && data.ok && data.job) {
          setSaveStatus("saved");
          setLastSavedAt(new Date());
          setJobData(data.job);
          setAlertMessage({ type: "success", text: "Role draft created successfully!" });
          // Redirect to the newly created job ID
          router.replace(`/admin/careers/jobs/${data.job.id}`);
        } else {
          setSaveStatus("error");
          const msg =
            typeof data.error === "string"
              ? data.error
              : data.error?.message || "Failed to create position.";
          setAlertMessage({ type: "error", text: msg });
        }
      } else {
        const res = await fetch(`/api/admin/jobs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });
        const data = await res.json();
        if (data.ok && data.job) {
          setSaveStatus("saved");
          setLastSavedAt(new Date());
          setJobData(data.job);
          setAlertMessage({ type: "success", text: "Draft changes saved." });
          setTimeout(
            () => setAlertMessage((prev) => (prev?.type === "success" ? null : prev)),
            4000,
          );
        } else {
          setSaveStatus("error");
          const msg =
            typeof data.error === "string"
              ? data.error
              : data.error?.message || "Failed to save changes.";
          const details = data.details
            ? Object.entries(data.details)
                .filter(([k]) => k !== "_errors")
                .map(([field, err]: [string, any]) => {
                  const fieldErrors = Array.isArray(err)
                    ? err
                    : (err as { _errors?: string[] })?._errors || [];
                  return `${field}: ${fieldErrors.join(", ")}`;
                })
                .filter(Boolean)
                .join("; ")
            : "";
          setAlertMessage({
            type: "error",
            text: details ? `${msg} (${details})` : msg,
          });
        }
      }
    } catch (err: any) {
      console.error("Save job error:", err);
      setSaveStatus("error");
      setAlertMessage({ type: "error", text: "Network error saving position." });
    } finally {
      setSaving(false);
    }
  };

  // Duplicate role action
  const handleDuplicate = async (sourceData?: JobFormData) => {
    const dataToClone = sourceData || jobData;
    try {
      setDuplicating(true);
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const duplicateData: Partial<JobFormData> = {
        ...dataToClone,
        title: `${dataToClone.title || "Position"} (Copy)`,
        slug: `${(dataToClone.slug || "job").replace(/-copy-[a-z0-9]+$/, "")}-copy-${randomSuffix}`,
        status: "DRAFT",
      };
      delete duplicateData.id;
      delete (duplicateData as any).versionId;
      delete (duplicateData as any).createdAt;
      delete (duplicateData as any).updatedAt;
      delete (duplicateData as any).approvalComment;
      delete (duplicateData as any).approvedAt;
      delete (duplicateData as any).approvedBy;

      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicateData),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.job) {
        setAlertMessage({ type: "success", text: "Role duplicated as new draft!" });
        router.push(`/admin/careers/jobs/${data.job.id}`);
      } else {
        const msg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message || "Failed to duplicate role";
        setAlertMessage({ type: "error", text: msg });
      }
    } catch (err: unknown) {
      console.error("Duplicate role error:", err);
      setAlertMessage({ type: "error", text: "Network error duplicating role." });
    } finally {
      setDuplicating(false);
    }
  };

  // Submit for Review action
  const handleSubmitForReview = async (updatedData: JobFormData) => {
    const evalResult = evaluateCompleteness(updatedData);
    if (!evalResult.isComplete) {
      setAlertMessage({
        type: "error",
        text: `Cannot submit for review: ${evalResult.missingFields.join(", ")}`,
      });
      return;
    }

    setSaving(true);
    try {
      // If still new, save first
      let currentJobId = id;
      if (isNew) {
        const createRes = await fetch("/api/admin/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...updatedData, status: "DRAFT" }),
        });
        const createData = await createRes.json();
        if (!createRes.ok || !createData.ok || !createData.job) {
          const msg =
            typeof createData.error === "string"
              ? createData.error
              : createData.error?.message || "Failed to create initial draft";
          throw new Error(msg);
        }
        currentJobId = createData.job.id;
      }

      // Transition to IN_REVIEW
      const transitionRes = await fetch(`/api/admin/jobs/${currentJobId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStatus: "IN_REVIEW",
          comment: "Submitted by recruiter for executive approval.",
        }),
      });
      const transitionData = await transitionRes.json();
      if (transitionRes.ok && transitionData.ok && transitionData.job) {
        setJobData(transitionData.job);
        setAlertMessage({
          type: "success",
          text: "Role submitted for review! Hiring managers and admins have been notified.",
        });
        if (isNew) {
          router.replace(`/admin/careers/jobs/${currentJobId}`);
        }
      } else {
        const msg =
          typeof transitionData.error === "string"
            ? transitionData.error
            : transitionData.error?.message || "Status transition failed";
        throw new Error(msg);
      }
    } catch (err: any) {
      console.error("Submit for review error:", err);
      setAlertMessage({ type: "error", text: err?.message || "Failed to submit for review." });
    } finally {
      setSaving(false);
    }
  };

  // Direct Publish action (for admins or when direct publish is allowed)
  const handlePublish = async (updatedData: JobFormData) => {
    const evalResult = evaluateCompleteness(updatedData);
    if (!evalResult.isComplete) {
      setAlertMessage({
        type: "error",
        text: `Cannot publish: ${evalResult.missingFields.join(", ")}`,
      });
      return;
    }

    setSaving(true);
    try {
      let currentJobId = id;
      if (isNew) {
        const createRes = await fetch("/api/admin/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...updatedData, status: "DRAFT" }),
        });
        const createData = await createRes.json();
        if (!createRes.ok || !createData.ok || !createData.job) {
          const msg =
            typeof createData.error === "string"
              ? createData.error
              : createData.error?.message || "Failed to create draft";
          throw new Error(msg);
        }
        currentJobId = createData.job.id;
      }

      const statusRes = await fetch(`/api/admin/jobs/${currentJobId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStatus: "PUBLISHED",
          comment: "Published directly to public careers portal.",
        }),
      });
      const statusData = await statusRes.json();
      if (statusRes.ok && statusData.ok && statusData.job) {
        setJobData(statusData.job);
        setAlertMessage({
          type: "success",
          text: "Role is now LIVE on the public careers portal!",
        });
        if (isNew) {
          router.replace(`/admin/careers/jobs/${currentJobId}`);
        }
      } else {
        const msg =
          typeof statusData.error === "string"
            ? statusData.error
            : statusData.error?.message || "Publishing failed";
        throw new Error(msg);
      }
    } catch (err: any) {
      console.error("Publish error:", err);
      setAlertMessage({ type: "error", text: err?.message || "Failed to publish role." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#1155CC]" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
          Loading role authoring editor...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/careers/jobs"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-sora">
                {isNew ? "Create New Role" : `Edit Role: ${jobData.title || "Untitled"}`}
              </h1>
              <Badge
                variant={
                  jobData.status === "PUBLISHED" || jobData.status === "OPEN"
                    ? "default"
                    : "secondary"
                }
                className="rounded-full text-[10px] font-mono uppercase tracking-wider font-bold"
              >
                {jobData.status || "DRAFT"}
              </Badge>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Multi-section job authoring with live completeness audit.
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!isNew && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVersionHistoryOpen(true)}
                className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
              >
                <History className="w-4 h-4 text-slate-500" />
                <span>History</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDuplicate()}
                disabled={duplicating || saving}
                className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                <span>{duplicating ? "Duplicating…" : "Duplicate"}</span>
              </Button>
            </>
          )}

          {!isNew && jobData.status === "IN_REVIEW" && (
            <>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setApprovalMode("return");
                  setApprovalDialogOpen(true);
                }}
                className="rounded-xl text-xs font-bold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
              >
                <Undo2 className="w-4 h-4" />
                <span>Return to Draft</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setApprovalMode("approve");
                  setApprovalDialogOpen(true);
                }}
                className="rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Approve Role</span>
              </Button>
            </>
          )}

          {jobData.slug && (jobData.status === "PUBLISHED" || jobData.status === "OPEN") && (
            <Link
              href={`/careers/${jobData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#1155CC] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Page</span>
            </Link>
          )}
        </div>
      </div>

      {/* Reviewer Feedback Warning if Returned */}
      {jobData.approvalStatus === "RETURNED" && jobData.approvalComment && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold mb-1">
            <Undo2 className="w-4 h-4 text-amber-600" />
            <span>Reviewer Feedback (Changes Requested):</span>
          </div>
          <p className="pl-6 text-amber-800 dark:text-amber-300 font-normal">
            {jobData.approvalComment}
          </p>
        </div>
      )}

      {/* Alert Notifications */}
      {alertMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between transition-all ${
            alertMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
              : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{alertMessage.text}</span>
          </div>
          <div className="flex items-center gap-2">
            {alertMessage.type === "error" && (
              <button
                type="button"
                onClick={() => {
                  setAlertMessage(null);
                  handleSave(jobData);
                }}
                className="px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-200 text-[11px] cursor-pointer"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => setAlertMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main 6-Section Form */}
      <JobEditorForm
        initialJob={jobData}
        onSave={handleSave}
        onSubmitForReview={handleSubmitForReview}
        onPublish={handlePublish}
        onDuplicate={handleDuplicate}
        isSaving={saving}
        isDuplicating={duplicating}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        hasBlockingError={Boolean(alertMessage && alertMessage.type === "error")}
        onClearError={() => setAlertMessage(null)}
        onRetrySave={() => handleSave(jobData)}
      />

      {/* Approval / Return Action Modal */}
      {!isNew && (
        <ApprovalActionDialog
          isOpen={approvalDialogOpen}
          onClose={() => setApprovalDialogOpen(false)}
          job={{
            id,
            title: jobData.title || "Untitled Position",
            status: jobData.status || "DRAFT",
            publishAt: jobData.publishAt,
          }}
          mode={approvalMode}
          onSuccess={(updatedJob) => {
            setJobData(updatedJob);
            setAlertMessage({
              type: "success",
              text:
                approvalMode === "approve"
                  ? "Position successfully approved!"
                  : "Position returned to draft with reviewer feedback.",
            });
          }}
        />
      )}

      {/* Version History Modal */}
      {!isNew && (
        <VersionHistoryDialog
          isOpen={versionHistoryOpen}
          onClose={() => setVersionHistoryOpen(false)}
          jobId={id}
          currentVersionId={jobData.versionId}
          onRestoreSuccess={(restoredJob) => {
            setJobData(restoredJob);
            setAlertMessage({
              type: "success",
              text: `Restored to version ${restoredJob.versionId}. Form updated.`,
            });
          }}
        />
      )}
    </div>
  );
}
