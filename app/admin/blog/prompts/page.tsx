"use client";

import React, { useState, useEffect, useCallback, startTransition, useMemo } from "react";
import {
  FileCode,
  Save,
  Sliders,
  Check,
  Layers,
  Terminal,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  PlusCircle,
  Copy,
  Info,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listAdminAiPrompts, updateAdminAiPrompt } from "@/lib/api/admin-ai.api";
import type { PromptTemplateDto } from "@/lib/contracts/admin-ai-prompts.contract";
import {
  DEFAULT_PROMPT_TEMPLATES,
  type DefaultPromptTemplate,
} from "@/lib/constants/ai.constants";

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

const PRESET_MODELS = [
  { id: "gemini-3.0-flash", label: "Gemini 3.0 Flash (Recommended - Fast & Multimodal)" },
  { id: "gemini-3.0-pro", label: "Gemini 3.0 Pro (Advanced Reasoning & Deep Code)" },
  { id: "gemini-3.0-flash-lite", label: "Gemini 3.0 Flash Lite (Cost-Efficient)" },
  { id: "gemini-3.0-ultra", label: "Gemini 3.0 Ultra (Deep Enterprise)" },
  { id: "flux-schnell", label: "Cloudflare FLUX.1-schnell (Image Generation)" },
  { id: "groq-llama3", label: "Groq Llama 3 70B (Ultra Low Latency)" },
];

const QUICK_INSERT_SYSTEM_BLOCKS = [
  {
    title: "+ Architecture Guidelines",
    text: `\n\n### Enterprise Architecture Guidelines:
- Highlight production tradeoffs, failover scenarios, and operational overhead.
- Present clean, modular service boundaries over monolithic functions.`,
  },
  {
    title: "+ Strict TypeScript Rules",
    text: `\n\n### Code Snippet Standards:
- Write idiomatic TypeScript with strict types, explicit return types, and zero loose \`any\`.
- Include realistic error handling, recovery paths, and boundary safety.`,
  },
  {
    title: "+ Executive Editorial Voice",
    text: `\n\n### Audience & Tone:
- Target audience: Principal Architects, Staff Engineers, and Technical Directors.
- Tone: Pragmatic, direct, and authoritative with zero superficial marketing fluff.`,
  },
  {
    title: "+ Strict Output Guard",
    text: `\n\n### Strict Output Constraints:
- Do NOT wrap output with conversational preamble or trailing commentary.
- Return ONLY valid output adhering strictly to the required schema.`,
  },
];

