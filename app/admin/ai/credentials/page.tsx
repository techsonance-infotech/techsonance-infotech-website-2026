"use client";

import React, { useState, useEffect, useCallback, startTransition } from "react";
import Link from "next/link";
import {
  KeyRound,
  ShieldCheck,
  Plus,
  RefreshCw,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Clock,
  OctagonAlert,
  Sliders,
  Sparkles,
  BarChart3,
  PowerOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AI_ADMIN_ROUTES } from "@/lib/constants/ai.constants";
import {
  listAdminAiCredentials,
  reactivateAdminAiCredential,
} from "@/lib/api/admin-ai-credentials.api";
import type { CredentialViewDto } from "@/lib/contracts/admin-ai-credentials.contract";
import { AddCredentialModal } from "@/components/admin/ai/AddCredentialModal";
import { ReplaceCredentialModal } from "@/components/admin/ai/ReplaceCredentialModal";
import { KillSwitchDialog } from "@/components/admin/ai/KillSwitchDialog";

export default function AiCredentialsPage() {
  const [credentials, setCredentials] = useState<CredentialViewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal controls
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<CredentialViewDto | null>(null);
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [killTarget, setKillTarget] = useState<CredentialViewDto | null>(null);
  const [killDialogOpen, setKillDialogOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleReactivate = async (credentialId: string) => {
    setActionLoadingId(credentialId);
    setToastMsg(null);
    try {
      await reactivateAdminAiCredential(credentialId);
      setToastMsg({
        type: "success",
        text: "Credential re-activated successfully! It is now active for inference routing.",
      });
      await fetchCredentials(false);
    } catch (err) {
      setToastMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to reactivate credential",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const fetchCredentials = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setErrorMsg(null);
    try {
      const data = await listAdminAiCredentials();
      startTransition(() => {
        setCredentials(data);
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load credentials");
    } finally {
      startTransition(() => {
        setLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void fetchCredentials(true);
    });
  }, [fetchCredentials]);

  const activeCount = credentials.filter((c) => c.status === "active").length;
  const cooldownCount = credentials.filter((c) => c.status === "cooling_down").length;
  const exhaustedCount = credentials.filter((c) => c.status === "exhausted" || c.status === "disabled").length;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="success" dot={true}>
            ACTIVE
          </Badge>
        );
      case "cooling_down":
        return (
          <Badge variant="warning" dot={true}>
            COOLING DOWN
          </Badge>
        );
      case "exhausted":
        return (
          <Badge variant="destructive" dot={true}>
            EXHAUSTED
          </Badge>
        );
      case "compromised":
        return (
          <Badge variant="destructive" dot={true}>
            COMPROMISED (WIPED)
          </Badge>
        );
      case "disabled":
      default:
        return <Badge variant="outline">DISABLED</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Navigation Tabs Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white">
              <KeyRound className="h-3.5 w-3.5" />
            </span>
            <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              AI Control Center & Vault
            </h1>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
            Multi-account failover, AES-256-GCM sealed credentials, and automated failover pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => fetchCredentials(true)}
            disabled={loading}
            className="rounded-2xl border-slate-200 bg-white text-xs font-semibold"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={() => setAddModalOpen(true)}
            className="rounded-2xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Credential
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <Link
          href={AI_ADMIN_ROUTES.CREDENTIALS}
          className="border-b-2 border-blue-600 px-4 py-2.5 text-xs font-bold text-blue-600"
        >
          Accounts & Keys Vault
        </Link>
        <Link
          href={AI_ADMIN_ROUTES.PIPELINE}
          className="border-b-2 border-transparent px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          Autonomous Blog Pipeline
        </Link>
        <Link
          href={AI_ADMIN_ROUTES.USAGE}
          className="border-b-2 border-transparent px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          Telemetry & Resource Caps
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Vault Keys</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <KeyRound className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-sora text-2xl font-black text-slate-900">
            {credentials.length}
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Across {new Set(credentials.map((c) => c.provider)).size} active providers
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Healthy Active Keys</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-sora text-2xl font-black text-emerald-600">
            {activeCount}
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Ready for inference routing
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>In Cooldown</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-sora text-2xl font-black text-amber-600">
            {cooldownCount}
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Rate-limited (auto-recovering)
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Exhausted / Halted</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <OctagonAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-sora text-2xl font-black text-rose-600">
            {exhaustedCount}
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Budget limit or kill switch
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {toastMsg && (
          <div
            className={`border-b p-4 flex items-center justify-between gap-2 text-xs font-semibold ${
              toastMsg.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMsg.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              )}
              <span>{toastMsg.text}</span>
            </div>
            <button
              onClick={() => setToastMsg(null)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        )}
        <div className="border-b border-slate-100 bg-slate-50/50 p-5 sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="font-sora text-base font-bold text-slate-900">
              Registered Provider Keys & Multi-Account Pool
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              All credentials are stored as AES-256-GCM ciphertext. The router automatically falls back across keys when quota limits or rate limits are reached.
            </p>
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-blue-600" />
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Loading encrypted credentials from vault...
              </p>
            </div>
          ) : errorMsg ? (
            <div className="p-8 text-center">
              <AlertTriangle className="mx-auto h-6 w-6 text-red-500" />
              <p className="mt-2 text-xs font-bold text-red-600">{errorMsg}</p>
              <Button
                variant="outline"
                onClick={() => fetchCredentials(true)}
                className="mt-3 rounded-xl text-xs"
              >
                Retry
              </Button>
            </div>
          ) : credentials.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="mt-3 font-sora text-sm font-bold text-slate-900">
                No Database Credentials Registered
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                The router is currently running on static environment fallback keys. Add your first encrypted credential to activate multi-account failover.
              </p>
              <Button
                onClick={() => setAddModalOpen(true)}
                className="mt-4 rounded-2xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Your First Credential
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Provider</th>
                    <th className="px-5 py-3">Model</th>
                    <th className="px-5 py-3">Label</th>
                    <th className="px-5 py-3">Key (Last 4)</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Spent Today / Cap</th>
                    <th className="px-5 py-3">Last Used</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {credentials.map((cred) => (
                    <tr key={cred.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-bold uppercase tracking-wider text-slate-900">
                          {cred.provider}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-200/60">
                          {cred.model || "default"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {cred.label}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-500">
                        ••••••••{cred.last4}
                      </td>
                      <td className="px-5 py-3.5">
                        {renderStatusBadge(cred.status)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-semibold">
                        #{cred.priority}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        ${parseFloat(cred.spentTodayUsd || "0").toFixed(2)}
                        {cred.dailyBudgetUsd ? ` / $${cred.dailyBudgetUsd}` : " (unlimited)"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {cred.lastUsedAt ? new Date(cred.lastUsedAt).toLocaleTimeString() : "Never"}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplaceTarget(cred);
                              setReplaceModalOpen(true);
                            }}
                            className="h-8 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5"
                          >
                            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                            <span>Replace</span>
                          </Button>

                          {cred.status === "disabled" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoadingId === cred.id}
                              onClick={() => handleReactivate(cred.id)}
                              className="h-8 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 text-[11px] font-semibold text-emerald-700 shadow-2xs hover:bg-emerald-100 hover:text-emerald-800 transition-colors inline-flex items-center gap-1.5"
                            >
                              <Zap
                                className={`h-3.5 w-3.5 text-emerald-600 ${
                                  actionLoadingId === cred.id ? "animate-spin" : ""
                                }`}
                              />
                              <span>
                                {actionLoadingId === cred.id ? "Activating..." : "Re-activate"}
                              </span>
                            </Button>
                          ) : cred.status === "compromised" ? (
                            <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                              Wiped
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setKillTarget(cred);
                                setKillDialogOpen(true);
                              }}
                              className="h-8 rounded-xl border border-rose-200 bg-rose-50/60 px-3 text-[11px] font-semibold text-rose-700 shadow-2xs hover:bg-rose-100 hover:text-rose-800 transition-colors inline-flex items-center gap-1.5"
                            >
                              <PowerOff className="h-3.5 w-3.5 text-rose-600" />
                              <span>Kill Switch</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddCredentialModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={() => fetchCredentials(false)}
      />

      <ReplaceCredentialModal
        credential={replaceTarget}
        open={replaceModalOpen}
        onOpenChange={setReplaceModalOpen}
        onSuccess={() => fetchCredentials(false)}
      />

      <KillSwitchDialog
        credential={killTarget}
        open={killDialogOpen}
        onOpenChange={setKillDialogOpen}
        onSuccess={() => fetchCredentials(false)}
      />
    </div>
  );
}
