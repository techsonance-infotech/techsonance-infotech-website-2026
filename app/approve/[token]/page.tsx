import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, XCircle, ArrowRight, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { getContainer } from "@/lib/di/container";
import { ApprovalService } from "@/lib/services/approval.service";
import { ApprovalActionForm } from "./ApprovalActionForm";

export const metadata: Metadata = {
  title: "Editorial Decision | TechSonance Studio",
  description: "Secure 1-click publishing approval for AI-drafted articles.",
  robots: { index: false, follow: false },
};

function checkIsExpired(expiresAt: Date | string): boolean {
  return Date.now() > new Date(expiresAt).getTime();
}

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
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
        <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <XCircle className="h-6 w-6" />
          </div>
          <h1 className="font-sora text-xl font-black text-slate-900">Invalid Approval Link</h1>
          <p className="text-xs leading-relaxed text-slate-500">
            This token does not exist or has been revoked. Please check your email or log into the
            Studio CMS.
          </p>
          <Link
            href="/admin/blog"
            className="inline-flex items-center gap-1.5 pt-2 text-xs font-bold text-[#1155CC] hover:underline"
          >
            <span>Open Studio CMS</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const { request, post } = data;
  const isExpired = checkIsExpired(request.expiresAt);
  const isUsed = !!request.usedAt;

  if (isUsed || isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
        <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xl">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${
              isUsed ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            }`}
          >
            {isUsed ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
          </div>
          <h1 className="font-sora text-xl font-black text-slate-900">
            {isUsed ? "Decision Already Recorded" : "Approval Link Expired"}
          </h1>
          <p className="text-xs leading-relaxed text-slate-500">
            {isUsed
              ? `This request was already decided as ${request.decision?.toUpperCase()} on ${new Date(
                  request.usedAt!,
                ).toLocaleString()}.`
              : "This single-use 72-hour approval link has expired. The article remains pending review in the Studio CMS."}
          </p>
          <Link
            href={`/admin/blog/${post.id}`}
            className="inline-flex items-center gap-1.5 pt-2 text-xs font-bold text-[#1155CC] hover:underline"
          >
            <span>Inspect Post in Studio CMS</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const initialDecision =
    action === "reject" ? "reject" : action === "improve" ? "improve" : "approve";

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#F8FAFC] p-4 antialiased sm:p-6 md:p-8">
      {/* Top Header */}
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between border-b border-slate-200/80 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#1155CC] via-[#1E6BEE] to-[#22B6F6] text-sm font-black text-white shadow-md shadow-[#1155CC]/20">
            TS
          </div>
          <div>
            <span className="block font-sora text-sm font-black tracking-tight text-slate-900">
              TechSonance
            </span>
            <span className="block text-[10px] font-semibold tracking-wider text-[#1155CC] uppercase">
              Editorial Verification
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Single-Use Signed Token</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto my-8 w-full max-w-3xl space-y-6">
        <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-blue-700 uppercase">
              <Sparkles className="h-3 w-3 text-blue-600" />
              Autonomous AI Draft (v{request.postVersion})
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              • Ready for publishing decision
            </span>
          </div>

          <div>
            <h1 className="font-sora text-2xl leading-tight font-black tracking-tight text-slate-900 sm:text-3xl">
              {post.title}
            </h1>
            <p className="mt-2 text-xs leading-relaxed font-medium text-slate-500 sm:text-sm">
              {post.excerpt || "Technical analysis and engineering best practices by TechSonance."}
            </p>
          </div>

          {post.heroImage && (
            <div className="relative max-h-80 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50">
              <Image
                src={post.heroImage}
                alt={post.thumbnailAlt || post.title}
                width={800}
                height={450}
                className="h-auto max-h-80 w-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Estimated Reading Time:</span>
            <span>{post.readTime || "5 min read"}</span>
            <span className="mx-2 text-slate-300">•</span>
            <span className="font-semibold text-slate-700">Slug:</span>
            <span className="font-mono text-slate-600">/{post.slug}</span>
          </div>
        </div>

        {/* Confirmation Form */}
        <ApprovalActionForm token={token} postId={post.id} initialDecision={initialDecision} />
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-3xl border-t border-slate-100 pt-4 text-center text-[11px] text-slate-400">
        TechSonance Infotech • Autonomous Content & Publishing Platform • Security Guaranteed
      </footer>
    </div>
  );
}
