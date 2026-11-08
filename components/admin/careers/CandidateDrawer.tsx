"use client";

import React, { useState, useEffect, startTransition } from "react";
import {
  X,
  Star,
  ExternalLink,
  FileText,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Clock,
  Globe,
  Loader2,
  Save,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicationStatus } from "@/lib/constants/enums";
import {
  getAdminApplication,
  updateAdminApplication,
  getAdminApplicationResume,
  type CandidateApplicationDetail,
  type ScreeningAnswerItem,
} from "@/lib/api/admin-applications.api";
import { RejectionReasonDialog } from "./RejectionReasonDialog";

interface CandidateDrawerProps {
  applicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onApplicationUpdated?: () => void;
}

export const STAGE_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  [ApplicationStatus.NEW]: {
    label: "New",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-900",
  },
  [ApplicationStatus.SCREENING]: {
    label: "Screening",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-900",
  },
  [ApplicationStatus.SHORTLISTED]: {
    label: "Shortlisted",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-900",
  },
  [ApplicationStatus.INTERVIEW]: {
    label: "Interview",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-400",
    border: "border-cyan-200 dark:border-cyan-900",
  },
  [ApplicationStatus.OFFER]: {
    label: "Offer",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-900",
  },
  [ApplicationStatus.HIRED]: {
    label: "Hired",
    bg: "bg-green-50 dark:bg-green-950/40",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-200 dark:border-green-900",
  },
  [ApplicationStatus.REJECTED]: {
    label: "Rejected",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-900",
  },
  [ApplicationStatus.WITHDRAWN]: {
    label: "Withdrawn",
    bg: "bg-slate-100 dark:bg-slate-900",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-800",
  },
};

