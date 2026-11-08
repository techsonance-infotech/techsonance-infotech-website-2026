"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { Currency, Region } from "@/lib/constants/enums/pricing.enum";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  DEFAULT_REGION,
  REGIONS,
  CURRENCY_COOKIE_KEY,
  REGION_COOKIE_KEY,
  type CurrencyConfig,
  type RegionConfig,
} from "@/lib/constants/pricing.constants";
import { detectRegionAndTimezone, formatCurrency as formatCurrencyUtil } from "@/lib/utils/pricing.utils";

interface CurrencyContextValue {
  currency: Currency;
  currencyConfig: CurrencyConfig;
  region: Region;
  regionConfig: RegionConfig;
  setCurrency: (currency: Currency) => void;
  setRegion: (region: Region) => void;
  formatPrice: (amountUSD: number, options?: { round?: boolean; compact?: boolean }) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof document !== "undefined") {
      const saved = getCookie(CURRENCY_COOKIE_KEY) as Currency | null;
      if (saved && CURRENCIES[saved]) return saved;
      return detectRegionAndTimezone().currency;
    }
    return DEFAULT_CURRENCY;
  });

  const [region, setRegionState] = useState<Region>(() => {
    if (typeof document !== "undefined") {
      const saved = getCookie(REGION_COOKIE_KEY) as Region | null;
      if (saved && REGIONS[saved]) return saved;
      return detectRegionAndTimezone().region;
    }
    return DEFAULT_REGION;
  });

  // Persist cookies if not already set
  useEffect(() => {
    if (!getCookie(CURRENCY_COOKIE_KEY)) {
      setCookie(CURRENCY_COOKIE_KEY, currency);
    }
    if (!getCookie(REGION_COOKIE_KEY)) {
      setCookie(REGION_COOKIE_KEY, region);
    }
  }, [currency, region]);

  const setCurrency = useCallback((newCurrency: Currency) => {
    if (!CURRENCIES[newCurrency]) return;
    setCurrencyState(newCurrency);
    setCookie(CURRENCY_COOKIE_KEY, newCurrency);
  }, []);

  const setRegion = useCallback((newRegion: Region) => {
    if (!REGIONS[newRegion]) return;
    setRegionState(newRegion);
    setCookie(REGION_COOKIE_KEY, newRegion);
    // Optionally sync default currency for this region if user hasn't explicitly customized
    const defaultCurr = REGIONS[newRegion].defaultCurrency;
    setCurrencyState(defaultCurr);
    setCookie(CURRENCY_COOKIE_KEY, defaultCurr);
  }, []);

  const formatPrice = useCallback(
    (amountUSD: number, options?: { round?: boolean; compact?: boolean }) => {
      return formatCurrencyUtil(amountUSD, currency, options);
    },
    [currency],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      currencyConfig: CURRENCIES[currency] || CURRENCIES[DEFAULT_CURRENCY],
      region,
      regionConfig: REGIONS[region] || REGIONS[DEFAULT_REGION],
      setCurrency,
      setRegion,
      formatPrice,
    }),
    [currency, region, setCurrency, setRegion, formatPrice],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Provide a resilient fallback so components don't crash if rendered outside provider
    return {
      currency: DEFAULT_CURRENCY,
      currencyConfig: CURRENCIES[DEFAULT_CURRENCY],
      region: DEFAULT_REGION,
      regionConfig: REGIONS[DEFAULT_REGION],
      setCurrency: () => {},
      setRegion: () => {},
      formatPrice: (amountUSD) => formatCurrencyUtil(amountUSD, DEFAULT_CURRENCY),
    };
  }
  return context;
}
