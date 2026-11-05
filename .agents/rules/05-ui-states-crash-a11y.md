# 05 — UI: States, Forms, Crash Handling, Tailwind 4, Motion, Accessibility

Owns: styling, components, async states, form UI, UI crash handling, motion, a11y. Validation: `04`; API calls: `08`; failure policy table: `11` §1. (Absorbs former `11b` §4.)

## 1. Tailwind CSS 4 (CSS-first)
- `app/globals.css` with `@import "tailwindcss";` and `@tailwindcss/postcss`. No `tailwind.config.js` (use `@theme`).
- Tokens in `@theme { --color-brand-500: …; --font-sans: …; }`. Semantic tokens: `--color-{background,foreground,muted,border,primary,destructive}`; dark mode via `.dark`/`prefers-color-scheme`. No raw hex/px classes (`bg-[#3b82f6]`) unless a documented one-off.
- v4 syntax: `bg-linear-to-r`, `outline-hidden`, `ring`, `bg-(--my-var)`, `bg-black/50`, `shrink-*`, `text-ellipsis`. Banned v3: `bg-gradient-to-*`, `bg-opacity-*`, `flex-shrink-*`, `overflow-ellipsis`.
- Mobile-first (`sm:`→`lg:`); container queries for reusable cards. Class order by `prettier-plugin-tailwindcss`.
- `cn()` (`lib/utils/cn.ts`): `twMerge(clsx(inputs))`; caller `className` last. Variants are typed lookup objects (`Record<Variant, string>`), never chained ternaries. Complete class literals only: no `text-${color}-500`.

## 2. Components and async states
- Primitives (`components/ui`): extend native props (`React.ComponentProps<"button">`), `ref` as prop (React 19), spread `...props`. Never edit them (`10`).
- Data fetching lives in server parents; pass DTO-derived view models. Prefer slots/`children` over boolean-prop proliferation.
- **Every data view implements, with explicit UI:**
  1. **Loading**: skeleton matching layout.
  2. **Empty**: meaningful message + CTA.
  3. **Error**: friendly message + retry (`UNAVAILABLE`/`INTERNAL`), reference id when known.
  4. **Partial**: if non-critical data is missing or fails, render the rest and a compact notice.
  Plus stale (refetch failure keeps existing items with a "couldn't refresh" notice), forbidden ("no access" panel) and offline.
- Defensive rendering: never assume data exists; use `?.` and `??` with fallbacks, driven by declared types (`01` §2).
- `<button>` for actions, `next/link` for navigation (never `<div onClick>`). Touch targets ≥ 44×44 px. No horizontal scroll at 360/768/1280 px.
- Mutating handlers use `useTransition`/`useActionState` and disable triggers while pending. Optimistic UI (`useOptimistic`) rolls back on `ok: false`.

## 3. Forms UI
- `<form action={formAction}>` + `useActionState`; input `name` equals the schema key (unit-tested per form). `maxLength`/`min`/`max`/`accept` come from exported schema constants.
- `FormField` primitive: `<label htmlFor>`, control, hint, error alert with generated ids; control sets `aria-invalid` and `aria-describedby="<id>-hint <id>-error"`.
- Errors from `state.result.error.fieldErrors[name]`; `_form` errors in a `role="alert"` region above submit; focus the first invalid field. Never clear the form on error: rehydrate via `defaultValue={state.values[name]}` (no passwords/files).
- Submit disabled while pending. `RATE_LIMITED` shows a countdown from `retryAfterSec`; `UNAVAILABLE` shows retry. Create forms carry a hidden `idempotencyKey` (`z.uuid()`) generated at render.
- Set explicit `type`, `autocomplete`, `inputMode`. Success goes to a live region (toast/inline); destructive actions require a confirm dialog.
- **Error copy** lives in `lib/errorCopy.ts`: `ERROR_COPY satisfies Record<ErrorCode, string>`, shared by actions and `callApi`.

## 4. UI crash handling
Expected failures are `Result`s rendered inline; boundaries are only for bugs. Never throw from a Server Action to signal validation.

| File | Scope | Contents |
| --- | --- | --- |
| `app/global-error.tsx` | root layout failure | own `<html><body>`, message, `reset`, reference id |
| `app/(group)/error.tsx` | route group + dynamic data segments | friendly panel (`role="alert"`), `ERROR_COPY.INTERNAL`, `digest`, retry via `reset`, link home; `reportClientError` in an effect |
| `app/(group)/loading.tsx` | same | layout-matching skeleton |
| `app/not-found.tsx` + `notFound()` | missing resources | helpful links |
| `<WidgetBoundary label>` | optional widgets: chat, booking modal, estimator, embeds, decorative animation | compact fallback; page unaffected |

⚠ type-check against installed React/Next (`09`). User-facing text above belongs in constants/copy in real code (`01` §3).
Rules:
1. Pair every `<Suspense>` with an error boundary above it.
2. **Network**: `callApi` never throws; fetch rejection/timeout → `UNAVAILABLE`; offline banner without relying on `navigator.onLine` alone; loads > 10 s show "taking longer than usual" with cancel/retry; abort in-flight requests on unmount (`AbortController`).
3. **Stale deployments**: chunk-load failure or "Failed to find Server Action" → one automatic `location.reload()` guarded by a `sessionStorage` flag (`try/catch`), then a "new version available" prompt.
4. **Client storage** (Dexie/IndexedDB/localStorage) may be unavailable: every access in `try/catch` with in-memory fallback; stored data parsed with Zod and version-migrated; corrupt records dropped, not thrown.
5. **Third-party scripts/embeds**: `next/script` with `onError`; failure never blocks rendering. Images have `onError` fallbacks.
6. **Hydration**: no `Date.now()`, `Math.random()`, `window` in render output; client-only values read in effects.
7. **Auth**: `UNAUTHENTICATED` from any action or `callApi` redirects to `/login?next=`; long drafts are kept in memory/`sessionStorage`.

## 5. Motion (one animation library per purpose: `07` §6)
- Client leaf components only. `framer-motion`: wrap the app in `<MotionConfig reducedMotion="user">`; shared variants in `lib/motion.ts`. GSAP/Lenis: cleanup on unmount (`gsap.context().revert()`, kill ScrollTriggers, `lenis.destroy()`).
- Disabled/degraded under `prefers-reduced-motion`. Decorative animation is wrapped in `WidgetBoundary` so a bug never blanks the page.
- Animate only `transform`/`opacity`; durations 150–400 ms ease-out. Above-the-fold content never starts at `opacity: 0`; scroll animations use `viewport={{ once: true }}`.

## 6. Accessibility (WCAG 2.2 AA)
- Landmarks (`header nav main footer`), one `<h1>`, sequential headings, skip-to-content link.
- Everything keyboard reachable, visible `:focus-visible`; modals trap focus and restore on `Escape`.
- Contrast ≥ 4.5:1 text, ≥ 3:1 large text/UI; never color alone. Meaningful `alt` (`alt=""` if decorative); inputs have labels; dynamic updates via `aria-live="polite"` or `role="alert"`.
- Support 200% zoom, `rem` units. `jsx-a11y` stays on without file-wide suppressions.

## 7. Icons, theming, localization
- `lucide-react` named imports only; size/color via utilities; decorative icons `aria-hidden="true"`; icon-only buttons need `aria-label`.
- Prevent dark-mode flash with a cookie/inline theme script. User-facing strings are centralized; format dates, numbers, currency with `Intl.*`.
