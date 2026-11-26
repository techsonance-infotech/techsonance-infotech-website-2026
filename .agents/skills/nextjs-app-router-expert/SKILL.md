---
name: nextjs-app-router-expert
description: "Expert guidelines and verification for Next.js 16 App Router and React 19 architecture: Server vs Client Components, dynamic metadata, headers/cookies, and build-time optimization."
---

# Next.js 16 & React 19 App Router Expert

Use this skill when creating or refactoring pages, layouts, API routes, or components in the `app/` directory.

## Core Rules

1. **Server Components by Default**:
   - Keep page components and layouts as React Server Components (RSC). Do not add `"use client"` unless interactive hooks (`useState`, `useEffect`, event listeners) or browser APIs (`window`, `localStorage`, GSAP) are strictly required.
   - Push `"use client"` boundaries down to leaf interactive components.

2. **Metadata & SEO**:
   - Export explicit `metadata` or `generateMetadata` on all public routes.
   - Ensure `canonical` links reference the absolute URL using `metadataBase` configured in `app/layout.tsx`.
   - Include OpenGraph images and descriptions.

3. **Next.js 16 Async APIs**:
   - `params`, `searchParams`, `cookies()`, and `headers()` are asynchronous in Next.js 16. Always `await` them before access:
     ```ts
     export default async function Page({
       params,
       searchParams,
     }: {
       params: Promise<{ slug: string }>;
       searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
     }) {
       const { slug } = await params;
       ...
     }
     ```

4. **Performance & Data Fetching**:
   - Use `next/image` for image assets with explicit width/height or `fill` with `sizes`.
   - Never import heavyweight client libraries (e.g. GSAP, Lenis) in Server Components.
