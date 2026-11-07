"use client";

import React, { useState, useEffect, useCallback, startTransition } from "react";
import {
  Zap,
  BarChart3,
  RefreshCw,
  Cpu,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminAiUsage } from "@/lib/api/admin-ai.api";
import type { AiTelemetrySummary } from "@/lib/contracts/admin-ai-usage.contract";

export default function AIUsageTelemetryPage() {
  const [data, setData] = useState<AiTelemetrySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTelemetry = useCallback(async () => {
    try {
      startTransition(() => {
        setLoading(true);
      });
      const telemetry = await getAdminAiUsage();
      startTransition(() => {
        setData(telemetry);
      });
    } catch {
      // Non-blocking telemetry loading
    } finally {
      startTransition(() => {
        setLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void loadTelemetry();
    });
  }, [loadTelemetry]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            AI Telemetry & Resource Caps
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
            Real-time tracking of token usage, provider latencies, and autonomous publishing caps.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadTelemetry}
          disabled={loading}
          className="rounded-2xl border-slate-200 bg-white text-xs font-semibold"
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Metrics
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Daily Cap */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Daily Cap Progress</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-sora text-2xl font-black text-slate-900">
              {data?.dailyPostsUsed ?? 0}
            </span>
            <span className="text-xs font-bold text-slate-400">
              / {data?.dailyPostCap ?? 1} posts today
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${Math.min(
                  100,
                  ((data?.dailyPostsUsed ?? 0) / (data?.dailyPostCap ?? 1)) * 100,
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Weekly Cap */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Weekly Cap Progress</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-sora text-2xl font-black text-slate-900">
              {data?.weeklyPostsUsed ?? 0}
            </span>
            <span className="text-xs font-bold text-slate-400">
              / {data?.weeklyPostCap ?? 3} posts this week
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{
                width: `${Math.min(
                  100,
                  ((data?.weeklyPostsUsed ?? 0) / (data?.weeklyPostCap ?? 3)) * 100,
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Tokens Today */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tokens Today</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="font-sora text-2xl font-black text-slate-900">
            {(data?.tokensToday ?? 0).toLocaleString()}
          </div>
          <span className="mt-1 block text-[11px] font-medium text-slate-400">
            {(data?.tokensThisWeek ?? 0).toLocaleString()} tokens over past 7 days
          </span>
        </div>

        {/* System Health */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Autonomy Status</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-sora text-lg font-black text-slate-900">Level 1</span>
            <Badge className="border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-700">
              Supervised
            </Badge>
          </div>
          <span className="mt-1 block text-[11px] font-medium text-slate-400">
            Drafting autonomous; human sign-off required
          </span>
        </div>
      </div>

      {/* Provider Status Cards */}
      <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="font-sora text-sm font-black text-slate-900">
          Model & Provider Availability
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Cloudflare Workers AI</span>
              <Badge className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
                Active
              </Badge>
            </div>
            <p className="mb-2 text-[11px] text-slate-500">
              FLUX.1-schnell model for high-resolution 16:9 article thumbnail generation.
            </p>
            <div className="text-[11px] font-medium text-slate-400">Primary Image Provider</div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Google Gemini & OpenRouter</span>
              <Badge className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
                Active
              </Badge>
            </div>
            <p className="mb-2 text-[11px] text-slate-500">
              Gemini 2.5 Flash / Groq for rapid outline, deep prose, and metadata extraction.
            </p>
            <div className="text-[11px] font-medium text-slate-400">Primary Text Provider</div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Pollinations.ai</span>
              <Badge className="border-blue-200 bg-blue-50 text-[10px] text-blue-700">
                Fallback Ready
              </Badge>
            </div>
            <p className="mb-2 text-[11px] text-slate-500">
              Zero-friction direct image fallback if Cloudflare Workers AI is throttled.
            </p>
            <div className="text-[11px] font-medium text-slate-400">Secondary Image Provider</div>
          </div>
        </div>
      </div>

      {/* Recent Usage Logs */}
      <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="font-sora text-sm font-black text-slate-900">Recent AI Invocation Events</h2>

        {loading ? (
          <div className="py-8 text-center text-xs font-semibold text-slate-400">
            Loading usage history...
          </div>
        ) : !data || data.recentEvents.length === 0 ? (
          <div className="py-8 text-center text-xs font-semibold text-slate-400">
            No AI invocation events recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 font-semibold text-slate-400">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Step</th>
                  <th className="pb-3">Provider</th>
                  <th className="pb-3">Model</th>
                  <th className="pb-3">Tokens</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentEvents.map((ev) => (
                  <tr key={ev.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="py-3 font-medium text-slate-500">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "-"}
                    </td>
                    <td className="py-3 font-bold text-slate-800">{ev.stepName || "custom"}</td>
                    <td className="py-3 text-slate-600 capitalize">{ev.provider}</td>
                    <td className="py-3 font-mono text-[11px] text-slate-500">{ev.model}</td>
                    <td className="py-3 font-semibold text-slate-800">
                      {ev.totalTokens ? ev.totalTokens.toLocaleString() : "-"}
                    </td>
                    <td className="py-3 text-slate-500">
                      {ev.durationMs ? `${ev.durationMs}ms` : "-"}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          ev.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {ev.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
