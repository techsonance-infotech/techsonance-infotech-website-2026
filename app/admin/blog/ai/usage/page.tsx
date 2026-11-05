"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Zap,
  BarChart3,
  Clock,
  ShieldCheck,
  Server,
  RefreshCw,
  Cpu,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TelemetrySummary } from "@/lib/services/admin-telemetry.service";

export default function AIUsageTelemetryPage() {
  const [data, setData] = useState<TelemetrySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTelemetry = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/ai/usage");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sora">
            AI Telemetry & Resource Caps
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            Real-time tracking of token usage, provider latencies, and autonomous publishing caps.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadTelemetry}
          disabled={loading}
          className="rounded-2xl border-slate-200 text-xs font-semibold bg-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh Metrics
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Cap */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Daily Cap Progress</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-sora">
              {data?.dailyPostsUsed ?? 0}
            </span>
            <span className="text-xs font-bold text-slate-400">
              / {data?.dailyPostCap ?? 1} posts today
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all"
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
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Weekly Cap Progress</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-sora">
              {data?.weeklyPostsUsed ?? 0}
            </span>
            <span className="text-xs font-bold text-slate-400">
              / {data?.weeklyPostCap ?? 3} posts this week
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all"
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
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Tokens Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-sora">
            {(data?.tokensToday ?? 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            {(data?.tokensThisWeek ?? 0).toLocaleString()} tokens over past 7 days
          </span>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Autonomy Status</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-slate-900 font-sora">Level 1</span>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
              Supervised
            </Badge>
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Drafting autonomous; human sign-off required
          </span>
        </div>
      </div>

      {/* Provider Status Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-black text-slate-900 font-sora">
          Model & Provider Availability
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-slate-200/70 rounded-2xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-900">Cloudflare Workers AI</span>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                Active
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              FLUX.1-schnell model for high-resolution 16:9 article thumbnail generation.
            </p>
            <div className="text-[11px] text-slate-400 font-medium">Primary Image Provider</div>
          </div>

          <div className="border border-slate-200/70 rounded-2xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-900">Google Gemini & OpenRouter</span>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                Active
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Gemini 2.5 Flash / Groq for rapid outline, deep prose, and metadata extraction.
            </p>
            <div className="text-[11px] text-slate-400 font-medium">Primary Text Provider</div>
          </div>

          <div className="border border-slate-200/70 rounded-2xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-slate-900">Pollinations.ai</span>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                Fallback Ready
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Zero-friction direct image fallback if Cloudflare Workers AI is throttled.
            </p>
            <div className="text-[11px] text-slate-400 font-medium">Secondary Image Provider</div>
          </div>
        </div>
      </div>

      {/* Recent Usage Logs */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-black text-slate-900 font-sora">Recent AI Invocation Events</h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-semibold">
            Loading usage history...
          </div>
        ) : !data || data.recentEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-semibold">
            No AI invocation events recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
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
                  <tr key={ev.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 text-slate-500 font-medium">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "-"}
                    </td>
                    <td className="py-3 font-bold text-slate-800">{ev.stepName || "custom"}</td>
                    <td className="py-3 capitalize text-slate-600">{ev.provider}</td>
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
