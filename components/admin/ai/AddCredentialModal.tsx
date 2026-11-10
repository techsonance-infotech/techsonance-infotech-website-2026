"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, ShieldCheck, AlertCircle, Edit3, Cpu, Sparkles, Layers } from "lucide-react";
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

export type ProviderCategory = "text" | "image";

interface AddCredentialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newCred: CredentialViewDto) => void;
  initialCategory?: ProviderCategory;
}

export interface ProviderCatalogEntry {
  id: string;
  name: string;
  category: ProviderCategory;
  defaultModel: string;
  models: { id: string; label: string }[];
}

export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  // Text LLM Providers
  {
    id: "groq",
    name: "Groq (LPU Inference)",
    category: "text",
    defaultModel: "openai/gpt-oss-120b",
    models: [
      { id: "openai/gpt-oss-120b", label: "OpenAI GPT-OSS 120B (Active - Ultra Fast)" },
      { id: "openai/gpt-oss-20b", label: "OpenAI GPT-OSS 20B (Groq Hosted)" },
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
      { id: "qwen/qwen3.8-27b", label: "Alibaba Qwen 3.8 27B (Groq Hosted)" },
      { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill Llama 70B" },
      { id: "canopylabs/orpheus-v1-english", label: "Canopy Labs Orpheus v1 (Groq Hosted)" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    category: "text",
    defaultModel: "gemini-3.5-flash-lite",
    models: [
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite (Fast & Active)" },
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Production General)" },
      { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash (Latest Preview)" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Deep Code & Reasoning)" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    category: "text",
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
    category: "text",
    defaultModel: "claude-3-7-sonnet-20250219",
    models: [
      { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet (Hybrid Reasoning)" },
      { id: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku (Sub-second)" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    category: "text",
    defaultModel: "deepseek-chat",
    models: [
      { id: "deepseek-chat", label: "DeepSeek-V3 (deepseek-chat)" },
      { id: "deepseek-reasoner", label: "DeepSeek-R1 (deepseek-reasoner)" },
    ],
  },
  {
    id: "cerebras",
    name: "Cerebras (Ultra-Fast)",
    category: "text",
    defaultModel: "llama-3.3-70b",
    models: [
      { id: "llama-3.3-70b", label: "Llama 3.3 70B" },
      { id: "llama3.1-8b", label: "Llama 3.1 8B" },
    ],
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    category: "text",
    defaultModel: "grok-2-latest",
    models: [
      { id: "grok-2-latest", label: "Grok 2" },
      { id: "grok-2-vision-latest", label: "Grok 2 Vision" },
      { id: "grok-beta", label: "Grok Beta" },
    ],
  },
  {
    id: "mistral",
    name: "Mistral AI",
    category: "text",
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
    category: "text",
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
    name: "Cloudflare Workers AI (LLMs & Text)",
    category: "text",
    defaultModel: "@cf/meta/llama-3.3-70b-instruct",
    models: [
      { id: "@cf/meta/llama-3.3-70b-instruct", label: "Llama 3.3 70B Instruct (Top Intelligence)" },
      { id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", label: "DeepSeek R1 Distill Qwen 32B (Reasoning)" },
      { id: "@cf/meta/llama-3.1-8b-instruct", label: "Llama 3.1 8B Instruct (High Speed)" },
      { id: "@cf/qwen/qwen2.5-72b-instruct", label: "Qwen 2.5 72B Instruct (Deep Analysis)" },
      { id: "@cf/mistral/mistral-7b-instruct-v0.2", label: "Mistral 7B Instruct v0.2" },
    ],
  },
  {
    id: "github",
    name: "GitHub Models (Azure AI)",
    category: "text",
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
      { id: "Phi-4", label: "Microsoft Phi-4" },
    ],
  },

  // Image Generation Providers
  {
    id: "cloudflare",
    name: "Cloudflare Workers AI (FLUX & Diffusion)",
    category: "image",
    defaultModel: "@cf/black-forest-labs/flux-1-schnell",
    models: [
      {
        id: "@cf/black-forest-labs/flux-1-schnell",
        label: "FLUX.1-schnell (12B - Fast & Recommended 16:9)",
      },
      {
        id: "@cf/black-forest-labs/flux-2-klein-9b",
        label: "FLUX.2 klein 9B (Ultra-Fast 4-Step SOTA)",
      },
      {
        id: "@cf/black-forest-labs/flux-2-klein-4b",
        label: "FLUX.2 klein 4B (Distilled Ultra-Low Latency)",
      },
      {
        id: "@cf/black-forest-labs/flux-2-dev",
        label: "FLUX.2 dev (Maximum Photorealism & Detail)",
      },
      {
        id: "@cf/leonardo/lucid-origin",
        label: "Leonardo.ai Lucid Origin (High-HD Graphic Design)",
      },
      {
        id: "@cf/leonardo/phoenix-1.0",
        label: "Leonardo.ai Phoenix 1.0 (Prompt Coherence & Text)",
      },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini & Imagen (Image Generation)",
    category: "image",
    defaultModel: "models/imagen-3.0-generate-002",
    models: [
      { id: "models/imagen-3.0-generate-002", label: "Google Imagen 3 (High-Detail 16:9)" },
      { id: "models/gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image" },
      { id: "models/gemini-3.1-flash-image", label: "Gemini 3.1 Flash Image" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI (DALL-E 3 & ChatGPT)",
    category: "image",
    defaultModel: "dall-e-3",
    models: [
      { id: "dall-e-3", label: "DALL-E 3 (High-Fidelity 1792x1024 16:9)" },
      { id: "dall-e-2", label: "DALL-E 2 (Fast 1024x1024)" },
    ],
  },
  {
    id: "pollinations",
    name: "Pollinations.ai (FLUX / Turbo)",
    category: "image",
    defaultModel: "flux",
    models: [
      { id: "flux", label: "FLUX Model (Image Generation)" },
      { id: "turbo", label: "Turbo (Fast Generation)" },
    ],
  },
  {
    id: "replicate",
    name: "Replicate (FLUX & Diffusion)",
    category: "image",
    defaultModel: "black-forest-labs/flux-schnell",
    models: [
      { id: "black-forest-labs/flux-schnell", label: "FLUX Schnell (Replicate)" },
      { id: "black-forest-labs/flux-dev", label: "FLUX Dev (High Detail)" },
      { id: "stability-ai/sdxl", label: "Stability AI SDXL" },
    ],
  },
  {
    id: "stability",
    name: "Stability AI (Stable Diffusion)",
    category: "image",
    defaultModel: "stable-diffusion-3.5-large",
    models: [
      { id: "stable-diffusion-3.5-large", label: "Stable Diffusion 3.5 Large" },
      { id: "sd3-medium", label: "SD3 Medium" },
      { id: "core", label: "Stable Image Core" },
    ],
  },
  {
    id: "custom",
    name: "Custom / Self-Hosted Provider",
    category: "text",
    defaultModel: "custom-model",
    models: [],
  },
];

export function AddCredentialModal({
  open,
  onOpenChange,
  onSuccess,
  initialCategory = "text",
}: AddCredentialModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory>(initialCategory);
  const [provider, setProvider] = useState("groq");
  const [modelOption, setModelOption] = useState("openai/gpt-oss-120b");
  const [customModelText, setCustomModelText] = useState("");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [cfAccountId, setCfAccountId] = useState("");
  const [cfApiToken, setCfApiToken] = useState("");
  const [dailyBudgetUsd, setDailyBudgetUsd] = useState("10.00");
  const [priority, setPriority] = useState("10");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedCategory(initialCategory);
      const catProviders = PROVIDER_CATALOG.filter((p) => p.category === initialCategory);
      const defaultP = catProviders[0] || PROVIDER_CATALOG[0];
      setProvider(defaultP.id);
      setModelOption(defaultP.defaultModel);
      setCustomModelText(defaultP.defaultModel);
      setLabel("");
      setApiKey("");
      setCfAccountId("");
      setCfApiToken("");
      setErrorMsg(null);
    }
  }, [open, initialCategory]);

  const categoryProviders = PROVIDER_CATALOG.filter(
    (p) => p.category === selectedCategory || p.id === "custom",
  );

  const currentProviderEntry =
    categoryProviders.find((p) => p.id === provider) ||
    categoryProviders[0] ||
    PROVIDER_CATALOG[0];

  const handleCategoryChange = (newCat: ProviderCategory) => {
    setSelectedCategory(newCat);
    const catProviders = PROVIDER_CATALOG.filter((p) => p.category === newCat);
    const firstP = catProviders[0] || PROVIDER_CATALOG[0];
    setProvider(firstP.id);
    setModelOption(firstP.defaultModel);
    setCustomModelText(firstP.defaultModel);
  };

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    const entry =
      categoryProviders.find((p) => p.id === newProvider) ||
      PROVIDER_CATALOG.find((p) => p.id === newProvider) ||
      PROVIDER_CATALOG[0];
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

  const resolvedModel = isCustomModelActive ? customModelText.trim() : modelOption;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isCloudflare = provider === "cloudflare";
    const effectiveApiKey = isCloudflare
      ? `${cfAccountId.trim()}:${cfApiToken.trim()}`
      : apiKey.trim();

    if (!label.trim()) {
      setErrorMsg("Please provide a descriptive credential label.");
      return;
    }

    if (isCloudflare) {
      if (!cfAccountId.trim() || !cfApiToken.trim()) {
        setErrorMsg("Please provide both Cloudflare Account ID and API Token.");
        return;
      }
    } else {
      if (!apiKey.trim()) {
        setErrorMsg("Please provide a valid API key / auth token.");
        return;
      }
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
        apiKey: effectiveApiKey,
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
      <DialogContent className="max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
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
            Keys are encrypted using AES-256-GCM before entering the database. The plaintext key is
            never stored, logged, or returned.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Category Switcher: Text vs Image */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">Engine Category</label>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/60 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => handleCategoryChange("text")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                  selectedCategory === "text"
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Cpu className="h-3.5 w-3.5 text-blue-600" />
                Text Generation (LLMs)
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange("image")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                  selectedCategory === "image"
                    ? "bg-white text-purple-700 shadow-xs border border-purple-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                Image Generation (FLUX)
              </button>
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700">AI Provider</label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {categoryProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selection & Custom Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">Model Identifier</label>
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
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {currentProviderEntry.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} ({m.id})
                  </option>
                ))}
                <option value="__custom__">✏️ Custom / Enter exact model name...</option>
              </select>
            ) : (
              <div className="relative">
                <Input
                  value={customModelText}
                  onChange={(e) => setCustomModelText(e.target.value)}
                  placeholder="e.g. @cf/black-forest-labs/flux-1-schnell or openai/gpt-oss-120b"
                  className="rounded-xl pl-8 font-mono text-xs"
                  required
                />
                <Cpu className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            )}
            <p className="text-[10px] text-slate-400">
              Active model for this key:{" "}
              <span className="font-mono font-semibold text-slate-600">
                {resolvedModel || "None specified"}
              </span>
            </p>
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs font-bold text-slate-700">Credential Label</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={
                selectedCategory === "image"
                  ? `e.g. Cloudflare FLUX Production Token`
                  : `e.g. ${currentProviderEntry.name} Production Primary`
              }
              className="mt-1 rounded-xl text-xs"
              required
            />
          </div>

          {/* API Key / Cloudflare Dual Inputs */}
          {provider === "cloudflare" ? (
            <div className="space-y-3 rounded-2xl border border-blue-200/60 bg-blue-50/50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">Cloudflare Workers AI Credentials</span>
                <span className="text-[10px] font-semibold text-blue-600">AES-256-GCM Vault</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Cloudflare Account ID (32-character Hex)
                </label>
                <Input
                  value={cfAccountId}
                  onChange={(e) => setCfAccountId(e.target.value)}
                  placeholder="e.g. 3a4f89b21c4e70d1891a238f4560b21a"
                  className="mt-1 rounded-xl bg-white font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Cloudflare API Token (Workers AI Read Permission)
                </label>
                <Input
                  type="password"
                  value={cfApiToken}
                  onChange={(e) => setCfApiToken(e.target.value)}
                  placeholder="Bearer token with Workers AI Read access"
                  className="mt-1 rounded-xl bg-white font-mono text-xs"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  API Key / Auth Token (Write-Only)
                </label>
                <span className="text-[10px] font-semibold text-blue-600">AES-256-GCM Sealed</span>
              </div>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste raw key/token here (sk-... / gsk_... / Bearer...)"
                className="mt-1 rounded-xl font-mono text-xs"
                required
              />
            </div>
          )}

          {/* Budget & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">Daily Budget ($USD)</label>
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
