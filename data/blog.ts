// ─── TechSonance Blog Data ──────────────────────────────────────────────────
// Single source of truth for all blog articles.

export interface Author {
  name: string;
  role: string;
  avatar: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // HTML-friendly string
  category: "Software Engineering" | "AI & Automation" | "Product Design" | "Culture";
  date: string;
  readTime: string;
  authors: Author[];
  heroImage: string;
  tags: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "multi-tenant-logistics-architecture",
    title: "Building Scalable Multi-Tenant Architecture for Indian Logistics",
    excerpt: "An in-depth look at how we engineered Row-Level Security and multi-tenant database isolation to power FreightFlow's national operations.",
    category: "Software Engineering",
    date: "June 15, 2026",
    readTime: "7 min read",
    authors: [
      {
        name: "Sajeshkumar Adeya",
        role: "CTO TechSonance",
        avatar: "SA",
      }
    ],
    heroImage: "/images/blog/logistics-architecture.jpg",
    tags: ["Next.js", "PostgreSQL", "RLS", "Logistics", "SaaS"],
    content: `
      <p class="lead text-lg text-slate-700 leading-relaxed font-semibold mb-6">
        When building software for the Indian road transport and logistics sector, scalability isn't just about handling high request volumes. It's about ensuring absolute data isolation, resilient offline syncing, and handling complex regulatory requirements like GST, e-Way bills, and multi-tenant billing.
      </p>

      <p class="text-slate-600 leading-relaxed mb-6">
        In this article, we share our architectural learnings from building <strong>FreightFlow</strong>, a full-stack multi-tenant SaaS platform built exclusively for Indian road transport operators.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">The Core Challenge: Data Isolation at Scale</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        In logistics, data security is paramount. Fleet owners, transporters, and consignees all demand that their transaction sheets, driver payrolls, and pricing agreements remain strictly isolated. We evaluated two multi-tenant architectural strategies:
      </p>
      <ul class="list-disc pl-6 mb-6 space-y-2 text-slate-600">
        <li><strong>Database-per-tenant:</strong> High isolation, but complex database migrations and high base server costs.</li>
        <li><strong>Shared database with Row-Level Security (RLS):</strong> Unified schema, easy migrations, and robust security handled natively at the database level.</li>
      </ul>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Implementing PostgreSQL Row-Level Security</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        We selected PostgreSQL Row-Level Security combined with Supabase schemas to enforce tenant isolation. Every table contains a <code>tenant_id</code> column. We configured the database to deny all reads and writes by default, enabling access only through a session-level tenant identifier:
      </p>

      <pre class="bg-slate-950 text-slate-200 rounded-2xl p-5 overflow-x-auto text-xs font-mono mb-6">
-- Enable Row Level Security
ALTER TABLE lorry_receipts ENABLE ROW LEVEL SECURITY;

-- Create Tenant Policy
CREATE POLICY tenant_isolation_policy ON lorry_receipts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true));
      </pre>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Optimizing Per-Trip Profit & Loss Queries</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        For transporters, calculating real-time profitability per vehicle requires aggregating trip earnings (freight charges) against immediate operational expenditures (fuel costs, driver wages, Toll payments, and vehicle repairs). We implemented indexed database views that compute material aggregates on the database layer, allowing FreightFlow to render financial metrics in under 150ms on mobile devices.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Conclusion</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        By pushing multi-tenancy rules and complex calculations down to the database level, we built a highly secure, fast, and maintainable ecosystem that handles hundreds of truck transactions concurrently.
      </p>
    `,
  },
  {
    slug: "nextjs-react-for-offline-pos",
    title: "Why We Chose React 19 and Next.js for SyncServe Retail POS",
    excerpt: "Discover why offline-first IndexedDB structures and React 19 concurrent features are crucial for modern checkout terminals.",
    category: "Software Engineering",
    date: "June 10, 2026",
    readTime: "5 min read",
    authors: [
      {
        name: "Sajeshkumar Adeya",
        role: "CTO TechSonance",
        avatar: "SA",
      }
    ],
    heroImage: "/images/blog/pos-react.jpg",
    tags: ["React 19", "Next.js", "IndexedDB", "PWA", "POS"],
    content: `
      <p class="lead text-lg text-slate-700 leading-relaxed font-semibold mb-6">
        Point of Sale (POS) systems represent a challenging frontier in web application engineering. Checkout lanes require instant responsiveness, zero dependency on active internet connections, and seamless peripheral device communication.
      </p>

      <p class="text-slate-600 leading-relaxed mb-6">
        When developing <strong>SyncServe POS</strong>, we chose React 19 and Next.js to provide an offline-first POS experience that outperforms legacy desktop terminals.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">The Offline-First Architectural Layer</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Retail stores experience internet outages frequently. SyncServe uses a service worker pipeline to cache dynamic inventory catalogs and customer directories. When active internet is lost, transactions are written locally to the browser's <strong>IndexedDB</strong>:
      </p>

      <pre class="bg-slate-950 text-slate-200 rounded-2xl p-5 overflow-x-auto text-xs font-mono mb-6">
// Offline Transaction Save
async function saveTransaction(transaction) {
  if (navigator.onLine) {
    return await api.post('/transactions', transaction);
  } else {
    await db.table('offline_orders').add({
      ...transaction,
      synced: 0,
      timestamp: Date.now()
    });
    registerBackgroundSync();
  }
}
      </pre>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Utilizing React 19 Concurrent Actions</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        React 19's new concurrent features (such as <code>useActionState</code> and <code>useTransition</code>) allow us to handle barcode scanner inputs asynchronously without locking up the UI thread. As cashiers scan items rapidly, the UI updates smoothly, buffering pending items and calculating tax totals concurrently.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Outcome</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        SyncServe POS achieves zero checkout downtime during retail network failures. Once connection is restored, background service workers synchronize the cached sales data back to the server in batch queries.
      </p>
    `,
  },
  {
    slug: "agentic-ai-business-automation",
    title: "Agentic AI Workflows: The Next Frontier in Business Automation",
    excerpt: "Moving beyond simple chatbots. How we design autonomous AI agents to execute complex validation and internal operations.",
    category: "AI & Automation",
    date: "June 05, 2026",
    readTime: "6 min read",
    authors: [
      {
        name: "Someshwari Adeya",
        role: "CEO",
        avatar: "SO",
      }
    ],
    heroImage: "/images/blog/agentic-ai.jpg",
    tags: ["AI Agents", "LangChain", "Automation", "Workflows"],
    content: `
      <p class="lead text-lg text-slate-700 leading-relaxed font-semibold mb-6">
        The corporate world is moving beyond simple retrieval chatbots. Today's enterprises require autonomous AI agents that can solve multi-step problems, make logical decisions, and interface with existing software tools.
      </p>

      <p class="text-slate-600 leading-relaxed mb-6">
        At TechSonance, we are building <strong>Agentic AI Workflows</strong> that automate document verification, compliance validation, and internal support operations with human-grade accuracy.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">What Makes an AI Agent "Agentic"?</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Unlike static pipelines, agentic workflows feature a loop where the LLM evaluates input, decides which tools to call, inspects the tools' output, and loops until the task is complete:
      </p>
      <ul class="list-disc pl-6 mb-6 space-y-2 text-slate-600">
        <li><strong>Planning:</strong> Breaking down a complex objective into sequential tasks.</li>
        <li><strong>Tool Access:</strong> Invoking APIs, reading databases, or querying files.</li>
        <li><strong>Reflection:</strong> Analyzing outputs and correcting paths dynamically.</li>
      </ul>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Automating Logistics Document Processing</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        By combining vision models and agentic workflows, we automated vendor invoice checks. The agent inspects the uploaded file, reads tax details, cross-references corporate purchase records, calls validation tools for GST registration, and posts the audited entry directly to the database.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">The Future of Agency Engineering</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Agentic workflows represent a paradigm shift. Rather than coding static conditions for every business rule, we configure guardrails and let models reason through cases dynamically.
      </p>
    `,
  },
  {
    slug: "designing-for-the-developer",
    title: "Designing for the Developer: Creating High-Fidelity UI Systems",
    excerpt: "How our design team collaborates with developers to build reusable systems that compile cleanly and feel extremely premium.",
    category: "Product Design",
    date: "June 01, 2026",
    readTime: "4 min read",
    authors: [
      {
        name: "Someshwari Adeya",
        role: "CEO",
        avatar: "SO",
      }
    ],
    heroImage: "/images/blog/design-developer.jpg",
    tags: ["Figma", "UI/UX", "Design Tokens", "Tailwind CSS"],
    content: `
      <p class="lead text-lg text-slate-700 leading-relaxed font-semibold mb-6">
        A premium design is only as good as its implementation. At TechSonance, we believe that design and engineering are not separate departments - they are two sides of the same product.
      </p>

      <p class="text-slate-600 leading-relaxed mb-6">
        In this article, we share how we bridge the gap between Figma mockups and high-performance React code.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">The Shared Token System</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Consistency starts with variables. We map every color palette, typography scaling, shadow depth, and border radius directly to Tailwind config variables. This ensures that when a designer specifies a color, the developer uses the exact same token.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Micro-Animations and Transitions</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Premium websites feel alive because they react to user actions. We use Framer Motion to animate page transitions and hover states. Subtle, fast easing curves make navigation feel snappy and responsive.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Summary</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        By establishing a unified design system and developer-friendly token structures, our team brings complex digital experiences to life efficiently and beautifully.
      </p>
    `,
  },
  {
    slug: "techsonance-marketplace-architecture",
    title: "Scaling a High-Throughput Multi-Vendor Marketplace Platform",
    excerpt: "How we engineered sub-second product catalog search queries and order split algorithms for TechSonance Marketplace.",
    category: "Software Engineering",
    date: "May 25, 2026",
    readTime: "6 min read",
    authors: [
      {
        name: "Manish Kushwaha",
        role: "Developer",
        avatar: "MK",
      }
    ],
    heroImage: "/images/blog/marketplace-architecture.jpg",
    tags: ["Marketplace", "Elasticsearch", "Next.js", "Redis", "Database"],
    content: `
      <p class="lead text-lg text-slate-700 leading-relaxed font-semibold mb-6">
        Multi-vendor marketplaces represent one of the most operationally complex business models to code. A single user cart can contain items from multiple independent merchants, requiring automatic payment splits, dynamic commission rules, and distributed inventory management.
      </p>

      <p class="text-slate-600 leading-relaxed mb-6">
        In this case analysis, we discuss how we architected and scaled <strong>TechSonance Marketplace</strong> to achieve sub-second catalog search responses and seamless order splitting pipelines.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">The Search Challenge: Millisecond Catalog Queries</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        With millions of SKUs from hundreds of sellers, querying PostgreSQL directly for dynamic searches, price ranges, and taxonomy filters became a bottleneck. We introduced <strong>Elasticsearch</strong> as our read-optimized query layer:
      </p>
      
      <pre class="bg-slate-950 text-slate-200 rounded-2xl p-5 overflow-x-auto text-xs font-mono mb-6">
// Syncing Postgres data to Elasticsearch on update
export async function syncProductToSearchIndex(productId, db) {
  const product = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
  await elasticClient.index({
    index: 'marketplace_products',
    id: productId,
    body: {
      name: product.name,
      description: product.description,
      price: product.price,
      vendor_id: product.vendor_id,
      in_stock: product.inventory > 0
    }
  });
}
      </pre>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Automated Transaction & Order Splitting</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        When a customer checks out, the backend splits the single checkout payload into separate sub-orders for each seller. Payment gateways like Razorpay or Stripe are leveraged to route funds dynamically: splitting base amounts to vendors and allocating calculated commission fees to TechSonance Marketplace in a single transactional query.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Summary</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Decoupling product search indexes and orchestrating microservice-based transaction routing allows TechSonance Marketplace to process thousands of transactions reliably with minimum latency.
      </p>
    `,
  },
  {
    slug: "hisaabkitaab-gst-invoicing",
    title: "Architecting a High-Fidelity GST Invoicing Engine for Indian SMBs",
    excerpt: "How we designed a dynamic GST/Non-GST tax compiler and real-time PAN registry validation rules for HisaabKitaab.",
    category: "Software Engineering",
    date: "May 20, 2026",
    readTime: "5 min read",
    authors: [
      {
        name: "Manish Kushwaha",
        role: "Developer",
        avatar: "MK",
      }
    ],
    heroImage: "/images/blog/hisaabkitaab-gst.jpg",
    tags: ["FinTech", "Next.js", "Zod", "MongoDB", "Invoicing"],
    content: `
      <p class="lead text-lg text-slate-700 leading-relaxed font-semibold mb-6">
        Accounting tools built for Western markets frequently fall flat when adapted to Indian tax codes. In India, invoicing is highly structured, requiring precise tax splits (CGST + SGST vs. IGST), HSN/SAC code mapping, and validation of regulatory identifiers.
      </p>

      <p class="text-slate-600 leading-relaxed mb-6">
        During the engineering of <strong>HisaabKitaab</strong>, we focused on building an open-source grade, bulletproof invoicing and tax calculations engine that processes compliance data with zero margins of error.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Decoupling Tax Logic</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        To prevent visual lag during user data entry, the tax compiler operates on decoupled state hooks. As line items are added, a Zod validator validates the item's parameters and computes the tax distributions client-side:
      </p>

      <pre class="bg-slate-950 text-slate-200 rounded-2xl p-5 overflow-x-auto text-xs font-mono mb-6">
// Schema validation for Indian tax calculation
export const InvoiceItemSchema = z.object({
  quantity: z.number().min(1),
  rate: z.number().min(0),
  gstRate: z.number().default(18), // Standard tax rate percentage
  hsnCode: z.string().regex(/^\\d{4,8}$/, "HSN must be 4 to 8 digits")
});
      </pre>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Instant Browser PDF Compilation</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Rather than generating invoice PDFs on the server layer (which incurs storage and rendering costs), we utilized client-side <strong>jsPDF</strong> and <strong>jspdf-autotable</strong>. Invoices render in the browser and download instantly, saving server overhead and providing sub-second document delivery to business owners.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Conclusion</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Designing clear validation models combined with client-side document processing allowed HisaabKitaab to generate thousands of clean, compliant invoices daily while keeping infrastructure costs minimal.
      </p>
    `,
  },
  {
    slug: "nfc-attendance-hardware-integration",
    title: "Bridging Hardware and Web: Building an Offline-First NFC Attendance System",
    excerpt: "A deep dive into writing standalone Node.js serial-port event listeners and syncing local SQLite tables with central cloud databases.",
    category: "AI & Automation",
    date: "May 15, 2026",
    readTime: "6 min read",
    authors: [
      {
        name: "Sajeshkumar Adeya",
        role: "CTO TechSonance",
        avatar: "SA",
      }
    ],
    heroImage: "/images/blog/nfc-attendance.jpg",
    tags: ["NFC", "Turso", "SQLite", "PWA", "IoT"],
    content: `
      <p class="lead text-lg text-slate-700 leading-relaxed font-semibold mb-6">
        Physical workforce management requires sub-second processing. In high-traffic office settings, employees expect to tap their badges and walk through gates immediately. Any network hiccup or delay halts productivity.
      </p>

      <p class="text-slate-600 leading-relaxed mb-6">
        When building the <strong>NFC Attendance System</strong>, our goal was to bridge physical USB/Ethernet card readers to a central cloud server without introducing single-point-of-failure network bottlenecks.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">The Hardware-to-Web Bridge Daemon</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Web browsers cannot interface directly with raw USB serial ports natively. We engineered a light background Node.js daemon (Reader Agent) that runs locally on check-in terminal machines. The agent listens to card-scan serial events and writes logs locally before attempting network dispatch:
      </p>

      <pre class="bg-slate-950 text-slate-200 rounded-2xl p-5 overflow-x-auto text-xs font-mono mb-6">
// Local buffering serial event listener
serialPort.on('data', (rawData) => {
  const cardUid = parseCardUid(rawData);
  localDb.run('INSERT INTO buffer (card_uid, timestamp) VALUES (?, ?)', [cardUid, Date.now()]);
  triggerUploadQueue();
});
      </pre>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Edge SQLite Tables</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        By deploying edge-optimized **Turso** databases, the attendance system syncs logs between local nodes and central company servers automatically. If the internet goes offline, the system continues logging taps to SQLite, pushing all buffered records seamlessly once the router reconnects.
      </p>
    `,
  },
  {
    slug: "agraj-enterprise-seo-architecture",
    title: "JSON-Driven SEO: How We Indexed an Industrial Site in 48 Hours",
    excerpt: "How we engineered a 100% JSON-configured Next.js site with 6 nested JSON-LD structured schemas to capture industrial traffic.",
    category: "Product Design",
    date: "May 10, 2026",
    readTime: "4 min read",
    authors: [
      {
        name: "Someshwari Adeya",
        role: "CEO",
        avatar: "SO",
      }
    ],
    heroImage: "/images/blog/seo-json.jpg",
    tags: ["SEO", "Next.js", "JSON-LD", "Marketing", "UX"],
    content: `
      <p class="lead text-lg text-slate-700 leading-relaxed font-semibold mb-6">
        Industrial contractors have historically struggled with online customer acquisition. Relying on paper cards or offline contracts means missing search traffic from facility managers searching for verified services online.
      </p>

      <p class="text-slate-600 leading-relaxed mb-6">
        For <strong>Agraj Enterprise</strong>, we built a digital presence from the ground up, optimizing local search indexing to position the brand on Google page one within 48 hours of launch.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">100% JSON-Driven Content Architecture</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Industrial businesses need to update safety certifications and project portfolios regularly but don't want to hire web agencies for simple text adjustments. We built the marketing pages to read entirely from configuration JSON documents, decoupling data from components.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Structured Schema Injection</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        To capture maximum search results real estate, we injected 6 distinct, structured JSON-LD schemas into the pages: <em>LocalBusiness, ServicePage, FAQPage, BreadcrumbList, WebSite,</em> and <em>ImageObject</em>. This helps search engine crawlers understand service locations, safety credentials, and contact points natively.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Result</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Agraj Enterprise went from zero web footprint to complete local indexing in two days, opening up fresh digital leads channel across Gujarat.
      </p>
    `,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return blogPosts;
}
