"use client";

import React, { useState, useEffect, useCallback, startTransition } from "react";
import Link from "next/link";
import {
  KeyRound,
  Plus,
  RefreshCw,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Clock,
  OctagonAlert,
  Sliders,
  Sparkles,
  PowerOff,
  PauseCircle,
  Trash2,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AI_ADMIN_ROUTES } from "@/lib/constants/ai.constants";
import {
  isImageCredentialModel,
  type ProviderCategory,
} from "@/lib/constants/ai-providers.constants";
import {
  listAdminAiCredentials,
  reactivateAdminAiCredential,
  deactivateAdminAiCredential,
} from "@/lib/api/admin-ai-credentials.api";
import type { CredentialViewDto } from "@/lib/contracts/admin-ai-credentials.contract";
import { AddCredentialModal } from "@/components/admin/ai/AddCredentialModal";
import { ReplaceCredentialModal } from "@/components/admin/ai/ReplaceCredentialModal";
import { ChangeModelModal } from "@/components/admin/ai/ChangeModelModal";
import { KillSwitchDialog } from "@/components/admin/ai/KillSwitchDialog";
import { DeleteCredentialDialog } from "@/components/admin/ai/DeleteCredentialDialog";

function renderStatusBadge(status: string): React.ReactElement {
  switch (status) {
    case "active":
      return (
        <Badge variant="success" dot={true} className="whitespace-nowrap">
          ACTIVE
        </Badge>
      );
    case "cooling_down":
      return (
        <Badge variant="warning" dot={true} className="whitespace-nowrap">
          COOLDOWN
        </Badge>
      );
    case "exhausted":
      return (
        <Badge variant="destructive" dot={true} className="whitespace-nowrap">
          EXHAUSTED
        </Badge>
      );
    case "compromised":
      return (
        <Badge variant="destructive" dot={true} className="whitespace-nowrap">
          WIPED
        </Badge>
      );
    case "disabled":
    default:
      return (
        <Badge variant="outline" className="whitespace-nowrap">
          DISABLED
        </Badge>
      );
  }
}