const QUICK_INSERT_USER_BLOCKS = [
  {
    title: "+ Add Focus Directive",
    text: `\nKey Focus Areas: Prioritize enterprise reliability, horizontal scalability, and developer ergonomics.`,
  },
  {
    title: "+ Add Tech Stack Context",
    text: `\nTarget Architecture: Next.js 16 App Router, React 19, TypeScript strict mode, and PostgreSQL.`,
  },
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
  const [showDefaultDiff, setShowDefaultDiff] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);

  // Form state
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPromptTemplate, setUserPromptTemplate] = useState("");
  const [modelPreference, setModelPreference] = useState("gemini-3.0-flash");
  const [temperature, setTemperature] = useState(70);

  // Pristine default for currently selected step
  const currentDefault: DefaultPromptTemplate = useMemo(() => {
    const found = DEFAULT_PROMPT_TEMPLATES.find((d) => d.stepName === selectedStep);
    return (
      found || {
        stepName: selectedStep,
        modelPreference: "gemini-3.0-flash",
        temperature: 70,
        systemPrompt: "",
        userPromptTemplate: "",
      }
    );
  }, [selectedStep]);

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

  // When step changes or templates load, sync editor state
  useEffect(() => {
    const active = templates.find((t) => t.stepName === selectedStep);
    startTransition(() => {
      if (active) {
        setSystemPrompt(active.systemPrompt || currentDefault.systemPrompt);
        setUserPromptTemplate(active.userPromptTemplate || currentDefault.userPromptTemplate);
        const model = active.modelPreference || currentDefault.modelPreference;
        setModelPreference(model);
        setIsCustomModel(!PRESET_MODELS.some((m) => m.id === model));
        setTemperature(active.temperature ?? currentDefault.temperature);
      } else {
        // Fallback to complete default template immediately
        setSystemPrompt(currentDefault.systemPrompt);
        setUserPromptTemplate(currentDefault.userPromptTemplate);
        setModelPreference(currentDefault.modelPreference);
        setIsCustomModel(!PRESET_MODELS.some((m) => m.id === currentDefault.modelPreference));
        setTemperature(currentDefault.temperature);
      }
    });
  }, [selectedStep, templates, currentDefault]);

  // Check if current text differs from default baseline
  const isModifiedFromDefault = useMemo(() => {
    return (
      systemPrompt.trim() !== currentDefault.systemPrompt.trim() ||
      userPromptTemplate.trim() !== currentDefault.userPromptTemplate.trim() ||
      temperature !== currentDefault.temperature
    );
  }, [systemPrompt, userPromptTemplate, temperature, currentDefault]);

  // Check if current text differs from database saved version
  const isDirty = useMemo(() => {
    const active = templates.find((t) => t.stepName === selectedStep);
    if (!active) return isModifiedFromDefault;
    return (
      systemPrompt !== (active.systemPrompt || "") ||
      userPromptTemplate !== (active.userPromptTemplate || "") ||
      temperature !== (active.temperature ?? 70)
    );
  }, [templates, selectedStep, systemPrompt, userPromptTemplate, temperature, isModifiedFromDefault]);

  const handleRestoreDefault = () => {
    startTransition(() => {
      setSystemPrompt(currentDefault.systemPrompt);
      setUserPromptTemplate(currentDefault.userPromptTemplate);
      setModelPreference(currentDefault.modelPreference);
      setIsCustomModel(!PRESET_MODELS.some((m) => m.id === currentDefault.modelPreference));
      setTemperature(currentDefault.temperature);
    });
    showToast(`Restored default baseline for ${selectedStep}`);
  };

  const handleInsertSystemBlock = (blockText: string) => {
    setSystemPrompt((prev) => (prev ? prev + blockText : blockText.trim()));
    showToast("Added custom instructions to template");
  };

  const handleInsertUserBlock = (blockText: string) => {
    setUserPromptTemplate((prev) => (prev ? prev + blockText : blockText.trim()));
    showToast("Added parameters to user template");
  };

  const handleInsertToken = (token: string) => {
    setUserPromptTemplate((prev) => (prev ? `${prev} ${token}` : token));
  };

  const handleModelSelectChange = (value: string) => {
    if (value === "__custom__") {
      setIsCustomModel(true);
    } else {
      setIsCustomModel(false);
      setModelPreference(value);
    }
  };

  const handleSave = async () => {
    const active = templates.find((t) => t.stepName === selectedStep);
    if (!active) {
      showToast("Selected prompt step template not found in database. Reloading...");
      void loadTemplates();
      return;
    }

    try {
      setSaving(true);
      const updated = await updateAdminAiPrompt(active.id, {
        systemPrompt,
        userPromptTemplate,
        modelPreference: selectedStep === "image" ? "flux-schnell" : (active.modelPreference || "vault-dynamic"),
        temperature,
      });

      setTemplates((prev) => prev.map((t) => (t.id === active.id ? updated : t)));
      showToast("Prompt template version updated successfully!");
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

  const activeTemplate = templates.find((t) => t.stepName === selectedStep);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 bottom-6 z-50 flex slide-in-from-bottom items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Prompt Template Studio
            </h1>
            {isModifiedFromDefault ? (
              <Badge variant="warning" className="text-[10px]">
                Customized
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-slate-500">
                Default Baseline
              </Badge>
            )}
            {isDirty && (
              <Badge variant="destructive" dot={true} className="text-[10px]">
                Unsaved Draft
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
            Tune AI pipeline prompts at runtime without code deploys. Partial edits preserve core JSON and model contracts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleRestoreDefault}
            className="rounded-2xl border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            title="Reset this step's editor to the original system default template"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            Restore Default
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDefaultDiff((prev) => !prev)}
            className="rounded-2xl border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            {showDefaultDiff ? (
              <>
                <EyeOff className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                Hide Baseline
              </>
            ) : (
              <>
                <Eye className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                View Baseline
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !activeTemplate}
            className="rounded-2xl bg-blue-600 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving Changes..." : `Save Version ${activeTemplate ? `v${activeTemplate.version + 1}` : ""}`}
          </Button>
        </div>
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
            const stepDef = DEFAULT_PROMPT_TEMPLATES.find((d) => d.stepName === s.key);
            const isCustom = t && stepDef && (t.systemPrompt !== stepDef.systemPrompt || t.userPromptTemplate !== stepDef.userPromptTemplate);

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
                  <div className="flex items-center gap-1">
                    {isCustom && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Customized" />
                    )}
                    {t && (
                      <Badge variant="outline" className="h-4 px-1.5 py-0 text-[10px]">
                        v{t.version}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="line-clamp-1 text-[11px] text-slate-500">{s.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Editor Area */}
        <div className="space-y-6 lg:col-span-3">
          {/* Baseline Reference Drawer (when toggled) */}
          {showDefaultDiff && (
            <Card className="rounded-3xl border border-blue-200 bg-blue-50/40 p-5 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-900">
                    System Default Baseline for Step &ldquo;{selectedStep}&rdquo;
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(currentDefault.systemPrompt);
                    showToast("Copied default system prompt to clipboard");
                  }}
                  className="h-7 text-xs text-blue-600 hover:bg-blue-100"
                >
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  Copy Default
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 text-xs font-mono md:grid-cols-2">
                <div className="rounded-xl border border-blue-100 bg-white p-3">
                  <span className="mb-1 block font-bold text-slate-700">Baseline System Prompt:</span>
                  <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-[11px] text-slate-600">
                    {currentDefault.systemPrompt}
                  </pre>
                </div>
                <div className="rounded-xl border border-blue-100 bg-white p-3">
                  <span className="mb-1 block font-bold text-slate-700">Baseline User Prompt Template:</span>
                  <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-[11px] text-slate-600">
                    {currentDefault.userPromptTemplate}
                  </pre>
                </div>
              </div>
            </Card>
          )}

          <Card className="space-y-6 rounded-3xl border-slate-200/80 bg-white p-6 shadow-sm">
            {/* Model & Temperature Controls */}
            <div className="grid grid-cols-1 gap-4 border-b border-slate-100 pb-4 sm:grid-cols-2">
              <div>
                {selectedStep === "image" ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-purple-200/80 bg-purple-50/50 p-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Image Generation Engine</span>
                        <Badge variant="outline" className="border-purple-300 bg-purple-100/70 text-purple-700 text-[10px] font-semibold">
                          FLUX.1-schnell
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Prompt directs Cloudflare Workers AI FLUX & Pollinations FLUX managed via AI Vault.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-2xl border border-blue-200/80 bg-blue-50/50 p-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Dynamic Vault Routing</span>
                        <Badge variant="success" dot={true} className="text-[10px]">Active Vault Key</Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Inference automatically executes using your active saved Vault provider and model. No manual override needed.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5">
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
                  className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
                />
              </div>
            </div>

            {/* System Prompt Editor with Quick Append Buttons */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="system-prompt-textarea"
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-800"
                >
                  <FileCode className="h-4 w-4 text-purple-600" />
                  System Instructions (Persona, Guardrails & Output Schemas)
                </label>
                <span className="text-[10px] text-slate-400">
                  Enforces persona, voice, and JSON output contracts
                </span>
              </div>

              {/* Partial edit quick-insert helper chips */}
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400">Quick partial additions:</span>
                {QUICK_INSERT_SYSTEM_BLOCKS.map((block) => (
                  <button
                    key={block.title}
                    type="button"
                    onClick={() => handleInsertSystemBlock(block.text)}
                    className="inline-flex items-center rounded-lg border border-purple-200 bg-purple-50/60 px-2 py-0.5 text-[10px] font-semibold text-purple-700 transition-colors hover:bg-purple-100"
                  >
                    <PlusCircle className="mr-1 h-3 w-3 text-purple-600" />
                    {block.title}
                  </button>
                ))}
              </div>

              <textarea
                id="system-prompt-textarea"
                rows={9}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Enter system prompt instructions..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs leading-relaxed focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                  Runtime parameters interpolated via tokens
                </span>
              </div>

              {/* Quick user prompt additions */}
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400">Add partial parameters:</span>
                {QUICK_INSERT_USER_BLOCKS.map((block) => (
                  <button
                    key={block.title}
                    type="button"
                    onClick={() => handleInsertUserBlock(block.text)}
                    className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    <PlusCircle className="mr-1 h-3 w-3 text-indigo-600" />
                    {block.title}
                  </button>
                ))}
              </div>

              <textarea
                id="user-prompt-textarea"
                rows={6}
                value={userPromptTemplate}
                onChange={(e) => setUserPromptTemplate(e.target.value)}
                placeholder="Enter user prompt with {{tokens}}..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs leading-relaxed focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            {/* Variable Tokens Helper */}
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50 p-4">
              <span className="mb-2 block text-[11px] font-bold text-slate-600">
                Available Variable Placeholders for this step (click to insert into template):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {getVariablesForStep(selectedStep).map((tok) => (
                  <button
                    key={tok}
                    type="button"
                    onClick={() => handleInsertToken(tok)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-50"
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
