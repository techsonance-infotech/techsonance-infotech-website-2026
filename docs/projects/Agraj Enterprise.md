# 🏭 Agraj Enterprise - Website

> **Industrial Painting & Protective Coating Solutions**
> *Protection. Performance. Perfection.*

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()
[![Status](https://img.shields.io/badge/Status-Production-brightgreen)]()

A fully **data-driven, SEO-optimized, multi-page marketing website** for **Agraj Enterprise** - a Bhavnagar-based industrial painting and protective coating company with **7+ years of experience** serving factories, warehouses, and process plants across Gujarat.

🔗 **Live Site:** [www.agrajenterprise.com](https://www.agrajenterprise.com)

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Industry Challenges & Solutions](#-industry-challenges--solutions)
- [Key Advantages](#-key-advantages)
- [Features & Modules](#-features--modules)
- [Tech Stack](#-tech-stack)
- [Architecture & Design Decisions](#-architecture--design-decisions)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Content Management (JSON-Driven)](#-content-management-json-driven)
- [SEO & Structured Data](#-seo--structured-data)
- [Performance & Security](#-performance--security)
- [Deployment](#-deployment)
- [Customization Guide](#-customization-guide)
- [Browser Support](#-browser-support)
- [Contact & Support](#-contact--support)

---

## 📌 Project Overview

This website is built with a **zero-hardcoded-values architecture**. Every piece of content - company name, phone number, service descriptions, project images, FAQ answers, safety protocols - lives in **JSON files** or a central **`config.ts`**. React components contain only logic and structure, never raw content strings or color hex values.

### What This Means in Practice

| Action | Effort |
|---|---|
| Update the phone number | Change **one line** in `config.ts` - updates everywhere |
| Add a new service | Add **one object** to `content/services.json` - card appears on Home + Services page |
| Change the brand color | Change **one value** in `config.ts` - propagates to every component |
| Add a new project | Add **one object** to `content/projects.json` - gallery updates automatically |
| Update an FAQ | Edit `content/faq.json` - accordion on Contact page updates |

> **No developer needed for routine content updates.** Just edit the relevant JSON file and redeploy.

---

## 🎯 Industry Challenges & Solutions

The industrial painting industry faces unique hurdles that generic website templates cannot address. This project was purpose-built to solve them:

| # | Industry Challenge | Our Solution |
|---|---|---|
| 1 | **No Online Presence** - Most industrial painting contractors have zero web presence, relying solely on word-of-mouth and WhatsApp for inquiries. | Built a professional, SEO-optimized website with structured data, sitemap, and local business schema to rank on Google for industrial painting queries in Gujarat. |
| 2 | **Credibility & Trust Gap** - Clients hesitate to award large contracts without seeing past work or safety credentials. | Dedicated **Before/After Gallery** with real project photos, **Client Testimonials** from Nirma Pvt. Ltd. and Balarka Fabricon, and a full **Safety Standards** page showcasing PPE compliance and zero-incident record. |
| 3 | **Complex Service Explanation** - Industrial coating involves multiple systems (Epoxy, PU, Zinc, Alkyd) that are hard to explain to non-technical decision-makers. | Interactive **Coating Types** section with tabbed UI, clear property/application breakdowns, and a visual **4-Step Process** timeline that simplifies the workflow. |
| 4 | **Lead Generation Friction** - Phone-only inquiries are inconvenient and lose leads outside business hours. | **Formspree-powered contact form** (no backend needed), floating **WhatsApp button** with pulse animation, and multiple CTAs across every page driving visitors to request a free quote. |
| 5 | **Content Update Difficulty** - Traditional websites require a developer for every text change, creating bottlenecks. | **100% JSON-driven content** architecture - any team member can update services, projects, FAQs, and client info by editing simple JSON files. |
| 6 | **Slow Page Loads on Mobile** - Factory managers often browse on mobile with limited connectivity. | Next.js **Server-Side Rendering (SSR)**, optimized image loading with `next/image`, async Font Awesome loading, and aggressive caching headers for sub-second page loads. |
| 7 | **Poor Local SEO** - Competitors don't use structured data, making it hard for Google to surface relevant local results. | **6 JSON-LD schemas** (LocalBusiness, Service, FAQPage, BreadcrumbList, WebSite, ImageObject), per-page meta tags, geo-targeting meta, and a complete XML sitemap. |

---

## 🚀 Key Advantages

### For the Business
- **🌐 Professional Online Presence** - A modern, responsive website that establishes credibility with industrial clients
- **📈 SEO-First Design** - Structured data, semantic HTML, and per-page meta optimization to rank for local industrial painting queries
- **📱 Mobile-Optimized** - Fully responsive across all devices; factory managers can browse on-site from their phones
- **💬 Multi-Channel Lead Capture** - Contact form + WhatsApp + phone - leads come in 24/7
- **🔄 Easy Content Updates** - JSON-driven architecture means no developer dependency for routine updates
- **⚡ Fast Performance** - SSR + optimized images + caching = fast loads even on slow mobile networks

### For Developers
- **🧩 Component-Based Architecture** - 10 reusable React components with clean separation of concerns
- **📦 Type-Safe Throughout** - Full TypeScript coverage with 12 interface definitions for all content types
- **🎨 Design System** - Centralized color palette, typography, and spacing via CSS custom properties
- **🔍 SEO Utilities** - Dedicated `lib/seo.ts` with 6 schema generators and a `generatePageMetadata()` helper
- **📁 Clean Project Structure** - Clear separation of config, content, components, and pages
- **🚀 Zero Backend** - No server, no database, no API - just static JSON + Formspree for the contact form

---

## ⚙️ Features & Modules

### 🏠 Home Page (`/`)
| Feature | Description |
|---|---|
| **Full-Screen Hero** | Unsplash background with gradient overlay, experience badge, tagline, and dual CTA buttons |
| **Animated Stats Counter** | 4 key metrics (7+ Years, 50+ Projects, 10+ Clients, 0 Safety Incidents) with scroll-triggered counting animation |
| **Services Strip** | Grid of 5 service cards loaded from `services.json` with icons, descriptions, and deep-links |
| **Why Choose Us** | 4 advantage cards (Quality, Protection, Asset Life, Safety) from `whyus.json` |
| **Before/After Gallery** | Featured projects with side-by-side before/after images and category badges |
| **Trusted By** | Client logos and names + trust badges (years, projects, zero incidents, PPE) |
| **Safety Standards** | Dark-themed section showcasing 5 PPE items with glassmorphism cards |
| **Client Testimonials** | Star ratings, quote cards, and client details from `clients.json` |
| **CTA Banner** | Full-width call-to-action driving visitors to the contact page |

### 📖 About Page (`/about`)
- Company story, expertise narrative, and commitment statement
- Mission and Vision statements
- 4-step work process timeline with step connectors
- Client showcase and trust indicators

### 🔧 Services Page (`/services`)
- 5 detailed service sections with full descriptions, step-by-step processes, and industry applications
- **Coating Types** interactive tabs (Epoxy, PU, Alkyd, Zinc Rich Primer) with properties and application lists
- Industries served grid with icons
- Process stepper visualization

### 📸 Projects Page (`/projects`)
- Filterable project card grid with category-based filtering
- Before/After image comparison for each project
- Aggregate project statistics (50+ projects, 1,00,000+ sq. ft., 200+ structures)
- Client reference information

### 🛡️ Safety Page (`/safety`)
- PPE equipment showcase (Helmet, Harness, Goggles, Gloves, Shoes)
- Safety policy bullet points
- 6-step site safety protocol with visual stepper
- Compliance statistics and zero-incident record

### 📞 Contact Page (`/contact`)
- **Formspree-integrated contact form** with success/error states
- Contact information cards (phone, email, address, hours)
- **Google Maps embed** with business location
- **FAQ accordion** with 6 common questions from `faq.json`

### 🌐 Global Features (Every Page)
| Feature | Implementation |
|---|---|
| Sticky Navbar | Scroll-aware with glassmorphism blur effect and mobile hamburger menu |
| WhatsApp Float | Bottom-right floating button with pulse animation, links to `wa.me/` |
| AOS Animations | Scroll-triggered fade-up animations on cards, sections, and grid items |
| Active Nav Detection | Current page highlighted in navbar |
| Skip to Content | Accessibility link for keyboard navigation |
| Dynamic Footer | Company info, quick links, services, contact details, dynamic copyright year |
| JSON-LD Schema | LocalBusiness schema injected on every page via `<JsonLd>` component |
| PWA Support | Service worker + web manifest for installable app experience |

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | [Next.js](https://nextjs.org) (App Router) | 16.2.4 | Server-side rendering, file-based routing, image optimization |
| **UI Library** | [React](https://react.dev) | 19.2.4 | Component-based UI with latest React features |
| **Language** | [TypeScript](https://typescriptlang.org) | 5.x | Type safety across all components, config, and content |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) | 4.x | Utility-first CSS with `@theme inline` design tokens |
| **Typography** | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) | - | Clean, modern sans-serif with variable weight support |
| **Icons** | [Font Awesome 6 Free](https://fontawesome.com) (CDN) | 6.5.1 | 50+ icons loaded async with print-media swap trick |
| **Animations** | [AOS](https://michalsnik.github.io/aos/) | 2.3.4 | Scroll-triggered reveal animations |
| **Image Comparison** | [img-comparison-slider](https://img-comparison-slider.sneas.io/) | 8.0.7 | Before/after project image sliders |
| **Contact Form** | [Formspree](https://formspree.io) | - | Serverless form submissions (no backend) |
| **Maps** | Google Maps Embed API | - | Business location embed |
| **SEO** | Next.js Metadata API + Custom `seo.ts` | - | 6 JSON-LD schemas, per-page meta, geo-targeting |
| **PWA** | Service Worker + Web Manifest | - | Installable app with offline-first shell |
| **Deployment** | Vercel / Netlify | - | Edge-optimized hosting with CI/CD |

### Dev Dependencies

| Tool | Purpose |
|---|---|
| `@tailwindcss/postcss` | PostCSS plugin for Tailwind 4 |
| `eslint` + `eslint-config-next` | Code quality and Next.js best practices |
| `@types/aos`, `@types/react`, `@types/node` | TypeScript type definitions |

---

## 🏗️ Architecture & Design Decisions

### Data Flow Architecture

```
config.ts (central settings)
    │
    ├── colors, contact, nav, SEO config
    │
content/*.json (13 JSON files)
    │
    ├── services, projects, clients, coatings,
    │   industries, process, about, faq, whyus,
    │   safety, safetypolicy, safetyprotocol, projectstats
    │
types.ts (12 TypeScript interfaces)
    │
    ├── Service, Project, Client, Coating, Industry,
    │   AboutContent, ProcessStep, FAQ, WhyUsItem,
    │   SafetyItem, SafetyProtocolStep, ProjectStats
    │
components/ (10 reusable components)
    │
    ├── Navbar, Footer, WhatsAppFloat, CTABanner,
    │   StatsCounter, PageHero, AOSInit, JsonLd,
    │   FAIcon, FontAwesomeLoader
    │
pages/ (6 routes via App Router)
    │
    └── /, /about, /services, /projects, /safety, /contact
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **Next.js App Router** over Pages Router | Leverages React Server Components for zero-JS content sections, nested layouts, and built-in metadata API |
| **JSON files** over CMS | No CMS overhead for a small business site; JSON is version-controlled, type-safe, and instantly deployable |
| **Centralized `config.ts`** | Single source of truth for branding, contact info, and SEO - prevents scattered magic strings |
| **TypeScript interfaces for content** | Catch content schema errors at build time, not in production |
| **Async Font Awesome loading** | Print-media swap trick prevents render-blocking; icons load after critical content |
| **AOS over Framer Motion** | Lightweight (6KB) scroll animations without the overhead of a full animation library |
| **Formspree over custom backend** | Zero server maintenance for a contact form; free tier handles expected volume |
| **CSS custom properties from config** | Colors defined once in `@theme inline`, referenced everywhere via Tailwind utilities |

---

## 📂 Project Structure

```
agraj-enterprises/
│
├── public/                          # Static assets & PWA files
│   ├── assets/images/               # Logo, OG image, client logos
│   ├── manifest.json                # PWA manifest
│   ├── sw.js                        # Service worker (pass-through)
│   ├── robots.txt                   # Crawler directives
│   ├── sitemap.xml                  # XML sitemap (6 URLs)
│   ├── _headers                     # Netlify/CDN cache headers
│   └── .htaccess                    # Apache redirects & compression
│
├── src/
│   ├── app/                         # Next.js App Router pages
│   │   ├── layout.tsx               # Root layout (Navbar, Footer, JsonLd, AOS)
│   │   ├── globals.css              # Design system (Tailwind @theme, animations)
│   │   ├── page.tsx                 # Home page (8 sections, ~514 lines)
│   │   ├── about/page.tsx           # About page
│   │   ├── services/                # Services page + layout with metadata
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── projects/                # Projects gallery + layout
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── safety/                  # Safety standards + layout
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── contact/page.tsx         # Contact form + FAQ
│   │
│   ├── components/                  # 10 reusable React components
│   │   ├── Navbar.tsx               # Sticky nav with scroll detection & mobile menu
│   │   ├── Footer.tsx               # Multi-column footer with dynamic year
│   │   ├── WhatsAppFloat.tsx        # Floating WhatsApp button with pulse
│   │   ├── CTABanner.tsx            # Full-width call-to-action section
│   │   ├── StatsCounter.tsx         # Animated number counters
│   │   ├── PageHero.tsx             # Reusable page hero with breadcrumbs
│   │   ├── AOSInit.tsx              # AOS initialization wrapper
│   │   ├── JsonLd.tsx               # JSON-LD structured data injector
│   │   ├── FAIcon.tsx               # Font Awesome icon wrapper
│   │   └── FontAwesomeLoader.tsx    # Async FA stylesheet loader
│   │
│   ├── content/                     # 13 JSON content files
│   │   ├── services.json            # 5 service definitions
│   │   ├── projects.json            # Before/after project portfolio
│   │   ├── clients.json             # Client names, testimonials, ratings
│   │   ├── coatings.json            # 4 coating types (Epoxy, PU, Alkyd, Zinc)
│   │   ├── industries.json          # 6 industries served
│   │   ├── about.json               # Company story, mission, vision
│   │   ├── process.json             # 4-step work process
│   │   ├── faq.json                 # 6 frequently asked questions
│   │   ├── whyus.json               # 4 competitive advantages
│   │   ├── safety.json              # PPE items and standards
│   │   ├── safetypolicy.json        # Safety policy bullet points
│   │   ├── safetyprotocol.json      # 6-step site safety protocol
│   │   └── projectstats.json        # Aggregate statistics
│   │
│   ├── lib/
│   │   └── seo.ts                   # SEO utilities (6 schema generators + metadata helper)
│   │
│   ├── config.ts                    # Central configuration (company, contact, colors, SEO)
│   └── types.ts                     # 12 TypeScript interfaces for all content types
│
├── next.config.ts                   # Next.js config (remote image patterns)
├── tsconfig.json                    # TypeScript config with path aliases
├── postcss.config.mjs               # PostCSS with Tailwind plugin
├── eslint.config.mjs                # ESLint configuration
└── package.json                     # Dependencies and scripts
```

---

## 💻 Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 20+ |
| npm | 9+ |
| A [Formspree](https://formspree.io) account | Free tier |

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/agraj-enterprises.git
cd agraj-enterprises

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create optimized production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint checks |

---

## ⚙️ Configuration

All site-wide settings live in **`src/config.ts`**. This is the single source of truth for everything that appears across multiple pages.

### Configuration Sections

| Section | Controls |
|---|---|
| `company` | Name, tagline, slogan, founding year, experience, logo path |
| `contact` | Person name, phone, email, WhatsApp, Formspree ID, address, Google Maps embed URL |
| `social` | WhatsApp, Instagram, LinkedIn, Facebook URLs (empty = icon hidden) |
| `meta` | Default site title, description, OG image, theme color, keywords |
| `colors` | 8-color brand palette used throughout via CSS variables |
| `nav` | Navigation links array and CTA button text/href |
| `stats` | 4 counter items shown on Home page |
| `seo` | Per-page titles, descriptions, keywords, OG data, canonical paths, and LocalBusiness schema |

### Color Palette

| Name | Hex | Usage |
|---|---|---|
| Primary Dark | `#1A3A6B` | Navbar, hero overlay, footer, dark sections |
| Primary Mid | `#2B6CB0` | CTA buttons, links, counter strip, active states |
| Accent Orange | `#DD6B20` | Safety icons, highlights, badges, WhatsApp hover |
| Danger Red | `#E53E3E` | Warnings, alerts, "Before" badges |
| Dark Text | `#2D3748` | Headings, body text |
| Light BG | `#F7FAFC` | Alternating section backgrounds |
| White | `#FFFFFF` | Cards, containers, base background |
| Border | `#E2E8F0` | Dividers, card borders |

All colors are defined in `CONFIG.colors` and registered as Tailwind CSS `@theme inline` custom properties in `globals.css`.

---

## 📦 Content Management (JSON-Driven)

All website content is stored in `src/content/` as typed JSON files. Each file has a corresponding TypeScript interface in `types.ts`.

### Content Files Reference

| File | Interface | Records | Description |
|---|---|---|---|
| `services.json` | `Service` | 5 | Service cards with icons, descriptions, steps, industries |
| `projects.json` | `Project` | 6 | Before/after project portfolio with categories |
| `clients.json` | `Client` | 2 | Client testimonials with ratings |
| `coatings.json` | `Coating` | 4 | Coating types with properties and applications |
| `industries.json` | `Industry` | 6 | Industries served with icons |
| `about.json` | `AboutContent` | 1 | Company story, mission, vision |
| `process.json` | `ProcessStep` | 4 | Work process timeline |
| `faq.json` | `FAQ` | 6 | Question/answer pairs |
| `whyus.json` | `WhyUsItem` | 4 | Competitive advantages |
| `safety.json` | `SafetyItem` | 5 | PPE equipment items |
| `safetypolicy.json` | - | 6 | Safety policy statements |
| `safetyprotocol.json` | `SafetyProtocolStep` | 6 | Site safety protocol steps |
| `projectstats.json` | `ProjectStats` | 1 | Aggregate statistics |

### Adding Content Examples

**New Service** - add to `content/services.json`:
```json
{
  "id": "new-service",
  "icon": "fa-solid fa-wrench",
  "title": "New Service Name",
  "shortDesc": "Short description for the Home page card.",
  "fullDesc": "Detailed description for the Services page.",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "industries": ["Factories", "Warehouses"],
  "image": "/assets/images/services/new-service.jpg"
}
```

**New Project** - add to `content/projects.json`:
```json
{
  "id": "proj-007",
  "title": "Project Title",
  "category": "Coating",
  "location": "City, Gujarat",
  "client": "Client Name",
  "description": "Brief description of the work.",
  "featured": true,
  "beforeImage": "/assets/images/projects/proj-007-before.jpg",
  "afterImage": "/assets/images/projects/proj-007-after.jpg"
}
```

Set `"featured": true` to display the project on the Home page gallery.

---

## 🔍 SEO & Structured Data

### Per-Page Metadata

Every page has custom SEO metadata generated via `generatePageMetadata()` from `lib/seo.ts`:

- **Title tags** - Unique, keyword-rich titles per page
- **Meta descriptions** - Compelling descriptions with local keywords
- **Keywords** - Targeted industrial painting terms for Gujarat
- **Open Graph** - Full OG tags for social sharing (title, description, image, URL)
- **Twitter Cards** - `summary_large_image` cards for Twitter/X
- **Canonical URLs** - Proper canonical paths to prevent duplicate content
- **Geo Meta Tags** - `geo.region`, `geo.placename`, `geo.position`, `ICBM` for local SEO

### JSON-LD Structured Data (6 Schemas)

| Schema | Page | Purpose |
|---|---|---|
| `LocalBusiness` | All pages | Business name, address, phone, hours, geo coordinates, payment methods |
| `WebSite` | Home | Site search action and site-level metadata |
| `Service` | Services | Individual service type schemas for each of the 5 services |
| `FAQPage` | Contact | FAQ question/answer pairs for rich snippets |
| `BreadcrumbList` | All inner pages | Navigation breadcrumb trail |
| `ImageObject` | All pages | OG share image metadata |

### Additional SEO Assets

| Asset | Path | Purpose |
|---|---|---|
| XML Sitemap | `/sitemap.xml` | 6 URLs with priority and change frequency |
| Robots.txt | `/robots.txt` | Crawler directives with sitemap reference |
| Web Manifest | `/manifest.json` | PWA metadata for app-like experience |
| OG Image | `/assets/images/og-image.jpg` | 1200×630 social share image |

---

## ⚡ Performance & Security

### Performance Optimizations

| Optimization | Implementation |
|---|---|
| **Server-Side Rendering** | Next.js App Router renders all pages server-side for instant first paint |
| **Image Optimization** | `next/image` with responsive `sizes`, lazy loading, and priority hints for hero |
| **Async Font Loading** | Font Awesome loaded via print-media swap trick to prevent render blocking |
| **Font Preconnect** | DNS prefetch + preconnect for Google Fonts, Font Awesome CDN, Formspree |
| **Aggressive Caching** | Images: 1 year, CSS/JS: 1 month, JSON: 1 week (via `_headers` and `.htaccess`) |
| **Gzip Compression** | HTML, CSS, JS, and JSON compressed via `mod_deflate` |
| **Minimal Client JS** | Server Components by default; client JS only for AOS, counters, and mobile menu |
| **Page Transitions** | CSS `fadeIn` animation (0.4s) for smooth page loads |

### Security Headers

| Header | Value |
|---|---|
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-XSS-Protection` | `1; mode=block` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

### HTTPS Enforcement

The `.htaccess` file enforces HTTPS redirects, removes `www`, strips trailing slashes, and applies cache/compression rules for Apache-based hosting.

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

Vercel auto-detects Next.js and optimizes the build with edge functions and image optimization.

### Netlify

```bash
# Option 1: Drag & drop the .next output
# Go to netlify.com → "Add new site" → drag your project folder

# Option 2: CLI
npm install -g netlify-cli
netlify deploy --prod
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🎨 Customization Guide

### Rebrand for a Different Company

1. Update `src/config.ts` - company name, contact, colors, SEO
2. Replace `/public/assets/images/logo.png` and `og-image.jpg`
3. Update all 13 JSON files in `src/content/` with new content
4. Update `public/sitemap.xml` with the new domain
5. Update `public/robots.txt` with the new sitemap URL
6. Deploy

### Add a New Page

1. Create `src/app/newpage/page.tsx`
2. Add SEO metadata to `CONFIG.seo.pages` in `config.ts`
3. Add the route to `CONFIG.nav.links`:
   ```ts
   { label: "New Page", href: "/newpage" }
   ```
4. Add a URL entry to `public/sitemap.xml`
5. The navbar and footer update automatically

### Change CTA Button Text

```ts
// src/config.ts
nav: {
  ctaLabel: "Request a Free Quote",
  ctaHref: "/contact",
}
```

---

## 🌍 Browser Support

| Browser | Support |
|---|---|
| Chrome 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Mobile Chrome (Android) | ✅ Full |
| Mobile Safari (iOS) | ✅ Full |

---

## 📞 Contact & Support

**Agraj Enterprise**

| Channel | Details |
|---|---|
| 📞 Phone | [+91 78188 11818](tel:+917818811818) |
| 📧 Email | [agrajenterprise925@gmail.com](mailto:agrajenterprise925@gmail.com) |
| 💬 WhatsApp | [Chat Now](https://wa.me/917818811818) |
| 📍 Address | Plot no. 104, Flat no. A/408, 150ft ring road, Sitaram Nagar, Ruva, Bhavnagar, Gujarat - 364001 |
| 🕐 Hours | Monday – Saturday, 8:00 AM – 7:00 PM |

---

## 📄 License

This project is built exclusively for **Agraj Enterprise**. All content, branding, and design are proprietary. Not for redistribution or reuse without written permission.

---

<p align="center">
  <strong>Agraj Enterprise</strong> - Industrial Painting & Protective Coating Solutions<br/>
  <em>Protection. Performance. Perfection.</em><br/><br/>
  Built with ❤️ using Next.js 16, React 19, TypeScript & Tailwind CSS 4
</p>