export default function AiCredentialsPage(): React.ReactElement {
  const [credentials, setCredentials] = useState<CredentialViewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "text" | "image">("all");

  // Modal controls
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [initialAddCategory, setInitialAddCategory] = useState<ProviderCategory>("text");
  const [modelTarget, setModelTarget] = useState<CredentialViewDto | null>(null);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<CredentialViewDto | null>(null);
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [killTarget, setKillTarget] = useState<CredentialViewDto | null>(null);
  const [killDialogOpen, setKillDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CredentialViewDto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const isImageCredential = useCallback((cred: CredentialViewDto) => {
    return isImageCredentialModel(cred.provider, cred.model);
  }, []);

  const handleDeactivate = async (credentialId: string) => {
    setActionLoadingId(credentialId);
    setToastMsg(null);
    try {
      await deactivateAdminAiCredential(credentialId);
      setToastMsg({
        type: "success",
        text: "Credential deactivated. Routing to this key is paused until re-activated.",
      });
      await fetchCredentials(false);
    } catch (err) {
      setToastMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to deactivate credential",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

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
  const exhaustedCount = credentials.filter(
    (c) => c.status === "exhausted" || c.status === "disabled" || c.status === "compromised",
  ).length;

  const textCredentials = credentials.filter((c) => !isImageCredential(c));
  const imageCredentials = credentials.filter(isImageCredential);
  const displayedCredentials =
    categoryFilter === "image"
      ? imageCredentials
      : categoryFilter === "text"
        ? textCredentials
        : credentials;

  return (
    <div className="space-y-6">
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
            Multi-account failover, AES-256-GCM sealed credentials, and automated failover
            pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            variant="outline"
            onClick={() => {
              setInitialAddCategory("image");
              setAddModalOpen(true);
            }}
            className="rounded-2xl border-purple-200 bg-purple-50 text-xs font-bold text-purple-700 hover:bg-purple-100"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-purple-600" />
            Add Image Key
          </Button>

          <Button
            onClick={() => {
              setInitialAddCategory("text");
              setAddModalOpen(true);
            }}
            className="rounded-2xl bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add LLM Key
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
            {textCredentials.length} Text LLMs • {imageCredentials.length} Image Engines
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Healthy Active Keys</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-sora text-2xl font-black text-emerald-600">{activeCount}</div>
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
          <div className="mt-3 font-sora text-2xl font-black text-amber-600">{cooldownCount}</div>
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
          <div className="mt-3 font-sora text-2xl font-black text-rose-600">{exhaustedCount}</div>
          <span className="text-[11px] font-semibold text-slate-400">
            Budget limit or kill switch
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        {toastMsg && (
          <div
            className={`flex items-center justify-between gap-2 border-b p-4 text-xs font-semibold ${
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

        {/* Filter Bar & Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h2 className="font-sora text-base font-bold text-slate-900">
              Registered Provider Keys &amp; Multi-Account Pool
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              All credentials are stored as AES-256-GCM ciphertext. The router automatically falls
              back across keys when quota limits or rate limits are reached.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Keys ({credentials.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("text")}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === "text"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "border border-blue-200/80 bg-white text-blue-700 hover:bg-blue-50/50"
              }`}
            >
              <Cpu className="h-3.5 w-3.5 shrink-0" />
              <span>Text LLMs ({textCredentials.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("image")}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === "image"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "border border-purple-200/80 bg-white text-purple-700 hover:bg-purple-50/50"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>Image Engines ({imageCredentials.length})</span>
            </button>
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
          ) : displayedCredentials.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                {categoryFilter === "image" ? (
                  <Sparkles className="h-6 w-6 text-purple-600" />
                ) : (
                  <KeyRound className="h-6 w-6" />
                )}
              </div>
              <h3 className="mt-3 font-sora text-sm font-bold text-slate-900">
                {categoryFilter === "image"
                  ? "No Image Generation Keys Registered"
                  : categoryFilter === "text"
                    ? "No Text LLM Credentials Registered"
                    : "No Database Credentials Registered"}
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                {categoryFilter === "image"
                  ? "Image generation currently falls back to Cloudflare Workers AI env tokens or zero-config Pollinations.ai FLUX. Add a dedicated Cloudflare, Replicate, or Stability AI token to manage quotas."
                  : "The router is currently running on static environment fallback keys. Add your first encrypted credential to activate multi-account failover."}
              </p>
              <Button
                onClick={() => {
                  setInitialAddCategory(categoryFilter === "image" ? "image" : "text");
                  setAddModalOpen(true);
                }}
                className={`mt-4 rounded-2xl text-xs font-bold text-white ${
                  categoryFilter === "image"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {categoryFilter === "image"
                  ? "Add Image Generation Key"
                  : "Add Your First Credential"}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Desktop Column Headers */}
              <div className="hidden border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase lg:grid lg:grid-cols-12 lg:items-center lg:gap-4">
                <div className="lg:col-span-3">Provider &amp; Label</div>
                <div className="lg:col-span-3">Serving Model</div>
                <div className="lg:col-span-2">Status &amp; Usage</div>
                <div className="text-right lg:col-span-4">Actions</div>
              </div>

              {displayedCredentials.map((cred) => {
                const isImg = isImageCredential(cred);
                const isCompromised = cred.status === "compromised";
                return (
                  <div
                    key={cred.id}
                    className="grid grid-cols-1 gap-3 px-5 py-4 text-xs transition-colors hover:bg-slate-50/60 lg:grid-cols-12 lg:items-center lg:gap-4"
                  >
                    {/* Col 1: Provider, Category Badge, Label, Key */}
                    <div className="min-w-0 space-y-1.5 lg:col-span-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold tracking-wider text-slate-900 uppercase">
                          {cred.provider}
                        </span>
                        {isImg ? (
                          <Badge
                            variant="outline"
                            className="border-purple-300 bg-purple-50/80 text-[9px] font-bold whitespace-nowrap text-purple-700"
                          >
                            IMAGE (FLUX)
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-blue-300 bg-blue-50/80 text-[9px] font-bold whitespace-nowrap text-blue-700"
                          >
                            TEXT (LLM)
                          </Badge>
                        )}
                        <span className="font-mono text-[11px] text-slate-400">
                          ••••{cred.last4}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className="truncate font-semibold text-slate-800" title={cred.label}>
                          {cred.label}
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                          #{cred.priority}
                        </span>
                      </div>
                    </div>

                    {/* Col 2: Active Model Switcher */}
                    <div className="min-w-0 lg:col-span-3">
                      <button
                        type="button"
                        disabled={isCompromised}
                        onClick={() => {
                          setModelTarget(cred);
                          setModelModalOpen(true);
                        }}
                        title={
                          isCompromised
                            ? "Wiped credential — use Replace or Delete"
                            : "Click to switch serving model"
                        }
                        className={`group inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] font-semibold transition-all ${
                          isCompromised
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-75"
                            : isImg
                              ? "cursor-pointer border-purple-200/70 bg-purple-50/80 text-purple-700 hover:border-purple-300 hover:bg-purple-100 hover:shadow-2xs"
                              : "cursor-pointer border-blue-200/70 bg-blue-50/80 text-blue-700 hover:border-blue-300 hover:bg-blue-100 hover:shadow-2xs"
                        }`}
                      >
                        <span className="truncate">{cred.model || "default"}</span>
                        {!isCompromised && (
                          <Sliders className="h-3 w-3 shrink-0 opacity-50 transition-opacity group-hover:opacity-100" />
                        )}
                      </button>
                    </div>

                    {/* Col 3: Status & Budget / Usage */}
                    <div className="flex flex-row items-center justify-between gap-2 lg:col-span-2 lg:flex-col lg:items-start lg:justify-center lg:gap-1.5">
                      {renderStatusBadge(cred.status)}
                      <div className="flex items-center gap-1.5 font-mono text-[11px] whitespace-nowrap text-slate-600">
                        <span>
                          ${parseFloat(cred.spentTodayUsd || "0").toFixed(2)}
                          {cred.dailyBudgetUsd ? ` / $${cred.dailyBudgetUsd}` : " (unlim.)"}
                        </span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="font-sans text-[10px] text-slate-400">
                          {cred.lastUsedAt
                            ? new Date(cred.lastUsedAt).toLocaleTimeString()
                            : "Never"}
                        </span>
                      </div>
                    </div>

                    {/* Col 4: Non-clipping Responsive Actions */}
                    <div className="flex flex-wrap items-center justify-start gap-1.5 lg:col-span-4 lg:justify-end">
                      {!isCompromised && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setModelTarget(cred);
                            setModelModalOpen(true);
                          }}
                          title="Switch serving model"
                          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/50 px-2.5 text-[11px] font-semibold text-blue-700 shadow-2xs transition-colors hover:bg-blue-100 hover:text-blue-800"
                        >
                          <Cpu className="h-3.5 w-3.5 text-blue-600" />
                          <span>Model</span>
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplaceTarget(cred);
                          setReplaceModalOpen(true);
                        }}
                        title="Rotate / replace key"
                        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                        <span>Replace</span>
                      </Button>

                      {cred.status === "cooling_down" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoadingId === cred.id}
                          onClick={() => handleReactivate(cred.id)}
                          title="Clear rate-limit cooldown"
                          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-xl border border-amber-300 bg-amber-50/80 px-2.5 text-[11px] font-semibold text-amber-800 shadow-2xs transition-colors hover:bg-amber-100 hover:text-amber-900"
                        >
                          <Zap
                            className={`h-3.5 w-3.5 text-amber-600 ${
                              actionLoadingId === cred.id ? "animate-spin" : ""
                            }`}
                          />
                          <span>{actionLoadingId === cred.id ? "Clearing..." : "Clear"}</span>
                        </Button>
                      )}

                      {cred.status === "disabled" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoadingId === cred.id}
                          onClick={() => handleReactivate(cred.id)}
                          title="Re-activate credential"
                          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50/70 px-2.5 text-[11px] font-semibold text-emerald-700 shadow-2xs transition-colors hover:bg-emerald-100 hover:text-emerald-800"
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
                      ) : !isCompromised ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoadingId === cred.id}
                            onClick={() => handleDeactivate(cred.id)}
                            title="Deactivate / pause credential without wiping key"
                            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-xl border border-amber-200 bg-amber-50/60 px-2.5 text-[11px] font-semibold text-amber-800 shadow-2xs transition-colors hover:bg-amber-100 hover:text-amber-900"
                          >
                            <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                            <span>
                              {actionLoadingId === cred.id ? "Pausing..." : "Deactivate"}
                            </span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setKillTarget(cred);
                              setKillDialogOpen(true);
                            }}
                            title="Emergency Kill Switch (requires audit reason)"
                            aria-label={`Kill Switch for ${cred.label}`}
                            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-xl border border-rose-200 bg-rose-50/60 px-2 text-[11px] font-semibold text-rose-700 shadow-2xs transition-colors hover:bg-rose-100 hover:text-rose-800"
                          >
                            <PowerOff className="h-3.5 w-3.5 text-rose-600" />
                          </Button>
                        </>
                      ) : null}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeleteTarget(cred);
                          setDeleteDialogOpen(true);
                        }}
                        title="Permanently delete credential"
                        aria-label={`Delete ${cred.label}`}
                        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-xl border border-rose-200 bg-white px-2.5 text-[11px] font-semibold text-rose-600 shadow-2xs transition-colors hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddCredentialModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        initialCategory={initialAddCategory}
        onSuccess={() => {
          setToastMsg({ type: "success", text: "New credential encrypted and added to Vault." });
          void fetchCredentials(false);
        }}
      />

      <ChangeModelModal
        credential={modelTarget}
        open={modelModalOpen}
        onOpenChange={setModelModalOpen}
        onSuccess={(updatedCred) => {
          setToastMsg({
            type: "success",
            text: `Serving model switched to ${updatedCred.model}.`,
          });
          void fetchCredentials(false);
        }}
      />

      <ReplaceCredentialModal
        credential={replaceTarget}
        open={replaceModalOpen}
        onOpenChange={setReplaceModalOpen}
        onSuccess={() => {
          setToastMsg({
            type: "success",
            text: "Credential rotated successfully. Old ciphertext wiped.",
          });
          void fetchCredentials(false);
        }}
      />

      <KillSwitchDialog
        credential={killTarget}
        open={killDialogOpen}
        onOpenChange={setKillDialogOpen}
        onSuccess={() => {
          setToastMsg({
            type: "success",
            text: "Emergency kill switch activated. Credential halted.",
          });
          void fetchCredentials(false);
        }}
      />

      <DeleteCredentialDialog
        credential={deleteTarget}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={() => {
          setToastMsg({
            type: "success",
            text: "Credential permanently deleted from Vault.",
          });
          void fetchCredentials(false);
        }}
      />
    </div>
  );
}
