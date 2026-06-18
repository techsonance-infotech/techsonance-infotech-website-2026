import { getProjectBySlug } from "@/data/projects";
import { enrichCapabilities } from "@/lib/capabilities-enrichment";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PainPoint {
  text: string;
}

export interface Capability {
  icon: string;
  title: string;
  description: string;
  usedInProject: string;
  tags?: string[];
  outcome?: string;
  clientLabel?: string;
  featured?: boolean;
  connectedItems?: string[];
}

export interface ProcessStep {
  title: string;
  description: string;
  icon: string;
}

export interface TechItem {
  name: string;
  why?: string;
}

export interface TechStackGroup {
  category: string;
  items: TechItem[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Metric {
  value: string;
  label: string;
}

export interface ProjectCard {
  slug: string;
  name: string;
  industry: string;
  outcome: string;
  techStack: string[];
  href: string;
  image: string;
  tech: string[];
  link: string;
}

export interface Service {
  slug: string;
  name: string;
  tagline: string;
  heroCode: string;
  problemHeadline: string;
  painPoints: PainPoint[];
  capabilities: Capability[];
  process: ProcessStep[];
  techStack: TechStackGroup[];
  proofOfWork: string[];
  faqs: FAQ[];
  metrics: Metric[];
  // Nav / homepage compatibility
  shortTitle: string;
  icon: string;
  accentColor: string;
  gradient: string;
  nodePosition: { angle: number; orbitRadiusX: number; orbitRadiusY: number };
  quickSummary: string;
  keyTech: string[];
  caseStudySlug?: string;
}

// ─── Shared metrics strip ────────────────────────────────────────────────────

export const SHARED_METRICS: Metric[] = [
  { value: "4+", label: "Years Building Production Systems" },
  { value: "15+", label: "SaaS Projects Delivered" },
  { value: "0", label: "Missed Deadlines on Fixed-Scope Projects" },
];

// ─── Services ────────────────────────────────────────────────────────────────

const rawServicesList: Service[] = [
  {
    slug: "custom-software-development",
    name: "Custom Software Development",
    shortTitle: "Custom Software",
    tagline: "Software that fits your workflow - not the other way around.",
    quickSummary: "Production-grade custom platforms built around how your team actually operates.",
    icon: "code",
    accentColor: "#22B6F6",
    gradient: "linear-gradient(135deg, #1155CC 0%, #22B6F6 100%)",
    nodePosition: { angle: 0, orbitRadiusX: 1, orbitRadiusY: 1 },
    keyTech: ["React", "Node.js", "PostgreSQL"],
    caseStudySlug: "techsonance-marketplace",
    heroCode: `// custom-platform.config.ts
export const platform = {
  tenant: "your-company",
  modules: ["orders", "inventory", "billing"],
  auth: { provider: "sso", roles: ["admin", "ops"] },
  deploy: { env: "production", region: "ap-south-1" },
};`,
    problemHeadline: "custom software development agencies",
    painPoints: [
      { text: "They build a generic dashboard and call it 'custom' - then charge you for every change." },
      { text: "Six months in, you're still explaining your workflow because they never mapped it properly." },
      { text: "The codebase is a black box. You can't hire another team without a full rewrite." },
    ],
    capabilities: [
      {
        icon: "schema",
        title: "Enterprise Platforms",
        description: "Multi-role systems with isolated permissions, audit trails, and modular feature flags.",
        usedInProject: "Sound Sphere Marketplace",
      },
      {
        icon: "database",
        title: "Internal Operations Portals",
        description: "Replace spreadsheets with role-based dashboards your team will actually use daily.",
        usedInProject: "HisaabKitaab",
      },
      {
        icon: "shield",
        title: "Workflow Automation Systems",
        description: "Encode business rules into software - approvals, validations, and automated notifications.",
        usedInProject: "NFC Attendance System",
      },
      {
        icon: "users",
        title: "Customer-Facing Dashboards",
        description: "Self-service portals that reduce support load and give clients real-time visibility.",
        usedInProject: "Sound Sphere Marketplace",
      },
      {
        icon: "code",
        title: "Legacy System Modernization",
        description: "Incremental migration from monoliths to maintainable, testable architectures.",
        usedInProject: "HisaabKitaab",
      },
      {
        icon: "monitor",
        title: "Admin & Back-Office Tools",
        description: "Purpose-built consoles for ops teams - bulk actions, exports, and exception handling.",
        usedInProject: "NFC Attendance System",
      },
    ],
    process: [
      { title: "Discovery", description: "We map your workflows, data sources, and constraints before writing a single line of code.", icon: "schema" },
      { title: "Architecture", description: "Database schema, API contracts, and deployment model - documented and agreed upfront.", icon: "schema" },
      { title: "Build Sprints", description: "Two-week cycles with demoable increments. You see working software, not slide decks.", icon: "code" },
      { title: "Hardening", description: "Security review, load testing, and observability before production cutover.", icon: "shield" },
      { title: "Handoff", description: "Full source code, documentation, and deployment runbooks. You own everything.", icon: "handshake" },
    ],
    techStack: [
      {
        category: "Frontend",
        items: [
          { name: "React", why: "Component model scales with complex UIs and has the largest hiring pool." },
          { name: "Next.js", why: "SSR, routing, and API routes in one framework - faster time to production." },
          { name: "TypeScript", why: "Catches integration bugs at compile time across large codebases." },
        ],
      },
      {
        category: "Backend",
        items: [
          { name: "Node.js", why: "Shared language with frontend - one team, faster iteration." },
          { name: "NestJS", why: "Structured modules and DI for enterprise-grade API design." },
          { name: "Express", why: "Lightweight when you need speed over ceremony." },
        ],
      },
      {
        category: "Database",
        items: [
          { name: "PostgreSQL", why: "ACID compliance, JSON support, and row-level security for multi-tenant apps." },
          { name: "MongoDB", why: "Flexible schema for rapid prototyping and document-heavy domains." },
          { name: "Redis", why: "Session caching, rate limiting, and job queues." },
        ],
      },
    ],
    proofOfWork: ["hisaabkitaab", "nfc-attendance"],
    faqs: [
      { question: "How long before I see a working version?", answer: "Most projects have a clickable prototype within 3–4 weeks and a production-ready MVP in 8–12 weeks, depending on scope." },
      { question: "Will I own the source code?", answer: "Yes. You receive full IP ownership and repository access upon final payment. No licensing fees, no lock-in." },
      { question: "Do you work with existing codebases?", answer: "We regularly take over legacy projects - audit first, then incremental refactoring with zero downtime." },
      { question: "How do you handle changing requirements?", answer: "We use fixed-scope sprints. Changes go through a brief impact assessment and are scoped before implementation." },
      { question: "What does ongoing support look like?", answer: "Optional retainer for bug fixes, security patches, and feature additions - billed monthly with clear SLAs." },
    ],
    metrics: SHARED_METRICS,
  },
  {
    slug: "ai-automation",
    name: "AI Automation Solutions",
    shortTitle: "AI Automation",
    tagline: "Automate the work your team shouldn't be doing manually.",
    quickSummary: "Practical AI integrations that cut manual work - OCR, document processing, and workflow automation.",
    icon: "brain",
    accentColor: "#22B6F6",
    gradient: "linear-gradient(135deg, #1155CC 0%, #22B6F6 100%)",
    nodePosition: { angle: 45, orbitRadiusX: 1, orbitRadiusY: 1 },
    keyTech: ["OpenAI", "Python", "LangChain"],
    heroCode: `// automation-pipeline.ts
const result = await pipeline.run({
  input: invoiceDocument,
  steps: ["ocr", "extract", "validate", "sync"],
  fallback: "human-review-queue",
});
// → structured data in your ERP`,
    problemHeadline: "AI automation agencies",
    painPoints: [
      { text: "They demo a ChatGPT wrapper and call it 'enterprise AI' - it breaks on your real documents." },
      { text: "No one measured accuracy on your data before you signed the contract." },
      { text: "The AI runs in their cloud. Your invoices never leave their servers - compliance nightmare." },
    ],
    capabilities: [
      {
        icon: "brain",
        title: "Document OCR & Extraction",
        description: "Turn paper invoices, receipts, and forms into structured data with validation rules.",
        usedInProject: "FreightFlow",
      },
      {
        icon: "beaker",
        title: "Anomaly Detection",
        description: "Flag unusual patterns in operational data - fuel consumption spikes, billing discrepancies.",
        usedInProject: "FreightFlow",
      },
      {
        icon: "auto",
        title: "Workflow Automation",
        description: "Trigger actions across systems when events occur - no manual copy-paste between tools.",
        usedInProject: "HisaabKitaab",
      },
      {
        icon: "bolt",
        title: "Automated Compliance Checks",
        description: "GST validation, PAN verification, and rule-based document screening at scale.",
        usedInProject: "HisaabKitaab",
      },
      {
        icon: "schema",
        title: "RAG Knowledge Bases",
        description: "Query your internal docs and SOPs with cited, grounded answers - not hallucinated guesses.",
        usedInProject: "FreightFlow",
      },
    ],
    process: [
      { title: "Process Audit", description: "We identify high-volume, repetitive tasks where automation delivers measurable ROI.", icon: "schema" },
      { title: "Data Assessment", description: "Sample your real documents and data to benchmark accuracy before building.", icon: "database" },
      { title: "Pipeline Build", description: "OCR, extraction, validation, and sync - each step logged and auditable.", icon: "code" },
      { title: "Accuracy Tuning", description: "Iterate on edge cases until accuracy meets your threshold for production.", icon: "beaker" },
      { title: "Deploy & Monitor", description: "Human-in-the-loop fallback queues and monitoring dashboards from day one.", icon: "monitor" },
    ],
    techStack: [
      {
        category: "AI Models",
        items: [
          { name: "OpenAI GPT-4", why: "Best-in-class for structured extraction and reasoning tasks." },
          { name: "Claude 3", why: "Strong document understanding with large context windows." },
          { name: "Tesseract OCR", why: "Open-source OCR for cost-effective batch processing." },
        ],
      },
      {
        category: "Frameworks",
        items: [
          { name: "LangChain", why: "Composable pipelines for multi-step AI workflows." },
          { name: "Python", why: "ML ecosystem standard - pandas, scikit-learn, and model APIs." },
          { name: "Node.js", why: "Integrate AI pipelines into existing MERN backends." },
        ],
      },
      {
        category: "Infrastructure",
        items: [
          { name: "PostgreSQL pgvector", why: "Store embeddings alongside your business data." },
          { name: "Redis", why: "Queue management for async document processing." },
          { name: "AWS Lambda", why: "Serverless scaling for bursty OCR workloads." },
        ],
      },
    ],
    proofOfWork: ["freightflow", "hisaabkitaab"],
    faqs: [
      { question: "How accurate is the AI on our specific documents?", answer: "We benchmark on your real data during discovery. Typical OCR extraction reaches 95%+ accuracy after tuning on Indian invoice formats." },
      { question: "Is our data used to train models?", answer: "No. We use API-based models with zero data retention policies. Your documents stay in your infrastructure." },
      { question: "What happens when the AI gets it wrong?", answer: "Every pipeline includes a human review queue for low-confidence extractions. Nothing syncs without passing validation rules." },
      { question: "Can this integrate with our existing ERP?", answer: "Yes. We build API connectors and webhook listeners to push structured data into any system you already use." },
      { question: "How long before automation is live?", answer: "A single-document-type pipeline typically goes live in 4–6 weeks including accuracy tuning." },
    ],
    metrics: SHARED_METRICS,
  },
  {
    slug: "saas-product-development",
    name: "SaaS Product Development",
    shortTitle: "SaaS Products",
    tagline: "A SaaS platform your first paying customer can use on day one.",
    quickSummary: "Multi-tenant SaaS with billing, onboarding, and infrastructure that scales from 10 to 10,000 users.",
    icon: "cloud",
    accentColor: "#22B6F6",
    gradient: "linear-gradient(135deg, #1155CC 0%, #22B6F6 100%)",
    nodePosition: { angle: 90, orbitRadiusX: 1, orbitRadiusY: 1 },
    keyTech: ["Next.js", "Node.js", "Stripe"],
    caseStudySlug: "freightflow",
    heroCode: `// tenant.config.ts
const tenant = await provision({
  plan: "professional",
  isolation: "row-level-security",
  billing: { provider: "razorpay", cycle: "monthly" },
  limits: { users: 50, storage: "10GB" },
});`,
    problemHeadline: "SaaS development agencies",
    painPoints: [
      { text: "They built your MVP as a single-tenant app. Now every new customer needs a separate deployment." },
      { text: "Billing was an afterthought - you're manually invoicing because Stripe integration never happened." },
      { text: "One customer's data leaked into another's dashboard. Multi-tenancy wasn't architected from day one." },
    ],
    capabilities: [
      {
        icon: "cloud",
        title: "Multi-Tenant Architecture",
        description: "Row-level security, tenant isolation, and per-tenant configuration without separate deployments.",
        usedInProject: "FreightFlow",
      },
      {
        icon: "schema",
        title: "Subscription Billing",
        description: "Plan tiers, usage metering, invoicing, and payment gateway integration built in from launch.",
        usedInProject: "FreightFlow",
      },
      {
        icon: "users",
        title: "Onboarding Flows",
        description: "Self-service signup, email verification, team invites, and guided setup wizards.",
        usedInProject: "SyncServe POS",
      },
      {
        icon: "monitor",
        title: "Admin Consoles",
        description: "Platform-level dashboards for tenant management, usage analytics, and support tooling.",
        usedInProject: "FreightFlow",
      },
      {
        icon: "database",
        title: "Usage Analytics",
        description: "Track feature adoption, active users, and churn signals per tenant.",
        usedInProject: "SyncServe POS",
      },
      {
        icon: "shield",
        title: "Compliance Modules",
        description: "GST engines, e-Invoice generation, and audit trails for regulated industries.",
        usedInProject: "HisaabKitaab",
      },
    ],
    process: [
      { title: "Product Scoping", description: "Define MVP features, pricing tiers, and tenant model before architecture.", icon: "lightbulb" },
      { title: "Tenant Architecture", description: "Database schema, auth model, and billing integration designed for multi-tenancy.", icon: "schema" },
      { title: "Core Build", description: "Auth, billing, onboarding, and primary feature set in iterative sprints.", icon: "code" },
      { title: "Beta Launch", description: "Deploy to staging, onboard 2–3 pilot customers, collect feedback.", icon: "cloud" },
      { title: "Scale Prep", description: "Load testing, monitoring, and infrastructure automation for growth.", icon: "trend" },
    ],
    techStack: [
      {
        category: "Frontend",
        items: [
          { name: "Next.js", why: "App Router with server components for fast SaaS dashboards." },
          { name: "React", why: "Rich interactive UIs for complex multi-tenant admin panels." },
          { name: "Tailwind CSS", why: "Consistent design system across tenant-facing and admin views." },
        ],
      },
      {
        category: "Backend",
        items: [
          { name: "Node.js", why: "Unified stack with frontend - one team ships faster." },
          { name: "Prisma", why: "Type-safe ORM with migration tooling for evolving schemas." },
          { name: "Supabase", why: "Auth, RLS, and real-time subscriptions out of the box." },
        ],
      },
      {
        category: "Infrastructure",
        items: [
          { name: "Razorpay", why: "Indian payment gateway with subscription and UPI support." },
          { name: "Vercel", why: "Zero-config deployments with preview environments per branch." },
          { name: "Turborepo", why: "Monorepo tooling for shared packages across web and mobile." },
        ],
      },
    ],
    proofOfWork: ["freightflow", "syncserve-pos"],
    faqs: [
      { question: "How long before I see a working version?", answer: "A functional multi-tenant MVP with auth and billing typically ships in 10–14 weeks." },
      { question: "Will I own the source code?", answer: "100%. Full repository access, documentation, and deployment rights transfer to you." },
      { question: "Do you handle payment gateway integration?", answer: "Yes - Razorpay, Stripe, or your preferred provider, including subscription lifecycle management." },
      { question: "How do you ensure tenant data isolation?", answer: "Row-level security policies, separate schema strategies, or dedicated databases - depending on your compliance needs." },
      { question: "Can you add features after launch?", answer: "Yes. We offer post-launch retainers or per-sprint feature development with clear scope documents." },
    ],
    metrics: SHARED_METRICS,
  },
  {
    slug: "web-development",
    name: "Web Application Development",
    shortTitle: "Web Apps",
    tagline: "Web apps that load fast, work offline, and convert visitors into users.",
    quickSummary: "High-performance React and Next.js applications built for Core Web Vitals and real user traffic.",
    icon: "monitor",
    accentColor: "#22B6F6",
    gradient: "linear-gradient(135deg, #1155CC 0%, #22B6F6 100%)",
    nodePosition: { angle: 135, orbitRadiusX: 1, orbitRadiusY: 1 },
    keyTech: ["React", "TypeScript", "Tailwind"],
    heroCode: `// app.config.ts
export const webApp = {
  framework: "next.js",
  rendering: "hybrid", // SSR + static
  performance: { lcp: "<1.2s", cls: "<0.1" },
  pwa: { offline: true, installable: true },
};`,
    problemHeadline: "web development agencies",
    painPoints: [
      { text: "The site looks great in the demo but scores 40 on Lighthouse when real content loads." },
      { text: "They used a page builder. Now every layout change needs a developer anyway." },
      { text: "Mobile is an afterthought - pinch-zooming a desktop layout is not a responsive design." },
    ],
    capabilities: [
      {
        icon: "monitor",
        title: "Single Page Applications",
        description: "Fast, app-like experiences with client-side routing and optimistic UI updates.",
        usedInProject: "Sound Sphere Marketplace",
      },
      {
        icon: "bolt",
        title: "Progressive Web Apps",
        description: "Installable, offline-capable web apps that work when connectivity drops.",
        usedInProject: "SyncServe POS",
      },
      {
        icon: "speed",
        title: "Performance-Optimized Frontends",
        description: "Code splitting, image optimization, and caching strategies for sub-second load times.",
        usedInProject: "Agraj Enterprise",
      },
      {
        icon: "image",
        title: "Marketing & Corporate Sites",
        description: "SEO-optimized sites with CMS integration your marketing team can update independently.",
        usedInProject: "Agraj Enterprise",
      },
      {
        icon: "schema",
        title: "Admin Dashboards",
        description: "Data-dense interfaces with real-time charts, filters, and bulk operations.",
        usedInProject: "SyncServe POS",
      },
    ],
    process: [
      { title: "UX Mapping", description: "User flows, wireframes, and component inventory before development starts.", icon: "image" },
      { title: "Component Build", description: "Design system and reusable components - consistent UI across every page.", icon: "code" },
      { title: "Integration", description: "API connections, auth flows, and third-party service wiring.", icon: "schema" },
      { title: "Performance Pass", description: "Lighthouse audit, bundle analysis, and Core Web Vitals optimization.", icon: "speed" },
      { title: "Launch", description: "CDN setup, SSL, monitoring, and SEO structured data deployment.", icon: "cloud" },
    ],
    techStack: [
      {
        category: "Frameworks",
        items: [
          { name: "Next.js", why: "Hybrid rendering, API routes, and image optimization built in." },
          { name: "React", why: "Largest component ecosystem and hiring pool for long-term maintenance." },
          { name: "TypeScript", why: "Type safety across components, API calls, and state management." },
        ],
      },
      {
        category: "Styling",
        items: [
          { name: "Tailwind CSS", why: "Utility-first CSS with consistent design tokens and small bundle size." },
          { name: "Framer Motion", why: "Production-ready animations without layout thrashing." },
        ],
      },
      {
        category: "State & Data",
        items: [
          { name: "React Query", why: "Server state caching, background refetch, and optimistic updates." },
          { name: "Zustand", why: "Minimal client state without Redux boilerplate." },
          { name: "Redux Toolkit", why: "Complex multi-slice state for large SPAs with persistence." },
        ],
      },
    ],
    proofOfWork: ["syncserve-pos", "techsonance-marketplace", "agraj-enterprise"],
    faqs: [
      { question: "How long before I see a working version?", answer: "A functional frontend prototype is typically ready in 3–4 weeks. Full production app in 8–12 weeks." },
      { question: "Will the site work on mobile?", answer: "Every app we build is mobile-first responsive - tested on real devices, not just browser resize." },
      { question: "Can you revamp an existing web app?", answer: "Yes. We audit the current codebase, identify performance bottlenecks, and migrate incrementally." },
      { question: "Do you handle SEO?", answer: "Server-side rendering, meta tags, structured data (JSON-LD), and sitemap generation are standard." },
      { question: "What about hosting and deployment?", answer: "We deploy to Vercel, AWS, or your preferred provider with CI/CD pipelines configured." },
    ],
    metrics: SHARED_METRICS,
  },
  {
    slug: "mobile-development",
    name: "Mobile App Development",
    shortTitle: "Mobile Apps",
    tagline: "One codebase. iOS and Android. Shipped to the stores.",
    quickSummary: "Cross-platform mobile apps with native performance - field tools, driver apps, and consumer products.",
    icon: "box",
    accentColor: "#22B6F6",
    gradient: "linear-gradient(135deg, #1155CC 0%, #22B6F6 100%)",
    nodePosition: { angle: 180, orbitRadiusX: 1, orbitRadiusY: 1 },
    keyTech: ["React Native", "Expo", "TypeScript"],
    heroCode: `// mobile-app.config.ts
export const app = {
  platform: "react-native",
  targets: ["ios", "android"],
  offline: { sync: "background", storage: "sqlite" },
  features: ["camera", "gps", "push-notifications"],
};`,
    problemHeadline: "mobile app development agencies",
    painPoints: [
      { text: "They quoted native iOS + Android separately. Your budget only covers one platform." },
      { text: "The app works in the simulator but crashes on half the Android devices your users actually have." },
      { text: "App Store rejection on launch day because push notifications and privacy policies weren't handled." },
    ],
    capabilities: [
      {
        icon: "box",
        title: "Cross-Platform Apps",
        description: "React Native apps that share 90%+ code between iOS and Android without compromising UX.",
        usedInProject: "FreightFlow",
      },
      {
        icon: "bolt",
        title: "Offline-First Mobile",
        description: "Local data storage with background sync - apps that work without connectivity.",
        usedInProject: "NFC Attendance System",
      },
      {
        icon: "monitor",
        title: "Field & Driver Apps",
        description: "GPS-tagged proof of delivery, expense capture, and real-time status updates from the field.",
        usedInProject: "FreightFlow",
      },
      {
        icon: "shield",
        title: "Hardware Integration",
        description: "NFC readers, barcode scanners, and Bluetooth peripherals connected to mobile workflows.",
        usedInProject: "NFC Attendance System",
      },
      {
        icon: "cloud",
        title: "POS & Retail Mobile",
        description: "Mobile billing terminals with barcode scanning and receipt printing.",
        usedInProject: "SyncServe POS",
      },
    ],
    process: [
      { title: "Prototype", description: "Interactive wireframes on device - validate flows before writing production code.", icon: "image" },
      { title: "Development", description: "Component-driven React Native build with shared API layer to your backend.", icon: "code" },
      { title: "Device Testing", description: "QA on real iOS and Android devices across screen sizes and OS versions.", icon: "shield" },
      { title: "Store Submission", description: "App Store and Play Store assets, privacy policies, and review management.", icon: "cloud" },
      { title: "OTA Updates", description: "Over-the-air update pipeline for bug fixes without store review delays.", icon: "auto" },
    ],
    techStack: [
      {
        category: "Frameworks",
        items: [
          { name: "React Native", why: "One codebase for iOS and Android with native module access." },
          { name: "Expo", why: "Faster development with managed builds and OTA updates." },
          { name: "TypeScript", why: "Type safety across shared business logic and API contracts." },
        ],
      },
      {
        category: "Native Features",
        items: [
          { name: "React Native Camera", why: "Receipt photos, barcode scanning, and document capture." },
          { name: "React Native Maps", why: "GPS tracking, route visualization, and geofencing." },
          { name: "Push Notifications", why: "FCM and APNs integration for real-time alerts." },
        ],
      },
      {
        category: "Backend",
        items: [
          { name: "Node.js", why: "Shared API layer with your web application." },
          { name: "Supabase", why: "Real-time subscriptions and auth for mobile clients." },
          { name: "SQLite", why: "Local offline storage with sync on reconnect." },
        ],
      },
    ],
    proofOfWork: ["freightflow", "syncserve-pos", "nfc-attendance"],
    faqs: [
      { question: "React Native or native - which do you recommend?", answer: "React Native for 90% of use cases. Saves 40–60% development cost while delivering native-quality UX." },
      { question: "Do you handle App Store submission?", answer: "Yes - we manage the entire process including assets, privacy policies, and review responses." },
      { question: "How long before I see a working version?", answer: "A testable build on your phone within 4–5 weeks. Store-ready app in 10–14 weeks." },
      { question: "Will the app work offline?", answer: "We build offline-first when your use case requires it - local storage with background sync." },
      { question: "Can you add features after launch?", answer: "Yes. OTA updates for minor fixes, store releases for major feature additions." },
    ],
    metrics: SHARED_METRICS,
  },
  {
    slug: "cloud-devops",
    name: "Cloud & DevOps Engineering",
    shortTitle: "Cloud & DevOps",
    tagline: "Infrastructure that deploys in minutes and stays up without 3 AM pages.",
    quickSummary: "CI/CD pipelines, containerized deployments, and cloud architecture for production reliability.",
    icon: "dns",
    accentColor: "#22B6F6",
    gradient: "linear-gradient(135deg, #1155CC 0%, #22B6F6 100%)",
    nodePosition: { angle: 225, orbitRadiusX: 1, orbitRadiusY: 1 },
    keyTech: ["AWS", "Docker", "GitHub Actions"],
    heroCode: `# deploy.yml - push to main → production
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: docker build -t app .
      - run: deploy --env production
      # → zero-downtime rollout in ~3 min`,
    problemHeadline: "cloud and DevOps agencies",
    painPoints: [
      { text: "Deployments are manual SSH sessions. One wrong command takes down production." },
      { text: "Your AWS bill doubled and no one can tell you which service is responsible." },
      { text: "There's no staging environment. Every test happens directly on production data." },
    ],
    capabilities: [
      {
        icon: "cloud",
        title: "Cloud Architecture",
        description: "Multi-tenant SaaS infrastructure with auto-scaling, load balancing, and regional deployment.",
        usedInProject: "FreightFlow",
      },
      {
        icon: "auto",
        title: "CI/CD Pipelines",
        description: "Automated test, build, and deploy on every merge - preview environments per PR.",
        usedInProject: "SyncServe POS",
      },
      {
        icon: "dns",
        title: "Container Orchestration",
        description: "Docker containers with health checks, rolling updates, and resource limits.",
        usedInProject: "FreightFlow",
      },
      {
        icon: "shield",
        title: "Infrastructure as Code",
        description: "Terraform or Pulumi configs - reproducible environments, no snowflake servers.",
        usedInProject: "FreightFlow",
      },
      {
        icon: "monitor",
        title: "Monitoring & Alerting",
        description: "Uptime checks, error tracking, and cost dashboards with actionable alerts.",
        usedInProject: "SyncServe POS",
      },
    ],
    process: [
      { title: "Infrastructure Audit", description: "Map current deployments, costs, bottlenecks, and single points of failure.", icon: "schema" },
      { title: "Architecture Design", description: "Cloud topology, networking, and security model documented before changes.", icon: "schema" },
      { title: "Pipeline Setup", description: "CI/CD with automated tests, linting, and staged deployments.", icon: "auto" },
      { title: "Migration", description: "Zero-downtime migration with rollback plan and data integrity checks.", icon: "cloud" },
      { title: "Runbooks", description: "Incident response procedures, scaling guides, and cost optimization playbook.", icon: "handshake" },
    ],
    techStack: [
      {
        category: "Cloud Providers",
        items: [
          { name: "AWS", why: "Broadest service catalog for Indian compliance and data residency." },
          { name: "Vercel", why: "Zero-config frontend deployments with edge caching." },
          { name: "Supabase", why: "Managed Postgres with auth, storage, and real-time built in." },
        ],
      },
      {
        category: "Containers",
        items: [
          { name: "Docker", why: "Consistent environments from development to production." },
          { name: "Turborepo", why: "Monorepo build caching for faster CI pipelines." },
          { name: "GitHub Actions", why: "Native CI/CD integrated with your repository workflow." },
        ],
      },
      {
        category: "Monitoring",
        items: [
          { name: "Upstash Redis", why: "Serverless Redis for rate limiting and job queues." },
          { name: "Sentry", why: "Error tracking with stack traces and release tracking." },
          { name: "CloudWatch", why: "AWS-native metrics, logs, and alerting." },
        ],
      },
    ],
    proofOfWork: ["freightflow", "syncserve-pos"],
    faqs: [
      { question: "Can you migrate us to AWS without downtime?", answer: "Yes. We use blue-green deployments and database replication for zero-downtime migrations." },
      { question: "How do you handle cost optimization?", answer: "Right-sizing instances, reserved capacity analysis, and automated shutdown of non-production resources." },
      { question: "Do you set up monitoring?", answer: "Uptime checks, error tracking (Sentry), and cost alerts are standard in every engagement." },
      { question: "What about security?", answer: "VPC isolation, secrets management, IAM least-privilege policies, and SSL/TLS everywhere." },
      { question: "Can you work with our existing infrastructure?", answer: "We audit first, then improve incrementally - no rip-and-replace unless necessary." },
    ],
    metrics: SHARED_METRICS,
  },
  {
    slug: "api-integrations",
    name: "API & Systems Integration",
    shortTitle: "API Integration",
    tagline: "Your systems talk to each other - automatically, reliably, in real time.",
    quickSummary: "Custom APIs and third-party integrations that unify data across your business tools.",
    icon: "schema",
    accentColor: "#22B6F6",
    gradient: "linear-gradient(135deg, #1155CC 0%, #22B6F6 100%)",
    nodePosition: { angle: 270, orbitRadiusX: 1, orbitRadiusY: 1 },
    keyTech: ["REST", "GraphQL", "Webhooks"],
    caseStudySlug: "syncserve-pos",
    heroCode: `// integration-hub.ts
await hub.connect({
  sources: ["erp", "payment-gateway", "gst-portal"],
  sync: "real-time",
  retry: { max: 3, backoff: "exponential" },
  deadLetter: "admin-queue",
});`,
    problemHeadline: "API integration agencies",
    painPoints: [
      { text: "Your team copies data between three systems every morning. That's not a workflow - it's a liability." },
      { text: "The last integration broke silently. You found out when invoices didn't match three weeks later." },
      { text: "They built a point-to-point connection. Adding a fourth system means starting over." },
    ],
    capabilities: [
      {
        icon: "schema",
        title: "Custom REST & GraphQL APIs",
        description: "Well-documented APIs with versioning, rate limiting, and OpenAPI specs.",
        usedInProject: "FreightFlow",
      },
      {
        icon: "bolt",
        title: "Payment Gateway Integration",
        description: "Razorpay, Stripe, and UPI payment flows with webhook reconciliation.",
        usedInProject: "FreightFlow",
      },
      {
        icon: "shield",
        title: "Government API Integration",
        description: "GST portal, e-Way Bill NIC API, e-Invoice IRN generation for Indian compliance.",
        usedInProject: "FreightFlow",
      },
      {
        icon: "database",
        title: "ERP & Accounting Sync",
        description: "Bi-directional sync between your app and Tally, Zoho Books, or custom ERPs.",
        usedInProject: "HisaabKitaab",
      },
      {
        icon: "auto",
        title: "Multi-Outlet Data Sync",
        description: "Real-time inventory and pricing sync across retail locations with conflict resolution.",
        usedInProject: "SyncServe POS",
      },
    ],
    process: [
      { title: "Data Mapping", description: "Document every data flow, endpoint, and transformation rule before building.", icon: "schema" },
      { title: "API Design", description: "Contract-first API design with authentication, pagination, and error standards.", icon: "code" },
      { title: "Integration Build", description: "Connectors with retry logic, dead-letter queues, and idempotent operations.", icon: "bolt" },
      { title: "Validation", description: "End-to-end testing with production-like data volumes and edge cases.", icon: "shield" },
      { title: "Monitoring", description: "Health dashboards, sync lag alerts, and automated reconciliation reports.", icon: "monitor" },
    ],
    techStack: [
      {
        category: "Protocols",
        items: [
          { name: "REST", why: "Universal standard - every third-party service supports it." },
          { name: "GraphQL", why: "Flexible queries when clients need different data shapes." },
          { name: "Webhooks", why: "Real-time event delivery without polling overhead." },
        ],
      },
      {
        category: "Messaging",
        items: [
          { name: "Redis Pub/Sub", why: "Lightweight real-time event distribution." },
          { name: "Bull Queue", why: "Reliable job processing with retry and dead-letter support." },
          { name: "RabbitMQ", why: "Enterprise message broker for high-throughput integrations." },
        ],
      },
      {
        category: "Gateways",
        items: [
          { name: "Kong", why: "API gateway with rate limiting, auth, and analytics." },
          { name: "AWS API Gateway", why: "Managed gateway with Lambda integration." },
          { name: "Nginx", why: "Reverse proxy and load balancing for self-hosted APIs." },
        ],
      },
    ],
    proofOfWork: ["freightflow", "syncserve-pos", "hisaabkitaab"],
    faqs: [
      { question: "Can you integrate with legacy systems?", answer: "Yes - we build adapters for SOAP APIs, flat-file imports, and direct database connections." },
      { question: "How do you handle API failures?", answer: "Exponential backoff retries, dead-letter queues, and admin alerts. No silent data loss." },
      { question: "How long does a typical integration take?", answer: "A single two-system integration ships in 2–4 weeks. Hub architectures take 6–8 weeks." },
      { question: "Do you document the APIs?", answer: "OpenAPI/Swagger specs, integration guides, and webhook event catalogs are standard deliverables." },
      { question: "What about rate limits from third parties?", answer: "We implement queuing, caching, and backoff strategies to stay within provider limits." },
    ],
    metrics: SHARED_METRICS,
  },
  {
    slug: "product-engineering",
    name: "Product Engineering",
    shortTitle: "Product Eng.",
    tagline: "From validated idea to paying users - without burning six months on the wrong features.",
    quickSummary: "End-to-end product development for startups - strategy, design, engineering, and launch.",
    icon: "lightbulb",
    accentColor: "#22B6F6",
    gradient: "linear-gradient(135deg, #1155CC 0%, #22B6F6 100%)",
    nodePosition: { angle: 315, orbitRadiusX: 1, orbitRadiusY: 1 },
    keyTech: ["Full-stack", "Agile", "MERN"],
    heroCode: `// product-roadmap.ts
const v1 = await ship({
  scope: "core-value-only",
  timeline: "10-weeks",
  metrics: ["signup", "activation", "retention"],
  iterate: "weekly-releases",
});`,
    problemHeadline: "product engineering agencies",
    painPoints: [
      { text: "They built every feature you mentioned instead of the three that actually matter for launch." },
      { text: "No one tracked whether users actually used what was built. Vanity metrics don't pay bills." },
      { text: "The MVP took nine months. Your competitor launched in three with half the features." },
    ],
    capabilities: [
      {
        icon: "lightbulb",
        title: "MVP Scoping",
        description: "Ruthless feature prioritization - ship the smallest thing that delivers core value.",
        usedInProject: "FreightFlow",
      },
      {
        icon: "code",
        title: "Full-Stack Development",
        description: "Frontend, backend, database, and deployment - one team owns the entire stack.",
        usedInProject: "SyncServe POS",
      },
      {
        icon: "trend",
        title: "Iterative Releases",
        description: "Weekly deployable increments with user feedback loops built into the process.",
        usedInProject: "Sound Sphere Marketplace",
      },
      {
        icon: "users",
        title: "Multi-Stakeholder Products",
        description: "Products with distinct user roles - customers, vendors, admins - each with tailored experiences.",
        usedInProject: "Sound Sphere Marketplace",
      },
      {
        icon: "cloud",
        title: "Launch Infrastructure",
        description: "Production deployment, monitoring, and analytics configured before go-live.",
        usedInProject: "FreightFlow",
      },
    ],
    process: [
      { title: "Discovery", description: "Problem validation, competitive analysis, and feature prioritization workshop.", icon: "schema" },
      { title: "Prototype", description: "Clickable prototype for user testing before committing to full development.", icon: "image" },
      { title: "Build", description: "Two-week sprints with demoable increments and scope control.", icon: "code" },
      { title: "Beta", description: "Limited release to early users - collect feedback, fix friction points.", icon: "users" },
      { title: "Launch", description: "Production deployment, analytics setup, and post-launch iteration plan.", icon: "trend" },
    ],
    techStack: [
      {
        category: "Frontend",
        items: [
          { name: "React", why: "Rapid UI development with the largest component ecosystem." },
          { name: "Next.js", why: "Full-stack framework - ship frontend and API together." },
          { name: "TypeScript", why: "Catch bugs early when you're moving fast." },
        ],
      },
      {
        category: "Backend",
        items: [
          { name: "Node.js", why: "JavaScript across the stack - one language, faster hiring." },
          { name: "PostgreSQL", why: "Reliable relational data for products that will scale." },
          { name: "Prisma", why: "Schema migrations and type-safe queries for evolving products." },
        ],
      },
      {
        category: "Product Tools",
        items: [
          { name: "Linear", why: "Sprint tracking with clear priorities and progress visibility." },
          { name: "Figma", why: "Design handoff with component specs for pixel-accurate builds." },
          { name: "PostHog", why: "Product analytics to measure what users actually do." },
        ],
      },
    ],
    proofOfWork: ["freightflow", "syncserve-pos", "techsonance-marketplace"],
    faqs: [
      { question: "Do you help with product strategy?", answer: "Yes. We run discovery workshops to define MVP scope, pricing, and go-to-market technical requirements." },
      { question: "How do we track progress?", answer: "Weekly demos, Linear board access, and sprint reports. You see working software every two weeks." },
      { question: "How long before I see a working version?", answer: "Clickable prototype in 2–3 weeks. Functional MVP in 8–12 weeks depending on complexity." },
      { question: "Will I own the source code?", answer: "Full IP ownership transfers on final payment. Repository, docs, and deployment access included." },
      { question: "What happens after launch?", answer: "We offer post-launch retainers for iteration, scaling, and new feature development." },
    ],
    metrics: SHARED_METRICS,
  },
];

const COMMON_TECH_STACK: TechStackGroup[] = [
  {
    category: "Frontend",
    items: [
      { name: "React", why: "Component model scales with complex UIs and has the largest hiring pool." },
      { name: "Next.js", why: "SSR, routing, and API routes in one framework - faster time to production." },
      { name: "TypeScript", why: "Catches integration bugs at compile time across large codebases." },
    ],
  },
  {
    category: "Backend",
    items: [
      { name: "Node.js", why: "Shared language with frontend - one team, faster iteration." },
      { name: "NestJS", why: "Structured modules and DI for enterprise-grade API design." },
      { name: "Express", why: "Lightweight when you need speed over ceremony." },
    ],
  },
  {
    category: "Database",
    items: [
      { name: "PostgreSQL", why: "ACID compliance, JSON support, and row-level security for multi-tenant apps." },
      { name: "MongoDB", why: "Flexible schema for rapid prototyping and document-heavy domains." },
      { name: "Redis", why: "Session caching, rate limiting, and job queues." },
    ],
  },
];

export const services: Service[] = rawServicesList.map((service) => ({
  ...service,
  capabilities: enrichCapabilities(service.slug, service.capabilities),
  techStack: COMMON_TECH_STACK,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function getProofOfWorkForService(slugs: string[]): ProjectCard[] {
  return slugs
    .map((slug) => {
      const project = getProjectBySlug(slug);
      if (!project) return null;
      const techNames = project.techStack.slice(0, 5).map((t) => t.name);
      return {
        slug: project.slug,
        name: project.title,
        industry: project.industry,
        outcome: project.result,
        techStack: techNames,
        href: `/portfolio/${project.slug}`,
        image: project.screenshotPath || "/images/projects/placeholder-techsonance-marketplace.png",
        tech: techNames,
        link: `/portfolio/${project.slug}`,
      };
    })
    .filter((card): card is ProjectCard => card !== null);
}