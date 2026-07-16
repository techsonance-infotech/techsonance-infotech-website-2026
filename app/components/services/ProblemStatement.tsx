"use client";

import type { Service } from "@/lib/services-data";
import EmojiOrLucideIcon from "@/app/components/icons/LucideIcon";

interface ProblemStatementProps {
  service: Service;
}

interface PainPointCard {
  number: string;
  badge: string;
  icon: string;
  title: string;
  quote: string;
  resolution: string;
}

const SERVICE_PROBLEMS_CONTENT: Record<
  string,
  { headerRightText: string; cards: PainPointCard[] }
> = {
  "custom-software-development": {
    headerRightText: "Three patterns we've seen kill custom software systems before they ship.",
    cards: [
      {
        number: "01",
        badge: "GENERIC MASK",
        icon: "🎨",
        title: "They sell a generic template as custom",
        quote: "They built a generic dashboard and called it 'custom' — then charged us for every single field change.",
        resolution: "Every layout and feature built from scratch for your workflow",
      },
      {
        number: "02",
        badge: "GAP IN MIND",
        icon: "🗺️",
        title: "They don't understand your business model",
        quote: "Six months in, we were still explaining our workflow because they never mapped it out properly.",
        resolution: "Deep operations audit and process mapping on week one",
      },
      {
        number: "03",
        badge: "BLACK BOX",
        icon: "📦",
        title: "They lock you into their codebase",
        quote: "The codebase was a total black box. We couldn't hire another developer without a full rewrite.",
        resolution: "Clean, documented, type-safe code you own completely",
      },
    ],
  },
  "ai-automation": {
    headerRightText: "Three patterns we've seen kill automations before they ship.",
    cards: [
      {
        number: "01",
        badge: "DEMO TRAP",
        icon: "🎭",
        title: "They sell the demo, not the integration",
        quote: "They showed us a ChatGPT wrapper and called it enterprise AI — it broke the moment we fed it our actual documents.",
        resolution: "We prototype on your real data before any contract",
      },
      {
        number: "02",
        badge: "NO BASELINE",
        icon: "📊",
        title: "No accuracy measurement before go-live",
        quote: "No one measured accuracy on our data before we signed the contract. We found out at launch it was 60% reliable.",
        resolution: "Accuracy benchmarks signed off in the scoping phase",
      },
      {
        number: "03",
        badge: "DATA RISK",
        icon: "🔒",
        title: "Your data lives on their servers forever",
        quote: "The AI runs in their cloud. Our invoices never leave their servers — became a compliance nightmare for our auditors.",
        resolution: "Self-hosted or VPC-deployed options available on day one",
      },
    ],
  },
  "saas-product-development": {
    headerRightText: "Three patterns we've seen kill SaaS products before they ship.",
    cards: [
      {
        number: "01",
        badge: "SCALING WALL",
        icon: "🧱",
        title: "They build single-tenant MVPs",
        quote: "They built our MVP as a single-tenant app. Now every new customer needs a separate expensive deployment.",
        resolution: "True multi-tenant database architectures from day one",
      },
      {
        number: "02",
        badge: "MANUAL BILLS",
        icon: "💳",
        title: "Manual billing and pricing models",
        quote: "Billing was an afterthought — we're manually invoicing because subscription integration never happened.",
        resolution: "Automated Stripe/Razorpay billing built into the core sprint",
      },
      {
        number: "03",
        badge: "LEAK RISK",
        icon: "🚨",
        title: "No data isolation security measures",
        quote: "One customer's data leaked into another's dashboard. Multi-tenancy wasn't architected correctly.",
        resolution: "Strict Row-Level Security (RLS) policies on the database level",
      },
    ],
  },
  "web-development": {
    headerRightText: "Three patterns we've seen kill web projects before they ship.",
    cards: [
      {
        number: "01",
        badge: "SLOW RENDERS",
        icon: "🐌",
        title: "Slow page load speeds and low SEO",
        quote: "The website looks nice but takes 6 seconds to load. Our Google Lighthouse score is red.",
        resolution: "Server-side rendering (SSR) and optimized image assets",
      },
      {
        number: "02",
        badge: "MOBILE CLUNKY",
        icon: "📱",
        title: "Clunky, broken mobile experiences",
        quote: "It looks perfect on their desktop screen, but half our links are impossible to tap on a mobile device.",
        resolution: "Fully responsive, mobile-first design system layouts",
      },
      {
        number: "03",
        badge: "CONTENT LOCK",
        icon: "🔑",
        title: "Hardcoded contents you can't edit",
        quote: "We have to email the agency every time we want to change a simple text paragraph or team photo.",
        resolution: "Headless CMS integration for easy editor updates",
      },
    ],
  },
  "mobile-development": {
    headerRightText: "Three patterns we've seen kill mobile apps before they ship.",
    cards: [
      {
        number: "01",
        badge: "OFFLINE CRASH",
        icon: "📵",
        title: "No offline-first sync architecture",
        quote: "The app crashes the moment our drivers enter a low-connectivity warehouse area.",
        resolution: "Robust local SQLite cache with automatic background sync",
      },
      {
        number: "02",
        badge: "STORE REJECT",
        icon: "❌",
        title: "Apple App Store review rejections",
        quote: "We spent 4 months building, and Apple rejected the app immediately for guideline compliance issues.",
        resolution: "Strict adherence to Apple Human Interface Guidelines",
      },
      {
        number: "03",
        badge: "LAGGY TRANS",
        icon: "⚡",
        title: "Laggy page transitions and frame drops",
        quote: "The page scrolls feel sluggish. It doesn't feel like a native app, it feels like a slow website.",
        resolution: "GPU-accelerated native animations and lightweight state",
      },
    ],
  },
  "cloud-devops": {
    headerRightText: "Three patterns we've seen kill cloud systems before they ship.",
    cards: [
      {
        number: "01",
        badge: "COST SPIKE",
        icon: "💸",
        title: "Bloated and unoptimized cloud bills",
        quote: "We are paying $3k/month for staging and dev clusters that are barely utilized.",
        resolution: "Auto-scaling groups and scheduled environment shutdowns",
      },
      {
        number: "02",
        badge: "MANUAL PUSH",
        icon: "🛠️",
        title: "Manual deployments and config drift",
        quote: "Only one senior dev knows how to deploy. When he went on vacation, we couldn't push critical bugfixes.",
        resolution: "Fully automated GitOps pipelines using GitHub Actions/Terraform",
      },
      {
        number: "03",
        badge: "ZERO ALERTS",
        icon: "🔔",
        title: "No central logging or alert monitors",
        quote: "Our database went down for 6 hours, and we only found out because a client called to complain.",
        resolution: "Prometheus/Grafana telemetry with instant Slack alerts",
      },
    ],
  },
  "api-integrations": {
    headerRightText: "Three patterns we've seen kill integrations before they ship.",
    cards: [
      {
        number: "01",
        badge: "RATE LIMITS",
        icon: "🛑",
        title: "No rate-limiting or queue backoff",
        quote: "The integration crashed because the third-party API rate-limited us during peak hours.",
        resolution: "BullMQ job queues with automatic retry backoff logic",
      },
      {
        number: "02",
        badge: "SILENT FAILS",
        icon: "🔕",
        title: "Silent database sync failures",
        quote: "Customers were charged, but the ERP system didn't update. We had no audit logs to see why.",
        resolution: "Comprehensive transaction logging and dead-letter queues",
      },
      {
        number: "03",
        badge: "HARD CODED",
        icon: "🧩",
        title: "Hardcoded credentials and schemas",
        quote: "The integration broke completely when the client updated their Salesforce field names.",
        resolution: "Type-safe dynamically mapped API payload validators",
      },
    ],
  },
  "product-engineering": {
    headerRightText: "Three patterns we've seen kill product systems before they ship.",
    cards: [
      {
        number: "01",
        badge: "PROTO DELAY",
        icon: "⏳",
        title: "Slow prototyping cycle times",
        quote: "It took them 3 months to build the first physical prototype. We lost our market lead window.",
        resolution: "Rapid 3D prototyping and modular hardware testing",
      },
      {
        number: "02",
        badge: "FIRM BUG",
        icon: "🐛",
        title: "Hard-to-update firmware bug risks",
        quote: "We shipped 100 units, and then found a firmware bug. There was no way to update them over the air.",
        resolution: "Secure OTA (Over-the-Air) firmware update agents",
      },
      {
        number: "03",
        badge: "PARTS RISK",
        icon: "🏭",
        title: "Single-source supply chain failures",
        quote: "Our factory stopped assembly because a microchip went out of stock globally.",
        resolution: "Multi-source component design and BOM optimization",
      },
    ],
  },
};

