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
      const res = await fetch("/api/admin/ai/jobs");
      const data = await res.json();
      if (data.ok) {
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Failed to load AI jobs", err);
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
      const res = await fetch("/api/admin/ai/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicText: topicText.trim(), category }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger generation");
      }

      setSuccessMsg("Autonomous generation job enqueued! Pipeline running in background.");
      setTopicText("");
      await fetchJobs();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to start job");
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Autonomous Engine (FD-1 to FD-7)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sora">
            AI Blog Automation Control Plane
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Automated multi-step outline expansion, FLUX thumbnail rendering, and single-use 1-click
            email approvals.
          </p>
        </div>

        <button
          onClick={() => {
            void fetchJobs(true);
          }}
          className="self-start sm:self-auto p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#1155CC]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Trigger New Autonomous Job Card */}
      <Card className="border-blue-100 bg-gradient-to-r from-blue-50/40 via-white to-sky-50/20 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1155CC] text-white flex items-center justify-center shadow-md shadow-[#1155CC]/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 font-sora">
                Launch Autonomous Generation Job
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                The agent will draft an outline, write deep technical sections, generate a 1200x630
                FLUX thumbnail, and email you an approval link.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleTriggerJob} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <Input
                  required
                  placeholder="e.g., Designing Scalable Event-Driven Architectures with Kafka and Next.js"
                  value={topicText}
                  onChange={(e) => setTopicText(e.target.value)}
                  className="h-11 rounded-xl bg-white border-slate-200 text-xs sm:text-sm font-medium"
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1155CC]"
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
                className="h-11 px-5 rounded-xl bg-[#1155CC] hover:bg-[#0d44a4] text-white font-bold text-xs shadow-md shadow-[#1155CC]/25 flex items-center justify-center gap-2 shrink-0"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${triggering ? "animate-pulse" : ""}`} />
                <span>{triggering ? "Enqueueing Job..." : "Generate Post"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Model & Failover Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Text Model Router</p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Groq &bull; Gemini &bull; Cerebras
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Failover Active
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Thumbnail Renderer</p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Cloudflare FLUX &bull; Pollinations
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Ready
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Email Approvals</p>
                <p className="text-[11px] text-slate-400 font-medium">Single-Use Signed Tokens</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              72h Expiry
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Generation Jobs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 font-sora">
              Pipeline Jobs & History
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Real-time progress of autonomous multi-step jobs and checkpoint states
            </CardDescription>
          </div>
          <span className="text-xs font-bold text-slate-400">Total: {jobs.length}</span>
        </CardHeader>
        <CardContent>
          {loading && jobs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              Loading generation jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              No generation jobs executed yet. Enter a topic above to test the autonomous pipeline.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Topic & Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Current Step</th>
                    <th className="py-3 px-4">Attempts</th>
                    <th className="py-3 px-4">Started</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-bold text-slate-900 truncate">{job.topicText}</p>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {job.category || "Engineering"} &bull; v{job.version}
                        </span>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(job.status)}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {job.currentStep || "queued"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {job.attempt} / {job.maxAttempts}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {new Date(job.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {job.resultPostId ? (
                          <Link
                            href={`/admin/blog/${job.resultPostId}`}
                            className="text-xs font-bold text-[#1155CC] hover:underline inline-flex items-center gap-1"
                          >
                            <span>Inspect Post</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : job.status === "FAILED" ? (
                          <span
                            className="text-[11px] text-rose-600 font-semibold"
                            title={JSON.stringify(job.errorDetails)}
                          >
                            Check Error
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3 animate-spin" />
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
