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
      } else {
        await updateAdminJob(id, updatedData);
      }

      if (jobData.status !== "PUBLISHED" && jobData.status !== "OPEN") {
        const statusJob = await updateAdminJobStatus(currentJobId, {
          targetStatus: "PUBLISHED",
          comment: "Published directly to public careers portal.",
        });
        setJobData(toJobFormData(statusJob));
      } else {
        const refreshed = await getAdminJob(currentJobId);
        setJobData(toJobFormData(refreshed));
      }

      setAlertMessage({
        type: "success",
        text: isNew
          ? "Role is now LIVE on the public careers portal!"
          : "Role details updated and live changes saved!",
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
      <div className="space-y-3 py-24 text-center">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#1155CC]" />
        <p className="font-mono text-xs font-bold tracking-wider text-slate-500 uppercase">
          Loading role authoring editor...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-6 pb-16 duration-300">
      {/* Top Header Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/careers/jobs"
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sora text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                {isNew ? "Create New Role" : `Edit Role: ${jobData.title || "Untitled"}`}
              </h1>
              <Badge
                variant={
                  jobData.status === "PUBLISHED" || jobData.status === "OPEN"
                    ? "default"
                    : "secondary"
                }
                className="rounded-full font-mono text-[10px] font-bold tracking-wider uppercase"
              >
                {jobData.status || "DRAFT"}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
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
                className="cursor-pointer gap-1.5 rounded-xl text-xs font-bold"
              >
                <History className="h-4 w-4 text-slate-500" />
                <span>History</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDuplicate()}
                disabled={duplicating || saving}
                className="cursor-pointer gap-1.5 rounded-xl text-xs font-bold"
              >
                <Copy className="h-4 w-4 text-slate-500" />
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
                className="cursor-pointer gap-1.5 rounded-xl bg-amber-600 text-xs font-bold text-white hover:bg-amber-700"
              >
                <Undo2 className="h-4 w-4" />
                <span>Return to Draft</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setApprovalMode("approve");
                  setApprovalDialogOpen(true);
                }}
                className="cursor-pointer gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Approve Role</span>
              </Button>
            </>
          )}

          {jobData.slug && (jobData.status === "PUBLISHED" || jobData.status === "OPEN") && (
            <Link
              href={`/careers/${jobData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:text-[#1155CC] dark:border-slate-800 dark:text-slate-300"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Public Page</span>
            </Link>
          )}
        </div>
      </div>

      {/* Reviewer Feedback Warning if Returned */}
      {jobData.approvalStatus === "RETURNED" && jobData.approvalComment && (
        <div className="animate-in fade-in rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 duration-200 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="mb-1 flex items-center gap-2 font-bold">
            <Undo2 className="h-4 w-4 text-amber-600" />
            <span>Reviewer Feedback (Changes Requested):</span>
          </div>
          <p className="pl-6 font-normal text-amber-800 dark:text-amber-300">
            {jobData.approvalComment}
          </p>
        </div>
      )}

      {/* Alert Notifications */}
      {alertMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-medium transition-all ${
            alertMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
              : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
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
                className="cursor-pointer rounded-lg bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => setAlertMessage(null)}
              className="cursor-pointer p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
            setJobData(toJobFormData(restoredJob));
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
