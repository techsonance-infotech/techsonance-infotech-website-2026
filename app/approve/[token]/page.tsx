import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { getContainer } from "@/lib/di/container";
import { ApprovalService } from "@/lib/services/approval.service";
import { ApprovalActionForm } from "./ApprovalActionForm";

export const metadata: Metadata = {
  title: "Editorial Decision | TechSonance Studio",
  description: "Secure 1-click publishing approval for AI-drafted articles.",
  robots: { index: false, follow: false },
};

export default async function ApprovePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const { token } = await params;
  const { action = "approve" } = await searchParams;

  const container = getContainer();
  const approvalService = container.get(ApprovalService);

  const data = await approvalService.getRequestByToken(token);

  if (!data || !data.request || !data.post) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-slate-900 font-sora">Invalid Approval Link</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            This token does not exist or has been revoked. Please check your email or log into the Studio CMS.
          </p>
          <Link
            href="/admin/blog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1155CC] hover:underline pt-2"
          >
            <span>Open Studio CMS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const { request, post } = data;
  const isExpired = new Date() > new Date(request.expiresAt);
  const isUsed = !!request.usedAt;

  if (isUsed || isExpired) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl text-center space-y-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
              isUsed ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            }`}
          >
            {isUsed ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </div>
          <h1 className="text-xl font-black text-slate-900 font-sora">
            {isUsed ? "Decision Already Recorded" : "Approval Link Expired"}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isUsed
              ? `This request was already decided as ${request.decision?.toUpperCase()} on ${new Date(
                  request.usedAt!,
                ).toLocaleString()}.`
              : "This single-use 72-hour approval link has expired. The article remains pending review in the Studio CMS."}
          </p>
          <Link
            href={`/admin/blog/${post.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1155CC] hover:underline pt-2"
          >
            <span>Inspect Post in Studio CMS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const initialDecision =
    action === "reject" ? "reject" : action === "improve" ? "improve" : "approve";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between p-4 sm:p-6 md:p-8 antialiased">
      {/* Top Header */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1155CC] via-[#1E6BEE] to-[#22B6F6] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#1155CC]/20">
            TS
          </div>
          <div>
            <span className="font-black text-sm text-slate-900 tracking-tight font-sora block">
              TechSonance
            </span>
            <span className="text-[10px] font-semibold text-[#1155CC] uppercase tracking-wider block">
              Editorial Verification
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Single-Use Signed Token</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl w-full mx-auto my-8 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Autonomous AI Draft (v{request.postVersion})
            </span>
            <span className="text-[11px] font-medium text-slate-400">• Ready for publishing decision</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sora leading-tight">
              {post.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 leading-relaxed">
              {post.excerpt || "Technical analysis and engineering best practices by TechSonance."}
            </p>
          </div>

          {post.heroImage && (
            <div className="rounded-2xl overflow-hidden border border-slate-200/80 max-h-80 relative bg-slate-50">
              <img
                src={post.heroImage}
                alt={post.thumbnailAlt || post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Estimated Reading Time:</span>
            <span>{post.readTime || "5 min read"}</span>
            <span className="mx-2 text-slate-300">•</span>
            <span className="font-semibold text-slate-700">Slug:</span>
            <span className="font-mono text-slate-600">/{post.slug}</span>
          </div>
        </div>

        {/* Confirmation Form */}
        <ApprovalActionForm
          token={token}
          postId={post.id}
          initialDecision={initialDecision}
        />
      </main>

      {/* Footer */}
      <footer className="max-w-3xl w-full mx-auto text-center pt-4 border-t border-slate-100 text-[11px] text-slate-400">
        TechSonance Infotech • Autonomous Content & Publishing Platform • Security Guaranteed
      </footer>
    </div>
  );
}
