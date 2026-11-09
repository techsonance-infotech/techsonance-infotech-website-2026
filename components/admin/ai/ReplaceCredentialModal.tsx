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

export function ReplaceCredentialModal({
  credential,
  open,
  onOpenChange,
  onSuccess,
}: ReplaceCredentialModalProps) {
  const [newApiKey, setNewApiKey] = useState("");
  const [reason, setReason] = useState("Routine credential rotation");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!credential) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiKey.trim()) {
      setErrorMsg("Please provide a new replacement API key.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const updated = await replaceAdminAiCredential({
        credentialId: credential.id,
        newApiKey: newApiKey.trim(),
        reason: reason.trim(),
      });

      setNewApiKey("");
      onSuccess(updated);
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to replace key");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
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
            {credential.last4}). Traffic seamlessly shifts to the new key, and the old key's
            ciphertext is permanently wiped.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700">
              New Replacement API Key (Write-Only)
            </label>
            <Input
              type="password"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="Paste new replacement key here..."
              className="mt-1 rounded-xl font-mono text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              Rotation Justification / Audit Reason
            </label>
            <Input
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
                Remember to revoke the old key in the provider console once this rotation finishes.
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
      </DialogContent>
    </Dialog>
  );
}
