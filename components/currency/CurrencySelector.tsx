"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCurrency } from "@/lib/context/currency-context";
import { Currency, Region } from "@/lib/constants/enums/pricing.enum";
import { CURRENCIES, REGIONS } from "@/lib/constants/pricing.constants";

export function CurrencySelector({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency, region, setRegion } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeCurrency = CURRENCIES[currency];

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select currency and region"
        className={`flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/90 font-medium text-slate-700 shadow-2xs backdrop-blur-xs transition-all hover:border-[#1155CC]/40 hover:bg-white hover:text-slate-900 focus:outline-none ${
          compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
        }`}
      >
        <span className="text-sm leading-none">{activeCurrency.flag}</span>
        <span className="font-bold text-slate-900">{activeCurrency.code}</span>
        <span className="text-[10px] text-slate-400">({activeCurrency.symbol})</span>
        <svg
          className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl duration-150 animate-in zoom-in-95">
          {/* Header */}
          <div className="mb-2 border-b border-slate-100 pb-2">
            <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
              International Currency
            </p>
            <p className="text-[11px] text-slate-500">Estimates converted at standard rates</p>
          </div>

          {/* Currency options */}
          <div className="space-y-1">
            {Object.values(Currency).map((c) => {
              const cfg = CURRENCIES[c];
              const isSelected = c === currency;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCurrency(c);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-[#1155CC]/10 font-bold text-[#1155CC]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{cfg.flag}</span>
                    <div>
                      <span className="font-semibold text-slate-900">{cfg.code}</span>
                      <span className="ml-1 text-[10px] text-slate-400">({cfg.name})</span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-500">{cfg.symbol}</span>
                </button>
              );
            })}
          </div>

          {/* Region selector hint */}
          <div className="mt-3 border-t border-slate-100 pt-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Delivery Timezone</span>
              <span className="font-bold text-slate-700">
                {REGIONS[region]?.label.split(" ")[0]}
              </span>
            </div>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as Region)}
              aria-label="Select Delivery Region"
              className="mt-1 w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700 focus:outline-none"
            >
              {Object.values(Region).map((r) => (
                <option key={r} value={r}>
                  {REGIONS[r].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
