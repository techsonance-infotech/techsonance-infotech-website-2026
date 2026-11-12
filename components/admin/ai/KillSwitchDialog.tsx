"use client";

import React, { useState } from "react";
import { OctagonAlert, AlertCircle } from "lucide-react";
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
import { killSwitchAdminAiCredential } from "@/lib/api/admin-ai-credentials.api";
import type { CredentialViewDto } from "@/lib/contracts/admin-ai-credentials.contract";

interface KillSwitchDialogProps {
  credential: CredentialViewDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (credentialId: string) => void;
}

interface KillSwitchFormProps {
  credential: CredentialViewDto;
  onOpenChange: (open: boolean) => void;
  onSuccess: (credentialId: string) => void;
}

function KillSwitchForm({
  credential,
  onOpenChange,
  onSuccess,
}: KillSwitchFormProps): React.ReactElement {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg("A justification reason is required to activate the kill switch.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await killSwitchAdminAiCredential({
        credentialId: credential.id,
        reason: reason.trim(),
      });

      onSuccess(credential.id);
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to activate kill switch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <OctagonAlert className="h-5 w-5" />
          </div>
          <DialogTitle className="font-sora text-lg font-bold text-red-950">
            Activate Key Kill Switch
          </DialogTitle>
        </div>
        <DialogDescription className="mt-1 text-xs text-slate-500">
          Emergency shutdown for{" "}
          <span className="font-semibold text-slate-700">{credential.label}</span> (...
          {credential.last4}). The router will immediately stop sending requests to this credential
          and fail over to other keys.
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

      <form onSubmit={handleActivate} className="space-y-4 pt-2">
        <div>
          <label
            htmlFor="kill-switch-reason"
            className="block text-xs font-bold text-slate-700"
          >
            Mandatory Kill Justification
          </label>
          <Input
            id="kill-switch-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Unexplained spike in token spend, rogue key usage detected"
            className="mt-1 rounded-xl text-xs"
            required
          />
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
            className="rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Halting Key..." : "Activate Emergency Kill"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function KillSwitchDialog({
  credential,
  open,
  onOpenChange,
  onSuccess,
}: KillSwitchDialogProps): React.ReactElement | null {
  if (!credential) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-xl">
        <KillSwitchForm
          key={`${credential.id}:${open ? "open" : "closed"}`}
          credential={credential}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
