import { Currency, Region } from "@/lib/constants/enums/pricing.enum";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  DEFAULT_REGION,
  REGIONS,
} from "@/lib/constants/pricing.constants";

/**
 * Format a USD base amount into the specified currency using configured rate and locale.
 */
export function formatCurrency(
  amountUSD: number,
  currency: Currency = DEFAULT_CURRENCY,
  options?: { round?: boolean; compact?: boolean },
): string {
  const config = CURRENCIES[currency] || CURRENCIES[DEFAULT_CURRENCY];
  const converted = amountUSD * config.rateAgainstUSD;

  // Round appropriately (nearest 10/100 depending on magnitude to avoid messy digits like $2,413.2)
  let displayValue: number;
  if (options?.round ?? true) {
    if (currency === Currency.INR) {
      // Round to nearest 5,000 for INR
      displayValue = Math.round(converted / 5000) * 5000;
    } else if (currency === Currency.AED) {
      displayValue = Math.round(converted / 50) * 50;
    } else {
      displayValue = Math.round(converted / 50) * 50;
    }
  } else {
    displayValue = Math.round(converted);
  }

  try {
    const formatter = new Intl.NumberFormat(config.formatLocale, {
      style: "currency",
      currency: config.code,
      maximumFractionDigits: 0,
      notation: options?.compact ? "compact" : "standard",
    });
    return formatter.format(displayValue);
  } catch {
    return `${config.symbol}${displayValue.toLocaleString()}`;
  }
}

/**
 * Given a visitor's IANA timezone string, detect recommended region and currency.
 */
export function detectRegionAndTimezone(tz?: string): {
  region: Region;
  currency: Currency;
} {
  const timezone =
    tz || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "");

  if (!timezone) {
    return { region: DEFAULT_REGION, currency: DEFAULT_CURRENCY };
  }

  // India & South Asia
  if (
    timezone.includes("Kolkata") ||
    timezone.includes("Calcutta") ||
    timezone.includes("Colombo")
  ) {
    return { region: Region.APAC_INDIA, currency: Currency.INR };
  }

  // United Kingdom
  if (timezone.includes("London") || timezone.includes("Belfast") || timezone.includes("Dublin")) {
    return { region: Region.UNITED_KINGDOM, currency: Currency.GBP };
  }

  // Europe (EU)
  if (
    timezone.includes("Berlin") ||
    timezone.includes("Paris") ||
    timezone.includes("Amsterdam") ||
    timezone.includes("Madrid") ||
    timezone.includes("Rome") ||
    timezone.includes("Stockholm") ||
    timezone.includes("Vienna") ||
    timezone.includes("Warsaw") ||
    timezone.includes("Zurich") ||
    timezone.includes("Brussels")
  ) {
    return { region: Region.EUROPE, currency: Currency.EUR };
  }

  // Middle East (UAE / GCC)
  if (
    timezone.includes("Dubai") ||
    timezone.includes("Abu_Dhabi") ||
    timezone.includes("Muscat") ||
    timezone.includes("Riyadh") ||
    timezone.includes("Qatar")
  ) {
    return { region: Region.MIDDLE_EAST, currency: Currency.AED };
  }

  // Africa
  if (
    timezone.includes("Cairo") ||
    timezone.includes("Johannesburg") ||
    timezone.includes("Nairobi") ||
    timezone.includes("Lagos") ||
    timezone.includes("Accra")
  ) {
    return { region: Region.AFRICA, currency: Currency.USD };
  }

  // North America
  if (
    timezone.includes("New_York") ||
    timezone.includes("Chicago") ||
    timezone.includes("Los_Angeles") ||
    timezone.includes("Denver") ||
    timezone.includes("Toronto") ||
    timezone.includes("Vancouver")
  ) {
    return { region: Region.NORTH_AMERICA, currency: Currency.USD };
  }

  return { region: Region.GLOBAL, currency: Currency.USD };
}

/**
 * Format a budget range in the active currency for dropdowns and options.
 */
export function getBudgetRangesForCurrency(currency: Currency = DEFAULT_CURRENCY): {
  id: string;
  label: string;
}[] {
  const config = CURRENCIES[currency] || CURRENCIES[DEFAULT_CURRENCY];
  const rate = config.rateAgainstUSD;

  if (currency === Currency.INR) {
    return [
      { id: "b-1", label: "₹1.5 Lakh - ₹3 Lakh ($2k - $3.5k)" },
      { id: "b-2", label: "₹3 Lakh - ₹6 Lakh ($3.5k - $7k)" },
      { id: "b-3", label: "₹6 Lakh - ₹15 Lakh ($7k - $18k)" },
      { id: "b-4", label: "₹15 Lakh+ ($18k+)" },
      { id: "b-flexible", label: "Not sure / Need consultation" },
    ];
  }

  const formatRound = (valUSD: number) => {
    const val = Math.round((valUSD * rate) / 500) * 500;
    return `${config.symbol}${val.toLocaleString()}`;
  };

  return [
    {
      id: "b-1",
      label: `${formatRound(1800)} - ${formatRound(3500)}`,
    },
    {
      id: "b-2",
      label: `${formatRound(3500)} - ${formatRound(7000)}`,
    },
    {
      id: "b-3",
      label: `${formatRound(7000)} - ${formatRound(18000)}`,
    },
    {
      id: "b-4",
      label: `${formatRound(18000)}+ (Enterprise Scale)`,
    },
    {
      id: "b-flexible",
      label: "Not sure / Need consultation",
    },
  ];
}
