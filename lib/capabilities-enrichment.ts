import type { Capability } from "@/lib/services-data";

type CapabilityEnrichment = Pick<Capability, "tags" | "outcome" | "connectedItems">;

const enrichments: Record<string, CapabilityEnrichment[]> = {
  "custom-software-development": [
    {
      tags: ["Multi-role", "RBAC", "Audit logs"],
      outcome: "3 fully isolated role portals with <200ms cart updates in Sound Sphere Marketplace.",
    },
    {
      tags: ["Dashboards", "Exports", "Workflows"],
      outcome: "Replaced 12 spreadsheets with a single ops portal for HisaabKitaab.",
    },
    {
      tags: ["Approvals", "Rules engine", "Alerts"],
      outcome: "Automated attendance validation — zero buddy-punching in NFC Attendance System.",
    },
    {
      tags: ["Self-service", "Real-time", "Notifications"],
      outcome: "Cut vendor support tickets by 40% with customer-facing dashboards.",
    },
    {
      tags: ["Strangler fig", "API-first", "Incremental"],
      outcome: "Legacy billing module migrated to Node.js with zero downtime cutover.",
      connectedItems: [
        "Monolith modules & stored procedures",
        "Third-party ERP exports",
        "Internal admin tools & reports",
        "Batch jobs & scheduled importers",
      ],
    },
  ],
  "ai-automation": [
    {
      tags: ["OCR", "JSON output", "Validation rules"],
      outcome: "Reduced manual data entry by 80% in FreightFlow's LR processing.",
    },
    {
      tags: ["Real-time alerts", "Threshold rules"],
      outcome: "Caught ₹2.3L billing error in first month of FreightFlow deployment.",
    },
    {
      tags: ["Webhooks", "n8n / custom", "Multi-system"],
      outcome: "3-step manual process automated end-to-end in HisaabKitaab invoicing.",
    },
    {
      tags: ["GST", "PAN / Aadhaar", "Rule engine"],
      outcome: "Zero compliance rejections across 4,000+ documents processed.",
    },
    {
      tags: ["Vector DB", "Embeddings", "Citations", "Self-hosted"],
      outcome: "Query response time under 2s with source citation on every answer.",
      connectedItems: [
        "Internal SOPs & HR policies",
        "Product manuals & support docs",
        "Client contracts & SLAs",
        "Onboarding playbooks",
      ],
    },
  ],
  "saas-product-development": [
    {
      tags: ["Row-level security", "Tenant isolation", "Per-tenant config"],
      outcome: "500+ trucks per tenant with complete data isolation in FreightFlow.",
    },
    {
      tags: ["Razorpay", "Usage metering", "Invoicing"],
      outcome: "Subscription billing live from day one — no manual invoicing.",
    },
    {
      tags: ["Signup flows", "Team invites", "Email verify"],
      outcome: "Self-service onboarding reduced setup time from 2 days to 20 minutes.",
    },
    {
      tags: ["Tenant admin", "Usage analytics", "Support tools"],
      outcome: "Platform admin console manages 18 modules across all tenants.",
    },
    {
      tags: ["GST engine", "e-Invoice", "Audit trail"],
      outcome: "Automated GST filing with zero missed compliance deadlines.",
      connectedItems: [
        "Payment gateways & billing webhooks",
        "Email & notification providers",
        "Analytics & product telemetry",
        "Compliance APIs & government portals",
      ],
    },
  ],
  "web-development": [
    {
      tags: ["React", "Client routing", "Optimistic UI"],
      outcome: "Marketplace SPA with 3 role portals and sub-200ms cart updates.",
    },
    {
      tags: ["Service worker", "IndexedDB", "Offline sync"],
      outcome: "Zero billing downtime during network outages in SyncServe POS.",
    },
    {
      tags: ["Code splitting", "Image opt", "CDN"],
      outcome: "Agraj Enterprise indexed on Google within 48 hours of launch.",
    },
    {
      tags: ["CMS", "JSON-LD", "Sitemap"],
      outcome: "Marketing team updates content without developer involvement.",
    },
    {
      tags: ["Charts", "Filters", "Bulk actions"],
      outcome: "Real-time sales dashboard across 5 outlets in a single view.",
      connectedItems: [
        "REST & GraphQL backends",
        "Auth providers & SSO",
        "Payment & checkout APIs",
        "Analytics & monitoring tools",
      ],
    },
  ],
  "mobile-development": [
    {
      tags: ["React Native", "iOS + Android", "Shared codebase"],
      outcome: "Driver app shipped for iOS and Android from a single codebase.",
    },
    {
      tags: ["SQLite", "Background sync", "Offline queue"],
      outcome: "NFC check-ins buffer locally and sync when reconnected.",
    },
    {
      tags: ["GPS", "Camera", "POD capture"],
      outcome: "Real-time trip status and expense photos from the field.",
    },
    {
      tags: ["NFC", "Barcode", "Bluetooth"],
      outcome: "Hardware-attendance integration with zero manual entry.",
    },
    {
      tags: ["Push notifications", "OTA updates", "Deep links"],
      outcome: "Store-ready app in 12 weeks with OTA patch pipeline.",
      connectedItems: [
        "Node.js / Supabase backends",
        "Firebase Cloud Messaging",
        "Maps & location services",
        "Payment & receipt APIs",
      ],
    },
  ],
  "cloud-devops": [
    {
      tags: ["Auto-scaling", "Load balancing", "Multi-region"],
      outcome: "99.9% uptime across multi-tenant FreightFlow production.",
    },
    {
      tags: ["GitHub Actions", "Preview envs", "Auto deploy"],
      outcome: "Every PR gets a preview URL — deploys in under 3 minutes.",
    },
    {
      tags: ["Docker", "Health checks", "Rolling updates"],
      outcome: "Zero-downtime deployments with automatic rollback on failure.",
    },
    {
      tags: ["Terraform", "IaC", "Reproducible"],
      outcome: "Full infrastructure recreated from code in under 15 minutes.",
    },
    {
      tags: ["Sentry", "Uptime checks", "Cost alerts"],
      outcome: "Incident response time cut from hours to minutes with alerting.",
      connectedItems: [
        "AWS / Vercel / Supabase",
        "CI/CD pipelines & registries",
        "Log aggregation & metrics",
        "Secrets & environment configs",
      ],
    },
  ],
  "api-integrations": [
    {
      tags: ["REST", "OpenAPI", "Versioning"],
      outcome: "18-module API surface documented with full OpenAPI specs.",
    },
    {
      tags: ["Razorpay", "Webhooks", "Reconciliation"],
      outcome: "Payment webhook reconciliation with zero missed transactions.",
    },
    {
      tags: ["GST portal", "e-Way Bill", "NIC API"],
      outcome: "Automated e-Way Bill generation — zero manual NIC portal visits.",
    },
    {
      tags: ["Bi-directional", "Tally / Zoho", "Sync"],
      outcome: "Accounting sync eliminated duplicate data entry in HisaabKitaab.",
    },
    {
      tags: ["Conflict resolution", "Real-time", "Multi-outlet"],
      outcome: "Inventory sync across outlets with automatic conflict handling.",
      connectedItems: [
        "ERP & accounting systems",
        "Government compliance APIs",
        "Payment gateways & banks",
        "CRM, webhooks & message queues",
      ],
    },
  ],
  "product-engineering": [
    {
      tags: ["MVP scope", "Prioritization", "Roadmap"],
      outcome: "FreightFlow MVP scoped to 8 core modules — shipped in 12 weeks.",
    },
    {
      tags: ["Full-stack", "Sprints", "Demos"],
      outcome: "SyncServe POS from wireframe to production in 14 weeks.",
    },
    {
      tags: ["Weekly releases", "Feedback loops", "Analytics"],
      outcome: "Marketplace iterated through 6 weekly releases before public launch.",
    },
    {
      tags: ["Multi-role", "Onboarding", "Permissions"],
      outcome: "3 stakeholder portals built in a single product codebase.",
    },
    {
      tags: ["Monitoring", "CI/CD", "Launch checklist"],
      outcome: "Production launch with observability and rollback plan from day one.",
      connectedItems: [
        "Product analytics & event tracking",
        "Design system & Figma handoff",
        "Sprint boards & stakeholder demos",
        "Post-launch iteration backlog",
      ],
    },
  ],
};

export function enrichCapabilities(slug: string, capabilities: Capability[]): Capability[] {
  const extra = enrichments[slug] ?? [];
  return capabilities.slice(0, 5).map((cap, i) => ({
    ...cap,
    tags: extra[i]?.tags ?? cap.tags ?? [],
    outcome: extra[i]?.outcome ?? cap.outcome ?? "",
    connectedItems: extra[i]?.connectedItems ?? cap.connectedItems,
    featured: i === 4,
    clientLabel: cap.clientLabel ?? cap.usedInProject.replace(/\s+/g, "").toUpperCase(),
  }));
}
