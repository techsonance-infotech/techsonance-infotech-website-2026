"use client";

import React, { useState } from "react";
import { Calculator, ArrowRight, CheckCircle2 } from "lucide-react";
import { useCurrency } from "@/lib/context/currency-context";
import { formatCurrency } from "@/lib/utils/pricing.utils";
import { HOURLY_BENCHMARK_USD } from "@/lib/constants/pricing.constants";
import { Button } from "@/components/ui/button";

interface PodConfiguration {
  id: string;
  label: string;
  team: string;
  monthlyUsd: number;
  monthlyHours: number;
}

const POD_OPTIONS: PodConfiguration[] = [
  {
    id: "pod-1",
    label: "Dedicated Senior Engineer",
    team: "1 Full-Stack Senior Developer (Next.js / Flutter / AI)",
    monthlyUsd: 3800,
    monthlyHours: 160,
  },
  {
    id: "pod-2",
    label: "Growth Acceleration Pod",
    team: "2 Senior Developers + Part-Time Solutions Architect",
    monthlyUsd: 7200,
    monthlyHours: 320,
  },
  {
    id: "pod-3",
    label: "Full Cross-Functional Pod",
    team: "2 Full-Stack Engineers + 1 DevOps/QA + 1 AI Specialist",
    monthlyUsd: 11500,
    monthlyHours: 560,
  },
];

const DURATIONS = [
  { months: 1, label: "1 Month (Flexible)", discountPercent: 0 },
  { months: 3, label: "3 Months (5% Retainer Benefit)", discountPercent: 5 },
  { months: 6, label: "6 Months (10% Retainer Benefit)", discountPercent: 10 },
];

export function PricingCalculator({ onBookPod }: { onBookPod: () => void }) {
  const { currency } = useCurrency();
  const [selectedPodId, setSelectedPodId] = useState<string>("pod-2");
  const [selectedDuration, setSelectedDuration] = useState<number>(3);

  const activePod = POD_OPTIONS.find((p) => p.id === selectedPodId) || POD_OPTIONS[0];
  const activeDuration = DURATIONS.find((d) => d.months === selectedDuration) || DURATIONS[1];

  const discountedMonthlyUsd =
    activePod.monthlyUsd * (1 - activeDuration.discountPercent / 100);
  const totalInvestmentUsd = discountedMonthlyUsd * activeDuration.months;

  const formattedMonthly = formatCurrency(discountedMonthlyUsd, currency);
  const formattedTotal = formatCurrency(totalInvestmentUsd, currency);
  const formattedHourly = formatCurrency(HOURLY_BENCHMARK_USD, currency, { round: false });

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg sm:p-10 lg:p-12">
          {/* Section Header */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1155CC]/10 px-3 py-1 text-xs font-bold text-[#1155CC]">
              <Calculator className="h-3.5 w-3.5" />
              <span>Dedicated Pod Estimator</span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Calculate Your Dedicated Engineering Pod
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
              Configure your team composition and sprint duration to estimate your monthly retainer
              and blended hourly equivalent in your chosen currency.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            {/* Controls (7 cols) */}
            <div className="space-y-6 lg:col-span-7">
              {/* Pod Selection */}
              <div>
                <p className="mb-2 block text-xs font-bold tracking-wider text-slate-800 uppercase">
                  1. Select Team Composition:
                </p>
                <div className="space-y-2.5">
                  {POD_OPTIONS.map((pod) => {
                    const isSelected = pod.id === selectedPodId;
                    return (
                      <button
                        key={pod.id}
                        type="button"
                        onClick={() => setSelectedPodId(pod.id)}
                        className={`flex w-full items-start justify-between rounded-2xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-[#1155CC] bg-[#1155CC]/5 shadow-xs ring-1 ring-[#1155CC]"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="space-y-1 pr-3">
                          <p className="text-sm font-bold text-slate-900">{pod.label}</p>
                          <p className="text-xs text-slate-500">{pod.team}</p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-slate-600">
                          {pod.monthlyHours} hrs/mo
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Selection */}
              <div>
                <p className="mb-2 block text-xs font-bold tracking-wider text-slate-800 uppercase">
                  2. Sprint & Retainer Duration:
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {DURATIONS.map((dur) => {
                    const isSelected = dur.months === selectedDuration;
                    return (
                      <button
                        key={dur.months}
                        type="button"
                        onClick={() => setSelectedDuration(dur.months)}
                        className={`rounded-xl border px-3 py-2.5 text-center text-xs font-bold transition-all ${
                          isSelected
                            ? "border-[#1155CC] bg-[#1155CC] text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {dur.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Calculation Summary (5 cols) */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-[#1155CC]/20 bg-linear-to-b from-[#1155CC]/5 to-transparent p-6 sm:p-8">
                <span className="text-[11px] font-bold tracking-wider text-[#1155CC] uppercase">
                  Estimated Retainer Investment
                </span>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                    {formattedMonthly}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">/ month</span>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-200/80 pt-4 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Total ({activeDuration.months} Months):</span>
                    <span className="font-bold text-slate-900">{formattedTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Blended Hourly Baseline:</span>
                    <span className="font-bold text-emerald-600">~{formattedHourly} / hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guaranteed Working Hours:</span>
                    <span className="font-semibold text-slate-900">
                      {activePod.monthlyHours * activeDuration.months} Total Hours
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-2 rounded-xl bg-white/80 p-3 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Daily standups & real-time Slack/Teams channel</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Sprint demos & automated CI/CD staging deployments</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={onBookPod}
                    variant="primary"
                    size="default"
                    className="w-full gap-2 font-bold"
                  >
                    <span>Reserve Engineering Pod</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
