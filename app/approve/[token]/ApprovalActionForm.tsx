"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ApprovalActionFormProps {
  token: string;
  postId: string;
  initialDecision: "approve" | "reject" | "improve";
}

export function ApprovalActionForm({
  token,
  postId,
  initialDecision,
}: ApprovalActionFormProps) {
  const [decision, setDecision] = useState<"approve" | "reject" | "improve">(initialDecision);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<{
    success: boolean;
    decision: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/approve/${token}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, feedback }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit decision");
      }

      setCompleted({ success: true, decision });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm text-center space-y-4 animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 font-sora">
          {completed.decision === "approve"
            ? "Article Successfully Published Live!"
            : completed.decision === "improve"
              ? "Improvement Feedback Dispatched to AI Agent!"
              : "Article Rejected & Archived"}
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          {completed.decision === "approve"
            ? "The article is now live on techsonance.co.in and the edge cache has been revalidated."
            : completed.decision === "improve"
              ? "Your feedback has been recorded. The autonomous agent will generate an improved revision (v2)."
              : "This draft has been archived and will not appear on the public site."}
        </p>

        <div className="pt-4 flex items-center justify-center gap-3">
          {completed.decision === "approve" && (
            <Link href="/blog" target="_blank">
              <Button
                variant="default"
                size="sm"
                className="rounded-xl bg-[#1155CC] text-white font-bold text-xs"
              >
                <span>View Live Blog</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          )}
          <Link href="/admin/blog">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 text-slate-700 font-bold text-xs"
            >
              <span>Return to Studio CMS</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-sora">
            Confirm Editorial Decision
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select your decision below and click confirm to execute.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Decision Pill Switcher */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/80 rounded-2xl">
        <button
          type="button"
          onClick={() => setDecision("approve")}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
            decision === "approve"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          ✓ Approve
        </button>
        <button
          type="button"
          onClick={() => setDecision("improve")}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
            decision === "improve"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          ✎ Improve
        </button>
        <button
          type="button"
          onClick={() => setDecision("reject")}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
            decision === "reject"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          ✕ Reject
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {decision === "improve" && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Feedback for Revision (Required)
            </label>
            <Textarea
              required
              rows={4}
              placeholder="Explain what needs to be changed (e.g., 'Make section 2 more technical, add benchmarks for Postgres query performance')..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="rounded-xl border-slate-200 text-xs"
            />
          </div>
        )}

        {decision === "reject" && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Rejection Reason (Optional)
            </label>
            <Textarea
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
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing Live to techsonance.co.in...
                </span>
              ) : (
                "Confirm & Publish Article Live"
              )}
            </Button>
          )}

          {decision === "improve" && (
            <Button
              type="submit"
              disabled={submitting || !feedback.trim()}
              className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Dispatching to Autonomous Agent...
                </span>
              ) : (
                "Dispatch Revision Request to AI Agent"
              )}
            </Button>
          )}

          {decision === "reject" && (
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rejecting Draft...
                </span>
              ) : (
                "Confirm Rejection & Archive"
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
