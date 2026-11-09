"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, ShieldCheck, AlertCircle, Edit3, Cpu } from "lucide-react";
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

interface ProviderCatalogEntry {
  id: string;
  name: string;
  defaultModel: string;
  models: { id: string; label: string }[];
}

const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    defaultModel: "gemini-3.0-flash",
    models: [
      { id: "gemini-3.0-flash", label: "Gemini 3.0 Flash (Fast & Capable, Recommended)" },
      { id: "gemini-3.0-pro", label: "Gemini 3.0 Pro (Advanced Reasoning)" },
      { id: "gemini-3.0-flash-lite", label: "Gemini 3.0 Flash Lite (Cost-Efficient)" },
      { id: "gemini-3.0-ultra", label: "Gemini 3.0 Ultra (Deep Enterprise)" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", label: "GPT-4o (Omni Flagship)" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini (Affordable & Fast)" },
      { id: "o3-mini", label: "o3-mini (High-Speed Reasoning)" },
      { id: "o1", label: "o1 (Full Reasoning)" },
      { id: "o1-mini", label: "o1-mini (Reasoning Tier)" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    defaultModel: "claude-3-7-sonnet-20250219",
    models: [
      { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet (Hybrid Reasoning)" },
      { id: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku (Sub-second)" },
    ],
  },
  {
    id: "groq",
    name: "Groq (LPU Inference)",
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
      { id: "openai/gpt-oss-120b", label: "OpenAI GPT-OSS 120B (Groq Hosted)" },
      { id: "openai/gpt-oss-20b", label: "OpenAI GPT-OSS 20B (Groq Hosted)" },
      { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill Llama 70B" },
      { id: "qwen/qwen3.8-27b", label: "Alibaba Qwen 3.8 27B (Groq Hosted)" },
      { id: "qwen-2.5-32b", label: "Qwen 2.5 32B" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
    ],
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    defaultModel: "grok-2-latest",
    models: [
      { id: "grok-2-latest", label: "Grok 2" },
      { id: "grok-2-vision-latest", label: "Grok 2 Vision" },
      { id: "grok-beta", label: "Grok Beta" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    defaultModel: "deepseek-chat",
    models: [
      { id: "deepseek-chat", label: "DeepSeek-V3 (deepseek-chat)" },
      { id: "deepseek-reasoner", label: "DeepSeek-R1 (deepseek-reasoner)" },
    ],
  },
  {
    id: "cerebras",
    name: "Cerebras (Ultra-Fast)",
    defaultModel: "llama-3.3-70b",
    models: [
      { id: "llama-3.3-70b", label: "Llama 3.3 70B" },
      { id: "llama3.1-8b", label: "Llama 3.1 8B" },
    ],
  },
  {
    id: "mistral",
    name: "Mistral AI",
    defaultModel: "mistral-small-latest",
    models: [
      { id: "mistral-small-latest", label: "Mistral Small" },
      { id: "mistral-large-latest", label: "Mistral Large" },
      { id: "codestral-latest", label: "Codestral" },
      { id: "open-mistral-7b", label: "Open Mistral 7B" },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
    models: [
      { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B Free" },
      { id: "deepseek/deepseek-r1:free", label: "DeepSeek R1 Free" },
      { id: "google/gemini-3.0-flash:free", label: "Gemini 3.0 Flash Free" },
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
    ],
  },
  {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    defaultModel: "@cf/meta/llama-3.3-70b-instruct",
    models: [
      { id: "@cf/meta/llama-3.3-70b-instruct", label: "Llama 3.3 70B Instruct" },
      { id: "@cf/meta/llama-3.1-8b-instruct", label: "Llama 3.1 8B Instruct" },
      { id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", label: "DeepSeek R1 Distill Qwen 32B" },
    ],
  },
  {
    id: "github",
    name: "GitHub Models (Azure AI)",
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
      { id: "Phi-4", label: "Microsoft Phi-4" },
    ],
  },
  {
    id: "custom",
    name: "Custom / Self-Hosted Provider",
    defaultModel: "custom-model",
    models: [],
  },
];

export function AddCredentialModal({
  open,
  onOpenChange,
  onSuccess,
}: AddCredentialModalProps) {
  const [provider, setProvider] = useState("gemini");
  const [modelOption, setModelOption] = useState("gemini-3.0-flash");
  const [customModelText, setCustomModelText] = useState("");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [dailyBudgetUsd, setDailyBudgetUsd] = useState("10.00");
  const [priority, setPriority] = useState("10");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentProviderEntry =
    PROVIDER_CATALOG.find((p) => p.id === provider) || PROVIDER_CATALOG[0];

  // When provider changes, sync default model
  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    const entry = PROVIDER_CATALOG.find((p) => p.id === newProvider) || PROVIDER_CATALOG[0];
    if (entry.models.length > 0) {
      setModelOption(entry.defaultModel);
      setCustomModelText(entry.defaultModel);
    } else {
      setModelOption("__custom__");
      setCustomModelText("");
    }
  };

  const isCustomModelActive =
    modelOption === "__custom__" || currentProviderEntry.models.length === 0;

  const resolvedModel = isCustomModelActive
    ? customModelText.trim()
    : modelOption;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !apiKey.trim()) {
      setErrorMsg("Please provide both a label and a valid API key.");
      return;
    }

    if (isCustomModelActive && !customModelText.trim()) {
      setErrorMsg("Please specify the exact model name or select a listed model.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await createAdminAiCredential({
        provider,
        model: resolvedModel || undefined,
        label: label.trim(),
        apiKey: apiKey.trim(),
        dailyBudgetUsd: parseFloat(dailyBudgetUsd) || 0,
        priority: parseInt(priority, 10) || 100,
      });

      // Clear plain key immediately from memory
      setApiKey("");
      setLabel("");
      setCustomModelText("");
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
      <DialogContent className="max-w-lg bg-white p-6 shadow-xl rounded-3xl border border-slate-200">
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
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700">
              AI Provider
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {PROVIDER_CATALOG.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selection & Custom Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Model Identifier
              </label>
              {currentProviderEntry.models.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (modelOption === "__custom__") {
                      setModelOption(currentProviderEntry.defaultModel);
                    } else {
                      setModelOption("__custom__");
                    }
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  <Edit3 className="h-3 w-3" />
                  {isCustomModelActive ? "Choose from catalog" : "Enter manual model name"}
                </button>
              )}
            </div>

            {currentProviderEntry.models.length > 0 && !isCustomModelActive ? (
              <select
                value={modelOption}
                onChange={(e) => {
                  setModelOption(e.target.value);
                  if (e.target.value === "__custom__") {
                    setCustomModelText("");
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {currentProviderEntry.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} ({m.id})
                  </option>
                ))}
                <option value="__custom__">
                  ✏️ Custom / Enter exact model name...
                </option>
              </select>
            ) : (
              <div className="relative">
                <Input
                  value={customModelText}
                  onChange={(e) => setCustomModelText(e.target.value)}
                  placeholder="e.g. gemini-2.5-flash or llama-3.3-70b-specdec"
                  className="rounded-xl font-mono text-xs pl-8"
                  required
                />
                <Cpu className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            )}
            <p className="text-[10px] text-slate-400">
              Active model for this key: <span className="font-mono font-semibold text-slate-600">{resolvedModel || "None specified"}</span>
            </p>
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs font-bold text-slate-700">
              Credential Label
            </label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`e.g. ${currentProviderEntry.name} Production Primary`}
              className="mt-1 rounded-xl text-xs"
              required
            />
          </div>

          {/* API Key */}
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
              placeholder="Paste raw key here (sk-... / gsk_... / AIza...)"
              className="mt-1 rounded-xl font-mono text-xs"
              required
            />
          </div>

          {/* Budget & Priority */}
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
                Priority (Lower = Tried First)
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
