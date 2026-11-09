"use client";

import React, { useState, useEffect } from "react";
import { Cpu, CheckCircle2, AlertCircle, Sparkles, Layers } from "lucide-react";
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
import { PROVIDER_CATALOG } from "@/components/admin/ai/AddCredentialModal";

interface ChangeModelModalProps {
  credential: CredentialViewDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedCred: CredentialViewDto) => void;
}

export function ChangeModelModal({
  credential,
  open,
  onOpenChange,
  onSuccess,
}: ChangeModelModalProps) {
  const [selectedModel, setSelectedModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Match provider catalog to suggest supported models
  const providerEntry = credential
    ? PROVIDER_CATALOG.find(
        (p) => p.id.toLowerCase() === credential.provider.toLowerCase(),
      )
    : null;

  useEffect(() => {
    if (credential) {
      const current = credential.model || "";
      setSelectedModel(current);
      setCustomModel(current);
      setErrorMsg(null);

      // Check if current model exists in catalog
      const existsInCatalog = providerEntry?.models.some((m) => m.id === current);
      setIsCustom(!existsInCatalog && !!current);
    }
  }, [credential, providerEntry]);

  if (!credential) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border-slate-200 bg-white p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                <Cpu className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Change Serving Model
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Switch the model routed to this credential without modifying or re-entering your API key.
              Use this when older models are deprecated, out of service, or when upgraded models are deployed.
            </DialogDescription>
          </DialogHeader>

          {/* Current Credential Info Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Provider & Key:</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-bold uppercase tracking-wider text-[10px]">
                  {credential.provider}
                </Badge>
                <span className="font-mono text-slate-600 font-semibold text-[11px]">
                  ••••••••{credential.last4}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Current Model:</span>
              <span className="font-mono text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded text-[11px] font-bold">
                {credential.model || "default"}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Catalog Preset Models */}
          {providerEntry && providerEntry.models.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span>Available Catalog Models</span>
                <span className="text-[10px] font-normal text-slate-400">Click to select</span>
              </label>

              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {providerEntry.models.map((m) => {
                  const isSelected = !isCustom && selectedModel === m.id;
                  const isCurrent = credential.model === m.id;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m.id);
                        setCustomModel(m.id);
                        setIsCustom(false);
                      }}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/80 font-semibold text-blue-900 shadow-2xs"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-[11px] font-bold">{m.id}</span>
                        <span className="text-[10px] text-slate-500">{m.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isCurrent && (
                          <Badge variant="outline" className="text-[9px] border-slate-300 text-slate-500">
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

          {/* Custom Model Input */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Custom / Unlisted Model Identifier
              </label>
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                {isCustom ? "Choose from catalog" : "Enter custom model ID"}
              </button>
            </div>

            {isCustom ? (
              <div className="space-y-1">
                <Input
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="e.g. llama-3.3-70b-versatile, qwen/qwen3.8-27b"
                  className="font-mono text-xs h-9 rounded-xl border-slate-200"
                  autoFocus
                />
                <p className="text-[10px] text-slate-400">
                  Exact model slug accepted by {credential.provider}&apos;s API endpoint.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 font-mono">
                Selected: <span className="text-slate-800 font-bold">{selectedModel || "none"}</span>
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
              disabled={isSubmitting || (!selectedModel && !customModel)}
              className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              {isSubmitting ? "Updating Model..." : "Apply Model Change"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
