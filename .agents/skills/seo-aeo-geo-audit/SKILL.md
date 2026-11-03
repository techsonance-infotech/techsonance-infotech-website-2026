---
name: seo-aeo-geo-audit
description: "Audit and verify Search Engine Optimization (SEO), AI Engine Optimization (AEO), and Generative Engine Optimization (GEO) for Techsonance Infotech pages, schema markup, and llms.txt."
---

# SEO, AEO & GEO Verification Runbook

Use this skill when modifying pages, blogs, services, or locations to ensure 100% compliance with TechSonance's AI and Search Engine visibility standards.

## Core Directives

1. **Canonical URLs & Base Domain**:
   - Always use `https://www.techsonance.co.in` (enforced via `lib/config.ts` and `next.config.ts`).
   - Validate `metadataBase` in `app/layout.tsx`.

2. **AEO & LLM Discoverability**:
   - Verify that any new service, location, or case study is reflected in `app/llms-full.txt` and `public/llms.txt`.
   - Ensure clean markdown headers, concise summaries, and unambiguous capabilities.

3. **Schema Markup (JSON-LD)**:
   - Pages must include appropriate structured data:
     - Home: `Organization`, `LocalBusiness`, `WebSite`
     - Services: `Service`, `FAQPage`, `BreadcrumbList`
     - Blog posts: `Article` / `BlogPosting`, `FAQPage`
   - Test JSON-LD with schema validators to ensure zero missing required properties.

4. **GEO Citations & Knowledge Base**:
   - When updating locations or contact information, sync `docs/OFF_PAGE_GEO_CITATION_KIT.md` and `docs/MEASUREMENT_AND_AI_VISIBILITY_TRACKER.md`.
