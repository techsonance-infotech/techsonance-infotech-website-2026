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
  },

  nestjs: {
    slug: "nestjs",
    route: "/technologies/nestjs",
    pageType: "technology",
    metaTitle: "NestJS Development Company | Enterprise Microservices & APIs | TechSonance",
    metaDescription: "Partner with TechSonance for enterprise NestJS development. We engineer high-throughput microservices, real-time WebSocket backends, and multi-tenant architectures.",
    keywords: [
      "NestJS Development Company",
      "Hire NestJS Developers India",
      "NestJS Microservices Agency",
      "Enterprise Node.js Backend",
      "NestJS Consulting Services"
    ],
    h1: "Enterprise NestJS Development & Microservices Architecture",
    badge: "ENTERPRISE NODE.JS & NESTJS SPECIALISTS",
    directAnswer: "TechSonance Infotech LLP is a specialized NestJS development company engineering enterprise microservices, real-time WebSocket platforms, and high-concurrency APIs. We build modular, type-safe backends utilizing TypeScript, Prisma/TypeORM, PostgreSQL Row-Level Security, Redis caching, and Docker on AWS with sub-20ms P99 latency.",
    subheading: "Architecting resilient, type-safe backend systems for high-growth SaaS, logistics, and fintech platforms worldwide.",

    overviewHeadline: "Enterprise-Grade Architecture Built for Scale and Long-Term Maintainability",
    overviewParagraphs: [
      "Modern enterprise backends demand structure, testability, and deterministic behavior. Ad-hoc Express scripts inevitably crumble under high concurrency and growing team sizes. We utilize NestJS—the progressive TypeScript framework—to construct clean, domain-driven architectures that mirror Spring Boot or Angular's enterprise discipline with Node.js's rapid event-driven performance.",
      "Our engineering squad implements strict modular boundaries, dependency injection, declarative validation pipes (class-validator), automated OpenAPI/Swagger generation, and distributed message queues using BullMQ and Redis.",
      "From FreightFlow's multi-tenant logistics transaction engine to real-time retail synchronization, our NestJS systems consistently achieve sub-20ms P99 database query responses while scaling across horizontal Docker containers with zero downtime."
    ],

    capabilitiesHeadline: "Our End-to-End NestJS Engineering Capabilities",
    capabilities: [
      {
        title: "Microservices & Distributed Event Bus",
        description: "Decoupled microservices communicating via gRPC, RabbitMQ, or Redis streams with automated dead-letter queues and distributed tracing."
      },
      {
        title: "Multi-Tenant Database & RLS",
        description: "PostgreSQL schema partitioning with Supabase and Prisma, enforcing Row-Level Security to guarantee complete customer data isolation."
      },
      {
        title: "Real-Time WebSocket Gateways",
        description: "Bidirectional, low-latency live sync for live chats, fleet tracking, auction engines, and collaborative multi-user editing."
      },
      {
        title: "Enterprise Security, Auth & RBAC",
        description: "OAuth 2.0, JWT with refresh token rotation, role-based access control (RBAC), API rate limiting, and encrypted field storage."
      }
    ],

    techStackHeadline: "Battle-Tested Backend & Cloud Stack",
    techStack: [
      {
        category: "Framework & Language",
        technologies: ["NestJS 11", "TypeScript", "Node.js 22", "Fastify", "Express"]
      },
      {
        category: "Databases & ORM",
        technologies: ["PostgreSQL", "Prisma ORM", "TypeORM", "Redis", "MongoDB"]
      },
      {
        category: "Cloud & DevOps",
        technologies: ["Docker", "AWS ECS", "AWS Lambda", "Kubernetes", "GitHub Actions"]
      },
      {
        category: "Testing & Monitoring",
        technologies: ["Jest", "Supertest", "Swagger/OpenAPI", "Sentry", "Datadog"]
      }
    ],

    featuredCaseStudies: [
      {
        slug: "freightflow",
        title: "FreightFlow Logistics SaaS Platform",
        client: "Grover Roadlines (Surat & National)",
        metric: "Sub-200ms Queries & 100% Data Isolation",
        description: "Engineered a scalable multi-tenant SaaS backend with real-time GST e-Way bill sync and PostgreSQL Row-Level Security.",
        tags: ["NestJS", "PostgreSQL", "RLS", "Logistics", "SaaS"]
      },
      {
        slug: "syncserve",
        title: "SyncServe Retail POS & Inventory Terminal",
        client: "Retail Chain Enterprise",
        metric: "Zero-Downtime Offline Checkout",
        description: "Offline-first Point of Sale application utilizing background cloud syncing for high-traffic retail checkout counters.",
        tags: ["Node.js", "NestJS", "IndexedDB", "PWA", "POS"]
      },
      {
        slug: "zion",
        title: "Zion Event Discovery & Ticketing App",
        client: "Zion Entertainment",
        metric: "50,000+ Concurrent Event Attendees",
        description: "Real-time backend featuring interactive seat mapping, QR ticketing, and host revenue analytics.",
        tags: ["Node.js", "NestJS", "Firebase", "Socket.IO"]
      }
    ],

    engagementModels: [
      {
        title: "Dedicated NestJS Squad",
        badge: "BEST FOR SCALING",
        description: "Full-time senior backend engineers working exclusively on your product backlog under your technical leadership or our CTO.",
        features: [
          "Direct Slack & Linear integration",
          "Daily standups & timezone overlap",
          "Senior developer retention",
          "Flexible monthly scaling"
        ]
      },
      {
        title: "API & Microservice MVP",
        badge: "BEST FOR STARTUPS",
        description: "End-to-end backend scoping, architecture blueprints, database design, and production delivery in 6–10 weeks.",
        features: [
          "Guaranteed scope and delivery date",
          "Swagger/OpenAPI contract in 2 weeks",
          "Production launch under 10 weeks",
          "Comprehensive unit & integration tests"
        ]
      },
      {
        title: "Backend Refactoring & Audit",
        badge: "BEST FOR LEGACY APIS",
        description: "Migrate legacy Express monoliths to modular NestJS architectures with automated testing and zero downtime.",
        features: [
          "Comprehensive performance audit",
          "Zero-downtime database migration",
          "Memory leak & query optimization",
          "Comprehensive test coverage"
        ]
      }
    ],

    faqs: [
      {
        question: "Why should we choose NestJS over standard Express.js for our backend?",
        answer: "Express is unopinionated and lacks architectural guidelines, which frequently leads to unmaintainable 'spaghetti code' as applications grow. NestJS provides an enterprise-grade modular architecture out of the box with native TypeScript support, dependency injection, and standardized testing tools. This drastically reduces bug count, accelerates feature development, and makes onboarding new developers painless."
      },
      {
        question: "Can TechSonance migrate our existing Express or Node.js codebase to NestJS?",
        answer: "Yes. We specialize in incremental migrations from legacy Express or Fastify APIs to NestJS. We establish automated integration test suites first, then migrate endpoints module-by-module to guarantee zero downtime and 100% backward compatibility for your frontend and mobile clients."
      },
      {
        question: "How do you ensure data security and multi-tenant isolation in NestJS?",
        answer: "We implement PostgreSQL Row-Level Security (RLS) integrated directly into NestJS request-scoped dependency injection. Every database query automatically binds the authenticated tenant context, preventing any possibility of data cross-contamination between customers."
      },
      {
        question: "What is your typical team composition for a dedicated NestJS backend squad?",
        answer: "A standard backend pod consists of 1 Senior NestJS Lead / Solutions Architect, 1-2 Full-Stack or Backend Engineers, and 1 QA/DevOps engineer. Our founders oversee architecture reviews and sprint delivery."
      },
      {
        question: "Who owns the code and intellectual property produced by TechSonance?",
        answer: "You own 100% of all source code, database schemas, Docker configurations, and intellectual property. All repositories are maintained directly in your GitHub/GitLab organization from day one."
      }
    ],

    relatedServices: [
      {
        title: "Custom Software Development",
        href: "/services/custom-software-development",
        description: "Bespoke operational ERPs, CRM systems, and automated enterprise workflows."
      },
      {
        title: "SaaS Product Engineering",
        href: "/services/saas-product-development",
        description: "Multi-tenant cloud architectures with integrated billing and user onboarding."
      },
      {
        title: "Cloud & DevOps Services",
        href: "/services/cloud-devops",
        description: "Docker, Kubernetes, and AWS architecture for high-concurrency systems."
      },
      {
        title: "Full-Stack Web Development",
        href: "/services/web-development",
        description: "High-performance Next.js 15 and React 19 web applications with sub-second speeds."
      }
    ]
  },

  ragChatbot: {
    slug: "rag-chatbot-development",
    route: "/services/rag-chatbot-development",
    pageType: "service",
    metaTitle: "Enterprise RAG Chatbot Development Company | LangChain & pgvector | TechSonance",
    metaDescription: "Build private, accurate enterprise RAG chatbots and autonomous AI agents. We engineer vector pipelines with pgvector, LangChain, Claude, and OpenAI with sub-second retrieval.",
    keywords: [
      "Enterprise RAG Chatbot Development",
      "RAG Development Company",
      "LangChain Agency",
      "pgvector Consulting",
      "Private AI Chatbot Developers",
      "Custom AI Agent Development"
    ],
    h1: "Enterprise RAG Chatbot & Intelligent Agent Development",
    badge: "PRODUCTION RAG & AI AGENT ENGINEERING",
    directAnswer: "TechSonance Infotech LLP develops private, enterprise-grade Retrieval-Augmented Generation (RAG) chatbots and autonomous AI agents. We combine semantic vector search (PostgreSQL pgvector, Qdrant), LangChain pipelines, and multi-tenant Row-Level Security to deliver hallucination-free AI systems connected to your proprietary documents and databases.",
    subheading: "Empower your workforce and customers with grounded, high-precision AI chatbots that query your proprietary data with zero hallucinations.",

    overviewHeadline: "Eliminating Hallucinations with Grounded, Context-Aware AI Systems",
    overviewParagraphs: [
      "Generic AI models lack access to your internal databases, PDFs, compliance handbooks, and customer histories. Fine-tuning models directly is expensive and quickly becomes obsolete as your data evolves daily. Production RAG (Retrieval-Augmented Generation) solves this by fetching your live, authorized company data at query time and injecting it directly into the LLM's prompt context.",
      "We engineer the full data ingestion lifecycle: smart document parsing (PDFs, Markdown, audio transcripts, SQL records), recursive chunking with semantic overlap, hybrid vector + keyword search (BM25), and re-ranking models (Cohere Rerank) to guarantee that only the most relevant passages enter the reasoning window.",
      "Security is engineered into the foundation. We enforce strict organizational role-based access control (RBAC) directly inside PostgreSQL via pgvector, ensuring executive-level documents are never accessible to unauthorized users."
    ],

    capabilitiesHeadline: "Specialized RAG & AI Engineering Capabilities",
    capabilities: [
      {
        title: "Hybrid Semantic & Keyword Vector Search",
        description: "Pair dense vector embeddings with sparse BM25 keyword matching to accurately retrieve SKU codes, legal clauses, and conceptual queries."
      },
      {
        title: "Autonomous Multi-Step AI Agents",
        description: "Tool-calling LLM agents equipped with database execution, CRM integration, email drafting, and workflow automation."
      },
      {
        title: "Multi-Tenant Data Privacy & Local Models",
        description: "Private VPC deployments on AWS Bedrock or on-premise open-source LLMs (Llama 3.3, DeepSeek) ensuring 100% data confidentiality."
      },
      {
        title: "Automated Evaluation & Guardrails",
        description: "Continuous RAG evaluation suites (Ragas, TruLens) tracking context precision, faithfulness, and answer relevancy."
      }
    ],

    techStackHeadline: "Enterprise AI & Vector Infrastructure",
    techStack: [
      {
        category: "AI & Agent Frameworks",
        technologies: ["LangChain", "LlamaIndex", "OpenAI GPT-4o", "Anthropic Claude 3.5", "Ollama"]
      },
      {
        category: "Vector Databases",
        technologies: ["PostgreSQL (pgvector)", "Qdrant", "Pinecone", "Redis Search"]
      },
      {
        category: "Backend & Orchestration",
        technologies: ["Python", "FastAPI", "Node.js", "NestJS", "Celery", "Docker"]
      },
      {
        category: "Frontend & Chat UI",
        technologies: ["Next.js 15", "React 19", "Tailwind CSS", "Vercel AI SDK"]
      }
    ],

    featuredCaseStudies: [
      {
        slug: "freightflow",
        title: "FreightFlow Document Extraction Engine",
        client: "Grover Roadlines (Logistics)",
        metric: "Automated e-Way Bill & Invoice Processing",
        description: "Intelligent OCR and structured document parsing extracting lorry receipts and tax records directly into database schemas.",
        tags: ["AI OCR", "pgvector", "Next.js", "PostgreSQL"]
      },
      {
        slug: "syncserve",
        title: "SyncServe Retail POS & Inventory Terminal",
        client: "Retail Chain Enterprise",
        metric: "Sub-Second SKU & Product Semantic Lookup",
        description: "Offline-first Point of Sale application utilizing background cloud syncing for high-traffic retail checkout counters.",
        tags: ["React 19", "Node.js", "POS", "Search"]
      },
      {
        slug: "masterweg",
        title: "MasterWeg Student Application Assistant",
        client: "EdTech Platform",
        metric: "Personalized Program & Admission Matching",
        description: "Guided conversational AI assisting university applicants with program evaluation and document drafting.",
        tags: ["Conversational AI", "Next.js", "Python"]
      }
    ],

    engagementModels: [
      {
        title: "RAG Proof-of-Concept (POC)",
        badge: "BEST FOR VALIDATION",
        description: "A functional, working prototype connecting your internal documents to a private AI interface in 3 weeks.",
        features: [
          "Document parsing & chunking pipeline",
          "Working vector search database",
          "Interactive chat UI for internal testing",
          "Evaluation report on accuracy & cost"
        ]
      },
      {
        title: "Production Enterprise RAG",
        badge: "BEST FOR SCALING",
        description: "Full production deployment with user permissions, streaming responses, audit logs, and CRM/ERP integrations in 8–12 weeks.",
        features: [
          "Production-ready scalable architecture",
          "Multi-tenant PostgreSQL RLS security",
          "Automated daily document sync",
          "SLA-backed latency and uptime"
        ]
      },
      {
        title: "Dedicated AI Engineering Pod",
        badge: "BEST FOR PRODUCT TEAMS",
        description: "Senior AI & full-stack engineers working alongside your existing team to continuously train, evaluate, and scale AI agents.",
        features: [
          "Full-time AI & Python developers",
          "Continuous prompt & retrieval tuning",
          "Daily standups & timezone overlap",
          "Flexible monthly retainer"
        ]
      }
    ],

    faqs: [
      {
        question: "How do you prevent RAG chatbots from hallucinating false information?",
        answer: "We prevent hallucinations through a multi-layered guardrail architecture: strict system prompts instructing the model to rely solely on retrieved context, re-ranking retrieved passages with Cohere Rerank to maximize relevance, calculating citation confidence scores, and configuring fallback responses when context is insufficient."
      },
      {
        question: "Is our proprietary business data safe from being used to train public AI models?",
        answer: "Yes, 100%. When utilizing commercial APIs like OpenAI or Anthropic, we mandate enterprise zero-data-retention agreements where your data is never stored or used for model training. For maximum data governance, we also deploy fully private models within your own AWS or Azure VPC."
      },
      {
        question: "Why do you recommend PostgreSQL pgvector over dedicated vector databases?",
        answer: "For collections up to 500,000 document chunks, PostgreSQL with pgvector provides the highest ROI: it eliminates the need for separate database infrastructure, provides sub-18ms P99 retrieval with HNSW indexing, and natively integrates with your existing relational security and Row-Level Security (RLS) tables."
      },
      {
        question: "What document formats can the RAG chatbot ingest?",
        answer: "Our ingestion pipeline parses PDFs, Microsoft Word/Excel documents, Markdown, raw text, CSV files, audio transcripts, and live SQL database records. We implement automated webhook syncs so newly uploaded files are instantly vectorized."
      },
      {
        question: "How long does it take to deploy a production RAG chatbot?",
        answer: "A functional proof-of-concept (POC) typically takes 2–3 weeks. A full enterprise deployment with authenticated user access, streaming chat UI, and automated document sync pipelines takes between 6 and 10 weeks."
      }
    ],

    relatedServices: [
      {
        title: "AI Automation Solutions",
        href: "/services/ai-automation",
        description: "Autonomous LLM agents, document parsing pipelines, and vector search."
      },
      {
        title: "Custom Software Development",
        href: "/services/custom-software-development",
        description: "Bespoke operational ERPs, CRM systems, and automated enterprise workflows."
      },
      {
        title: "SaaS Product Engineering",
        href: "/services/saas-product-development",
        description: "Multi-tenant cloud architectures with integrated billing and user onboarding."
      },
      {
        title: "API Integrations",
        href: "/services/api-integrations",
        description: "Connect AI pipelines with your existing CRM, ERP, and payment systems."
      }
    ]
  },

  nextjs: {
    slug: "nextjs",
    route: "/technologies/nextjs",
    pageType: "technology",
    metaTitle: "Next.js Development Agency | High-Performance React 19 Apps | TechSonance",
    metaDescription: "Partner with TechSonance, an elite Next.js development agency. We engineer sub-second web platforms, SaaS interfaces, and App Router architectures using Next.js 15 and React 19.",
    keywords: [
      "Next.js Development Agency",
      "Next.js Development Company India",
      "Hire Next.js Developers",
      "React 19 Web App Agency",
      "Enterprise Next.js Consulting"
    ],
    h1: "Enterprise Next.js 15 & React 19 Web App Development",
    badge: "VERCEL & NEXT.JS APP ROUTER SPECIALISTS",
    directAnswer: "TechSonance Infotech LLP is an elite Next.js development agency building ultra-fast web platforms, multi-tenant SaaS interfaces, and headless eCommerce applications. We leverage Next.js 15, React 19 Server Components, Turbopack, and Tailwind CSS to deliver sub-second Core Web Vitals and 100/100 PageSpeed scores.",
    subheading: "Engineering sub-second web applications with modern Next.js App Router, streaming SSR, and zero-latency user experiences.",

    overviewHeadline: "Blazing Speed. SEO Dominance. Modern App Router Architecture.",
    overviewParagraphs: [
      "Slow websites destroy conversion rates. In 2026, client-heavy single-page applications (SPAs) burdened by 5MB JavaScript bundles are obsolete. We build on Next.js 15 App Router and React 19 Server Components, executing heavy business logic and database queries directly on the server to ship zero-runtime JavaScript to client browsers.",
      "Our interfaces leverage partial prerendering, parallel streaming, optimistic UI mutations, and responsive edge caching on Vercel and AWS CloudFront to guarantee near-instant navigation and perfect Core Web Vitals.",
      "From high-volume logistics portals to interactive POS checkouts, our Next.js architectures combine bulletproof TypeScript type-safety with rich visual aesthetics, seamless Framer Motion micro-interactions, and full accessibility."
    ],

    capabilitiesHeadline: "Full-Lifecycle Next.js Capabilities",
    capabilities: [
      {
        title: "App Router & React Server Components",
        description: "Deep architectural mastery of React 19 Server Components, Server Actions, route handlers, and streaming Suspense boundaries."
      },
      {
        title: "Sub-Second Performance & Core Web Vitals",
        description: "Aggressive optimization achieving 95+ Google PageSpeed scores, LCP under 1.2s, and zero layout shift (CLS)."
      },
      {
        title: "Enterprise SaaS Frontends & Dashboards",
        description: "Complex authenticated dashboards, real-time data grids, dynamic chart visualizations, and role-based views."
      },
      {
        title: "Legacy Migration to Next.js 15",
        description: "Smooth migration of monolithic Create React App, Angular, or legacy WordPress platforms into modular, headless Next.js applications."
      }
    ],

    techStackHeadline: "Modern Frontend Ecosystem",
    techStack: [
      {
        category: "Framework & Core",
        technologies: ["Next.js 15", "React 19", "TypeScript", "Turbopack", "Tailwind CSS v4"]
      },
      {
        category: "State & Data Fetching",
        technologies: ["Server Actions", "TanStack Query", "Zustand", "SWR"]
      },
      {
        category: "UI & Animations",
        technologies: ["Framer Motion", "Radix UI", "Lucide Icons", "Recharts"]
      },
      {
        category: "Deployment & Edge",
        technologies: ["Vercel Edge", "AWS CloudFront", "Docker", "Cloudflare"]
      }
    ],

    featuredCaseStudies: [
      {
        slug: "freightflow",
        title: "FreightFlow Logistics SaaS Platform",
        client: "Grover Roadlines (Surat & National)",
        metric: "Sub-Second Interactive Dashboard",
        description: "Built a high-performance Next.js 15 logistics portal with real-time fleet analytics and dynamic GST reporting.",
        tags: ["Next.js 15", "React 19", "PostgreSQL", "Tailwind CSS"]
      },
      {
        slug: "syncserve",
        title: "SyncServe Retail POS & Inventory Terminal",
        client: "Retail Chain Enterprise",
        metric: "Instant Checkout & Edge Caching",
        description: "Next.js Point of Sale interface designed for sub-second keyboard-driven checkout counters and offline queues.",
        tags: ["React 19", "Next.js", "IndexedDB", "PWA"]
      },
      {
        slug: "masterweg",
        title: "MasterWeg Higher Ed Application Workspace",
        client: "EdTech Platform",
        metric: "98/100 Mobile Performance Score",
        description: "Unified applicant portal with automated university matching and personalized admission guidance.",
        tags: ["Next.js", "TypeScript", "Tailwind CSS"]
      }
    ],

    engagementModels: [
      {
        title: "Dedicated Next.js Squad",
        badge: "BEST FOR SCALING",
        description: "Full-time senior React/Next.js engineers working exclusively on your product roadmap with direct Linear/Slack alignment.",
        features: [
          "Direct Slack & Linear integration",
          "Daily standups & timezone overlap",
          "Senior developer retention",
          "Flexible monthly scaling"
        ]
      },
      {
        title: "Next.js MVP Delivery",
        badge: "BEST FOR STARTUPS",
        description: "Complete design-to-production delivery in 8–12 weeks: clickable Figma, full Next.js development, QA, and launch.",
        features: [
          "Guaranteed scope and delivery date",
          "Interactive prototype in 3 weeks",
          "Production launch under 12 weeks",
          "100/100 Core Web Vitals guarantee"
        ]
      },
      {
        title: "Performance & App Router Audit",
        badge: "BEST FOR EXISTING APPS",
        description: "Diagnose slow page loads, optimize hydration bottlenecks, migrate to App Router, and slash server bundle sizes.",
        features: [
          "Complete Core Web Vitals audit",
          "Bundle size & hydration optimization",
          "Server Component refactoring",
          "Measurable speed improvements"
        ]
      }
    ],

    faqs: [
      {
        question: "Why should we choose Next.js 15 App Router over traditional React (SPA)?",
        answer: "Traditional React Single-Page Applications (SPAs) ship massive JavaScript bundles to the browser, leading to sluggish initial page loads, high battery consumption on mobile, and poor search engine crawlability. Next.js 15 App Router renders components on the server by default (RSC), drastically reducing JavaScript execution time, guaranteeing sub-second Core Web Vitals, and maximizing SEO ranking potential."
      },
      {
        question: "Can TechSonance migrate our existing React (Vite / CRA) app to Next.js 15?",
        answer: "Yes. We have migrated dozens of client applications from legacy Create React App (CRA) or Vite to Next.js. We ensure all existing state and routing logic is cleanly mapped to App Router conventions without user-facing regression."
      },
      {
        question: "How does Next.js improve SEO and Google Core Web Vitals?",
        answer: "Next.js delivers complete, pre-rendered HTML on the initial request, allowing search engine crawlers and social media bots to parse content and metadata instantly without waiting for client-side JavaScript. Combined with automatic image optimization, font preloading, and edge caching, your site achieves top-tier Largest Contentful Paint (LCP) and zero Cumulative Layout Shift (CLS)."
      },
      {
        question: "Do your Next.js developers work in our timezone?",
        answer: "Yes. Our engineering squads maintain 4 to 5 hours of direct working overlap with clients in the United States (EST/PST), United Kingdom (GMT), and Gulf region (GST), participating in your daily standups and sprint reviews."
      },
      {
        question: "Who owns the code and intellectual property after project completion?",
        answer: "You own 100% of all code, assets, and intellectual property. All repositories, commit history, and deployment configs are transferred directly to your organization."
      }
    ],

    relatedServices: [
      {
        title: "Full-Stack Web Development",
        href: "/services/web-development",
        description: "High-performance Next.js 15 and React 19 web applications with sub-second speeds."
      },
      {
        title: "SaaS Product Engineering",
        href: "/services/saas-product-development",
        description: "Multi-tenant cloud architectures with integrated billing and user onboarding."
      },
      {
        title: "Custom Software Development",
        href: "/services/custom-software-development",
        description: "Bespoke operational ERPs, CRM systems, and automated enterprise workflows."
      },
      {
        title: "Mobile App Development",
        href: "/services/mobile-development",
        description: "Cross-platform Flutter and React Native mobile applications."
      }
    ]
  }
};

export function getLandingPageBySlug(slug: string): LandingPageData | undefined {
  return landingPages[slug];
}

