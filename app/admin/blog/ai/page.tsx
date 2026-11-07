"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  ArrowUpRight,
  ShieldCheck,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { AdminGenerationJob } from "@/lib/types/admin.types";
import { listAdminAiJobs, createAdminAiJob } from "@/lib/api/admin-ai.api";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge variant="success" dot={true}>
          COMPLETED
        </Badge>
      );
    case "RUNNING":
      return (
        <Badge variant="info" dot={true}>
          RUNNING
        </Badge>
      );
    case "QUEUED":
      return <Badge variant="secondary">QUEUED</Badge>;
    case "WAITING_QUOTA":
      return <Badge variant="warning">WAITING QUOTA</Badge>;
    case "FAILED":
      return <Badge variant="destructive">FAILED</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AdminAIPage() {
  const [jobs, setJobs] = useState<AdminGenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicText, setTopicText] = useState("");
  const [category, setCategory] = useState("Engineering");
  const [triggering, setTriggering] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchJobs = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await listAdminAiJobs(50);
      setJobs(data);
    } catch {
      // Non-blocking fetch error handling
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchJobs(false);
    // Auto-refresh every 8 seconds if there are running or queued jobs
    const interval = setInterval(() => {
      void fetchJobs(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleTriggerJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicText.trim()) return;

    setTriggering(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await createAdminAiJob({ topicText: topicText.trim(), category });
      setSuccessMsg("Autonomous generation job enqueued! Pipeline running in background.");
      setTopicText("");
      await fetchJobs();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to start job");
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="animate-in fade-in space-y-8 duration-300">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 pb-2 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 uppercase">
              <Sparkles className="h-3 w-3 text-blue-600" />
              Autonomous Engine (FD-1 to FD-7)
            </span>
          </div>
          <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            AI Blog Automation Control Plane
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
            Automated multi-step outline expansion, FLUX thumbnail rendering, and single-use 1-click
            email approvals.
          </p>
        </div>

        <button
          onClick={() => {
            void fetchJobs(true);
          }}
          className="flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#1155CC]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Trigger New Autonomous Job Card */}
      <Card className="border-blue-100 bg-gradient-to-r from-blue-50/40 via-white to-sky-50/20 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1155CC] text-white shadow-md shadow-[#1155CC]/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="font-sora text-base font-bold text-slate-900">
                Launch Autonomous Generation Job
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                The agent will draft an outline, write deep technical sections, generate a 1200x630
                FLUX thumbnail, and email you an approval link.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {successMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleTriggerJob} className="space-y-4">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <Input
                  required
                  placeholder="e.g., Designing Scalable Event-Driven Architectures with Kafka and Next.js"
                  value={topicText}
                  onChange={(e) => setTopicText(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-white text-xs font-medium sm:text-sm"
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#1155CC] focus:outline-none"
              >
                <option value="Engineering">Engineering</option>
                <option value="Architecture">Architecture</option>
                <option value="AI & Machine Learning">AI & Machine Learning</option>
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                <option value="Security">Security</option>
              </select>

              <Button
                type="submit"
                disabled={triggering || !topicText.trim()}
                className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1155CC] px-5 text-xs font-bold text-white shadow-md shadow-[#1155CC]/25 hover:bg-[#0d44a4]"
              >
                <Play className={`h-3.5 w-3.5 fill-current ${triggering ? "animate-pulse" : ""}`} />
                <span>{triggering ? "Enqueueing Job..." : "Generate Post"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Model & Failover Status Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-slate-200/80">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Text Model Router</p>
                <p className="text-[11px] font-medium text-slate-400">
                  Groq &bull; Gemini &bull; Cerebras
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              Failover Active
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Thumbnail Renderer</p>
                <p className="text-[11px] font-medium text-slate-400">
                  Cloudflare FLUX &bull; Pollinations
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              Ready
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Email Approvals</p>
                <p className="text-[11px] font-medium text-slate-400">Single-Use Signed Tokens</p>
              </div>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
              72h Expiry
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Generation Jobs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="font-sora text-base font-bold text-slate-900">
              Pipeline Jobs & History
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              Real-time progress of autonomous multi-step jobs and checkpoint states
            </CardDescription>
          </div>
          <span className="text-xs font-bold text-slate-400">Total: {jobs.length}</span>
        </CardHeader>
        <CardContent>
          {loading && jobs.length === 0 ? (
            <div className="py-12 text-center text-xs font-medium text-slate-400">
              Loading generation jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-center text-xs font-medium text-slate-400">
              No generation jobs executed yet. Enter a topic above to test the autonomous pipeline.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  <tr>
                    <th className="px-4 py-3">Topic & Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Current Step</th>
                    <th className="px-4 py-3">Attempts</th>
                    <th className="px-4 py-3">Started</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => (
                    <tr key={job.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="max-w-xs px-4 py-3">
                        <p className="truncate font-bold text-slate-900">{job.topicText}</p>
                        <span className="text-[10px] font-medium text-slate-400">
                          {job.category || "Engineering"} &bull; v{job.version}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(job.status)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                          {job.currentStep || "queued"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-500">
                        {job.attempt} / {job.maxAttempts}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-500">
                        {new Date(job.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {job.resultPostId ? (
                          <Link
                            href={`/admin/blog/${job.resultPostId}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#1155CC] hover:underline"
                          >
                            <span>Inspect Post</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : job.status === "FAILED" ? (
                          <span
                            className="text-[11px] font-semibold text-rose-600"
                            title={JSON.stringify(job.errorDetails)}
                          >
                            Check Error
                          </span>
                        ) : (
                          <span className="flex items-center justify-end gap-1 text-[11px] font-medium text-slate-400">
                            <Clock className="h-3 w-3 animate-spin" />
                            <span>Processing</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
