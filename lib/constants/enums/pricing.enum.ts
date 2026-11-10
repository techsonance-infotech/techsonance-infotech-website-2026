export enum Currency {
  USD = "USD",
  EUR = "EUR",
  GBP = "GBP",
  AED = "AED",
  INR = "INR",
}

export const CURRENCY_VALUES = Object.values(Currency) as [Currency, ...Currency[]];

export enum Region {
  GLOBAL = "GLOBAL",
  NORTH_AMERICA = "NORTH_AMERICA",
  EUROPE = "EUROPE",
  UNITED_KINGDOM = "UNITED_KINGDOM",
  MIDDLE_EAST = "MIDDLE_EAST",
  AFRICA = "AFRICA",
  APAC_INDIA = "APAC_INDIA",
}

export const REGION_VALUES = Object.values(Region) as [Region, ...Region[]];
