"use client";

import React from "react";
import { Check, ArrowRight, Zap, Star } from "lucide-react";
import { useCurrency } from "@/lib/context/currency-context";
import { PRICING_PLANS } from "@/lib/constants/pricing.constants";
import { formatCurrency } from "@/lib/utils/pricing.utils";
import { Button } from "@/components/ui/button";

interface PricingPlansSectionProps {
  onSelectPlan: (planId: string) => void;
}

export function PricingPlansSection({ onSelectPlan }: PricingPlansSectionProps) {
  const { currency } = useCurrency();

  return (
    <section className="relative py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => {
            const formattedPrice = formatCurrency(plan.basePriceUSD, currency);
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-3xl border bg-white p-7 transition-all duration-200 sm:p-8 ${
                  isPopular
                    ? "border-[#1155CC] shadow-xl ring-2 ring-[#1155CC]/20 lg:-translate-y-2"
                    : "border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md"
                }`}
              >
                {/* Popular Pill */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-[#1155CC] to-[#00B4D8] px-4 py-1 text-xs font-bold text-white shadow-md">
                      <Star className="h-3.5 w-3.5 fill-white" />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold tracking-wider text-slate-700 uppercase">
                    {plan.badge || "Tier"}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {plan.typicalDuration}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="mt-2 min-h-10 text-xs leading-relaxed text-slate-500">
                  {plan.tagline}
                </p>

                {/* Price Display */}
                <div className="mt-6 border-y border-slate-100 py-5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                      {formattedPrice}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {plan.billingPeriod === "month"
                        ? "/ month"
                        : plan.billingPeriod === "hour"
                          ? "/ hour"
                          : " starting"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Converted automatically to your local currency
                  </p>
                </div>

                {/* Features List */}
                <div className="mt-6 flex-1 space-y-3">
                  <p className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                    What&apos;s Included:
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1155CC]" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended For */}
                <div className="mt-6 rounded-2xl bg-slate-50 p-3.5 text-slate-600">
                  <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Best suited for:
                  </span>
                  <p className="mt-1 text-xs font-medium text-slate-700">
                    {plan.recommendedFor}
                  </p>
                </div>

                {/* CTA Action */}
                <div className="mt-6 pt-2">
                  <Button
                    onClick={() => onSelectPlan(plan.id)}
                    variant={isPopular ? "primary" : "secondary"}
                    size="default"
                    className="w-full gap-2 font-bold"
                  >
                    <span>{plan.ctaText}</span>
                    {isPopular ? <Zap className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