export default function ProblemStatement({ service }: ProblemStatementProps) {
  const content = SERVICE_PROBLEMS_CONTENT[service.slug] || {
    headerRightText: `Three patterns we've seen kill ${service.name.toLowerCase()} projects before they ship.`,
    cards: service.painPoints.map((point, idx) => ({
      number: `0${idx + 1}`,
      badge: "PROBLEM",
      icon: "⚠️",
      title: "Common project mistake",
      quote: point.text,
      resolution: "We resolve this in our engineering phase",
    })),
  };

  return (
    <section className="service-section bg-[var(--bg-subtle)] py-20 md:py-24">
      <div className="service-container">

        {/* Subtitle / Category Label */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-[1.5px] bg-[#22B6F6]" />
          <span className="text-[10px] font-black uppercase text-[#1155CC] tracking-widest">
            Industry Reality
          </span>
        </div>

        {/* Header Block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16">
          <div className="lg:col-span-8">
            <h2
              className="text-[var(--text-primary)] font-medium tracking-tight"
              style={{ fontSize: "var(--text-section-title)", lineHeight: 1.1 }}
            >
              What most {service.problemHeadline} get{" "}
              <span className="text-[#1155CC]">wrong</span>
            </h2>
          </div>
          <div className="lg:col-span-4 lg:text-right">
            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-sm lg:ml-auto">
              {content.headerRightText}
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {content.cards.map((card, idx) => {
            const isHighlighted = idx === 1;
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-8 relative flex flex-col justify-between transition-all duration-300 ${isHighlighted
                  ? "border-2 border-[#22B6F6]/40 shadow-[0_10px_50px_rgba(34, 182, 246,0.06)] hover:shadow-[0_12px_55px_rgba(34, 182, 246,0.1)]"
                  : "border border-slate-100/80 shadow-[0_4px_30px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_40px_rgba(17, 85, 204,0.03)]"
                  }`}
              >
                <div>
                  {/* Top row with Icon and Number/Badge */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/70 flex items-center justify-center text-[var(--accent-blue)] select-none">
                      <EmojiOrLucideIcon icon={card.icon} className="w-5 h-5 text-[var(--accent-blue)]" />
                    </div>
                    <div className="flex items-center gap-2 relative">
                      <span className="text-[40px] sm:text-[52px] font-black text-slate-100 select-none leading-[0.8] tracking-tighter">
                        {card.number}
                      </span>
                      <span className="absolute right-0 -bottom-1 text-[8px] font-black uppercase text-[#EF4444] bg-[#EF4444]/10 rounded-full px-2.5 py-1 tracking-wider whitespace-nowrap">
                        {card.badge}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-[15px] font-medium text-[var(--text-primary)] leading-snug mb-4">
                    {card.title}
                  </h3>

                  {/* Blockquote Quote */}
                  <div className="border-l-2 border-slate-200 pl-4 mb-6">
                    <p className="text-[13px] text-slate-500 leading-relaxed italic">
                      &ldquo;{card.quote}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Resolution footer */}
                <div className="flex items-start gap-2 text-[12px] text-green-600 font-semibold mt-auto pt-4 border-t border-slate-50">
                  <span className="text-green-500 shrink-0 text-sm leading-none">✓</span>
                  <span className="leading-tight">{card.resolution}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
