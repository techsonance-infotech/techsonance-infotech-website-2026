"use client";

import React, { useState } from "react";
import { KeyRound, ShieldCheck, AlertCircle, Edit3, Cpu, Sparkles } from "lucide-react";
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
import {
  PROVIDER_CATALOG,
  type ProviderCategory,
} from "@/lib/constants/ai-providers.constants";

interface AddCredentialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newCred: CredentialViewDto) => void;
  initialCategory?: ProviderCategory;
}

interface AddCredentialFormProps {
  initialCategory: ProviderCategory;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newCred: CredentialViewDto) => void;
}

function AddCredentialForm({
  initialCategory,
  onOpenChange,
  onSuccess,
}: AddCredentialFormProps): React.ReactElement {
  const initialEntry =
    PROVIDER_CATALOG.find((p) => p.category === initialCategory) || PROVIDER_CATALOG[0];

  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory>(initialCategory);
  const [provider, setProvider] = useState(initialEntry.id);
  const [modelOption, setModelOption] = useState(initialEntry.defaultModel);
  const [customModelText, setCustomModelText] = useState(initialEntry.defaultModel);
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [cfAccountId, setCfAccountId] = useState("");
  const [cfApiToken, setCfApiToken] = useState("");
  const [dailyBudgetUsd, setDailyBudgetUsd] = useState("10.00");
  const [priority, setPriority] = useState("10");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const categoryProviders = PROVIDER_CATALOG.filter(
    (p) => p.category === selectedCategory || p.id === "custom",
  );

  const currentProviderEntry =
    categoryProviders.find((p) => p.id === provider) ||
    categoryProviders[0] ||
    PROVIDER_CATALOG[0];

  const handleCategoryChange = (newCat: ProviderCategory) => {
    setSelectedCategory(newCat);
    const firstP = PROVIDER_CATALOG.find((p) => p.category === newCat) || PROVIDER_CATALOG[0];
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
    const sanitizedCfAccountId = isCloudflare ? cfAccountId.trim().toLowerCase() : "";
    const sanitizedCfApiToken = isCloudflare ? cfApiToken.trim() : "";
    const effectiveApiKey = isCloudflare
      ? `${sanitizedCfAccountId}:${sanitizedCfApiToken}`
      : apiKey.trim();

    if (!label.trim()) {
      setErrorMsg("Please provide a descriptive credential label.");
      return;
    }

    if (isCloudflare) {
      if (!sanitizedCfAccountId || !sanitizedCfApiToken) {
        setErrorMsg("Please provide both Cloudflare Account ID and API Token.");
        return;
      }
      if (!/^[0-9a-f]{32}$/.test(sanitizedCfAccountId)) {
        setErrorMsg(
          "Cloudflare Account ID must be a 32-character hexadecimal string (0-9, a-f). Found invalid character(s) or incorrect length.",
        );
        return;
      }
    } else if (!apiKey.trim()) {
      setErrorMsg("Please provide a valid API key / auth token.");
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
        apiKey: effectiveApiKey,
        dailyBudgetUsd: parseFloat(dailyBudgetUsd) || 0,
        priority: parseInt(priority, 10) || 100,
      });

      onSuccess(created);
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to register key");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div>
          <span className="mb-1.5 block text-xs font-bold text-slate-700">Engine Category</span>
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/60 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleCategoryChange("text")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                selectedCategory === "text"
                  ? "border border-slate-200/60 bg-white text-blue-700 shadow-xs"
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
                  ? "border border-purple-200/60 bg-white text-purple-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              Image Generation (FLUX)
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="add-cred-provider" className="block text-xs font-bold text-slate-700">
            AI Provider
          </label>
          <select
            id="add-cred-provider"
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="add-cred-model" className="block text-xs font-bold text-slate-700">
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
              id="add-cred-model"
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
              <option value="__custom__">Custom / Enter exact model name...</option>
            </select>
          ) : (
            <div className="relative">
              <Input
                id="add-cred-model"
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

        <div>
          <label htmlFor="add-cred-label" className="block text-xs font-bold text-slate-700">
            Credential Label
          </label>
          <Input
            id="add-cred-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={
              selectedCategory === "image"
                ? "e.g. Cloudflare FLUX Production Token"
                : `e.g. ${currentProviderEntry.name} Production Primary`
            }
            className="mt-1 rounded-xl text-xs"
            required
          />
        </div>

        {provider === "cloudflare" ? (
          <div className="space-y-3 rounded-2xl border border-blue-200/60 bg-blue-50/50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">
                Cloudflare Workers AI Credentials
              </span>
              <span className="text-[10px] font-semibold text-blue-600">AES-256-GCM Vault</span>
            </div>

            <div>
              <label
                htmlFor="add-cf-account-id"
                className="block text-[11px] font-bold text-slate-700"
              >
                Cloudflare Account ID (32-character Hex)
              </label>
              <Input
                id="add-cf-account-id"
                value={cfAccountId}
                onChange={(e) => setCfAccountId(e.target.value)}
                placeholder="e.g. 3a4f89b21c4e70d1891a238f4560b21a"
                className="mt-1 rounded-xl bg-white font-mono text-xs"
                required
              />
            </div>

            <div>
              <label
                htmlFor="add-cf-api-token"
                className="block text-[11px] font-bold text-slate-700"
              >
                Cloudflare API Token (Workers AI Read/Edit Permission)
              </label>
              <Input
                id="add-cf-api-token"
                type="password"
                value={cfApiToken}
                onChange={(e) => setCfApiToken(e.target.value)}
                placeholder="40-char Workers AI API Token (NOT R2 Secret or Global Key)"
                className="mt-1 rounded-xl bg-white font-mono text-xs"
                required
              />
              <p className="mt-1 text-[10px] text-blue-700/80">
                Create under Cloudflare Profile &rarr; API Tokens &rarr; Workers AI template.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="add-cred-api-key" className="block text-xs font-bold text-slate-700">
                API Key / Auth Token (Write-Only)
              </label>
              <span className="text-[10px] font-semibold text-blue-600">AES-256-GCM Sealed</span>
            </div>
            <Input
              id="add-cred-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste raw key/token here (sk-... / gsk_... / Bearer...)"
              className="mt-1 rounded-xl font-mono text-xs"
              required
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="add-cred-budget" className="block text-xs font-bold text-slate-700">
              Daily Budget ($USD)
            </label>
            <Input
              id="add-cred-budget"
              type="number"
              step="0.01"
              value={dailyBudgetUsd}
              onChange={(e) => setDailyBudgetUsd(e.target.value)}
              className="mt-1 rounded-xl text-xs"
            />
          </div>
          <div>
            <label htmlFor="add-cred-priority" className="block text-xs font-bold text-slate-700">
              Priority (Lower = Tried First)
            </label>
            <Input
              id="add-cred-priority"
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
    </>
  );
}

export function AddCredentialModal({
  open,
  onOpenChange,
  onSuccess,
  initialCategory = "text",
}: AddCredentialModalProps): React.ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <AddCredentialForm
          key={`${initialCategory}:${open ? "open" : "closed"}`}
          initialCategory={initialCategory}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
