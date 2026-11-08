"use client";

import React from "react";
import { Sparkles, Globe, Clock, ShieldCheck } from "lucide-react";
import { useCurrency } from "@/lib/context/currency-context";
import { CurrencySelector } from "@/components/currency/CurrencySelector";
import { CURRENCIES, REGIONS } from "@/lib/constants/pricing.constants";

export function PricingHero() {
  const { currency, region } = useCurrency();
  const activeCurrency = CURRENCIES[currency];
  const activeRegion = REGIONS[region];

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-20">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[450px] w-[650px] rounded-full bg-linear-to-tr from-[#1155CC]/10 via-[#00B4D8]/10 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1155CC]/20 bg-[#1155CC]/5 px-3.5 py-1.5 text-xs font-semibold text-[#1155CC]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Transparent International Pricing</span>
          </div>

          {/* Heading */}
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
            High-Performance Engineering with{" "}
            <span className="bg-linear-to-r from-[#1155CC] to-[#00B4D8] bg-clip-text text-transparent">
              Predictable Investment
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
            Whether launching an MVP sprint, scaling with a dedicated developer pod, or architecting
            an enterprise multi-tenant platform, our pricing is transparent, milestone-driven, and
            benchmarked in your local currency.
          </p>

          {/* Currency & Region Live Bar */}
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-200/90 bg-white/90 p-2 shadow-xs backdrop-blur-xs sm:gap-4 sm:p-2.5">
            <div className="flex items-center gap-2 pl-2 text-xs font-medium text-slate-600">
              <Globe className="h-4 w-4 text-[#1155CC]" />
              <span className="hidden sm:inline">Active Currency:</span>
            </div>

            <CurrencySelector compact />

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-1.5 pr-2 text-xs text-slate-600">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-medium text-slate-800">{activeRegion?.label.split(" ")[0]}</span>
              <span className="text-[11px] text-slate-400">({activeCurrency?.symbol} billing)</span>
            </div>
          </div>

          {/* Trust points */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>100% IP & Code Ownership</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Dedicated Timezone Overlap</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Zero Recruitment Overhead</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
