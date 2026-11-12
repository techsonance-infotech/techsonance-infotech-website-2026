"use client";

import React, { useState } from "react";
import { RefreshCw, ShieldAlert, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { replaceAdminAiCredential } from "@/lib/api/admin-ai-credentials.api";
import type { CredentialViewDto } from "@/lib/contracts/admin-ai-credentials.contract";

interface ReplaceCredentialModalProps {
  credential: CredentialViewDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedCred: CredentialViewDto) => void;
}

interface ReplaceFormProps {
  credential: CredentialViewDto;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedCred: CredentialViewDto) => void;
}

function ReplaceCredentialForm({
  credential,
  onOpenChange,
  onSuccess,
}: ReplaceFormProps): React.ReactElement {
  const [newApiKey, setNewApiKey] = useState("");
  const [cfAccountId, setCfAccountId] = useState("");
  const [cfApiToken, setCfApiToken] = useState("");
  const [reason, setReason] = useState("Routine credential rotation");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isCloudflare = credential.provider.toLowerCase() === "cloudflare";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveKey = isCloudflare
      ? `${cfAccountId.trim()}:${cfApiToken.trim()}`
      : newApiKey.trim();

    if (isCloudflare) {
      if (!cfAccountId.trim() || !cfApiToken.trim()) {
        setErrorMsg("Please provide both Cloudflare Account ID and Workers AI API Token.");
        return;
      }
    } else if (!newApiKey.trim()) {
      setErrorMsg("Please provide a new replacement API key.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const updated = await replaceAdminAiCredential({
        credentialId: credential.id,
        newApiKey: effectiveKey,
        reason: reason.trim() || undefined,
      });

      onSuccess(updated);
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to replace key");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <RefreshCw className="h-5 w-5" />
          </div>
          <DialogTitle className="font-sora text-lg font-bold text-slate-900">
            Replace Credential (Zero Downtime)
          </DialogTitle>
        </div>
        <DialogDescription className="mt-1 text-xs text-slate-500">
          Replaces <span className="font-semibold text-slate-700">{credential.label}</span> (...
          {credential.last4}). Traffic seamlessly shifts to the new key, and the old key&apos;s
          ciphertext is permanently wiped.
        </DialogDescription>
      </DialogHeader>

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {isCloudflare ? (
          <div className="space-y-3 rounded-2xl border border-blue-200/60 bg-blue-50/50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">
                Cloudflare Workers AI Credentials
              </span>
              <span className="text-[10px] font-semibold text-blue-600">AES-256-GCM Vault</span>
            </div>

            <div>
              <label
                htmlFor="replace-cf-account-id"
                className="block text-[11px] font-bold text-slate-700"
              >
                Cloudflare Account ID (32-character Hex)
              </label>
              <Input
                id="replace-cf-account-id"
                value={cfAccountId}
                onChange={(e) => setCfAccountId(e.target.value)}
                placeholder="e.g. 3a4f89b21c4e70d1891a238f4560b21a"
                className="mt-1 rounded-xl bg-white font-mono text-xs"
                required
              />
            </div>

            <div>
              <label
                htmlFor="replace-cf-api-token"
                className="block text-[11px] font-bold text-slate-700"
              >
                New Cloudflare API Token (Workers AI Read/Edit)
              </label>
              <Input
                id="replace-cf-api-token"
                type="password"
                value={cfApiToken}
                onChange={(e) => setCfApiToken(e.target.value)}
                placeholder="40-char Workers AI API Token (NOT R2 Secret)"
                className="mt-1 rounded-xl bg-white font-mono text-xs"
                required
              />
            </div>
          </div>
        ) : (
          <div>
            <label
              htmlFor="replace-api-key"
              className="block text-xs font-bold text-slate-700"
            >
              New Replacement API Key (Write-Only)
            </label>
            <Input
              id="replace-api-key"
              type="password"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="Paste new replacement key here..."
              className="mt-1 rounded-xl font-mono text-xs"
              required
            />
          </div>
        )}

        <div>
          <label
            htmlFor="replace-reason"
            className="block text-xs font-bold text-slate-700"
          >
            Rotation Justification / Audit Reason
          </label>
          <Input
            id="replace-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Suspected leak, routine quarterly rotation"
            className="mt-1 rounded-xl text-xs"
            required
          />
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[11px] leading-relaxed">
              You can safely delete the old wiped row afterward to keep your vault clean.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="rounded-xl bg-amber-600 text-xs font-bold text-white hover:bg-amber-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Rotating..." : "Rotate & Wipe Old Ciphertext"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function ReplaceCredentialModal({
  credential,
  open,
  onOpenChange,
  onSuccess,
}: ReplaceCredentialModalProps): React.ReactElement | null {
  if (!credential) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <ReplaceCredentialForm
          key={`${credential.id}:${open ? "open" : "closed"}`}
          credential={credential}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
