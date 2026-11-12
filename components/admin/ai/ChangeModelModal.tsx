"use client";

import React, { useState, useMemo } from "react";
import { Cpu, CheckCircle2, AlertCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { updateAdminAiCredentialModel } from "@/lib/api/admin-ai-credentials.api";
import type { CredentialViewDto } from "@/lib/contracts/admin-ai-credentials.contract";
import { PROVIDER_CATALOG } from "@/lib/constants/ai-providers.constants";

interface ChangeModelModalProps {
  credential: CredentialViewDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedCred: CredentialViewDto) => void;
}

interface ChangeModelFormProps {
  credential: CredentialViewDto;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedCred: CredentialViewDto) => void;
}

function ChangeModelForm({
  credential,
  onOpenChange,
  onSuccess,
}: ChangeModelFormProps): React.ReactElement {
  const combinedModels = useMemo(() => {
    const matchedEntries = PROVIDER_CATALOG.filter(
      (p) => p.id.toLowerCase() === credential.provider.toLowerCase(),
    );
    return Array.from(
      new Map(matchedEntries.flatMap((p) => p.models).map((m) => [m.id, m])).values(),
    );
  }, [credential]);

  const currentModel = credential.model || "";
  const existsInCatalog = combinedModels.some((m) => m.id === currentModel);

  const [selectedModel, setSelectedModel] = useState(currentModel);
  const [customModel, setCustomModel] = useState(currentModel);
  const [isCustom, setIsCustom] = useState(!existsInCatalog && Boolean(currentModel));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isCompromised = credential.status === "compromised";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCompromised) {
      setErrorMsg("Cannot change model on a compromised/wiped credential. Replace or delete it.");
      return;
    }

    const finalModel = (isCustom ? customModel : selectedModel).trim();
    if (!finalModel) {
      setErrorMsg("Please specify or select a valid model identifier.");
      return;
    }

    if (finalModel === credential.model) {
      setErrorMsg("The selected model is already active for this credential.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const updated = await updateAdminAiCredentialModel({
        credentialId: credential.id,
        model: finalModel,
      });

      onSuccess(updated);
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update model");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <DialogHeader className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
            <Cpu className="h-5 w-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Change Serving Model
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs leading-relaxed text-slate-500">
          Switch the model routed to this credential without modifying or re-entering your API key.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-500">Provider &amp; Key:</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase">
              {credential.provider}
            </Badge>
            <span className="font-mono text-[11px] font-semibold text-slate-600">
              ••••••••{credential.last4}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-500">Current Model:</span>
          <span className="rounded border border-blue-200/80 bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700">
            {credential.model || "default"}
          </span>
        </div>
      </div>

      {isCompromised && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-medium text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            This key is wiped/compromised. Use Replace to rotate in a new key, or Delete it from the
            vault.
          </span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {combinedModels.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold tracking-wider text-slate-600 uppercase">
            <span>Available Catalog Models</span>
            <span className="text-[10px] font-normal text-slate-400">Click to select</span>
          </div>

          <div className="grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto pr-1">
            {combinedModels.map((m) => {
              const isSelected = !isCustom && selectedModel === m.id;
              const isCurrent = credential.model === m.id;

              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={isCompromised}
                  onClick={() => {
                    setSelectedModel(m.id);
                    setCustomModel(m.id);
                    setIsCustom(false);
                    setErrorMsg(null);
                  }}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/80 font-semibold text-blue-900 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] font-bold">{m.id}</span>
                    <span className="text-[10px] text-slate-500">{m.label}</span>
                  </div>
                  <div className="ml-2 flex shrink-0 items-center gap-1.5">
                    {isCurrent && (
                      <Badge
                        variant="outline"
                        className="border-slate-300 text-[9px] text-slate-500"
                      >
                        Active
                      </Badge>
                    )}
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="custom-model-identifier"
            className="text-xs font-bold tracking-wider text-slate-600 uppercase"
          >
            Custom / Unlisted Model Identifier
          </label>
          <button
            type="button"
            disabled={isCompromised}
            onClick={() => {
              setIsCustom(!isCustom);
              setErrorMsg(null);
            }}
            className="text-[11px] font-semibold text-blue-600 transition-colors hover:text-blue-800 disabled:opacity-50"
          >
            {isCustom ? "Choose from catalog" : "Enter custom model ID"}
          </button>
        </div>

        {isCustom ? (
          <div className="space-y-1">
            <Input
              id="custom-model-identifier"
              value={customModel}
              onChange={(e) => {
                setCustomModel(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="e.g. openai/gpt-oss-120b, @cf/black-forest-labs/flux-2-dev"
              className="h-9 rounded-xl border-slate-200 font-mono text-xs"
              disabled={isCompromised}
            />
            <p className="text-[10px] text-slate-400">
              Exact model slug accepted by {credential.provider}&apos;s API endpoint.
            </p>
          </div>
        ) : (
          <p className="font-mono text-[11px] text-slate-400">
            Selected: <span className="font-bold text-slate-800">{selectedModel || "none"}</span>
          </p>
        )}
      </div>

      <DialogFooter className="gap-2 pt-2 sm:space-x-0">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => onOpenChange(false)}
          className="h-9 rounded-xl border-slate-200 text-xs"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isCompromised || isSubmitting || (!selectedModel && !customModel)}
          className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
        >
          {isSubmitting ? "Applying Model..." : "Apply Model Change"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ChangeModelModal({
  credential,
  open,
  onOpenChange,
  onSuccess,
}: ChangeModelModalProps): React.ReactElement | null {
  if (!credential) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border-slate-200 bg-white p-6 shadow-2xl">
        <ChangeModelForm
          key={`${credential.id}:${credential.model ?? ""}:${open ? "open" : "closed"}`}
          credential={credential}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
