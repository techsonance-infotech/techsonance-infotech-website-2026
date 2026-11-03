# 05 — UI: Tailwind 4, Components, Forms, Motion, Icons, Accessibility

Owns: styling, components, form UI wiring, motion, a11y. Validation behaviour is owned by `04`; API calls by `08`.

## Tailwind CSS 4 (CSS-first)
- Entry `app/globals.css`: `@import "tailwindcss";`. PostCSS uses `@tailwindcss/postcss` only. **No `tailwind.config.js`** unless truly required (then `@config`).
- Tokens live in `@theme { --color-brand-500: …; --font-sans: …; --radius-card: …; }`. No hard-coded hex/px in components (`bg-[#3b82f6]`, `w-[317px]` are review blockers unless truly one-off, with a comment).
- **Semantic tokens** (`--color-background`, `--color-foreground`, `--color-muted`, `--color-border`, `--color-primary`, `--color-destructive`) swapped for dark mode via `.dark` / `prefers-color-scheme` + `@custom-variant dark (&:where(.dark, .dark *));`. Components use semantic tokens, never raw palette colours.
- Utilities only; `@apply` only in rare base/prose styles. No inline `style={{}}` for static values (dynamic values via CSS variables).
- v4 syntax: `bg-linear-to-r` (not `bg-gradient-to-r`), `shadow-xs`/`rounded-xs` scale shifts, `outline-hidden`, `ring` default 1px (`ring-3` for old look), important suffix `p-4!`, variable shorthand `bg-(--my-var)`. Removed v3 utilities (`bg-opacity-*`, `flex-shrink-*`, `overflow-ellipsis`) are banned: use `bg-black/50`, `shrink-*`, `text-ellipsis`.
- Mobile-first: base = mobile; `sm:`/`md:`/`lg:` upward. Container queries (`@container`, `@md:`) for reusable components.
- Class order is automated by `prettier-plugin-tailwindcss` (`07`).

## `cn()` helper & variants
```ts
// lib/utils/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
```
- Components accepting `className` merge it last: `cn("base", variantClasses, className)`.
- Variants are typed lookup objects (`Record<Variant, string>`), never long ternary chains.
- Never build class names dynamically (`` `text-${color}-500` ``): Tailwind cannot detect them. Use complete literal strings in maps.

## Component rules
- Primitives in `components/ui`: props extend native element props (`React.ComponentProps<"button">`), `ref` as prop (React 19), spread `...props` on the root, sensible defaults.
- Presentational and composable; data fetching in server parents. Prefer composition (`children`, slots) over boolean prop explosions.
- Props that come from the server are DTO types derived from schemas (`z.infer`), never hand-written copies (`01`).
- Every data view implements **4 states**: loading (skeleton, not spinner-only), empty (call to action), error (retry), success. Skeletons match the final layout.
- No anonymous components inline in render; no components defined inside components.
- Tested at 360px, 768px, 1280px; no horizontal scroll; touch targets ≥ 44×44px.
- `next/image` and `next/link` (`06`). `<button>` for actions, `Link` for navigation, never `<div onClick>`. Buttons inside forms set `type` explicitly.
- Event handlers are typed and tiny: parse/convert in a helper, call the action/`callApi`, handle the `Result`. Mutating handlers use `useTransition` or `useActionState` and disable the trigger while pending.

## Forms UI wiring (links `04` + `08` to the DOM)
- One `FormField` primitive: `<label htmlFor>` + control + optional hint + error, with generated ids; control gets `aria-invalid` and `aria-describedby="<id>-hint <id>-error"`; the error element has `role="alert"` (or sits in an `aria-live="polite"` region).
- Error text comes from `state.result.error.fieldErrors[name]`; a form-level `_form` / non-field error renders in an alert above the submit button. After a failed submit, focus the first invalid field (effect keyed on the result).
- Error copy for each `ErrorCode` lives in one `const ERROR_COPY = {…} satisfies Record<ErrorCode, string>`: adding a code forces a copy decision at compile time. The same map serves `callApi` failures (network error, timeout, 429 with `Retry-After`).
- Inputs: correct `type`, `autocomplete`, `inputMode`, `name` = schema key; `maxLength`/`min`/`max` from schema constants; values restored via `defaultValue={state.values[name]}` (`04`). Passwords and files are never echoed.
- Success feedback in a live region (toast or inline); destructive actions confirm via dialog.
- Optimistic UI (`useOptimistic`) must roll back and show the error when `ok: false`.

## Icons (lucide-react)
- Named per-icon imports only (`import { Check, Loader2 } from "lucide-react";`); never `import * as Icons` or icon-by-name lookups (breaks tree-shaking).
- Size/colour via classes (`size-4`, `text-muted-foreground`); stroke consistent app-wide.
- Decorative icons `aria-hidden="true"`; icon-only buttons need `aria-label`.
- Verify icon names exist in the installed version (renames happen between majors; `09`).

## Motion (framer-motion)
- Import from `"framer-motion"` only in `"use client"` files; keep animated wrappers small leaves so parents stay server-rendered.
- `LazyMotion` + `m` components with `domAnimation` (`strict`) for non-trivial pages; avoid importing `motion` in many tiny hot-path files.
- **Reduced motion**: wrap the app in `<MotionConfig reducedMotion="user">`; non-essential motion degrades to none/opacity-only.
- Animate only `transform` and `opacity`; never `width/height/top/left/box-shadow` on large trees; `layout` sparingly.
- Durations 150–400ms, ease-out entrances; shared variants/transitions in `lib/motion.ts`, no per-component magic numbers.
- `AnimatePresence` with stable `key`s; no route-level page animation that blocks navigation/LCP.
- Never start the above-the-fold LCP element at `opacity: 0`. Scroll reveals use `viewport={{ once: true }}`.
- Hydration safety: initial animation state never derives from `window`/random values.

## Accessibility (WCAG 2.2 AA target)
- Semantic HTML first: `header/nav/main/footer/section/article`, one `<h1>` per page, ordered headings, `main` landmark with skip-link.
- Everything interactive is keyboard reachable with a visible `:focus-visible` ring (never `outline-none` without a replacement), logical tab order, no traps. Dialogs/menus: focus trap, restore focus, `Escape` closes (native `<dialog>` or a vetted headless library).
- Contrast ≥ 4.5:1 (text), ≥ 3:1 (large text/UI). Never convey information by colour alone.
- Meaningful `alt` (or `alt=""` if decorative). Every input has a `<label>`. Errors announced via `aria-live="polite"`/`role="alert"`.
- Dynamic updates (toasts, async results) in a live region. No auto-playing media/motion without a pause.
- Zoom to 200% and text resize without loss; `rem` sizing; never disable zoom.
- `jsx-a11y` lint stays on: fix, don't suppress. Tests query by role/label (`07`), so they double as a11y checks.

## Theming & content
- Light/dark via tokens; avoid a flash of the wrong theme (class set by a tiny blocking inline script or a server-read cookie; the script gets the CSP nonce, `03`).
- User-visible copy lives in constants (or i18n files) rather than deep in JSX if the app may localise. Use `Intl.*` for dates, numbers, currency.
