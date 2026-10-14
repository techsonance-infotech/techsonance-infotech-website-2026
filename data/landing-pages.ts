// ─── Programmatic Landing Pages Data ──────────────────────────────────────
// Single source of truth for location, technology, and specialized landing pages.

export interface LandingPageCapability {
  title: string;
  description: string;
  iconName?: string;
}

export interface LandingPageEngagementModel {
  title: string;
  badge: string;
  description: string;
  features: string[];
}

export interface LandingPageFaq {
  question: string;
  answer: string;
}

export interface LandingPageCaseStudyRef {
  slug: string;
  title: string;
  client: string;
  metric: string;
  description: string;
  tags: string[];
}

export interface LandingPageData {
  slug: string;
  route: string;
  pageType: "location" | "technology" | "service";
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  h1: string;
  badge: string;
  directAnswer: string; // 40-60 word concise direct answer for AEO / Snippets
  subheading: string;

  overviewHeadline: string;
  overviewParagraphs: string[];

  capabilitiesHeadline: string;
  capabilities: LandingPageCapability[];

  techStackHeadline: string;
  techStack: { category: string; technologies: string[] }[];

  featuredCaseStudies: LandingPageCaseStudyRef[];

  engagementModels: LandingPageEngagementModel[];

  faqs: LandingPageFaq[];

  relatedServices: { title: string; href: string; description: string }[];
}

