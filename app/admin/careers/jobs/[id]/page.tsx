"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  History,
  CheckCheck,
  Undo2,
  Copy,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  JobEditorForm,
  type JobFormData,
  DEFAULT_JOB_FORM,
} from "@/components/admin/careers/JobEditorForm";
import { evaluateCompleteness } from "@/components/admin/careers/CompletenessChecklist";
import { ApprovalActionDialog } from "@/components/admin/careers/ApprovalActionDialog";
import { VersionHistoryDialog } from "@/components/admin/careers/VersionHistoryDialog";
import {
  getAdminJob,
  createAdminJob,
  updateAdminJob,
  updateAdminJobStatus,
  toJobFormData,
} from "@/lib/api/admin-jobs.api";

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

  useEffect(() => {
    let ignore = false;
    if (isNew) return;

    async function load() {
      try {
        setLoading(true);
        const job = await getAdminJob(id);
        if (!ignore) {
          setJobData(toJobFormData(job));
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Network error loading position data.";
          setAlertMessage({ type: "error", text: msg });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [id, isNew]);

  // Save handler (Create new or update existing)
  const handleSave = async (updatedData: JobFormData) => {
    setSaving(true);
    setSaveStatus("saving");
    setAlertMessage(null);

    try {
      if (isNew) {
        const job = await createAdminJob(updatedData);
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        setJobData(toJobFormData(job));
        setAlertMessage({ type: "success", text: "Role draft created successfully!" });
        // Redirect to the newly created job ID
        router.replace(`/admin/careers/jobs/${job.id}`);
      } else {
        const job = await updateAdminJob(id, updatedData);
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        setJobData(toJobFormData(job));
        setAlertMessage({ type: "success", text: "Draft changes saved." });
        setTimeout(() => setAlertMessage((prev) => (prev?.type === "success" ? null : prev)), 4000);
      }
    } catch (err: unknown) {
      setSaveStatus("error");
      const msg = err instanceof Error ? err.message : "Failed to save changes.";
      setAlertMessage({ type: "error", text: msg });
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

      const created = await createAdminJob(duplicateData);
      setAlertMessage({ type: "success", text: "Role duplicated as new draft!" });
      router.push(`/admin/careers/jobs/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to duplicate role";
      setAlertMessage({ type: "error", text: msg });
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
        const job = await createAdminJob({ ...updatedData, status: "DRAFT" });
        currentJobId = job.id;
      }

      // Transition to IN_REVIEW
      const transitionJob = await updateAdminJobStatus(currentJobId, {
        targetStatus: "IN_REVIEW",
        comment: "Submitted by recruiter for executive approval.",
      });

      setJobData(toJobFormData(transitionJob));
      setAlertMessage({
        type: "success",
        text: "Role submitted for review! Hiring managers and admins have been notified.",
      });
      if (isNew) {
        router.replace(`/admin/careers/jobs/${currentJobId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit for review.";
      setAlertMessage({ type: "error", text: msg });
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
        const job = await createAdminJob({ ...updatedData, status: "DRAFT" });
        currentJobId = job.id;
      }

      const statusJob = await updateAdminJobStatus(currentJobId, {
        targetStatus: "PUBLISHED",
        comment: "Published directly to public careers portal.",
      });

      setJobData(toJobFormData(statusJob));
      setAlertMessage({
        type: "success",
        text: "Role is now LIVE on the public careers portal!",
      });
      if (isNew) {
        router.replace(`/admin/careers/jobs/${currentJobId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish role.";
      setAlertMessage({ type: "error", text: msg });
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
            setJobData(toJobFormData(updatedJob));
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
