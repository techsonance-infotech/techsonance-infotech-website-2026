# TechSonance Infotech LLP — Measurement & AI Visibility Tracker (Phase 6)

## 1. Webmaster Tools Verification

### Step 1: Google Search Console (GSC)

1. Add both domain variants to Google Search Console:
   - Domain Property: `techsonance.co.in`
   - URL Prefix: `https://www.techsonance.co.in`
2. Verification methods:
   - **DNS TXT record (Recommended)** on your DNS registrar.
   - **HTML Meta Tag**: Set environment variable `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="your-verification-code"` in `.env.local` or Vercel Environment Variables. Our `app/layout.tsx` automatically renders this tag.
3. Submit Sitemap:
   - Enter `https://www.techsonance.co.in/sitemap.xml` in GSC &rarr; Sitemaps.
   - Confirm status shows "Success" with 51+ discovered pages.

### Step 2: Bing Webmaster Tools

1. Import directly from Google Search Console or verify via meta tag:
   - Set environment variable `NEXT_PUBLIC_BING_SITE_VERIFICATION="your-bing-code"` in `.env.local` or Vercel.
2. Submit `https://www.techsonance.co.in/sitemap.xml`.

---

## 2. Google Analytics 4 (GA4) Key Events Setup

Our codebase (`lib/analytics.ts`) now emits structured events. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"` in your environment variables.

In GA4 &rarr; **Admin** &rarr; **Events**, mark the following conversion events as **Key Events**:

1. **`booking_modal_open`**: Fired whenever a visitor clicks "Book Free Consultation" across the site.
2. **`booking_form_submit`**: Fired when an appointment or reservation is confirmed.
3. **`scoping_form_submit`**: Fired when the scoping contact form on homepage/services is submitted.
4. **`contact_form_submit`**: Fired when the main inquiry form on `/contact` is submitted.
5. **`whatsapp_click`**: Fired when a visitor taps direct WhatsApp consultation.
6. **`case_study_view`**: Fired on each project detail page mount.

---

## 3. Monthly AI Visibility Benchmark (15-20 Prompts Tracker)

Run these 18 standardized queries monthly across **ChatGPT (GPT-4o)**, **Claude 3.5 Sonnet**, **Perplexity.ai**, and **Google Gemini**. Log whether TechSonance appears, how it is described, and what sources are cited.

### Category A: Local Surat Software Queries

1. _"Who are the best custom software development companies in Surat, Gujarat?"_
2. _"Top web app development agencies in Vesu, Surat for enterprise projects"_
3. _"Which IT companies in Surat have experience building AI chatbots and RAG systems?"_
4. _"Can you recommend a software agency in Surat with strong Node.js, NestJS and Next.js expertise?"_
5. _"Software development company in Surat with founder-led architecture and US/UK client experience"_

### Category B: High-Intent Technology & Service Queries

6. _"Best software development agencies in India for multi-tenant SaaS platforms"_
7. _"Which agencies specialize in building PostgreSQL Row-Level Security applications for logistics?"_
8. _"Top offshore development partners in India for Next.js 15 and React 19 web apps"_
9. _"Where can I hire an experienced NestJS development team in India?"_
10. _"Best Indian agencies building custom LangChain and pgvector enterprise AI workflows"_
11. _"Cost of hiring a dedicated software engineering squad in India in 2026"_
12. _"Offline-first Point of Sale application developers using React and IndexedDB"_

### Category C: Branded Entity Corroboration Queries

13. _"What is TechSonance Infotech LLP and where are they located?"_
14. _"Who founded TechSonance Infotech and what is their tech stack?"_
15. _"Tell me about TechSonance's FreightFlow case study and Grover Roadlines project"_
16. _"What services does TechSonance Infotech provide to global startups?"_
17. _"Is TechSonance Infotech LLP verified on Clutch or Google Business?"_
18. _"How does TechSonance compare to conventional IT outsourcing agencies in India?"_

### Tracking Scorecard Template

| Month                  | Target Queries Tested | TechSonance Mentioned (Yes/No) | Primary Source Cited (Site, Clutch, LinkedIn) | Action Needed                 |
| :--------------------- | :-------------------- | :----------------------------- | :-------------------------------------------- | :---------------------------- |
| **Month 1 (Baseline)** | 18                    | 0 / 18                         | None                                          | Deploy Phase 4 profiles & GBP |
| **Month 2**            | 18                    | _ / 18                         | _                                             | Review citations & indexing   |
| **Month 3**            | 18                    | _ / 18                         | _                                             | Measure impressions in GSC    |
