"use client";

import React, { useState, useEffect } from "react";
import {
  FileCode,
  Save,
  Sparkles,
  Sliders,
  Check,
  RefreshCw,
  Info,
  Layers,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface PromptTemplate {
  id: string;
  stepName: string;
  version: number;
  systemPrompt: string;
  userPromptTemplate: string;
  modelPreference: string;
  temperature: number;
}

export default function PromptsManagementPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState<string>("outline");
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPromptTemplate, setUserPromptTemplate] = useState("");
  const [modelPreference, setModelPreference] = useState("gemini-2.5-flash");
  const [temperature, setTemperature] = useState(70);

  const steps = [
    { key: "outline", name: "1. Outline Generator", desc: "Generates headings & key technical points" },
    { key: "section", name: "2. Section Writer", desc: "Generates code snippets & technical prose" },
    { key: "meta", name: "3. SEO & Metadata", desc: "Generates title, slug, excerpt, and image prompt" },
    { key: "image", name: "4. Thumbnail Prompt", desc: "FLUX.1 / Pollinations image generation prompt" },
    { key: "critic", name: "5. Quality Critic", desc: "Evaluates depth, voice, and quality score" },
  ];

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/ai/prompts");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    const active = templates.find((t) => t.stepName === selectedStep);
    if (active) {
      setSystemPrompt(active.systemPrompt);
      setUserPromptTemplate(active.userPromptTemplate);
      setModelPreference(active.modelPreference || "gemini-2.5-flash");
      setTemperature(active.temperature ?? 70);
    }
  }, [selectedStep, templates]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/ai/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepName: selectedStep,
          systemPrompt,
          userPromptTemplate,
          modelPreference,
          temperature,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTemplates((prev) =>
          prev.map((t) => (t.stepName === selectedStep ? data.template : t))
        );
        showToast("Prompt template updated successfully!");
      } else {
        showToast("Failed to save template");
      }
    } catch {
      showToast("Network error saving prompt");
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getVariablesForStep = (step: string) => {
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
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sora">
            Prompt Template Studio
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            Tune AI pipeline prompts at runtime without code deploys (FD-1 & FD-6).
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-lg shadow-blue-500/20"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving Changes..." : "Save Prompt Version"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Step Selector Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
            Pipeline Steps
          </label>
          {steps.map((s) => {
            const isSelected = selectedStep === s.key;
            const t = templates.find((item) => item.stepName === s.key);
            return (
              <button
                key={s.key}
                onClick={() => setSelectedStep(s.key)}
                className={`w-full text-left p-3.5 rounded-2xl transition-all border ${
                  isSelected
                    ? "bg-white border-blue-600 shadow-md shadow-blue-600/5 ring-2 ring-blue-600/10"
                    : "bg-white/60 border-slate-200/80 hover:bg-white text-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isSelected ? "text-blue-600" : "text-slate-800"}`}>
                    {s.name}
                  </span>
                  {t && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      v{t.version}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{s.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white p-6 space-y-6">
            {/* Model & Temperature Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-600" />
                  Target Model Preference
                </label>
                <select
                  value={modelPreference}
                  onChange={(e) => setModelPreference(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 text-xs px-3 bg-white font-medium"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Fast & Free)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
                  <option value="flux-schnell">Cloudflare FLUX.1-schnell (Image)</option>
                  <option value="groq-llama3">Groq Llama 3 70B (Ultra Low Latency)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    Temperature: {(temperature / 100).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {temperature < 40 ? "Deterministic" : temperature > 75 ? "Creative" : "Balanced"}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                />
              </div>
            </div>

            {/* System Prompt Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-purple-600" />
                  System Instructions (Persona & Guardrails)
                </label>
                <span className="text-[10px] text-slate-400">Enforces voice, style, and output format</span>
              </div>
              <textarea
                rows={6}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Enter system prompt instructions..."
                className="w-full text-xs font-mono p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            {/* User Prompt Template Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  User Prompt Template
                </label>
                <span className="text-[10px] text-slate-400">Interpolates step parameters at runtime</span>
              </div>
              <textarea
                rows={5}
                value={userPromptTemplate}
                onChange={(e) => setUserPromptTemplate(e.target.value)}
                placeholder="Enter user prompt with {{tokens}}..."
                className="w-full text-xs font-mono p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            {/* Variable Tokens Helper */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-600 block mb-2">
                Available Variable Placeholders for this step:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {getVariablesForStep(selectedStep).map((tok) => (
                  <button
                    key={tok}
                    type="button"
                    onClick={() => setUserPromptTemplate((prev) => prev + ` ${tok}`)}
                    className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-blue-600 hover:border-blue-400"
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
