"use client";

import React, { useState, useEffect, useCallback, startTransition } from "react";
import { FileCode, Save, Sliders, Check, Layers, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listAdminAiPrompts, updateAdminAiPrompt } from "@/lib/api/admin-ai.api";
import type { PromptTemplateDto } from "@/lib/contracts/admin-ai-prompts.contract";

const STEPS = [
  {
    key: "outline",
    name: "1. Outline Generator",
    desc: "Generates headings & key technical points",
  },
  {
    key: "section",
    name: "2. Section Writer",
    desc: "Generates code snippets & technical prose",
  },
  {
    key: "meta",
    name: "3. SEO & Metadata",
    desc: "Generates title, slug, excerpt, and image prompt",
  },
  {
    key: "image",
    name: "4. Thumbnail Prompt",
    desc: "FLUX.1 / Pollinations image generation prompt",
  },
  { key: "critic", name: "5. Quality Critic", desc: "Evaluates depth, voice, and quality score" },
];

function getVariablesForStep(step: string) {
  switch (step) {
    case "outline":
      return ["{{topic}}", "{{category}}", "{{targetAudience}}", "{{difficulty}}"];
    case "section":
      return ["{{topic}}", "{{heading}}", "{{keyPoints}}"];
    case "meta":
      return ["{{topic}}", "{{category}}", "{{headings}}"];
    case "image":
      return ["{{topic}}", "{{category}}"];
    case "critic":
      return ["{{title}}", "{{wordCount}}", "{{content}}"];
    default:
      return ["{{topic}}"];
  }
}

export default function PromptsManagementPage() {
  const [templates, setTemplates] = useState<PromptTemplateDto[]>([]);
  const [selectedStep, setSelectedStep] = useState<string>("outline");
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPromptTemplate, setUserPromptTemplate] = useState("");
  const [modelPreference, setModelPreference] = useState("gemini-2.5-flash");
  const [temperature, setTemperature] = useState(70);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await listAdminAiPrompts();
      startTransition(() => {
        setTemplates(data);
      });
    } catch {
      // Non-blocking template load error handling
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void loadTemplates();
    });
  }, [loadTemplates]);

  useEffect(() => {
    const active = templates.find((t) => t.stepName === selectedStep);
    if (active) {
      startTransition(() => {
        setSystemPrompt(active.systemPrompt);
        setUserPromptTemplate(active.userPromptTemplate);
        setModelPreference(active.modelPreference || "gemini-2.5-flash");
        setTemperature(active.temperature ?? 70);
      });
    }
  }, [selectedStep, templates]);

  const handleSave = async () => {
    const active = templates.find((t) => t.stepName === selectedStep);
    if (!active) {
      showToast("Selected prompt step template not found");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateAdminAiPrompt(active.id, {
        systemPrompt,
        userPromptTemplate,
        modelPreference,
        temperature,
      });

      setTemplates((prev) => prev.map((t) => (t.id === active.id ? updated : t)));
      showToast("Prompt template updated successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save template";
      showToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed right-6 bottom-6 z-50 flex slide-in-from-bottom items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Prompt Template Studio
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
            Tune AI pipeline prompts at runtime without code deploys (FD-1 & FD-6).
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl bg-blue-600 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving Changes..." : "Save Prompt Version"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Step Selector Sidebar */}
        <div className="space-y-2 lg:col-span-1">
          <span className="mb-2 block px-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
            Pipeline Steps
          </span>
          {STEPS.map((s) => {
            const isSelected = selectedStep === s.key;
            const t = templates.find((item) => item.stepName === s.key);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSelectedStep(s.key)}
                className={`w-full rounded-2xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? "bg-white border-blue-600 shadow-md shadow-blue-600/5 ring-2 ring-blue-600/10"
                    : "bg-white/60 border-slate-200/80 hover:bg-white text-slate-600"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${isSelected ? "text-blue-600" : "text-slate-800"}`}
                  >
                    {s.name}
                  </span>
                  {t && (
                    <Badge variant="outline" className="h-4 px-1.5 py-0 text-[10px]">
                      v{t.version}
                    </Badge>
                  )}
                </div>
                <p className="line-clamp-1 text-[11px] text-slate-500">{s.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Editor Area */}
        <div className="space-y-6 lg:col-span-3">
          <Card className="space-y-6 rounded-3xl border-slate-200/80 bg-white p-6 shadow-sm">
            {/* Model & Temperature Controls */}
            <div className="grid grid-cols-1 gap-4 border-b border-slate-100 pb-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="model-preference-select"
                  className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700"
                >
                  <Terminal className="h-3.5 w-3.5 text-blue-600" />
                  Target Model Preference
                </label>
                <select
                  id="model-preference-select"
                  value={modelPreference}
                  onChange={(e) => setModelPreference(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium"
                >
                  <option value="gemini-2.5-flash">
                    Gemini 2.5 Flash (Recommended - Fast & Free)
                  </option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
                  <option value="flux-schnell">Cloudflare FLUX.1-schnell (Image)</option>
                  <option value="groq-llama3">Groq Llama 3 70B (Ultra Low Latency)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="temperature-range"
                  className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-blue-600" />
                    Temperature: {(temperature / 100).toFixed(2)}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {temperature < 40
                      ? "Deterministic"
                      : temperature > 75
                        ? "Creative"
                        : "Balanced"}
                  </span>
                </label>
                <input
                  id="temperature-range"
                  type="range"
                  min="0"
                  max="100"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-blue-600"
                />
              </div>
            </div>

            {/* System Prompt Editor */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="system-prompt-textarea"
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-800"
                >
                  <FileCode className="h-4 w-4 text-purple-600" />
                  System Instructions (Persona & Guardrails)
                </label>
                <span className="text-[10px] text-slate-400">
                  Enforces voice, style, and output format
                </span>
              </div>
              <textarea
                id="system-prompt-textarea"
                rows={6}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Enter system prompt instructions..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* User Prompt Template Editor */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="user-prompt-textarea"
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-800"
                >
                  <Layers className="h-4 w-4 text-indigo-600" />
                  User Prompt Template
                </label>
                <span className="text-[10px] text-slate-400">
                  Interpolates step parameters at runtime
                </span>
              </div>
              <textarea
                id="user-prompt-textarea"
                rows={5}
                value={userPromptTemplate}
                onChange={(e) => setUserPromptTemplate(e.target.value)}
                placeholder="Enter user prompt with {{tokens}}..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Variable Tokens Helper */}
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50 p-4">
              <span className="mb-2 block text-[11px] font-bold text-slate-600">
                Available Variable Placeholders for this step:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {getVariablesForStep(selectedStep).map((tok) => (
                  <button
                    key={tok}
                    type="button"
                    onClick={() => setUserPromptTemplate((prev) => prev + ` ${tok}`)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-blue-600 hover:border-blue-400"
                  >
                    {tok}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
