export const Currency = {
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
  AED: "AED",
  INR: "INR",
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];

export const CURRENCY_VALUES = Object.values(Currency) as [Currency, ...Currency[]];

export const Region = {
  GLOBAL: "GLOBAL",
  NORTH_AMERICA: "NORTH_AMERICA",
  EUROPE: "EUROPE",
  UNITED_KINGDOM: "UNITED_KINGDOM",
  MIDDLE_EAST: "MIDDLE_EAST",
  AFRICA: "AFRICA",
  APAC_INDIA: "APAC_INDIA",
} as const;

export type Region = (typeof Region)[keyof typeof Region];

export const REGION_VALUES = Object.values(Region) as [Region, ...Region[]];
