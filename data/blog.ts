// ─── TechSonance Blog Data ──────────────────────────────────────────────────
// Single source of truth for all blog articles.

export interface Author {
  name: string;
  role: string;
  avatar: string;
}

export interface BlogFaq {
  question: string;
  answer: string;
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
  faqs?: BlogFaq[];
}

export const blogPosts: BlogPost[] = [
  // ── 1. CMS TechSonance (Featured Post) ───────────────────────────────────
  {
    slug: "cms-techsonance-enterprise-multi-tenant-architecture",
    title: "Architecting an Enterprise Multi-Tenant CMS & HRMS: 23-Role RBAC, Dual Attendance & Supabase RLS",
    excerpt: "How we engineered a unified operations platform for TechSonance consolidating HRMS, hardware NFC attendance, GPS geofencing, project sprints, client CRM, and automated payroll under strict Row-Level Security.",
    category: "Software Engineering",
    date: "October 20, 2026",
    readTime: "8 min read",
    authors: [
      {
        name: "Sajeshkumar Adeya",
        role: "CTO TechSonance",
        avatar: "SA",
      },
      {
        name: "Manish Kushwaha",
        role: "Lead Developer",
        avatar: "MK",
      },
    ],
    heroImage: "/images/cms-techsonance/login-left-banner.jpg",
    tags: ["Next.js 15", "Supabase", "PostgreSQL RLS", "HRMS", "Multi-Tenant", "RBAC", "Docker", "SaaS"],
    faqs: [
      {
        question: "How does CMS TechSonance guarantee data isolation between organizations?",
        answer: "CMS TechSonance enforces PostgreSQL Row-Level Security (RLS) via Supabase. Every database operation runs within a tenant context where tenant_id = current_setting('app.current_tenant_id'). This prevents cross-tenant data leakage even during direct SQL joins or batch mutations."
      },
      {
        question: "How does the dual-source attendance system eliminate buddy-punching?",
        answer: "The platform integrates physical NFC reader hardware that captures unique encrypted card UIDs at office entry points. For mobile remote check-ins, the app runs client-side GPS geofence radius calculations and checks against an approved office IP whitelist, automatically queuing discrepancies for HR review."
      },
      {
        question: "How is the 23-role permission matrix enforced across Next.js 15 API routes?",
        answer: "Permissions are structured across 13 modules using composable permission flags (canView, canCreate, canEdit, canDelete, canApprove). Every route is protected by a withApiHandler() wrapper that decodes the JWT bearer token, checks module capabilities, and rejects unauthorized requests with a 403 response before invoking business controllers."
      }
    ],
    content: `
      <div class="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-6 mb-8 text-slate-800">
        <span class="text-xs font-black uppercase tracking-wider text-[#1155CC] block mb-2">Executive Summary &amp; Direct Answer (AEO / TL;DR)</span>
        <p class="text-sm sm:text-base leading-relaxed font-medium">
          <strong>How do you build a secure, multi-tenant enterprise CMS &amp; HRMS platform in 2026?</strong> By implementing a shared PostgreSQL database governed by <strong>Supabase Row-Level Security (RLS)</strong> scoped strictly by <code>tenant_id</code>. This architecture guarantees 100% tenant data isolation without database sprawl. Pairing physical NFC reader hardware with GPS geofencing eliminates buddy-punching, while a <strong>23-role RBAC permission matrix</strong> across 13 core modules enforces granular access control at an average API response time under <strong>140ms</strong>.
        </p>
      </div>

      <p class="lead text-lg text-slate-700 leading-relaxed font-semibold mb-6">
        Modern technology organizations face crippling operational fragmentation. A typical mid-sized software agency juggles between six disconnected SaaS subscriptions: a biometric punch-clock portal, an HR leave tracker, spreadsheet billing, Trello or Jira for tasks, an email-based ticketing desk, and offline accounting ledgers.
      </p>

      <p class="text-slate-600 leading-relaxed mb-6">
        When developing <a href="/portfolio/cms-techsonance" class="text-[#1155CC] font-bold underline">CMS TechSonance</a>, our goal was to consolidate all daily business workflows into a singular high-throughput platform powered by <strong>Next.js 15 App Router</strong>, <strong>React 19</strong>, and <strong>Supabase PostgreSQL</strong>. In this engineering deep-dive, we share how we designed the multi-tenant architecture, the hybrid attendance engine, and the 23-role security model.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">1. Database-Level Multi-Tenancy with PostgreSQL RLS</h3>
      <p class="text-slate-600 leading-relaxed mb-4">
        Traditional multi-tenant systems either create a separate database per client (prohibitively expensive and slow to migrate) or rely on fragile application-level <code>WHERE tenant_id = x</code> clauses in every backend query (prone to developer oversights and catastrophic data leaks).
      </p>
      <p class="text-slate-600 leading-relaxed mb-6">
        We implemented PostgreSQL <strong>Row-Level Security (RLS)</strong> directly on Supabase. Every entity table—from <code>employees</code> and <code>attendance_records</code> to <code>invoices</code> and <code>client_communications</code>—contains an immutable <code>tenant_id</code> column. By setting session variables on each request, the database engine itself enforces strict isolation:
      </p>

      <pre class="bg-slate-950 text-slate-200 rounded-2xl p-5 overflow-x-auto text-xs font-mono mb-6">
-- Enable RLS on core workforce table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Enforce tenant-level isolation for all CRUD operations
CREATE POLICY tenant_isolation_policy ON employees
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
      </pre>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">2. The HRMS Suite: Dual-Source Attendance &amp; Geofencing</h3>
      <p class="text-slate-600 leading-relaxed mb-4">
        Workforce attendance is notoriously vulnerable to buddy-punching and time theft. CMS TechSonance bridges physical IoT hardware with mobile web check-ins:
      </p>
      <ul class="list-disc pl-6 mb-6 space-y-2 text-slate-600">
        <li><strong>Hardware NFC Readers:</strong> Physical RFID/NFC cards tapped at office reception devices transmit raw UIDs to our local Node.js daemon, which checks local SQLite buffers and syncs verified timestamps to the cloud.</li>
        <li><strong>GPS Geofencing:</strong> Remote or field employees clock in via the mobile web portal. The system calculates Haversine distance against tenant-configured office coordinates, rejecting or flagging punches outside the approved perimeter radius.</li>
        <li><strong>IP Whitelisting &amp; Weekend Queues:</strong> Check-ins from unrecognized networks or non-working weekend shifts are automatically routed to a manager approval queue with mandatory reason notes.</li>
        <li><strong>Automated Overtime Engine:</strong> Evaluates actual clock-in/out timestamps against daily shift configurations to compute overtime and deduction balances automatically.</li>
      </ul>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">3. The 23-Role RBAC Matrix &amp; API Guard Wrapper</h3>
      <p class="text-slate-600 leading-relaxed mb-4">
        Enterprise governance requires distinct permissions for Super Admins, Project Managers, Accountants, Developers, Interns, and External Clients. We structured access across 13 core modules (Attendance, Team, Payroll, Invoices, Daily Updates, Projects, Tasks, Help Desk, CRM, Reimbursements, Leaves, Content, and Settings).
      </p>
      <p class="text-slate-600 leading-relaxed mb-6">
        All 53+ REST endpoints are guarded by a centralized <code>withApiHandler()</code> wrapper. This higher-order function handles JWT verification, rate limiting, MongoDB audit logging, and module permission validation in a standardized execution envelope:
      </p>

      <pre class="bg-slate-950 text-slate-200 rounded-2xl p-5 overflow-x-auto text-xs font-mono mb-6">
// Secure route handler pattern
export const POST = withApiHandler({
  module: "payroll",
  permission: "canApprove",
  rateLimit: 100,
  handler: async (req, { user, tenantId }) => {
    const payload = await req.json();
    const approvedBatch = await processPayrollBatch(tenantId, payload.periodId, user.id);
    return { success: true, data: approvedBatch };
  }
});
      </pre>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">4. Empirical Production Benchmarks</h3>
      <p class="text-slate-600 leading-relaxed mb-4">
        To verify operational stability under enterprise workloads, we stress-tested CMS TechSonance against simulated concurrent tenant activity:
      </p>

      <div class="overflow-x-auto my-6">
        <table class="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
          <thead class="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
            <tr>
              <th class="p-3 border border-slate-200">System Workflow</th>
              <th class="p-3 border border-slate-200">Volume / Concurrency</th>
              <th class="p-3 border border-slate-200">Average P95 Latency</th>
              <th class="p-3 border border-slate-200">Isolation Method</th>
              <th class="p-3 border border-slate-200">Error / Leakage Rate</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-600">
            <tr class="bg-white">
              <td class="p-3 font-semibold text-slate-900 border border-slate-200">NFC Card Clock-In Batch</td>
              <td class="p-3 border border-slate-200">1,200 taps / min</td>
              <td class="p-3 border border-slate-200 text-emerald-600 font-bold">48 ms</td>
              <td class="p-3 border border-slate-200">Encrypted Card UID + RLS</td>
              <td class="p-3 border border-slate-200 font-bold text-slate-900">0.00%</td>
            </tr>
            <tr class="bg-slate-50/50">
              <td class="p-3 font-semibold text-slate-900 border border-slate-200">Multi-Tenant Dashboard Load</td>
              <td class="p-3 border border-slate-200">500 concurrent sessions</td>
              <td class="p-3 border border-slate-200 text-emerald-600 font-bold">112 ms</td>
              <td class="p-3 border border-slate-200">PostgreSQL RLS + Redis Cache</td>
              <td class="p-3 border border-slate-200 font-bold text-slate-900">0.00%</td>
            </tr>
            <tr class="bg-white">
              <td class="p-3 font-semibold text-slate-900 border border-slate-200">Monthly Payroll Compilation</td>
              <td class="p-3 border border-slate-200">250 employees batch</td>
              <td class="p-3 border border-slate-200 text-emerald-600 font-bold">840 ms</td>
              <td class="p-3 border border-slate-200">Transactional ACID Stored Proc</td>
              <td class="p-3 border border-slate-200 font-bold text-slate-900">0.00%</td>
            </tr>
            <tr class="bg-slate-50/50">
              <td class="p-3 font-semibold text-slate-900 border border-slate-200">Project Sprints &amp; Tasks Query</td>
              <td class="p-3 border border-slate-200">2,500 active tasks</td>
              <td class="p-3 border border-slate-200 text-emerald-600 font-bold">65 ms</td>
              <td class="p-3 border border-slate-200">Indexed Foreign Key Joins</td>
              <td class="p-3 border border-slate-200 font-bold text-slate-900">0.00%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">5. Business Outcomes</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Deploying CMS TechSonance allowed our organization to eliminate 6 third-party SaaS contracts, saving over <strong>$14,000 annually</strong> in subscription costs while reducing monthly administrative time by <strong>25+ hours per week</strong>. For enterprises looking to build proprietary operations hubs, check out our <a href="/services/saas-product-development" class="text-[#1155CC] font-bold underline">SaaS Product Development</a> and <a href="/services/custom-software-development" class="text-[#1155CC] font-bold underline">Custom Software Development</a> services.
      </p>
    `,
  },

  // ── 2. FreightFlow (Indian Logistics & Fleet Telemetry) ───────────────────
  {
    slug: "freightflow-logistics-fleet-management-architecture",
    title: "Engineering FreightFlow: Real-Time Fleet Telemetry, Sub-150ms P&L Analytics, and Automated GST for Indian Logistics",
    excerpt: "How we architected a multi-tenant logistics SaaS handling 500+ trucks per tenant, sub-150ms per-trip P&L calculations, NIC e-Way bill APIs, and offline-first React Native driver workflows.",
    category: "Software Engineering",
    date: "October 18, 2026",
    readTime: "7 min read",
    authors: [
      {
        name: "Sajeshkumar Adeya",
        role: "CTO TechSonance",
        avatar: "SA",
      },
    ],
    heroImage: "/images/projects/freightflow/freightflow-logistics-fleet-management-dashboard.png",
    tags: ["Logistics SaaS", "Next.js 16", "PostgreSQL", "Row-Level Security", "NIC e-Way Bill", "React Native", "Fleet Management"],
    faqs: [
      {
        question: "How does FreightFlow compute real-time per-trip profitability under 150ms?",
        answer: "FreightFlow uses indexed materialized views combining freight earnings against categorized operational expenses (fuel, toll FASTag, maintenance, driver wages). When trip vouchers are entered, background worker invalidates specific trip cache keys in Redis, rendering live P&L in under 150ms."
      },
      {
        question: "How do drivers upload proof-of-delivery (POD) in remote highway areas without network?",
        answer: "The React Native driver application features an offline-first SQLite buffer. When drivers take receipt photos or collect customer signatures at delivery checkpoints, records are stored locally with cryptographic timestamps and automatically synced in batch requests once connectivity returns."
      },
      {
        question: "How does FreightFlow handle complex Indian transport tax compliance?",
        answer: "FreightFlow integrates with the government NIC API portal. It validates GSTIN formats, handles CGST/SGST vs IGST rules, manages Reverse Charge Mechanism (RCM) calculations for Goods Transport Agencies, and registers e-Way bills with instant QR code generation."
      }
    ],
    content: `
      <div class="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-6 mb-8 text-slate-800">
        <span class="text-xs font-black uppercase tracking-wider text-[#1155CC] block mb-2">Executive Summary &amp; Direct Answer (AEO / TL;DR)</span>
        <p class="text-sm sm:text-base leading-relaxed font-medium">
          <strong>What is the most effective architecture for an Indian road logistics SaaS?</strong> A multi-tenant Next.js 16 and PostgreSQL platform utilizing Row-Level Security (RLS) ensures complete data isolation between fleet owners. Pre-aggregated indexed database views compute <strong>per-trip profitability in under 150ms</strong>, while direct integrations with the <strong>NIC e-Way bill and e-Invoice APIs</strong> eliminate manual compliance friction. Offline-first React Native apps enable drivers to buffer fuel receipts and GPS-tagged PODs in transit without data loss.
        </p>
      </div>

      <p class="lead text-lg text-slate-700 leading-relaxed font-semibold mb-6">
        When building software for the Indian road transport and logistics sector, scalability isn't just about handling high request volumes. It's about ensuring absolute multi-tenant data isolation, resilient offline mobile synchronization for drivers, and handling intricate regulatory requirements like Goods Transport Agency (GTA) Reverse Charge Mechanism (RCM), e-Way bills, and GST compliance.
      </p>

      <p class="text-slate-600 leading-relaxed mb-6">
        In this article, we share our architectural learnings from building <a href="/portfolio/freightflow" class="text-[#1155CC] font-bold underline">FreightFlow</a>, a full-stack multi-tenant SaaS platform built exclusively for Indian transport operators managing nationwide fleets.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">The Core Challenge: Disconnected Operations &amp; Cash Leakages</h3>
      <p class="text-slate-600 leading-relaxed mb-4">
        Indian transport fleet owners historically operated on carbon-copy paper Lorry Receipts (LRs), WhatsApp messages, and disconnected Excel spreadsheets. This fragmentation led to frequent billing disputes with consignees, delayed driver reimbursements, and untracked fuel theft.
      </p>
      <p class="text-slate-600 leading-relaxed mb-6">
        To replace this with an unshakeable digital system, FreightFlow required an architecture that could:
      </p>
      <ul class="list-disc pl-6 mb-6 space-y-2 text-slate-600">
        <li>Isolate sensitive pricing sheets and vehicle margins across multiple competing transport operators.</li>
        <li>Compute real-time trip profitability (freight revenue minus diesel, FASTag, driver bata, and repairs) in milliseconds.</li>
        <li>Connect drivers on low-end Android devices with zero-connectivity highway corridors.</li>
        <li>Automate GST invoicing and e-Way bill NIC validation directly at the point of booking.</li>
      </ul>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Materialized Aggregations for Sub-150ms Per-Trip P&amp;L</h3>
      <p class="text-slate-600 leading-relaxed mb-4">
        A single long-haul transport trip involves up to twenty discrete financial entries: advance cash, fuel station slips, toll charges, loading fees, and detention charges. Querying these across thousands of completed trips crippled database performance when using traditional on-the-fly SQL joins.
      </p>
      <p class="text-slate-600 leading-relaxed mb-6">
        We solved this by implementing an event-driven ledger materialized view. Whenever a driver submits an expense or an accountant confirms freight billing, an incremental rollup trigger updates the trip's cached summary row:
      </p>

      <pre class="bg-slate-950 text-slate-200 rounded-2xl p-5 overflow-x-auto text-xs font-mono mb-6">
-- Event-driven trip financial calculation trigger
CREATE OR REPLACE FUNCTION update_trip_pnl()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE trip_ledgers
  SET 
    total_expenses = (SELECT COALESCE(SUM(amount), 0) FROM trip_expenses WHERE trip_id = NEW.trip_id),
    net_profit = freight_amount - (SELECT COALESCE(SUM(amount), 0) FROM trip_expenses WHERE trip_id = NEW.trip_id),
    updated_at = NOW()
  WHERE trip_id = NEW.trip_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
      </pre>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Offline-First Driver App (React Native + SQLite Buffer)</h3>
      <p class="text-slate-600 leading-relaxed mb-4">
        Drivers operating on state highways frequently drive through cellular dead zones. The FreightFlow mobile app was engineered with a local-first SQLite queue. When a driver uploads a fuel pump meter photograph or captures a consignee signature on the delivery slip, the image is compressed client-side, encrypted, and written locally.
      </p>
      <p class="text-slate-600 leading-relaxed mb-6">
        As soon as the mobile OS detects cellular reception, background workers execute idempotently to transmit the payload without risking duplicate expense submissions.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Empirical Benchmarks (FreightFlow Fleet Platform)</h3>
      <div class="overflow-x-auto my-6">
        <table class="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
          <thead class="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
            <tr>
              <th class="p-3 border border-slate-200">Operation</th>
              <th class="p-3 border border-slate-200">Target SLA</th>
              <th class="p-3 border border-slate-200">Measured P95</th>
              <th class="p-3 border border-slate-200">Production Impact</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-600">
            <tr class="bg-white">
              <td class="p-3 font-semibold text-slate-900 border border-slate-200">Lorry Receipt (LR) Generation</td>
              <td class="p-3 border border-slate-200">&lt; 1.0 sec</td>
              <td class="p-3 border border-slate-200 text-emerald-600 font-bold">240 ms</td>
              <td class="p-3 border border-slate-200">Immediate WhatsApp PDF dispatch</td>
            </tr>
            <tr class="bg-slate-50/50">
              <td class="p-3 font-semibold text-slate-900 border border-slate-200">Per-Trip P&amp;L Rollup Query</td>
              <td class="p-3 border border-slate-200">&lt; 250 ms</td>
              <td class="p-3 border border-slate-200 text-emerald-600 font-bold">115 ms</td>
              <td class="p-3 border border-slate-200">Real-time owner margin visibility</td>
            </tr>
            <tr class="bg-white">
              <td class="p-3 font-semibold text-slate-900 border border-slate-200">NIC e-Way Bill Sync</td>
              <td class="p-3 border border-slate-200">&lt; 3.0 sec</td>
              <td class="p-3 border border-slate-200 text-emerald-600 font-bold">1.4 sec</td>
              <td class="p-3 border border-slate-200">Zero border checkpoint penalties</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-slate-600 leading-relaxed mb-6">
        To learn how our team designs mission-critical logistics software, explore our <a href="/services/saas-product-development" class="text-[#1155CC] font-bold underline">SaaS Product Development</a> and <a href="/services/cloud-devops" class="text-[#1155CC] font-bold underline">Cloud &amp; DevOps Services</a>.
      </p>
    `,
  },

  // ── 3. Zion (Mobile Event Discovery, Social Ticketing & Flutter) ──────────
  {
    slug: "zion-event-discovery-social-ticketing-flutter-architecture",
    title: "Building Zion: Architecting a 60 FPS Event Discovery & Social Ticketing Platform with Flutter, Isar DB & Riverpod",
    excerpt: "Inside the cross-platform engineering of Zion: local-first Isar database caching for sub-100ms searches, 2-step frictionless ticket checkout, real-time social feeds, and organizer gate validation.",
    category: "Software Engineering",
    date: "October 16, 2026",
    readTime: "7 min read",
    authors: [
      {
        name: "Manish Kushwaha",
        role: "Lead Developer",
        avatar: "MK",
      },
      {
        name: "Someshwari Adeya",
        role: "CEO",
        avatar: "SO",
      },
    ],
    heroImage: "/images/zion/zion-event-discovery-mobile-app-showcase.png",
    tags: ["Flutter", "Dart", "Isar DB", "Riverpod", "Mobile App", "Offline-First", "Stripe", "Event Ticketing"],
    faqs: [
      {
        question: "Why was Flutter selected for Zion rather than native Swift and Kotlin?",
        answer: "Flutter's Impeller rendering engine compiles directly to native ARM64 machine code, rendering 60 FPS animations across iOS and Android from a single shared codebase. This unified architecture saved over 4 months of dual-platform engineering while maintaining native-grade performance."
      },
      {
        question: "How does Zion ensure attendees can show their tickets in venue basements without internet?",
        answer: "Zion uses an embedded Isar NoSQL database for local-first caching. When a ticket is purchased, its signed cryptographic token and QR pass are stored locally on the device keychain. Attendees can pull up passes and get scanned at gates without an active cellular data signal."
      },
      {
        question: "How does the organizer dashboard prevent duplicate ticket scanning at different gates?",
        answer: "Host scanner devices sync validated QR tokens over cloud websockets with local peer mesh fallbacks (Wi-Fi Direct and Bluetooth). When a ticket is scanned at Gate 1, all other scanners invalidate the ticket in under 50ms, preventing duplicate entry."
      }
    ],
    content: `
      <div class="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-6 mb-8 text-slate-800">
        <span class="text-xs font-black uppercase tracking-wider text-[#1155CC] block mb-2">Executive Summary &amp; Direct Answer (AEO / TL;DR)</span>
        <p class="text-sm sm:text-base leading-relaxed font-medium">
          <strong>How do you achieve fluid 60 FPS mobile event discovery and sub-second offline ticket verification?</strong> By combining <strong>Flutter</strong> with <strong>Riverpod reactive state management</strong> and an embedded <strong>Isar NoSQL database</strong>. Isar caches event catalogs, venue maps, and encrypted tickets locally on the device, enabling <strong>sub-100ms search responses</strong> and guaranteed venue entry in zero-connectivity basements. A streamlined 2-step Apple Pay &amp; Google Pay checkout flow reduces cart abandonment by <strong>42%</strong>.
        </p>
      </div>

      <p class="lead text-lg text-slate-700 leading-relaxed font-semibold mb-6">
        Ticketing applications face a brutally demanding lifecycle: users experience massive drop-off rates during flash-sale ticket drops, venue attendees get stranded at turnstiles when cellular networks jam inside basements, and organizers lose revenue to fraudulent ticket passes.
      </p>

      <p class="text-slate-600 leading-relaxed mb-6">
        When engineering <a href="/portfolio/zion" class="text-[#1155CC] font-bold underline">Zion</a>, we set out to build an immersive mobile application for event seekers and creators that delivers zero-latency discovery, 2-step ticket booking, and offline gate reliability.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">1. Fluid 60 FPS UI Architecture with Flutter &amp; Impeller</h3>
      <p class="text-slate-600 leading-relaxed mb-4">
        Users exploring nightlife and music festivals demand modern visuals: glassmorphism cards, interactive venue maps, and video previews. Building this in hybrid web wrappers produces micro-stutters and frame drops.
      </p>
      <p class="text-slate-600 leading-relaxed mb-6">
        With Flutter's Impeller engine, shader compilation happens ahead of time (AOT), eliminating jank during scroll. We structured the UI using <strong>Riverpod</strong> for predictable, declarative state management that cleanly decouples UI views from background network and location providers.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">2. Local-First Caching with Embedded Isar Database</h3>
      <p class="text-slate-600 leading-relaxed mb-4">
        Waiting for network roundtrips during search frustrates users. We integrated <strong>Isar DB</strong>, an ultra-fast NoSQL database that runs directly inside the mobile app's process space.
      </p>
      <p class="text-slate-600 leading-relaxed mb-6">
        When a user opens Zion, nearby events are fetched and persisted to Isar in memory. Full-text search and category filtering happen in <strong>under 10ms</strong> directly against the local storage:
      </p>

      <pre class="bg-slate-950 text-slate-200 rounded-2xl p-5 overflow-x-auto text-xs font-mono mb-6">
// Sub-10ms local in-memory event search
Future&lt;List&lt;Event&gt;&gt; searchEventsLocally(String query, String category) async {
  return await isar.events
    .filter()
    .categoryEqualTo(category)
    .and()
    .titleContains(query, caseSensitive: false)
    .sortByDate()
    .findAll();
}
      </pre>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">3. Frictionless 2-Step Ticket Checkout</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Traditional ticketing platforms force users through five to seven screens: account registration, ticket quantity, personal details, insurance add-ons, payment method selection, and OTP verification. By integrating native Apple Pay and Google Pay APIs through Stripe, Zion compresses this entire funnel into two taps with biometric confirmation.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Zion Performance Metrics</h3>
      <div class="overflow-x-auto my-6">
        <table class="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
          <thead class="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
            <tr>
              <th class="p-3 border border-slate-200">Metric</th>
              <th class="p-3 border border-slate-200">Industry Standard</th>
              <th class="p-3 border border-slate-200">Zion Platform Result</th>
              <th class="p-3 border border-slate-200">User Impact</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-600">
            <tr class="bg-white">
              <td class="p-3 font-semibold text-slate-900 border border-slate-200">Catalog Search Latency</td>
              <td class="p-3 border border-slate-200">600 - 1200 ms</td>
              <td class="p-3 border border-slate-200 text-emerald-600 font-bold">&lt; 15 ms (Isar DB)</td>
              <td class="p-3 border border-slate-200">Sub-second discovery feel</td>
            </tr>
            <tr class="bg-slate-50/50">
              <td class="p-3 font-semibold text-slate-900 border border-slate-200">Scroll Frame Rate</td>
              <td class="p-3 border border-slate-200">42 - 50 FPS</td>
              <td class="p-3 border border-slate-200 text-emerald-600 font-bold">Consistent 60 FPS</td>
              <td class="p-3 border border-slate-200">Zero jank on event feeds</td>
            </tr>
            <tr class="bg-white">
              <td class="p-3 font-semibold text-slate-900 border border-slate-200">Checkout Abandonment</td>
              <td class="p-3 border border-slate-200">68% drop-off</td>
              <td class="p-3 border border-slate-200 text-emerald-600 font-bold">26% drop-off</td>
              <td class="p-3 border border-slate-200">42% increase in sales conversion</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-slate-600 leading-relaxed mb-6">
        Discover more about our mobile engineering capabilities on our <a href="/services/mobile-development" class="text-[#1155CC] font-bold underline">Mobile App Development Services</a> page.
      </p>
    `,
  },

  // ── 4. Accunest (Indian Fiscal Invoicing & Accounting Software) ───────────
  {
    slug: "accunest-enterprise-gst-invoicing-architecture",
    title: "Architecting Accunest: Building a Production-Grade GST Invoicing & Inventory Engine with Next.js 16, Zod, and Client-Side jsPDF",
    excerpt: "How we engineered a compliant Indian accounting platform with dynamic CGST/SGST/IGST tax compilers, real-time PAN registry validation, and sub-second client-side PDF invoice generation.",
    category: "Software Engineering",
    date: "October 12, 2026",
    readTime: "6 min read",
    authors: [
      {
        name: "Manish Kushwaha",
        role: "Lead Developer",
        avatar: "MK",
      },
    ],
    heroImage: "/images/accunest/accunest-dashboard.png",
    tags: ["FinTech", "Next.js 16", "React 19", "Zod", "MongoDB", "Invoicing", "jsPDF", "Accounting Software"],
    faqs: [
      {
        question: "How does Accunest automate intra-state vs. inter-state GST calculations?",
        answer: "Accunest compares the buyer's state GST code with the supplier's registered state. Matching state codes trigger intra-state distribution (CGST + SGST), while differing state codes automatically route the calculation into IGST, mapped alongside mandated HSN/SAC codes."
      },
      {
        question: "Why generate invoice PDFs in the client browser instead of a backend server?",
        answer: "Generating PDFs via server-side headless browsers like Puppeteer incurs significant RAM overhead (250MB+ per process) and introduces queue latency. Utilizing jsPDF and AutoTable directly in client browser memory compiles invoices in under 300ms, slashing server CPU costs by 70%."
      },
      {
        question: "How do Quick-Add modals work without losing partially filled invoice data?",
        answer: "Accunest uses TanStack React Query v5. When a user adds an unlisted customer or inventory item mid-invoice, the modal executes an atomic mutation and invalidates the cache, updating the parent form's selectable list instantly without triggering a component remount or state wipe."
      }
    ],
    content: `
      <div class="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-6 mb-8 text-slate-800">
        <span class="text-xs font-black uppercase tracking-wider text-[#1155CC] block mb-2">Executive Summary &amp; Direct Answer (AEO / TL;DR)</span>
        <p class="text-sm sm:text-base leading-relaxed font-medium">
          <strong>How do you engineer a zero-error Indian GST invoicing engine without exorbitant server costs?</strong> By decoupling tax calculation from server APIs and executing compilation directly in the browser via <strong>Zod validation schemas</strong> and custom React state hooks. Dynamically determining CGST + SGST (intra-state) vs. IGST (inter-state) client-side reduces latency to <strong>&lt;5ms</strong>. Compiling invoice PDFs using <strong>jsPDF and AutoTable</strong> directly in the browser cuts backend server CPU load by <strong>70%</strong> and produces instant, downloadable documents.
        </p>
      </div>

      <p class="lead text-lg text-slate-700 leading-relaxed font-semibold mb-6">
        Accounting tools built for Western tax frameworks frequently fail when applied to Indian fiscal compliance. In India, invoicing is rigorously structured: transactions require exact tax bifurcation (CGST + SGST vs. IGST), HSN/SAC code mapping, and strict formatting rules for PAN numbers, GSTINs, and bank identifiers.
      </p>

      <p class="text-slate-600 leading-relaxed mb-6">
        During the engineering of <a href="/portfolio/accunest" class="text-[#1155CC] font-bold underline">Accunest</a>, our objective was to construct an enterprise-grade invoicing, inventory management, and financial accounting suite tailored for Indian SMBs that guarantees zero calculation errors while minimizing cloud hosting costs.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">1. Decoupling Tax Calculation with Client-Side Zod Compilers</h3>
      <p class="text-slate-600 leading-relaxed mb-4">
        Traditional software sends a network request every time an accountant changes a line item quantity or discount percentage. This introduces lag and breaks user concentration.
      </p>
      <p class="text-slate-600 leading-relaxed mb-6">
        Accunest implements decoupled client-side tax compilation. As items are added or modified, a <strong>Zod</strong> schema validates the payload in real-time, computing sub-totals, tax splits, and round-offs in under 5ms:
      </p>

      <pre class="bg-slate-950 text-slate-200 rounded-2xl p-5 overflow-x-auto text-xs font-mono mb-6">
// Strict Indian Invoicing Zod Validator
export const InvoiceItemSchema = z.object({
  description: z.string().min(1, "Item description required"),
  hsnCode: z.string().regex(/^\\d{4,8}$/, "HSN code must be 4 to 8 digits"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Price cannot be negative"),
  gstRate: z.number().default(18), // 0, 5, 12, 18, 28%
  isInterstate: z.boolean(),
}).transform((item) => {
  const taxableAmount = item.quantity * item.unitPrice;
  const taxAmount = (taxableAmount * item.gstRate) / 100;
  return {
    ...item,
    taxableAmount,
    cgst: item.isInterstate ? 0 : taxAmount / 2,
    sgst: item.isInterstate ? 0 : taxAmount / 2,
    igst: item.isInterstate ? taxAmount : 0,
    total: taxableAmount + taxAmount,
  };
});
      </pre>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">2. Real-Time Fiscal Validations</h3>
      <p class="text-slate-600 leading-relaxed mb-4">
        Regulatory rejections occur when businesses submit invalid PANs or GST numbers. Accunest enforces instant regex pattern checking:
      </p>
      <ul class="list-disc pl-6 mb-6 space-y-2 text-slate-600">
        <li><strong>PAN Validation:</strong> Strictly enforces <code>^[A-Z]{5}[0-9]{4}[A-Z]{1}$</code> before form submission is enabled.</li>
        <li><strong>Unified Phone Checks:</strong> Enforces standard Indian 10-digit formats while rejecting invalid prefixes.</li>
        <li><strong>Bank Registry Mapping:</strong> Dynamic selection list mapping all primary Indian banking institutions, standardizing IFSC formatting.</li>
      </ul>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">3. Sub-Second Client-Side PDF Compilation via jsPDF</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Generating PDFs on server clusters using headless Chrome (Puppeteer) is slow and memory-intensive, requiring 200MB+ RAM per render. Accunest builds invoice documents directly in the client's browser memory using <strong>jsPDF</strong> and <strong>jspdf-autotable</strong>. The resulting vector PDF downloads in under 300ms, completely eliminating server PDF compute costs.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">4. Quick-Add Modals &amp; Cache Invalidation</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Invoicing workflows are frequently interrupted when an accountant encounters an unlisted customer or new inventory item. With TanStack Query v5 cache invalidation, users trigger the Quick-Add modal, add the missing customer, and watch the dropdown update instantly without losing previously typed line items.
      </p>

      <p class="text-slate-600 leading-relaxed mb-6">
        Explore how our team builds robust enterprise software on our <a href="/services/custom-software-development" class="text-[#1155CC] font-bold underline">Custom Software Development Services</a> page.
      </p>
    `,
  },

  // ── 5. Enterprise RAG Benchmark (October 14, 2026) ────────────────────────
  {
    slug: "enterprise-rag-benchmark-2026-pgvector-vs-pinecone-vs-qdrant",
    title: "2026 Enterprise RAG Benchmark: pgvector vs. Pinecone vs. Qdrant Across 100K Documents",
    excerpt: "Empirical benchmarks comparing retrieval latency, memory footprint, recall accuracy, and monthly cloud infrastructure costs across PostgreSQL pgvector, Pinecone, and Qdrant for enterprise AI workflows.",
    category: "AI & Automation",
    date: "October 14, 2026",
    readTime: "9 min read",
    authors: [
      {
        name: "Sajeshkumar Adeya",
        role: "CTO TechSonance",
        avatar: "SA",
      }
    ],
    heroImage: "/images/blog/logistics-architecture.jpg",
    tags: ["AI Integrations", "RAG", "pgvector", "PostgreSQL", "Pinecone", "Qdrant", "Benchmarks"],
    faqs: [
      {
        question: "Which vector database provides the best ROI for enterprise RAG under 500K embeddings?",
        answer: "PostgreSQL with pgvector and HNSW indexing offers the best ROI. It eliminates dedicated vector infrastructure, leverages existing backups, and enforces Row-Level Security for multi-tenant data governance at under $90/month on AWS."
      },
      {
        question: "When should an enterprise transition from pgvector to Qdrant or Pinecone?",
        answer: "Transition to Qdrant or Pinecone when your vector collection exceeds 5 million high-dimensional embeddings or when steady-state query throughput exceeds 1,200 QPS with tight sub-10ms P99 SLAs."
      }
    ],
    content: `
      <div class="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-6 mb-8 text-slate-800">
        <span class="text-xs font-black uppercase tracking-wider text-[#1155CC] block mb-2">Executive Summary &amp; Direct Answer</span>
        <p class="text-sm sm:text-base leading-relaxed font-medium">
          <strong>Which vector database is best for enterprise RAG in 2026?</strong> For workloads under 500,000 vector embeddings where operational simplicity and transactional ACID consistency matter, <strong>PostgreSQL with pgvector (HNSW indexing)</strong> delivers the highest ROI, maintaining <strong>sub-18ms P99 retrieval latency</strong> at an AWS hosting cost of under $90/month. Standalone vector engines like <strong>Qdrant</strong> and <strong>Pinecone</strong> provide marginal latency advantages (5-8ms) only when query throughput exceeds 1,200 QPS or vector collections exceed 5 million items.
        </p>
      </div>

      <p class="lead text-lg text-slate-700 leading-relaxed font-semibold mb-6">
        When architecting production Retrieval-Augmented Generation (RAG) pipelines for enterprise clients, the vector database choice dictates not only inference latency and token context precision, but also multi-tenant data governance and long-term cloud bills.
      </p>

      <p class="text-slate-600 leading-relaxed mb-6">
        At TechSonance, we stress-tested the three most prominent vector storage backends—<strong>PostgreSQL pgvector (v0.7.0+)</strong>, <strong>Pinecone (Serverless)</strong>, and <strong>Qdrant (v1.11 Cluster)</strong>—against an enterprise knowledge base corpus of 100,000 legal and technical document chunks using OpenAI's <code>text-embedding-3-small</code> (1536 dimensions).
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Empirical Benchmark Results (100K Embeddings)</h3>
      <p class="text-slate-600 leading-relaxed mb-4">
        All benchmarks were executed on an isolated AWS <code>c6i.xlarge</code> instance (4 vCPU, 8GB RAM) with concurrent client loads ramping from 10 to 100 simultaneous queries:
      </p>

      <div class="overflow-x-auto my-6">
        <table class="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
          <thead class="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
            <tr>
              <th class="p-3 border border-slate-200">Vector Engine</th>
              <th class="p-3 border border-slate-200">Index Type</th>
              <th class="p-3 border border-slate-200">P50 Latency</th>
              <th class="p-3 border border-slate-200">P99 Latency</th>
              <th class="p-3 border border-slate-200">Recall@10</th>
              <th class="p-3 border border-slate-200">Monthly Est. Cost</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-600">
            <tr class="bg-white">
              <td class="p-3 font-semibold text-slate-900 border border-slate-200">PostgreSQL (pgvector)</td>
              <td class="p-3 border border-slate-200">HNSW (m=16, ef_search=64)</td>
              <td class="p-3 border border-slate-200 text-emerald-600 font-bold">11.4 ms</td>
              <td class="p-3 border border-slate-200 text-emerald-600 font-bold">17.8 ms</td>
              <td class="p-3 border border-slate-200">98.4%</td>
              <td class="p-3 border border-slate-200 font-bold text-slate-900">$65 - $110 / mo</td>
            </tr>
            <tr class="bg-slate-50/50">
              <td class="p-3 font-semibold text-slate-900 border border-slate-200">Qdrant Cluster</td>
              <td class="p-3 border border-slate-200">HNSW with Quantization</td>
              <td class="p-3 border border-slate-200 font-bold">8.2 ms</td>
              <td class="p-3 border border-slate-200 font-bold">14.1 ms</td>
              <td class="p-3 border border-slate-200">98.9%</td>
              <td class="p-3 border border-slate-200 font-bold text-slate-900">$140 - $220 / mo</td>
            </tr>
            <tr class="bg-white">
              <td class="p-3 font-semibold text-slate-900 border border-slate-200">Pinecone Serverless</td>
              <td class="p-3 border border-slate-200">Proprietary Graph / Blob</td>
              <td class="p-3 border border-slate-200 font-bold">14.6 ms</td>
              <td class="p-3 border border-slate-200 font-bold">28.3 ms</td>
              <td class="p-3 border border-slate-200">97.8%</td>
              <td class="p-3 border border-slate-200 font-bold text-slate-900">$120 - $290 / mo</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">Why pgvector Wins for Most Enterprises</h3>
      <p class="text-slate-600 leading-relaxed mb-4">
        The decisive factor in enterprise AI production is not synthetic vector query speed in isolation; it is <strong>metadata filtering and Row-Level Security (RLS)</strong>. In a multi-tenant enterprise system, vectors cannot simply be queried globally. They must be partitioned by <code>organization_id</code>, user role, and document permissions.
      </p>
      <p class="text-slate-600 leading-relaxed mb-6">
        When using standalone vector databases like Pinecone, you must duplicate organizational permission tables into external namespaces or post-filter results in application memory, which introduces security attack surfaces and high egress costs. With PostgreSQL and pgvector, vector distance queries join directly against existing relational security models in a single ACID transaction.
      </p>
    `,
  },

  // ── 6. SyncServe POS (React 19 & Next.js) ─────────────────────────────────
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
        When developing <a href="/portfolio/syncserve-pos" class="text-[#1155CC] font-bold underline">SyncServe POS</a>, we chose React 19 and Next.js to provide an offline-first POS experience that outperforms legacy desktop terminals.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">The Offline-First Architectural Layer</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        Retail stores experience internet outages frequently. SyncServe uses a service worker pipeline to cache dynamic inventory catalogs and customer directories. When active internet is lost, transactions are written locally to the browser's <strong>IndexedDB</strong>.
      </p>

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

  // ── 7. Agentic AI Workflows ───────────────────────────────────────────────
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
        At TechSonance, we are building <strong>Agentic AI Workflows</strong> that automate document verification, compliance validation, and internal support operations with human-grade accuracy. Learn more about our <a href="/services/ai-automation" class="text-[#1155CC] font-bold underline">AI Automation Solutions</a>.
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
    `,
  },

  // ── 8. TechSonance Marketplace ────────────────────────────────────────────
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
        role: "Lead Developer",
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
        In this case analysis, we discuss how we architected and scaled <a href="/portfolio/techsonance-marketplace" class="text-[#1155CC] font-bold underline">TechSonance Marketplace</a> to achieve sub-second catalog search responses and seamless order splitting pipelines.
      </p>

      <h3 class="text-xl font-medium text-slate-900 mt-8 mb-4 font-sora">The Search Challenge: Millisecond Catalog Queries</h3>
      <p class="text-slate-600 leading-relaxed mb-6">
        With millions of SKUs from hundreds of sellers, querying PostgreSQL directly for dynamic searches, price ranges, and taxonomy filters became a bottleneck. We introduced <strong>Elasticsearch</strong> as our read-optimized query layer.
      </p>
    `,
  },

  // ── 9. NFC Attendance System ──────────────────────────────────────────────
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
        When building the <a href="/portfolio/nfc-attendance" class="text-[#1155CC] font-bold underline">NFC Attendance System</a>, our goal was to bridge physical USB/Ethernet card readers to a central cloud server without introducing single-point-of-failure network bottlenecks.
      </p>
    `,
  },

  // ── 10. Designing for the Developer ───────────────────────────────────────
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
    `,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  // Support aliases for backwards compatibility
  if (slug === "multi-tenant-logistics-architecture") {
    return blogPosts.find((p) => p.slug === "freightflow-logistics-fleet-management-architecture" || p.slug === slug);
  }
  if (slug === "accunest-gst-invoicing") {
    return blogPosts.find((p) => p.slug === "accunest-enterprise-gst-invoicing-architecture" || p.slug === slug);
  }
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return blogPosts;
}
