# 06 — Performance, Images (sharp), Bundle & SEO

## 1. Budgets (fail review if exceeded without justification)

- LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (p75, mobile). Lighthouse ≥ 90 on key pages (mobile), run in CI (`07` §8).
- First-load JS per route ≤ 170 KB gzip; keep client components minimal.
- Reserve space for images, embeds, fonts, skeletons (no layout shift).
- Check with `next build` output and `@next/bundle-analyzer` before releases.

## 2. Rendering and data

- Prefer static/cached rendering for public pages; stream dynamic parts with `<Suspense>`.
- No request waterfalls: start independent fetches together (`Promise.all`), dedupe with `React.cache`.
- Non-critical work (analytics, logging) runs after the response via `after()`.
- DB: needed columns only, paginate, index filter/sort/FK columns, no N+1 (`03` §6).
- `dynamic(() => import(…))` for heavy, below-the-fold or interaction-gated client components; never lazy-load LCP content.
- Third-party scripts: `next/script` with `lazyOnload`/`afterInteractive`; each one justified.
- Avoid large client libraries (date, lodash, charting): prefer `Intl`, `structuredClone`, native array methods; import specific functions.
- Debounce/throttle high-frequency handlers; clean up listeners, intervals, subscriptions.

## 3. Images with `next/image`

- `<Image>` always (never raw `<img>`) for content images, with `width`/`height` or `fill` + sized parent, accurate `sizes`, and `alt`.
- LCP/hero image: `priority`; everything else lazy. Large images: `placeholder="blur"` + `blurDataURL`.
- Remote images declared in `images.remotePatterns` (exact hostname + pathname); `images.formats: ["image/avif","image/webp"]`; restrict `qualities`; set `minimumCacheTTL` for immutable assets. Prefer pre-sized Supabase Storage variants.

## 4. `sharp` (Node.js only)

- Only in Server Actions, `route.ts` with `export const runtime = "nodejs"`, or scripts. Never in client components, `proxy.ts`, or Edge.
- Never trust client `Content-Type`/extension: enforce the size cap before buffering (e.g. ≤ 5 MB), allowlist detected formats (`jpeg|png|webp|avif`), then re-encode.
  ```ts
  import sharp from "sharp";
  const image = sharp(buffer, { limitInputPixels: 40_000_000, failOn: "error" });
  const meta = await image.metadata(); // reject non-allowlisted format / absurd dimensions
  const out = await image
    .rotate() // honour EXIF orientation first
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 }) // EXIF/GPS stripped by default
    .toBuffer();
  ```
- `.withMetadata()` is forbidden for user content. Reject animated/huge inputs unless supported; set `sharp.concurrency`, wrap in timeouts, queue large batches.
- Store under `<user_id>/<uuid>.<ext>` (random names, never user filenames) with correct `contentType` and `cacheControl`.
- Corrupt images throw: return `VALIDATION`, never a 500 with internals.

## 5. Fonts and CSS

`next/font` only; subset; ≤ 2 families / ≤ 4 weights; `display: "swap"`; preload only the primary font. CSS stays in Tailwind; no external CSS `@import`.

## 6. Metadata and SEO

- `metadata`/`generateMetadata` on every public route: unique `title` (root `title.template`), `description` ≤ 160 chars, `alternates.canonical`, Open Graph + Twitter (`opengraph-image` via `ImageResponse`), `noindex` for private/auth pages.
- `app/sitemap.ts`, `robots.ts`, `manifest.ts`, icons. JSON-LD with escaped `<` where relevant.
- Kebab-case slugs; 301 moved URLs via `redirects()`; real 404 via `notFound()`; `lang` on `<html>`; don't disable zoom in `viewport`.

## 7. Caching

`_next/static` is immutable. Custom route responses set `Cache-Control` intentionally (`private, no-store` for user data); never cache user-specific data on a shared cache/CDN. SVG (SVGO) for icons/logos, AVIF/WebP for photos, lazy-load iframes.
