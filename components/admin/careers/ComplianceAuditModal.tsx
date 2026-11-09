"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Download,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  exportCandidateCompliance,
  purgeCandidateCompliance,
} from "@/lib/api/admin-applications.api";
import type { CandidateComplianceExportResponse } from "@/lib/contracts/admin-careers-compliance.contract";

interface ComplianceAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onPurgeSuccess?: () => void;
}

export function ComplianceAuditModal({
  isOpen,
  onClose,
  initialEmail = "",
  onPurgeSuccess,
}: ComplianceAuditModalProps) {
  const [activeTab, setActiveTab] = useState<"export" | "purge">("export");
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [exportData, setExportData] = useState<CandidateComplianceExportResponse | null>(null);

  if (!isOpen) return null;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setResultMessage(null);
    setExportData(null);

    try {
      const data = await exportCandidateCompliance(email.trim());
      setExportData(data);
      setResultMessage(`Compliance record retrieved for ${email.trim()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to export compliance data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePurge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const confirmed = window.confirm(
      `WARNING: Are you sure you want to permanently erase ALL data, resumes, and records for candidate ${email.trim()}? This action is IRREVERSIBLE under GDPR/EEOC compliance mandates.`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setResultMessage(null);
    setExportData(null);

    try {
      const res = await purgeCandidateCompliance(email.trim());
      setResultMessage(
        `Candidate successfully purged: ${res.deletedApplicationsCount} applications, ${res.deletedTalentPoolCount} talent entries, and ${res.deletedFilesCount} files removed.`,
      );
      onPurgeSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to execute compliance purge";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs duration-200 animate-in fade-in"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compliance-modal-title"
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#1155CC] dark:bg-blue-950/60 dark:text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="compliance-modal-title"
                className="font-sora text-base font-bold text-slate-900 dark:text-white"
              >
                GDPR & Privacy Compliance
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Candidate data export and right-to-be-forgotten audits
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab("export");
              setError(null);
              setResultMessage(null);
            }}
            className={`flex-1 cursor-pointer rounded-xl py-1.5 text-xs font-bold transition-all ${
              activeTab === "export"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Export Subject Data
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("purge");
              setError(null);
              setResultMessage(null);
            }}
            className={`flex-1 cursor-pointer rounded-xl py-1.5 text-xs font-bold transition-all ${
              activeTab === "purge"
                ? "bg-white dark:bg-slate-900 text-rose-600 shadow-xs"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Purge Data (Forget)
          </button>
        </div>

        {/* Alert Notifications */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-600 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resultMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{resultMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={activeTab === "export" ? handleExport : handlePurge} className="space-y-4">
          <div>
            <label
              htmlFor="compliance-email"
              className="mb-1.5 block text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
            >
              Candidate Email Address
            </label>
            <Input
              id="compliance-email"
              type="email"
              required
              placeholder="candidate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-xl text-xs"
            />
          </div>

          {activeTab === "purge" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              <strong>GDPR Article 17 Notice:</strong> Purging candidate data deletes all job
              applications, talent pool records, candidate resumes from storage, and communication
              history irrevocably.
            </div>
          )}

          {exportData !== null && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] dark:border-slate-700 dark:bg-slate-800/60">
              <pre>{JSON.stringify(exportData, null, 2)}</pre>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs"
            >
              Close
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !email.trim()}
              className={`gap-1.5 rounded-xl text-xs font-bold ${
                activeTab === "purge"
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-[#1155CC] hover:bg-blue-700 text-white"
              }`}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : activeTab === "purge" ? (
                <Trash2 className="h-3.5 w-3.5" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {activeTab === "purge" ? "Purge Candidate Records" : "Export Candidate Bundle"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
