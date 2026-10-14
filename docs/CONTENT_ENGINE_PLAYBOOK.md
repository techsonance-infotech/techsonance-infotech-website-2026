# TechSonance Infotech LLP — Content Engine & Citable Asset Playbook (Phase 5)

## 1. Publishing Strategy & Cadence

- **Frequency:** Minimum 2 technical posts per month + 1 original benchmark data piece per quarter.
- **Goal:** Build topical authority around custom software engineering, Next.js/React frontends, NestJS backends, and Enterprise AI/RAG automation that search engines index and LLMs cite as truth.

---

## 2. Article Structure Rules (For Search & AI Overviews)

Every post published in `data/blog.ts` must follow this 5-point formula:

1. **Direct Answer / TL;DR Box (First 60 Words):**
   - Place a highlighted box right under the title answering the core query directly ("What is X?", "Which is better X or Y?"). AI Overviews extract this verbatim.
2. **Author Byline with Schema Attribution:**
   - Always credit real team leaders (`Sajeshkumar Adeya` for engineering/CTO posts; `Someshwari Adeya` for product/founder posts; `Manish Kushwaha` for frontend/fullstack posts).
3. **Original Numbers & Reproducible Code:**
   - Include tables, latency numbers, architecture diagrams, or code snippets. Never publish generic fluffy advice that ChatGPT could generate without testing.
4. **Internal Link to Core Service:**
   - Every post must include 2-3 contextual internal links pointing back to related service pages (e.g. `/services/ai-automation`, `/services/custom-software-development`) and `/locations/surat`.
5. **Visible Updated Date (`dateModified`):**
   - Refresh top articles every 90 days and update `dateModified` in the schema.

---

## 3. 12-Week Editorial Queue

| Week | Target Topic | Target Keyword | Author Byline | Primary Internal Link |
| :--- | :--- | :--- | :--- | :--- |
| **Current** | Enterprise RAG Benchmark 2026: pgvector vs Pinecone vs Qdrant | `pgvector benchmark 2026`, `enterprise RAG architecture` | Sajeshkumar Adeya | `/services/ai-automation` |
| **Week 2** | Multi-Tenant Data Isolation with PostgreSQL Row-Level Security | `multi tenant postgresql rls`, `SaaS database security` | Sajeshkumar Adeya | `/services/saas-product-development` |
| **Week 4** | Building Offline-First POS Terminals with React 19 & IndexedDB | `offline first POS react`, `retail pos terminal engineering` | Manish Kushwaha | `/services/custom-software-development` |
| **Week 6** | Agentic AI Workflows: LangChain vs Autonomous Function Calling | `agentic AI workflows`, `custom AI agents India` | Sajeshkumar Adeya | `/services/ai-automation` |
| **Week 8** | Complete Software Development Cost Breakdown in India (2026 Guide) | `software development cost India`, `hire dedicated team India` | Someshwari Adeya | `/locations/surat` |
| **Week 10** | Migrating Legacy Express APIs to NestJS 11 Microservices | `NestJS development agency`, `Express to NestJS migration` | Sajeshkumar Adeya | `/services/custom-software-development` |
| **Week 12** | Flutter vs React Native in 2026: The Hardware & 60 FPS Reality | `mobile app developers Surat`, `Flutter development company` | Manish Kushwaha | `/locations/surat` |

---

## 4. Multi-Platform Syndication Checklist (Backlink Generation)

When a blog post goes live on `https://www.techsonance.co.in/blog/[slug]`:

1. **Dev.to:**
   - Syndicate the full post.
   - Set `canonical_url: https://www.techsonance.co.in/blog/[slug]` in Dev.to frontmatter.
2. **Medium:**
   - Use Medium's *"Import a story"* tool to automatically preserve the canonical tag pointing back to TechSonance.
3. **LinkedIn Articles:**
   - Publish a 400-word executive summary under the Founder or CTO's LinkedIn profile linking back to the full case study/post on the website.
4. **Reddit & Quora:**
   - Identify active discussions around the topic (e.g. r/nextjs, r/node, r/LangChain).
   - Provide a genuinely helpful, high-effort answer sharing reproducible technical insights with no spammy links. Mention TechSonance naturally only where relevant.
