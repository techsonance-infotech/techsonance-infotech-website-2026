import { Currency, Region } from "@/lib/constants/enums/pricing.enum";

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  flag: string;
  rateAgainstUSD: number; // Conversion multiplier relative to USD baseline
  formatLocale: string;
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  [Currency.USD]: {
    code: Currency.USD,
    symbol: "$",
    name: "US Dollar",
    flag: "🇺🇸",
    rateAgainstUSD: 1.0,
    formatLocale: "en-US",
  },
  [Currency.EUR]: {
    code: Currency.EUR,
    symbol: "€",
    name: "Euro",
    flag: "🇪🇺",
    rateAgainstUSD: 0.92,
    formatLocale: "de-DE",
  },
  [Currency.GBP]: {
    code: Currency.GBP,
    symbol: "£",
    name: "British Pound",
    flag: "🇬🇧",
    rateAgainstUSD: 0.79,
    formatLocale: "en-GB",
  },
  [Currency.AED]: {
    code: Currency.AED,
    symbol: "AED",
    name: "UAE Dirham",
    flag: "🇦🇪",
    rateAgainstUSD: 3.67,
    formatLocale: "en-AE",
  },
  [Currency.INR]: {
    code: Currency.INR,
    symbol: "₹",
    name: "Indian Rupee",
    flag: "🇮🇳",
    rateAgainstUSD: 86.5,
    formatLocale: "en-IN",
  },
};

export interface RegionConfig {
  id: Region;
  label: string;
  defaultCurrency: Currency;
  description: string;
}

export const REGIONS: Record<Region, RegionConfig> = {
  [Region.GLOBAL]: {
    id: Region.GLOBAL,
    label: "Global / International",
    defaultCurrency: Currency.USD,
    description: "Standard international USD invoicing",
  },
  [Region.NORTH_AMERICA]: {
    id: Region.NORTH_AMERICA,
    label: "North America (US & Canada)",
    defaultCurrency: Currency.USD,
    description: "EST/PST aligned delivery teams",
  },
  [Region.EUROPE]: {
    id: Region.EUROPE,
    label: "Europe (EU)",
    defaultCurrency: Currency.EUR,
    description: "CET timezone alignment, GDPR-compliant architectures",
  },
  [Region.UNITED_KINGDOM]: {
    id: Region.UNITED_KINGDOM,
    label: "United Kingdom",
    defaultCurrency: Currency.GBP,
    description: "GMT/BST timezone overlap",
  },
  [Region.MIDDLE_EAST]: {
    id: Region.MIDDLE_EAST,
    label: "Middle East (GCC / UAE)",
    defaultCurrency: Currency.AED,
    description: "GST/VAT compliant, Gulf business hours support",
  },
  [Region.AFRICA]: {
    id: Region.AFRICA,
    label: "Africa (East & South Africa)",
    defaultCurrency: Currency.USD,
    description: "High-value startup and enterprise agile engineering",
  },
  [Region.APAC_INDIA]: {
    id: Region.APAC_INDIA,
    label: "India & South Asia",
    defaultCurrency: Currency.INR,
    description: "Domestic enterprise and startup invoicing (GST)",
  },
};

export interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  tagline: string;
  basePriceUSD: number; // Base rate in USD
  billingPeriod: "one-time" | "month" | "hour";
  typicalDuration: string;
  description: string;
  features: string[];
  recommendedFor: string;
  ctaText: string;
  popular?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "mvp-sprint",
    name: "MVP & Discovery Sprint",
    badge: "Fast Launch",
    tagline: "Turn your validated idea into a production-ready MVP in 3-4 weeks.",
    basePriceUSD: 2400,
    billingPeriod: "one-time",
    typicalDuration: "3 - 4 Weeks",
    description:
      "Ideal for founders and product teams needing rapid execution with robust architecture.",
    features: [
      "Full-stack Next.js 16 + React 19 architecture",
      "Supabase / Postgres schema with strict TypeScript",
      "Auth, roles, and automated onboarding flows",
      "Stripe / Razorpay payment gateway integration",
      "1 month post-launch bug warranty included",
      "Direct Slack/Discord access to senior engineers",
    ],
    recommendedFor: "Early-stage startups, prototype validation, fast-to-market products",
    ctaText: "Start MVP Sprint",
  },
  {
    id: "dedicated-pod",
    name: "Dedicated Engineering Pod",
    badge: "Most Popular",
    tagline: "A dedicated senior team scaling your core product sprint by sprint.",
    basePriceUSD: 3800,
    billingPeriod: "month",
    typicalDuration: "Monthly Flexible Retainer",
    description:
      "A dedicated senior engineering team working exclusively as your extended tech force.",
    features: [
      "Full-time Senior Engineers (Next.js, Flutter, Node.js, AI)",
      "Daily standups, weekly demos, and transparent Jira/Linear boards",
      "Zero recruitment overhead, instant project onboarding",
      "Scalable bandwidth: ramp up or down with 2-week notice",
      "Enterprise CI/CD, automated testing & security audits",
      "Mutual NDA and 100% intellectual property ownership transfer",
    ],
    recommendedFor: "Growth-stage SaaS, funded startups, product expansions",
    ctaText: "Hire Engineering Pod",
    popular: true,
  },
  {
    id: "enterprise-custom",
    name: "Enterprise Custom Platform",
    badge: "High Security",
    tagline: "Bespoke high-throughput systems, multi-tenant architectures & agentic AI.",
    basePriceUSD: 8500,
    billingPeriod: "one-time",
    typicalDuration: "8 - 16 Weeks",
    description:
      "For companies demanding deep scalability, compliance, and bespoke workflow integration.",
    features: [
      "Custom multi-tenant database partitioning & Supabase pooling",
      "Agentic AI workflows, private RAG & fine-tuned LLM pipelines",
      "High-concurrency cloud architecture (AWS / Cloudflare)",
      "Enterprise security audits (SOC2 readiness, role-based ACLs)",
      "Dedicated Technical Lead & Solutions Architect",
      "SLA guarantee (99.9% uptime commitments) & 3 months warranty",
    ],
    recommendedFor: "Logistics, ERP/CRM, FinTech, high-throughput enterprise applications",
    ctaText: "Request Enterprise Scoping",
  },
];

export const HOURLY_BENCHMARK_USD = 28; // Standard senior developer hourly baseline

export const BUDGET_TIERS = [
  { id: "tier-1", minUSD: 1800, maxUSD: 3500, label: "Starter ($1.8k - $3.5k)" },
  { id: "tier-2", minUSD: 3500, maxUSD: 7000, label: "Growth ($3.5k - $7k)" },
  { id: "tier-3", minUSD: 7000, maxUSD: 18000, label: "Scale ($7k - $18k)" },
  { id: "tier-4", minUSD: 18000, maxUSD: null, label: "Enterprise ($18k+)" },
  { id: "tier-custom", minUSD: 0, maxUSD: null, label: "Flexible / Need Consultation" },
] as const;

export const DEFAULT_CURRENCY: Currency = Currency.USD;
export const DEFAULT_REGION: Region = Region.GLOBAL;
export const CURRENCY_COOKIE_KEY = "ts_currency";
export const REGION_COOKIE_KEY = "ts_region";

/**
 * Feature flag for public pricing section and navigation visibility.
 * Kept false by default. Toggle to true when ready to show public pricing.
 */
export const SHOW_PRICING_SECTION = false;

/**
 * Feature flag for currency selector pill visibility in the site header and navigation.
 * Kept false by default as requested. Toggle to true to display the currency switcher in the header.
 */
export const SHOW_CURRENCY_SELECTOR = false;
