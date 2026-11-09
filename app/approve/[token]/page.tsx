import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Tag,
  Calendar,
} from "lucide-react";
import { getContainer } from "@/lib/di/container";
import { ApprovalService } from "@/lib/services/approval.service";
import { GenerationJobsRepository } from "@/lib/repositories/generation-jobs.repository";
import { renderMarkdownToHtml } from "@/lib/utils/markdown";
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

  // Retrieve origin topic text if available
  let topicText = post.title;
  if (post.aiJobId) {
    try {
      const jobsRepo = container.get(GenerationJobsRepository);
      const job = await jobsRepo.findById(post.aiJobId);
      if (job?.topicText) {
        topicText = job.topicText;
      }
    } catch {
      // Non-blocking fallback to post title
    }
  }

  // Render article content markdown to HTML for complete review
  let renderedContentHtml = "";
  if (post.content) {
    try {
      renderedContentHtml = renderMarkdownToHtml(post.content);
    } catch {
      renderedContentHtml = `<p>${post.content.replace(/\n/g, "<br/>")}</p>`;
    }
  }

  const initialDecision =
    action === "reject" ? "reject" : action === "improve" ? "improve" : "approve";

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#F8FAFC] p-4 antialiased sm:p-6 md:p-8">
      {/* Top Header */}
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between border-b border-slate-200/80 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#1155CC] via-[#1E6BEE] to-[#22B6F6] text-sm font-black text-white shadow-md shadow-[#1155CC]/20">
            TS
          </div>
          <div>
            <span className="block font-sora text-sm font-black tracking-tight text-slate-900">
              TechSonance Studio
            </span>
            <span className="block text-[10px] font-semibold tracking-wider text-[#1155CC] uppercase">
              Editorial Quality Gate & Verification
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Single-Use Signed Token</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto my-8 w-full max-w-4xl space-y-6">
        {/* Topic Context Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
              <Sparkles className="h-3 w-3" />
              Approved Topic
            </span>
            <span className="text-xs font-bold text-slate-800">{topicText}</span>
          </div>
          <span className="text-[11px] font-medium text-blue-700">
            Autonomous AI Draft (v{request.postVersion})
          </span>
        </div>

        {/* Article Overview Card */}
        <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h1 className="font-sora text-2xl leading-tight font-black tracking-tight text-slate-900 sm:text-3xl">
              {post.title}
            </h1>
            <p className="mt-2 text-xs leading-relaxed font-medium text-slate-500 sm:text-sm">
              {post.excerpt || "Technical analysis and engineering best practices by TechSonance."}
            </p>
          </div>

          {/* 16:9 Hero Graphic Preview */}
          {post.heroImage && (
            <div className="space-y-2">
              <div className="relative aspect-video max-h-96 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950 shadow-inner">
                <Image
                  src={post.heroImage}
                  alt={post.thumbnailAlt || post.title}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-cover"
                  priority={true}
                />
              </div>
              <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                <span>FLUX.1-schnell 16:9 Editorial Graphic</span>
                <a
                  href={post.heroImage}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#1155CC] hover:underline"
                >
                  Open full resolution &rarr;
                </a>
              </div>
            </div>
          )}

          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{post.readTime || "5 min read"}</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {post.tags && post.tags.length > 0 ? post.tags.join(", ") : "Engineering"}
              </span>
            </div>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-[11px] text-slate-600">/{post.slug}</span>
          </div>
        </div>

        {/* Complete Blog Content Review Card */}
        <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#1155CC]" />
              <h2 className="font-sora text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                Complete Article Draft Review
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Full Text Preview</span>
          </div>

          <div
            className="prose prose-slate max-w-none text-xs leading-relaxed sm:text-sm"
            dangerouslySetInnerHTML={{ __html: renderedContentHtml }}
          />
        </div>

        {/* Action Decision Form */}
        <ApprovalActionForm
          token={token}
          postId={post.id}
          slug={post.slug}
          initialDecision={initialDecision}
        />
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-4xl border-t border-slate-100 pt-4 text-center text-[11px] text-slate-400">
        TechSonance Infotech • Autonomous Content & Publishing Platform • Security Guaranteed
      </footer>
    </div>
  );
}
