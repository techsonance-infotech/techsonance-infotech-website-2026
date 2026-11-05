"use client";

import React, { useState, useEffect } from "react";
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
  Briefcase,
  Globe,
  Loader2,
  Save,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicationStatus } from "@/lib/constants/enums";
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
  const [app, setApp] = useState<any | null>(null);
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
      setApp(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/careers/applications/${applicationId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load candidate application");
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.application) {
          setApp(data.application);
          setNotes(data.application.internalNotes || "");
          setRating(data.application.rating || null);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
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
      const res = await fetch(`/api/admin/careers/applications/${applicationId}/resume`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate resume link");
      if (data.signedUrl) {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      alert(err.message || "Could not retrieve resume document");
    } finally {
      setLoadingResume(false);
    }
  };

  const handleStageChange = async (newStage: ApplicationStatus, reason?: string) => {
    if (!applicationId) return;
    setUpdatingStage(true);
    try {
      const res = await fetch(`/api/admin/careers/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStage,
          rejectionReason: reason || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update stage");

      setApp(data.application);
      setShowRejectModal(false);
      onApplicationUpdated?.();
    } catch (err: any) {
      alert(err.message || "Failed to update stage");
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
      const res = await fetch(`/api/admin/careers/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internalNotes: notes,
          rating: activeRating ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save evaluation");

      setApp(data.application);
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 2500);
      onApplicationUpdated?.();
    } catch (err: any) {
      alert(err.message || "Failed to save evaluation");
    } finally {
      setSavingNotes(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Candidate Evaluation"
          className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-40"
        >
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-sora">
                Candidate Evaluation
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                ID:{" "}
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {applicationId}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="py-24 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#1155CC]" />
                <p className="text-xs text-slate-500 font-medium">Loading candidate profile...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium">
                {error}
              </div>
            ) : app ? (
              <>
                {/* Knockout Warning Banner */}
                {app.knockoutTriggered && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300">
                        Knockout Question Gate Failed
                      </h4>
                      <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                        This applicant did not satisfy one or more mandatory requirements defined in
                        the job's knockout screening gates.
                      </p>
                    </div>
                  </div>
                )}

                {/* Profile Overview Card */}
                <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white font-sora">
                        {app.candidateName}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <a href={`mailto:${app.email}`} className="hover:underline truncate">
                        {app.email}
                      </a>
                    </div>
                    {app.phone && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <a href={`tel:${app.phone}`} className="hover:underline">
                          {app.phone}
                        </a>
                      </div>
                    )}
                    {app.currentLocation && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{app.currentLocation}</span>
                      </div>
                    )}
                    {app.noticePeriodWeeks !== null && app.noticePeriodWeeks !== undefined && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Notice: {app.noticePeriodWeeks} weeks</span>
                      </div>
                    )}
                  </div>

                  {/* Social & Portfolio Links */}
                  {(app.portfolioUrl || app.githubUrl || app.linkedinUrl) && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      {app.portfolioUrl && (
                        <a
                          href={app.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#1155CC] transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" /> Portfolio
                        </a>
                      )}
                      {app.githubUrl && (
                        <a
                          href={app.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-black transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> GitHub
                        </a>
                      )}
                      {app.linkedinUrl && (
                        <a
                          href={app.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0A66C2] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> LinkedIn
                        </a>
                      )}
                    </div>
                  )}

                  {/* Rejection reason details if rejected */}
                  {app.status === ApplicationStatus.REJECTED && app.rejectionReason && (
                    <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs space-y-1">
                      <span className="font-bold text-rose-800 dark:text-rose-300">
                        Rejection Reason:
                      </span>
                      <p className="text-rose-700 dark:text-rose-400 font-medium">
                        {app.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stage Progression Selector */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
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
                          className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
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
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
                    >
                      Reject Candidate
                    </button>
                    {app.status !== ApplicationStatus.WITHDRAWN && (
                      <button
                        type="button"
                        disabled={updatingStage}
                        onClick={() => handleStageChange(ApplicationStatus.WITHDRAWN)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Withdrawn
                      </button>
                    )}
                  </div>
                </div>

                {/* Resume Document Link / Preview */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Resume Document
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      {app.resumeFileName || "resume.pdf"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#1155CC] flex items-center justify-center">
                        <FileText className="w-5 h-5" />
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
                      className="rounded-xl flex items-center gap-1.5 text-xs"
                    >
                      {loadingResume ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5" />
                      )}
                      Open Resume
                    </Button>
                  </div>
                </div>

                {/* Reviewer Evaluation & Rating */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Reviewer Evaluation & Notes
                    </h4>
                    {notesSavedSuccess && (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                      </span>
                    )}
                  </div>

                  {/* Interactive Rating Stars (1-5) */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                      Candidate Rating (1-5 Stars):
                    </label>
                    <div className="flex items-center gap-1.5">
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
                            className="p-1 hover:scale-110 transition-transform cursor-pointer"
                            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
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
                          className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ml-2"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Internal Notes Textarea */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                      Internal Notes:
                    </label>
                    <textarea
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add technical interview feedback, coding challenge notes, or compensation requirements..."
                      className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1155CC]/20 focus:border-[#1155CC]"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleSaveNotesAndRating()}
                        disabled={savingNotes}
                        className="rounded-xl flex items-center gap-1.5 text-xs bg-[#1155CC] hover:bg-[#0c44a4] text-white"
                      >
                        {savingNotes ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Save Notes
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Screening Question Responses */}
                {app.screeningAnswers && app.screeningAnswers.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Screening Question Answers
                    </h4>
                    <div className="space-y-3 pt-1">
                      {app.screeningAnswers.map((ans: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {ans.question}
                            </p>
                            {ans.isKnockout && (
                              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-2 py-0.5 rounded-md">
                                <AlertTriangle className="w-3 h-3" /> Knockout Gate
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/40">
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
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Cover Letter
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60">
                      {app.coverLetter}
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
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