export function CandidateDrawer({
  applicationId,
  isOpen,
  onClose,
  onApplicationUpdated,
}: CandidateDrawerProps) {
  const [app, setApp] = useState<CandidateApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);

  const [loadingResume, setLoadingResume] = useState(false);

  // Reject dialog state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);

  useEffect(() => {
    if (!isOpen || !applicationId) {
      startTransition(() => {
        setApp(null);
      });
      return;
    }

    let isMounted = true;
    startTransition(() => {
      setLoading(true);
      setError(null);
    });

    getAdminApplication(applicationId)
      .then((data) => {
        if (isMounted && data) {
          startTransition(() => {
            setApp(data);
            setNotes(data.internalNotes || "");
            setRating(data.rating || null);
          });
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Failed to load candidate application";
          startTransition(() => {
            setError(msg);
          });
        }
      })
      .finally(() => {
        if (isMounted) {
          startTransition(() => {
            setLoading(false);
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, applicationId]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !showRejectModal) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showRejectModal, onClose]);

  const handleFetchResumeUrl = async () => {
    if (!applicationId) return;
    setLoadingResume(true);
    try {
      const data = await getAdminApplicationResume(applicationId);
      if (data.signedUrl) {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not retrieve resume document";
      alert(msg);
    } finally {
      setLoadingResume(false);
    }
  };

  const handleStageChange = async (newStage: ApplicationStatus, reason?: string) => {
    if (!applicationId) return;
    setUpdatingStage(true);
    try {
      const updated = await updateAdminApplication(applicationId, {
        status: newStage,
        rejectionReason: reason || undefined,
      });

      setApp(updated);
      setShowRejectModal(false);
      onApplicationUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update stage";
      alert(msg);
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleSaveNotesAndRating = async (newRating?: number) => {
    if (!applicationId) return;
    setSavingNotes(true);
    setNotesSavedSuccess(false);

    const activeRating = newRating !== undefined ? (newRating === 0 ? null : newRating) : rating;

    try {
      const updated = await updateAdminApplication(applicationId, {
        internalNotes: notes,
        rating: activeRating ?? undefined,
      });

      setApp(updated);
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 2500);
      onApplicationUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save evaluation";
      alert(msg);
    } finally {
      setSavingNotes(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end overflow-hidden bg-slate-900/50 backdrop-blur-xs duration-200 animate-in fade-in">
        <dialog
          open
          aria-label="Candidate Evaluation"
          className="z-40 m-0 flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Drawer Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="space-y-1">
              <h2 className="font-sora text-lg font-bold text-slate-900 dark:text-white">
                Candidate Evaluation
              </h2>
              <p className="text-xs font-medium text-slate-500">
                ID:{" "}
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {applicationId}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {loading ? (
              <div className="space-y-3 py-24 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#1155CC]" />
                <p className="text-xs font-medium text-slate-500">Loading candidate profile...</p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
                {error}
              </div>
            ) : app ? (
              <>
                {/* Knockout Warning Banner */}
                {app.knockoutTriggered && (
                  <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300">
                        Knockout Question Gate Failed
                      </h4>
                      <p className="text-xs leading-relaxed text-rose-700 dark:text-rose-400">
                        This applicant did not satisfy one or more mandatory requirements defined in
                        the job's knockout screening gates.
                      </p>
                    </div>
                  </div>
                )}

                {/* Profile Overview Card */}
                <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-sora text-xl font-bold text-slate-900 dark:text-white">
                        {app.candidateName}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Applied on{" "}
                        {new Date(app.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Stage Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${
                          STAGE_CONFIG[app.status as ApplicationStatus]?.bg || "bg-slate-100"
                        } ${STAGE_CONFIG[app.status as ApplicationStatus]?.text || "text-slate-700"} ${
                          STAGE_CONFIG[app.status as ApplicationStatus]?.border ||
                          "border-slate-200"
                        }`}
                      >
                        {STAGE_CONFIG[app.status as ApplicationStatus]?.label || app.status}
                      </span>
                    </div>
                  </div>

                  {/* Contact Meta Grid */}
                  <div className="grid grid-cols-1 gap-3 border-t border-slate-200/60 pt-2 text-xs sm:grid-cols-2 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                      <a href={`mailto:${app.email}`} className="truncate hover:underline">
                        {app.email}
                      </a>
                    </div>
                    {app.phone && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                        <a href={`tel:${app.phone}`} className="hover:underline">
                          {app.phone}
                        </a>
                      </div>
                    )}
                    {app.currentLocation && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>{app.currentLocation}</span>
                      </div>
                    )}
                    {app.noticePeriodWeeks !== null && app.noticePeriodWeeks !== undefined && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>Notice: {app.noticePeriodWeeks} weeks</span>
                      </div>
                    )}
                  </div>

                  {/* Social & Portfolio Links */}
                  {(app.portfolioUrl || app.githubUrl || app.linkedinUrl) && (
                    <div className="flex flex-wrap gap-2 border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
                      {app.portfolioUrl && (
                        <a
                          href={app.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:text-[#1155CC] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <Globe className="h-3.5 w-3.5" /> Portfolio
                        </a>
                      )}
                      {app.githubUrl && (
                        <a
                          href={app.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:text-black dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> GitHub
                        </a>
                      )}
                      {app.linkedinUrl && (
                        <a
                          href={app.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:text-[#0A66C2] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> LinkedIn
                        </a>
                      )}
                    </div>
                  )}

                  {/* Rejection reason details if rejected */}
                  {app.status === ApplicationStatus.REJECTED && app.rejectionReason && (
                    <div className="space-y-1 rounded-2xl border border-rose-200 bg-rose-50/70 p-3 text-xs dark:border-rose-900 dark:bg-rose-950/30">
                      <span className="font-bold text-rose-800 dark:text-rose-300">
                        Rejection Reason:
                      </span>
                      <p className="font-medium text-rose-700 dark:text-rose-400">
                        {app.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stage Progression Selector */}
                <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase">
                    Stage Progression
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ApplicationStatus.NEW,
                      ApplicationStatus.SCREENING,
                      ApplicationStatus.SHORTLISTED,
                      ApplicationStatus.INTERVIEW,
                      ApplicationStatus.OFFER,
                      ApplicationStatus.HIRED,
                    ].map((stg) => {
                      const isCurrent = app.status === stg;
                      return (
                        <button
                          key={stg}
                          type="button"
                          disabled={updatingStage || isCurrent}
                          onClick={() => handleStageChange(stg)}
                          className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                            isCurrent
                              ? "bg-[#1155CC] text-white border-[#1155CC] shadow-xs"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {STAGE_CONFIG[stg]?.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      disabled={updatingStage || app.status === ApplicationStatus.REJECTED}
                      onClick={() => setShowRejectModal(true)}
                      className="cursor-pointer rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                    >
                      Reject Candidate
                    </button>
                    {app.status !== ApplicationStatus.WITHDRAWN && (
                      <button
                        type="button"
                        disabled={updatingStage}
                        onClick={() => handleStageChange(ApplicationStatus.WITHDRAWN)}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      >
                        Withdrawn
                      </button>
                    )}
                  </div>
                </div>

                {/* Resume Document Link / Preview */}
                <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase">
                      Resume Document
                    </h4>
                    <span className="font-mono text-[11px] text-slate-400">
                      {app.resumeFileName || "resume.pdf"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-700/80 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-[#1155CC] dark:bg-blue-900/40">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {app.resumeFileName || "Candidate Resume"}
                        </p>
                        <p className="text-[10px] text-slate-500">Secure short-lived signed link</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleFetchResumeUrl}
                      disabled={loadingResume}
                      className="flex items-center gap-1.5 rounded-xl text-xs"
                    >
                      {loadingResume ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                      Open Resume
                    </Button>
                  </div>
                </div>

                {/* Reviewer Evaluation & Rating */}
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase">
                      Reviewer Evaluation & Notes
                    </h4>
                    {notesSavedSuccess && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 animate-in fade-in">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                      </span>
                    )}
                  </div>

                  {/* Interactive Rating Stars (1-5) */}
                  <div>
                    <span
                      id="candidate-rating-label"
                      className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400"
                    >
                      Candidate Rating (1-5 Stars):
                    </span>
                    <div
                      role="radiogroup"
                      aria-labelledby="candidate-rating-label"
                      className="flex items-center gap-1.5"
                    >
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = (hoverRating ?? rating ?? 0) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => {
                              setRating(star);
                              handleSaveNotesAndRating(star);
                            }}
                            className="cursor-pointer p-1 transition-transform hover:scale-110"
                            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                          >
                            <Star
                              className={`h-6 w-6 transition-colors ${
                                isFilled
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300 dark:text-slate-700"
                              }`}
                            />
                          </button>
                        );
                      })}
                      {rating && (
                        <button
                          type="button"
                          onClick={() => {
                            setRating(null);
                            handleSaveNotesAndRating(0);
                          }}
                          className="ml-2 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Internal Notes Textarea */}
                  <div className="space-y-2">
                    <label
                      htmlFor="candidate-internal-notes"
                      className="block text-xs font-semibold text-slate-600 dark:text-slate-400"
                    >
                      Internal Notes:
                    </label>
                    <textarea
                      id="candidate-internal-notes"
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add technical interview feedback, coding challenge notes, or compensation requirements..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs focus:border-[#1155CC] focus:ring-2 focus:ring-[#1155CC]/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleSaveNotesAndRating()}
                        disabled={savingNotes}
                        className="flex items-center gap-1.5 rounded-xl bg-[#1155CC] text-xs text-white hover:bg-[#0c44a4]"
                      >
                        {savingNotes ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save Notes
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Screening Question Responses */}
                {Array.isArray(app.screeningAnswers) && app.screeningAnswers.length > 0 && (
                  <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase">
                      Screening Question Answers
                    </h4>
                    <div className="space-y-3 pt-1">
                      {app.screeningAnswers.map((ans: ScreeningAnswerItem) => (
                        <div
                          key={`qa-${ans.question.slice(0, 30)}`}
                          className="space-y-1.5 rounded-2xl border border-slate-200/60 bg-slate-50 p-3.5 text-xs dark:border-slate-700/60 dark:bg-slate-800/60"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {ans.question}
                            </p>
                            {ans.isKnockout && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:border-rose-900 dark:bg-rose-950/40">
                                <AlertTriangle className="h-3 w-3" /> Knockout Gate
                              </span>
                            )}
                          </div>
                          <p className="rounded-xl border border-slate-200/40 bg-white p-2.5 font-mono text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                            {typeof ans.answer === "boolean"
                              ? ans.answer
                                ? "Yes"
                                : "No"
                              : String(ans.answer)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {app.coverLetter && (
                  <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase">
                      Cover Letter
                    </h4>
                    <p className="rounded-2xl border border-slate-200/60 bg-slate-50 p-4 text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                      {app.coverLetter}
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </dialog>
      </div>

      {/* Rejection Reason Dialog */}
      <RejectionReasonDialog
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        candidateName={app?.candidateName}
        isSubmitting={updatingStage}
        onConfirm={async (reason) => {
          await handleStageChange(ApplicationStatus.REJECTED, reason);
        }}
      />
    </>
  );
}
