"use client";

import React, { useState } from "react";
import { KeyRound, ShieldCheck, AlertCircle } from "lucide-react";
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
import { createAdminAiCredential } from "@/lib/api/admin-ai-credentials.api";
import type { CredentialViewDto } from "@/lib/contracts/admin-ai-credentials.contract";

interface AddCredentialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newCred: CredentialViewDto) => void;
}

const PROVIDER_OPTIONS = [
  { id: "groq", label: "Groq (Llama 3.3 70B)" },
  { id: "gemini", label: "Google Gemini (2.5 Flash)" },
  { id: "cerebras", label: "Cerebras (Llama 3.3 70B)" },
  { id: "openrouter", label: "OpenRouter Free Tier" },
  { id: "mistral", label: "Mistral AI" },
  { id: "cloudflare", label: "Cloudflare Workers AI" },
  { id: "github", label: "GitHub Models (Azure AI)" },
];

export function AddCredentialModal({
  open,
  onOpenChange,
  onSuccess,
}: AddCredentialModalProps) {
  const [provider, setProvider] = useState("groq");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [dailyBudgetUsd, setDailyBudgetUsd] = useState("10.00");
  const [priority, setPriority] = useState("10");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !apiKey.trim()) {
      setErrorMsg("Please provide both a label and a valid API key.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await createAdminAiCredential({
        provider,
        label: label.trim(),
        apiKey: apiKey.trim(),
        dailyBudgetUsd: parseFloat(dailyBudgetUsd) || 0,
        priority: parseInt(priority, 10) || 100,
      });

      // Clear plain key immediately from memory
      setApiKey("");
      setLabel("");
      onSuccess(created);
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to register key");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white p-6 shadow-xl rounded-3xl border border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <KeyRound className="h-5 w-5" />
            </div>
            <DialogTitle className="font-sora text-lg font-bold text-slate-900">
              Add Encrypted AI Credential
            </DialogTitle>
          </div>
          <DialogDescription className="mt-1 text-xs text-slate-500">
            Keys are encrypted using AES-256-GCM before entering the database. The
            plaintext key is never stored, logged, or returned.
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
              AI Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {PROVIDER_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              Credential Label
            </label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Production Primary Groq Key"
              className="mt-1 rounded-xl text-xs"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                API Key (Write-Only)
              </label>
              <span className="text-[10px] font-semibold text-blue-600">
                AES-256-GCM Sealed
              </span>
            </div>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-... or gsk_..."
              className="mt-1 rounded-xl font-mono text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Daily Budget ($USD)
              </label>
              <Input
                type="number"
                step="0.01"
                value={dailyBudgetUsd}
                onChange={(e) => setDailyBudgetUsd(e.target.value)}
                className="mt-1 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Priority (Lower = First)
              </label>
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 rounded-xl text-xs"
              />
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
              className="rounded-xl bg-blue-600 text-xs font-bold hover:bg-blue-700"
              disabled={isSubmitting}
            >
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              {isSubmitting ? "Encrypting & Storing..." : "Seal & Register Key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
