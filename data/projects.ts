// ─── TechSonance Projects Data ─────────────────────────────────────────────
// Single source of truth for all project/case study content.
// To add a new project: add an object to the `projects` array below.

export interface TechBadge {
  name: string;
  category: "frontend" | "backend" | "database" | "infra" | "ai" | "mobile";
}

export interface ProjectMetric {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
}

export interface ProjectChallenge {
  title: string;
  description: string;
  icon: string; // emoji or icon name
}

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  category: string;
  industry: string;
  liveUrl?: string;
  featured: boolean;
  featuredOrder?: number; // 1, 2, 3 for home page ordering
  shortDescription: string;
  overview: string;

  challenge: string;       // one-liner challenge for home featured
  solution: string;        // one-liner solution for home featured
  result: string;          // one-liner result for home featured

  challenges: ProjectChallenge[];
  solutions: string[];
  metrics: ProjectMetric[];

  techStack: TechBadge[];

  // Visual identity
  accentColor: string;       // hex - used for glow/borders
  mockupGradient: string;    // CSS gradient for placeholder mockup panel
  screenshotPath?: string;   // primary screenshot shown in mockup
  screenshots?: { src: string; caption: string }[]; // gallery for detail page
}

export const projects: Project[] = [
  // ── 1. FreightFlow ─────────────────────────────────────────────────────────
  {
    slug: "freightflow",
    title: "FreightFlow",
    tagline: "Every Trip. Every Rupee. Every Mile - In Control.",
    category: "SaaS Platform",
    industry: "Logistics & Transport",
    liveUrl: "https://freightflow.techsonance.co.in/dashboard",
    featured: true,
    featuredOrder: 1,
    shortDescription:
      "A full-stack multi-tenant SaaS platform built exclusively for Indian road transport businesses - replacing disconnected spreadsheets with a single, purpose-built digital ecosystem.",
    overview:
      "FreightFlow replaces paper lorry receipts, Excel invoices, and disjointed accounting tools with a single unified platform. It handles everything from LR creation to GST filing, fleet tracking to driver payroll - all in real time.",

    challenge: "Indian transport businesses drowning in paper LRs, manual GST calculations, and zero real-time fleet visibility.",
    solution: "Multi-tenant SaaS with automated GST/e-Way Bill, per-trip P&L, and a React Native driver app.",
    result: "100% digital operations, zero missed compliance deadlines, real-time profitability per truck.",

    challenges: [
      {
        title: "Manual Paperwork",
        description: "Hundreds of paper LRs per day causing data loss, billing delays, and disputes between transporters and consignees.",
        icon: "📄",
      },
      {
        title: "GST Complexity",
        description: "Automated CGST/SGST/IGST, RCM for GTA, e-Invoice IRN generation, and GSTR-1/3B preparation - Indian compliance is complex.",
        icon: "🧾",
      },
      {
        title: "Zero Fleet Visibility",
        description: "Owners had no real-time data on vehicle locations, fuel consumption, or per-trip profitability.",
        icon: "🚛",
      },
    ],
    solutions: [
      "Multi-tenant architecture with Row-Level Security - complete data isolation between customers",
      "Automated GST engine: CGST/SGST/IGST, RCM, e-Way Bill NIC API integration",
      "Per-trip P&L dashboard: freight earned vs. fuel, toll, driver wages, repairs",
      "React Native driver app for expense capture with receipt photos & GPS-tagged POD",
      "Vehicle document expiry alerts (insurance, fitness, permit, PUC)",
      "AI-powered OCR for vendor invoice extraction and anomaly detection on fuel consumption",
    ],
    metrics: [
      { value: "100", suffix: "%", label: "Paperless Operations" },
      { value: "18", label: "Modules Available" },
      { value: "500+", label: "Trucks Supported per Tenant" },
      { value: "0", label: "Compliance Misses" },
    ],
    techStack: [
      { name: "Next.js 16", category: "frontend" },
      { name: "React 19", category: "frontend" },
      { name: "TypeScript", category: "frontend" },
      { name: "Tailwind CSS 4", category: "frontend" },
      { name: "Supabase (PostgreSQL)", category: "database" },
      { name: "Prisma ORM", category: "database" },
      { name: "Node.js", category: "backend" },
      { name: "Upstash Redis", category: "infra" },
      { name: "Turborepo", category: "infra" },
      { name: "React Native", category: "mobile" },
      { name: "Razorpay", category: "backend" },
    ],
    accentColor: "#0D47A1",
    mockupGradient: "linear-gradient(135deg, #0D47A1 0%, #1565C0 40%, #0288D1 100%)",
    screenshotPath: "/images/projects/freightflow/freightflow-logistics-platform-login-screen.png",
    screenshots: [
      {
        src: "/images/projects/freightflow/freightflow-logistics-platform-login-screen.png",
        caption: "Login & Splash - Branded entry screen with secure authentication",
      },
      {
        src: "/images/projects/freightflow/freightflow-logistics-fleet-management-dashboard.png",
        caption: "Mission Control Dashboard - Real-time KPIs, fleet status & revenue at a glance",
      },
      {
        src: "/images/projects/freightflow/freightflow-logistics-lorry-receipt-listing.png",
        caption: "Lorry Receipts - Digital LR management with search, filter & bulk actions",
      },
      {
        src: "/images/projects/freightflow/freightflow-logistics-create-lorry-receipt.png",
        caption: "Create Lorry Receipt - Multi-duct LR form with GST, e-Way Bill & auto-numbering",
      },
    ],
  },

  // ── 2. SyncServe POS ───────────────────────────────────────────────────────
  {
    slug: "syncserve-pos",
    title: "SyncServe POS",
    tagline: "Point of Sale Reimagined for Modern Retail.",
    category: "POS System",
    industry: "Retail & Hospitality",
    liveUrl: "https://syncserve.techsonance.co.in/",
    featured: true,
    featuredOrder: 2,
    shortDescription:
      "A cloud-native Point of Sale system built for modern retail and hospitality - featuring real-time inventory sync, multi-outlet management, and offline-first transactions.",
    overview:
      "SyncServe is a modern cloud POS platform that works online and offline. It supports multi-location retail with real-time inventory synchronization, billing, and analytics - all accessible from any device.",

    challenge: "Retail businesses using outdated POS systems with no cloud sync, offline capability, or multi-outlet support.",
    solution: "Cloud-native POS with offline-first architecture, real-time inventory sync across outlets, and mobile billing.",
    result: "Zero billing downtime even during network outages, 3× faster checkout, unified multi-store dashboard.",

    challenges: [
      {
        title: "Offline Reliability",
        description: "Retail floors frequently lose internet. POS systems must continue working and sync automatically when connection restores.",
        icon: "📡",
      },
      {
        title: "Multi-Outlet Chaos",
        description: "Managing inventory, pricing, and staff across multiple store locations was fragmented and error-prone.",
        icon: "🏪",
      },
      {
        title: "Slow Checkout",
        description: "Legacy systems caused long queues. Customers and cashiers needed a fast, intuitive billing experience.",
        icon: "⚡",
      },
    ],
    solutions: [
      "Offline-first architecture with local IndexedDB cache and automatic background sync",
      "Real-time inventory management with multi-outlet sync and conflict resolution",
      "Barcode scanner integration and quick-search product lookup",
      "Customer loyalty program with points tracking and automated discounts",
      "Role-based access: Owner, Manager, Cashier with granular permissions",
      "Analytics dashboard: revenue trends, top products, peak hours",
    ],
    metrics: [
      { value: "3×", label: "Faster Checkout Speed" },
      { value: "99.9", suffix: "%", label: "Uptime (offline+online)" },
      { value: "0", label: "Data Loss During Outages" },
      { value: "Multi", label: "Outlet Ready" },
    ],
    techStack: [
      { name: "React", category: "frontend" },
      { name: "TypeScript", category: "frontend" },
      { name: "Tailwind CSS", category: "frontend" },
      { name: "Node.js", category: "backend" },
      { name: "Express.js", category: "backend" },
      { name: "PostgreSQL", category: "database" },
      { name: "Redis", category: "database" },
      { name: "IndexedDB", category: "frontend" },
    ],
    accentColor: "#0D47A1",
    mockupGradient: "linear-gradient(135deg, #0D47A1 0%, #1565C0 40%, #0288D1 100%)",
    screenshotPath: "/images/projects/syncserve/syncserve-retail-pos-login-screen.png",
    screenshots: [
      {
        src: "/images/projects/syncserve/syncserve-retail-pos-login-screen.png",
        caption: "Cloud POS Login - Secure, branded outlet authentication page",
      },
      {
        src: "/images/projects/syncserve/syncserve-retail-pos-billing-terminal.png",
        caption: "Retail POS Billing Interface - Fast checkout with barcode scanning & dynamic discounts",
      },
      {
        src: "/images/projects/syncserve/syncserve-retail-pos-inventory-management.png",
        caption: "Inventory Management - Real-time stock tracking and low-stock indicators",
      },
      {
        src: "/images/projects/syncserve/syncserve-retail-pos-sales-analytics.png",
        caption: "Sales & Analytics Dashboard - Live metrics on revenue, top products, and store performance",
      },
      {
        src: "/images/projects/syncserve/syncserve-retail-pos-terminal-settings.png",
        caption: "Outlet Terminal Settings - Granular printer configurations and cashier management",
      },
    ],
  },

  // ── 3. TechSonance Marketplace ─────────────────────────────────────────────
  {
    slug: "techsonance-marketplace",
    title: "Sound Sphere Marketplace",
    tagline: "A Multi-Vendor Commerce Platform at Scale.",
    category: "E-Commerce Platform",
    industry: "E-Commerce & Retail",
    liveUrl: "https://cms.techsonance.co.in/login",
    featured: true,
    featuredOrder: 3,
    shortDescription:
      "A comprehensive multi-tenant e-commerce marketplace where customers browse and purchase, vendors manage their stores, and admins oversee the platform - all from one React application.",
    overview:
      "Sound Sphere Marketplace is a production-grade multi-vendor platform with separate dashboards for Customers, Vendors, and Admins. It features advanced state management, real-time cart/wishlist sync, and a rich vendor analytics suite.",

    challenge: "Building a scalable multi-vendor marketplace with role-isolated dashboards, real-time cart sync, and vendor onboarding - all in a single SPA.",
    solution: "Redux Toolkit multi-slice architecture with localStorage persistence, role-based routing, and Recharts analytics.",
    result: "3 fully isolated role portals, <200ms cart updates, vendor-level financial reporting, and dark/light mode.",

    challenges: [
      {
        title: "Role Isolation",
        description: "Three distinct user types (Customer, Vendor, Admin) each need completely separate layouts, permissions, and data access.",
        icon: "🔐",
      },
      {
        title: "State Persistence",
        description: "Cart, wishlist, and auth state must persist across page refreshes without a backend round-trip.",
        icon: "💾",
      },
      {
        title: "Vendor Analytics",
        description: "Vendors needed real-time financial dashboards, inventory tracking, and order processing - all in one view.",
        icon: "📊",
      },
    ],
    solutions: [
      "7 Redux Toolkit slices with custom localStorage middleware for instant state restoration",
      "React Router v7 with ProtectedRoute components per role (admin/vendor/customer)",
      "Recharts-powered vendor financial dashboards with revenue trends and inventory charts",
      "Separate login/register portals per role with JWT token auth",
      "Embla Carousel for product showcases, React Day Picker for order date filtering",
      "shadcn/ui component system with dark/light theme toggle for admin panel",
    ],
    metrics: [
      { value: "3", label: "Role Portals" },
      { value: "7", label: "Redux Slices" },
      { value: "<200", suffix: "ms", label: "Cart Update Speed" },
      { value: "100", suffix: "%", label: "Type Safe" },
    ],
    techStack: [
      { name: "React 19", category: "frontend" },
      { name: "TypeScript", category: "frontend" },
      { name: "Vite 7", category: "infra" },
      { name: "Redux Toolkit", category: "frontend" },
      { name: "React Router v7", category: "frontend" },
      { name: "Tailwind CSS 4", category: "frontend" },
      { name: "Recharts", category: "frontend" },
      { name: "shadcn/ui", category: "frontend" },
      { name: "Zod", category: "backend" },
      { name: "Axios", category: "backend" },
    ],
    accentColor: "#0D47A1",
    mockupGradient: "linear-gradient(135deg, #0D47A1 0%, #1565C0 40%, #0288D1 100%)",
    screenshotPath: "/images/projects/placeholder-techsonance-marketplace.png",
  },

  // ── 4. HisaabKitaab ────────────────────────────────────────────────────────
  {
    slug: "hisaabkitaab",
    title: "HisaabKitaab",
    tagline: "Enterprise-Grade Invoicing for Indian Businesses.",
    category: "Accounting Software",
    industry: "FinTech & Accounting",
    liveUrl: "https://hisaabkitaab.techsonance.co.in/",
    featured: false,
    shortDescription:
      "A premium invoicing, inventory management, and digital accounting suite custom-tailored for Indian businesses - with strict GST validation, real-time PAN checks, and automated PDF/Excel exports.",
    overview:
      "HisaabKitaab is a full-stack Indian accounting platform with GST-aware billing, inventory tracking, and automated compliance reporting. Built with Next.js + MongoDB, it features micro-animations, real-time form validation, and role-based dashboards.",

    challenge: "Indian SMBs need GST-compliant invoicing with real-time tax calculations (CGST/IGST), PAN/bank validation, and PDF generation - all without a CA.",
    solution: "Zod-powered GST/Non-GST billing engine, instant PDF/Excel exports, and role-based dashboards for accountants and sales reps.",
    result: "Zero manual GST calculation errors, 5-minute invoice generation, automated low-stock alerts.",

    challenges: [
      {
        title: "GST Complexity",
        description: "Intra-state vs. inter-state supply triggers different tax rules (CGST+SGST vs. IGST). Businesses got this wrong constantly.",
        icon: "🧾",
      },
      {
        title: "PAN/Bank Validation",
        description: "Indian regulatory fields like PAN, GST numbers, and bank accounts have strict formats that most generic tools ignore.",
        icon: "🏦",
      },
      {
        title: "Inventory Sync",
        description: "Billing and inventory were managed separately, causing stock discrepancies and overbooking.",
        icon: "📦",
      },
    ],
    solutions: [
      "GST vs. Non-GST billing mode selector with dynamic CGST/SGST/IGST calculation",
      "Real-time PAN validation (regex: ^[A-Z]{5}[0-9]{4}[A-Z]{1}$) on every form",
      "Quick-Add modals for customers and products with React Query cache invalidation",
      "jsPDF + AutoTable for professional invoice PDFs with HSN/SAC codes",
      "SheetJS XLSX export for accounting data and sales reports",
      "Recharts dashboards: profit margins, sales trends, inventory stock levels",
    ],
    metrics: [
      { value: "0", label: "GST Calculation Errors" },
      { value: "5", suffix: "min", label: "Invoice Generation" },
      { value: "Auto", label: "PDF/Excel Export" },
      { value: "Real-time", label: "Inventory Sync" },
    ],
    techStack: [
      { name: "Next.js 16", category: "frontend" },
      { name: "React 19", category: "frontend" },
      { name: "TypeScript", category: "frontend" },
      { name: "Tailwind CSS 4", category: "frontend" },
      { name: "Framer Motion", category: "frontend" },
      { name: "Zustand", category: "frontend" },
      { name: "TanStack Query v5", category: "frontend" },
      { name: "Node.js + Express 5", category: "backend" },
      { name: "MongoDB + Mongoose", category: "database" },
      { name: "Zod", category: "backend" },
      { name: "jsPDF", category: "backend" },
    ],
    accentColor: "#00897B",
    mockupGradient: "linear-gradient(135deg, #004D40 0%, #00796B 40%, #26A69A 100%)",
    screenshotPath: "/images/projects/placeholder-hisaabkitaab.png",
  },

  // ── 5. NFC Attendance System ────────────────────────────────────────────────
  {
    slug: "nfc-attendance",
    title: "NFC Attendance System",
    tagline: "Tap to Clock In. No Friction. No Paper.",
    category: "Enterprise Tool",
    industry: "HR & Workforce Management",
    featured: false,
    shortDescription:
      "A production-grade NFC-based attendance management system for IT companies - with an admin dashboard, mobile PWA for NFC check-ins, and a standalone reader agent for hardware integration.",
    overview:
      "Built with Next.js 15 and Turso SQLite, this system handles NFC tag enrollment, real-time attendance tracking, role-based access, and offline buffering with automatic sync. Includes a Progressive Web App for mobile NFC check-ins.",

    challenge: "Manual attendance registers and PIN-based systems were slow, gameable, and produced no analyzable data.",
    solution: "NFC tap-to-check-in with offline buffering, RBAC, and a real-time admin dashboard with CSV export.",
    result: "Zero buddy-punching, instant attendance data, offline reliability with auto-sync.",

    challenges: [
      {
        title: "Hardware Integration",
        description: "Physical NFC readers (USB/Ethernet) needed a bridge between hardware events and the web application.",
        icon: "📡",
      },
      {
        title: "Offline Reliability",
        description: "Network drops in factories and warehouses meant check-ins would fail. Attendance data is too critical to lose.",
        icon: "🔌",
      },
      {
        title: "Role Complexity",
        description: "Admin, HR, Reader devices, and Employees all need different access levels with secure session management.",
        icon: "🔐",
      },
    ],
    solutions: [
      "Standalone Node.js Reader Agent for USB/Ethernet NFC hardware with offline buffering and automatic retry",
      "Progressive Web App with Web NFC API for mobile Chrome (Android) tap check-ins",
      "Better Auth (JWT) with 4 roles: Admin, HR, Reader, Employee",
      "Turso SQLite + Drizzle ORM for edge-optimized, fast local queries",
      "Real-time stats dashboard with auto-refresh, CSV export, and 30-day attendance history",
      "Service worker background sync - check-ins buffer locally and upload when reconnected",
    ],
    metrics: [
      { value: "0", label: "Buddy Punching" },
      { value: "490+", label: "Pre-loaded Records" },
      { value: "4", label: "User Roles" },
      { value: "PWA", label: "Mobile Ready" },
    ],
    techStack: [
      { name: "Next.js 15", category: "frontend" },
      { name: "TypeScript", category: "frontend" },
      { name: "Tailwind CSS", category: "frontend" },
      { name: "shadcn/ui", category: "frontend" },
      { name: "Turso (SQLite)", category: "database" },
      { name: "Drizzle ORM", category: "database" },
      { name: "Better Auth", category: "backend" },
      { name: "PWA / Service Worker", category: "infra" },
      { name: "Web NFC API", category: "frontend" },
    ],
    accentColor: "#F57C00",
    mockupGradient: "linear-gradient(135deg, #E65100 0%, #F57C00 40%, #FFB74D 100%)",
    screenshotPath: "/images/projects/placeholder-nfc-attendance.png",
  },

  // ── 6. Agraj Enterprise Redesign ───────────────────────────────────────────
  {
    slug: "agraj-enterprise",
    title: "Agraj Enterprise",
    tagline: "Industrial Brand Brought to Life Online.",
    category: "Website Redesign",
    industry: "Industrial & Manufacturing",
    liveUrl: "https://www.agrajenterprise.com",
    featured: false,
    shortDescription:
      "A fully data-driven, SEO-optimized multi-page marketing website for Agraj Enterprise - a Bhavnagar-based industrial painting and protective coating company - replacing zero web presence with a premium, rank-worthy digital brand.",
    overview:
      "Built with Next.js App Router and Tailwind CSS 4, the site uses a 100% JSON-driven content architecture - every service, project, FAQ, and testimonial lives in typed JSON files. Includes 6 JSON-LD schemas, per-page SEO, and PWA support.",

    challenge: "Zero web presence, no lead capture, and a credibility gap - industrial clients couldn't verify safety credentials or past work.",
    solution: "SSR-powered 6-page marketing site with Formspree contact form, WhatsApp CTA, 6 JSON-LD schemas, and before/after project gallery.",
    result: "Indexed on Google within 48 hours, 3× lead channels, and a content system any team member can update without a developer.",

    challenges: [
      {
        title: "Zero Digital Presence",
        description: "Relied entirely on word-of-mouth. No website meant no Google visibility and losing contracts to competitors with even basic websites.",
        icon: "🌐",
      },
      {
        title: "Content Update Bottleneck",
        description: "Every content change required a developer. The business needed to update projects and services themselves.",
        icon: "🔄",
      },
      {
        title: "Local SEO Gap",
        description: "Competitors ranked for 'industrial painting Gujarat' without structured data. A chance to leapfrog with proper schema.",
        icon: "📈",
      },
    ],
    solutions: [
      "100% JSON-driven content - 13 content files, one config.ts as single source of truth",
      "6 JSON-LD structured data schemas: LocalBusiness, Service, FAQPage, BreadcrumbList, WebSite, ImageObject",
      "Formspree contact form + floating WhatsApp button + phone - 3 lead channels",
      "Before/After image comparison sliders for project portfolio",
      "AOS scroll animations, sticky glassmorphic navbar, PWA manifest",
      "Server-Side Rendering for sub-second first paint on mobile networks",
    ],
    metrics: [
      { value: "48", suffix: "hrs", label: "Time to Google Index" },
      { value: "3×", label: "Lead Channels" },
      { value: "6", label: "JSON-LD Schemas" },
      { value: "0", label: "Developer Needed for Updates" },
    ],
    techStack: [
      { name: "Next.js 16 App Router", category: "frontend" },
      { name: "React 19", category: "frontend" },
      { name: "TypeScript", category: "frontend" },
      { name: "Tailwind CSS 4", category: "frontend" },
      { name: "AOS Animations", category: "frontend" },
      { name: "Formspree", category: "backend" },
      { name: "PWA / Service Worker", category: "infra" },
      { name: "JSON-LD (6 schemas)", category: "infra" },
    ],
    accentColor: "#D32F2F",
    mockupGradient: "linear-gradient(135deg, #B71C1C 0%, #D32F2F 40%, #EF5350 100%)",
    screenshotPath: "/images/projects/placeholder-agraj-enterprise.png",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return projects
    .filter((p) => p.featured)
    .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99));
}

export function getAllProjects(): Project[] {
  return projects;
}