export const landingPages: Record<string, LandingPageData> = {
  surat: {
    slug: "surat",
    route: "/locations/surat",
    pageType: "location",
    metaTitle: "Software Development Company in Surat | TechSonance Infotech",
    metaDescription: "Headquartered in Vesu, Surat, TechSonance engineers custom web apps, mobile solutions, NestJS backends, and AI integrations for global startups and enterprises.",
    keywords: [
      "Software Development Company in Surat",
      "Web App Developers Surat",
      "AI Engineering Company Surat",
      "Custom Software Development Surat",
      "IT Company in Vesu Surat",
      "Mobile App Developers Surat"
    ],
    h1: "Custom Software & AI Development Company in Surat",
    badge: "SURAT HEADQUARTERS & GLOBAL DELIVERY",
    directAnswer: "TechSonance Infotech LLP is a premier software development company in Surat, Gujarat, based at Palladium Plaza, VIP Road, Vesu. We engineer full-stack web platforms, cross-platform mobile apps, cloud-native backends, and enterprise AI/RAG systems for global clients, combining direct founder architecture with offshore development cost efficiencies.",
    subheading: "Engineering high-performance software systems from Vesu, Surat — trusted by startups and enterprises across the US, UK, UAE, and India.",

    overviewHeadline: "Local Architectural Leadership. Global Production Standards.",
    overviewParagraphs: [
      "From our headquarters at Palladium Plaza on VIP Road in Vesu, Surat, TechSonance Infotech operates as an elite software engineering partner rather than a conventional IT body shop. Founded and led by experienced technologists—Someshwari Adeya (CEO) and Sajeshkumar Adeya (CTO)—we bring direct senior oversight to every client system architecture.",
      "We harness the rapid commercial growth and engineering talent of Gujarat's economic capital while adhering to Silicon Valley engineering disciplines: strict TypeScript type-safety, test-driven microservices, zero-latency React interfaces, and Row-Level Security in multi-tenant databases.",
      "Whether you are a Surat-based enterprise modernizing legacy logistics or an offshore startup in New York or London needing a dedicated development squad, our team delivers seamless timezone alignment, weekly deployable demos, and 100% intellectual property ownership."
    ],

    capabilitiesHeadline: "Specialized Engineering Capabilities from Our Surat Team",
    capabilities: [
      {
        title: "Bespoke Web & SaaS Engineering",
        description: "Full-stack architectures using Next.js 15, React 19, and Node.js. Multi-tenant database partitioning, automated subscription billing, and sub-second page loads."
      },
      {
        title: "Enterprise AI & RAG Workflows",
        description: "Autonomous LLM agents, vector embeddings (pgvector), LangChain pipelines, and custom knowledge base chatbots that automate compliance and operational workflows."
      },
      {
        title: "Cross-Platform Mobile Apps",
        description: "Flutter and React Native development for iOS and Android. High-fidelity animations, hardware sensor integrations (NFC, BLE), and resilient offline-first SQLite sync."
      },
      {
        title: "Cloud & DevOps Infrastructure",
        description: "Zero-downtime CI/CD pipelines, Docker containerization, AWS cloud architecture (ECS, Lambda, S3, RDS), and Redis caching for high-concurrency systems."
      }
    ],

    techStackHeadline: "Battle-Tested Modern Tech Stack",
    techStack: [
      {
        category: "Frontend & Web",
        technologies: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS v4", "Framer Motion"]
      },
      {
        category: "Backend & Cloud",
        technologies: ["Node.js", "NestJS", "Python", "FastAPI", "Docker", "AWS", "Vercel"]
      },
      {
        category: "Databases & AI",
        technologies: ["PostgreSQL", "Supabase RLS", "MongoDB", "Redis", "pgvector", "LangChain"]
      },
      {
        category: "Mobile",
        technologies: ["Flutter", "Dart", "React Native", "Expo", "SQLite", "Firebase"]
      }
    ],

    featuredCaseStudies: [
      {
        slug: "freightflow",
        title: "FreightFlow Logistics SaaS Platform",
        client: "Grover Roadlines (Surat & National)",
        metric: "Sub-200ms Queries & 100% Data Isolation",
        description: "Engineered a scalable multi-tenant SaaS platform for Indian transport operators with real-time GST e-Way bill sync and PostgreSQL Row-Level Security.",
        tags: ["Next.js", "PostgreSQL", "RLS", "Logistics", "SaaS"]
      },
      {
        slug: "syncserve",
        title: "SyncServe Retail POS & Inventory Terminal",
        client: "Retail Chain Enterprise",
        metric: "Zero-Downtime Offline Checkout",
        description: "Offline-first Point of Sale application utilizing IndexedDB local queues and background cloud syncing for high-traffic retail checkout counters.",
        tags: ["React 19", "IndexedDB", "Node.js", "PWA", "POS"]
      },
      {
        slug: "zion",
        title: "Zion Event Discovery & Ticketing App",
        client: "Zion Entertainment",
        metric: "50,000+ Concurrent Event Attendees",
        description: "Real-time cross-platform mobile application featuring interactive seat mapping, QR ticketing, and host revenue analytics.",
        tags: ["Flutter", "Firebase", "Node.js", "Mobile"]
      }
    ],

    engagementModels: [
      {
        title: "Dedicated Engineering Squad",
        badge: "BEST FOR SCALING",
        description: "Full-time senior engineers in Surat working exclusively on your product backlog under your technical leadership or our CTO.",
        features: [
          "Direct Slack & Linear integration",
          "Daily standups & timezone overlap",
          "Senior developer retention",
          "Flexible monthly scaling"
        ]
      },
      {
        title: "Fixed-Scope MVP Delivery",
        badge: "BEST FOR STARTUPS",
        description: "End-to-end product scoping, clickable Figma prototypes, and complete production delivery in a guaranteed 8–12 week timeframe.",
        features: [
          "Guaranteed scope and delivery date",
          "Interactive prototype in 3 weeks",
          "Production launch under 12 weeks",
          "Comprehensive QA and documentation"
        ]
      },
      {
        title: "Time & Materials (Agile Sprints)",
        badge: "BEST FOR ITERATION",
        description: "Two-week agile sprints with weekly deployable demos. Ideal for products with dynamic feature roadmaps or active pivots.",
        features: [
          "Transparent weekly time tracking",
          "Weekly production releases",
          "Continuous code reviews",
          "Pay only for executed hours"
        ]
      }
    ],

    faqs: [
      {
        question: "Can we visit your Surat office for an in-person project discovery session?",
        answer: "Yes, absolutely. Our engineering headquarters is located at UG-15, Palladium Plaza, VIP Road, Vesu, Surat. We welcome founders and enterprise tech leads for in-person architectural scoping, technical workshops, and sprint planning sessions from Monday to Friday (9:00 AM – 6:00 PM IST)."
      },
      {
        question: "Why should we hire a software development company in Surat over Bangalore or Mumbai?",
        answer: "Surat offers exceptional engineering value: significantly lower developer turnover and overhead costs compared to metro hubs, without any compromise in technical caliber. At TechSonance, our founders personally direct every architecture, ensuring you get senior technical execution at offshore cost efficiencies."
      },
      {
        question: "Do you sign a Non-Disclosure Agreement (NDA) before discovery?",
        answer: "Yes. Before reviewing any proprietary business documentation, system designs, or product roadmaps, we execute a legally binding mutual Non-Disclosure Agreement (NDA) to protect all trade secrets and intellectual property."
      },
      {
        question: "Who owns the code and intellectual property after project completion?",
        answer: "You own 100% of the code, database schemas, and intellectual property. Upon completion of milestone payments, complete ownership and all Git repositories are transferred directly to your organization with zero licensing locks."
      },
      {
        question: "How do you coordinate with international clients in the US, UK, and UAE?",
        answer: "Our Surat squads maintain 4 to 5 hours of direct working overlap with US (EST/PST), UK (GMT), and Gulf (GST) timezones. We communicate proactively through dedicated Slack channels, weekly video sprint reviews, and transparent Linear/GitHub issue trackers."
      }
    ],

    relatedServices: [
      {
        title: "Custom Software Development",
        href: "/services/custom-software-development",
        description: "Bespoke operational ERPs, CRM systems, and automated enterprise workflows."
      },
      {
        title: "AI Automation & RAG Systems",
        href: "/services/ai-automation",
        description: "Autonomous LLM agents, document parsing pipelines, and vector search."
      },
      {
        title: "SaaS Product Engineering",
        href: "/services/saas-product-development",
        description: "Multi-tenant cloud architectures with integrated billing and user onboarding."
      },
      {
        title: "Full-Stack Web Development",
        href: "/services/web-development",
        description: "High-performance Next.js 15 and React 19 web applications with sub-second speeds."
      }
    ]
  }
};

export function getLandingPageBySlug(slug: string): LandingPageData | undefined {
  return landingPages[slug];
}
