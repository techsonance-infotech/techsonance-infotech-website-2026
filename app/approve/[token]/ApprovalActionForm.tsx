"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  FileText,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type UiApprovalDecision =
  | "approve"
  | "reject"
  | "improve"
  | "approve_content_retry_image"
  | "approve_image_revise_content";

interface ApprovalActionFormProps {
  token: string;
  postId: string;
  slug?: string | null;
  initialDecision: UiApprovalDecision;
  autoExecute?: boolean;
}

function decisionLabel(d: UiApprovalDecision): string {
  switch (d) {
    case "approve":
      return "Approve & Publish Live";
    case "approve_content_retry_image":
      return "Keep Content, Regenerate Hero Graphic";
    case "approve_image_revise_content":
      return "Keep Image, Revise Article Text";
    case "reject":
      return "Reject & Archive Draft";
    case "improve":
      return "Request Revisions";
    default:
      return "Confirm Action";
  }
}

export function ApprovalActionForm({
  token,
  postId,
  slug,
  initialDecision,
  autoExecute = false,
}: ApprovalActionFormProps) {
  const [decision, setDecision] = useState<UiApprovalDecision>(initialDecision);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(autoExecute ? 3 : null);
  const [autoCancelled, setAutoCancelled] = useState(false);
  const [completed, setCompleted] = useState<{
    success: boolean;
    decision: string;
    slug?: string | null;
  } | null>(null);

  const executeSubmit = async (selectedDecision: UiApprovalDecision, feedbackText: string) => {
    setError(null);
    setSubmitting(true);
    setAutoCountdown(null);

    try {
      const res = await fetch(`/approve/${token}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: selectedDecision, feedback: feedbackText }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit decision");
      }

      setCompleted({
        success: true,
        decision: selectedDecision,
        slug: data?.result?.slug || slug,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (!autoExecute || autoCancelled || autoCountdown === null || completed || submitting) {
      return;
    }

    if (autoCountdown <= 0) {
      void executeSubmit(decision, feedback);
      return;
    }

    const timer = setTimeout(() => {
      setAutoCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoCountdown, autoCancelled, autoExecute, completed, submitting, decision, feedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSubmit(decision, feedback);
  };

  if (completed) {
    const isApprove = completed.decision === "approve";
    const isRetryImage = completed.decision === "approve_content_retry_image";
    const isReviseContent =
      completed.decision === "approve_image_revise_content" || completed.decision === "improve";

    return (
      <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm duration-300 animate-in fade-in">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
            isApprove
              ? "bg-emerald-50 text-emerald-600"
              : isRetryImage
                ? "bg-sky-50 text-sky-600"
                : isReviseContent
                  ? "bg-amber-50 text-amber-600"
                  : "bg-rose-50 text-rose-600"
          }`}
        >
          {isApprove && <CheckCircle2 className="h-8 w-8" />}
          {isRetryImage && <RefreshCw className="h-8 w-8" />}
          {isReviseContent && <FileText className="h-8 w-8" />}
          {!isApprove && !isRetryImage && !isReviseContent && <XCircle className="h-8 w-8" />}
        </div>

        <h2 className="font-sora text-xl font-black text-slate-900">
          {isApprove && "Article Successfully Published Live!"}
          {isRetryImage && "Hero Image Regeneration Queued!"}
          {isReviseContent && "Article Text Flagged for Revision!"}
          {!isApprove && !isRetryImage && !isReviseContent && "Article Draft Rejected & Archived"}
        </h2>

        <p className="mx-auto max-w-md text-xs leading-relaxed text-slate-500">
          {isApprove &&
            "The article is now live on techsonance.co.in and the edge cache has been revalidated."}
          {isRetryImage &&
            "Article content has been approved and locked. The old graphic was moved to the 30-day recycle bin, and Critic AI vision loop is regenerating a fresh hero image. You will receive an updated email preview shortly."}
          {isReviseContent &&
            "The hero visual has been approved and locked. Your editorial feedback has been saved and the article draft is ready for revision in Studio CMS."}
          {!isApprove &&
            !isRetryImage &&
            !isReviseContent &&
            "This draft has been archived and associated hero assets moved to the 30-day recycle bin."}
        </p>

        <div className="flex items-center justify-center gap-3 pt-4">
          {isApprove && (
            <Link href={completed.slug ? `/blog/${completed.slug}` : "/blog"} target="_blank">
              <Button
                variant="default"
                size="sm"
                className="rounded-xl bg-[#1155CC] text-xs font-bold text-white shadow-md shadow-[#1155CC]/20"
              >
                <span>View Live Article</span>
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
          <Link href={`/admin/blog/${postId}`}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 text-xs font-bold text-slate-700"
            >
              <span>Inspect in Studio CMS</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
      {autoCountdown !== null && autoCountdown > 0 && !autoCancelled && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/90 p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white animate-pulse">
                {autoCountdown}
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Auto-confirming &quot;{decisionLabel(decision)}&quot; in {autoCountdown}s...
                </p>
                <p className="text-[11px] text-slate-500">
                  Action will execute automatically. Click cancel to review or change decision.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAutoCancelled(true)}
                className="h-8 rounded-lg border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel Auto-Run
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void executeSubmit(decision, feedback)}
                className="h-8 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
              >
                Confirm Now
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sora text-base font-bold text-slate-900">
            Confirm Editorial Decision
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Choose full publishing or granular component rework for text and hero visuals.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Decision Pill Grid */}
      <div className="grid grid-cols-1 gap-2 rounded-2xl bg-slate-100/80 p-2 sm:grid-cols-2 lg:grid-cols-4">
        {/* Option 1: Full Approve */}
        <button
          type="button"
          onClick={() => setDecision("approve")}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
            decision === "approve"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Approve Everything</span>
        </button>

        {/* Option 2: Keep Text, Retry Image */}
        <button
          type="button"
          onClick={() => setDecision("approve_content_retry_image")}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
            decision === "approve_content_retry_image"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Keep Text, Retry Image</span>
        </button>

        {/* Option 3: Keep Image, Revise Text */}
        <button
          type="button"
          onClick={() => setDecision("approve_image_revise_content")}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
            decision === "approve_image_revise_content"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Keep Image, Revise Text</span>
        </button>

        {/* Option 4: Reject Both */}
        <button
          type="button"
          onClick={() => setDecision("reject")}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
            decision === "reject"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>Reject Both</span>
        </button>
      </div>

      {/* Decision Summary Banner */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs">
        {decision === "approve" && (
          <div className="flex items-start gap-2.5 text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <strong className="font-bold">Full Publishing Authorization:</strong> Both the article
              content and hero graphic pass quality checks and will go live immediately on
              techsonance.co.in.
            </div>
          </div>
        )}

        {decision === "approve_content_retry_image" && (
          <div className="flex items-start gap-2.5 text-sky-800">
            <RefreshCw className="h-4 w-4 shrink-0 text-sky-600" />
            <div>
              <strong className="font-bold">Granular Image Rework:</strong> Article text is approved
              and locked. The current hero image is moved to the 30-day recycle bin, and the Critic
              AI vision loop is triggered to generate a better graphic.
            </div>
          </div>
        )}

        {decision === "approve_image_revise_content" && (
          <div className="flex items-start gap-2.5 text-amber-800">
            <FileText className="h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <strong className="font-bold">Granular Content Revision:</strong> The hero graphic is
              approved and permanently locked. The article body is returned to draft status for
              content revisions.
            </div>
          </div>
        )}

        {decision === "reject" && (
          <div className="flex items-start gap-2.5 text-rose-800">
            <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <div>
              <strong className="font-bold">Full Rejection:</strong> The entire post draft is
              archived and all associated media assets are moved to the 30-day recycle bin.
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {decision === "approve_content_retry_image" && (
          <div className="space-y-2">
            <label
              htmlFor="image-feedback"
              className="block text-xs font-bold tracking-wider text-slate-700 uppercase"
            >
              Critic AI Guidance for New Image (Optional)
            </label>
            <Textarea
              id="image-feedback"
              rows={3}
              placeholder="e.g. 'Make it darker, reduce neon saturation, ensure isometric perspective'..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="rounded-xl border-slate-200 text-xs"
            />
          </div>
        )}

        {decision === "approve_image_revise_content" && (
          <div className="space-y-2">
            <label
              htmlFor="content-feedback"
              className="block text-xs font-bold tracking-wider text-slate-700 uppercase"
            >
              Revision Feedback for Content (Required)
            </label>
            <Textarea
              id="content-feedback"
              required
              rows={4}
              placeholder="e.g. 'Deepen section 2 with concrete code examples, add query benchmarks for Postgres pooler'..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="rounded-xl border-slate-200 text-xs"
            />
          </div>
        )}

        {decision === "reject" && (
          <div className="space-y-2">
            <label
              htmlFor="reject-feedback"
              className="block text-xs font-bold tracking-wider text-slate-700 uppercase"
            >
              Rejection Reason (Optional)
            </label>
            <Textarea
              id="reject-feedback"
              rows={3}
              placeholder="Reason for archiving this draft..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="rounded-xl border-slate-200 text-xs"
            />
          </div>
        )}

        <div className="pt-2">
          {decision === "approve" && (
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 sm:text-sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing Live to techsonance.co.in...
                </span>
              ) : (
                "Confirm & Publish Article Live"
              )}
            </Button>
          )}

          {decision === "approve_content_retry_image" && (
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-xl bg-sky-600 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 sm:text-sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Triggering Critic AI Regeneration...
                </span>
              ) : (
                "Confirm: Keep Content & Regenerate Image"
              )}
            </Button>
          )}

          {decision === "approve_image_revise_content" && (
            <Button
              type="submit"
              disabled={submitting || !feedback.trim()}
              className="h-11 w-full rounded-xl bg-amber-600 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 sm:text-sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Feedback & Flagging for Revision...
                </span>
              ) : (
                "Confirm: Keep Image & Revise Content"
              )}
            </Button>
          )}

          {decision === "reject" && (
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-xl bg-rose-600 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 sm:text-sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rejecting Draft...
                </span>
              ) : (
                "Confirm Rejection & Archive Draft"
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
