"use client";

import React, { useState } from "react";
import { Trash2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteAdminAiCredential } from "@/lib/api/admin-ai-credentials.api";
import type { CredentialViewDto } from "@/lib/contracts/admin-ai-credentials.contract";

interface DeleteCredentialDialogProps {
  credential: CredentialViewDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (credentialId: string) => void;
}

interface DeleteCredentialBodyProps {
  credential: CredentialViewDto;
  onOpenChange: (open: boolean) => void;
  onSuccess: (credentialId: string) => void;
}

function DeleteCredentialBody({
  credential,
  onOpenChange,
  onSuccess,
}: DeleteCredentialBodyProps): React.ReactElement {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await deleteAdminAiCredential(credential.id);
      onSuccess(credential.id);
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to delete credential");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <DialogTitle className="font-sora text-lg font-bold text-slate-900">
            Delete Credential Permanently
          </DialogTitle>
        </div>
        <DialogDescription className="mt-1 text-xs leading-relaxed text-slate-500">
          Permanently remove{" "}
          <span className="font-semibold text-slate-800">{credential.label}</span> (
          <span className="uppercase">{credential.provider}</span> ••••••••{credential.last4}) from
          the Vault. Historical audit events are preserved without linking to the deleted secret.
        </DialogDescription>
      </DialogHeader>

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <DialogFooter className="gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="rounded-xl text-xs"
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleConfirmDelete}
          className="rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
          disabled={isDeleting}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {isDeleting ? "Deleting..." : "Delete Credential"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function DeleteCredentialDialog({
  credential,
  open,
  onOpenChange,
  onSuccess,
}: DeleteCredentialDialogProps): React.ReactElement | null {
  if (!credential) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-xl">
        <DeleteCredentialBody
          key={`${credential.id}:${open ? "open" : "closed"}`}
          credential={credential}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
