# 05 — UI: Tailwind 4, Components, Forms, Motion, Icons, Accessibility

Owns: styling, components, form UI wiring, motion, and a11y. Validation logic is in `04`; API calls in `08`.

## Tailwind CSS 4 (CSS-first)

- **Entry**: `app/globals.css` with `@import "tailwindcss";` and `@tailwindcss/postcss`. No `tailwind.config.js` (use `@theme` or `@config`).
- **Design Tokens**: Defined in `@theme { --color-brand-500: ...; --font-sans: ...; }`. No raw hex/px classes (`bg-[#3b82f6]`, `w-[317px]` prohibited unless documented one-off).
- **Semantic Tokens**: Use `--color-background`, `--color-foreground`, `--color-muted`, `--color-border`, `--color-primary`, `--color-destructive`. Dark mode via `.dark` / `prefers-color-scheme`.
- **v4 Syntax**: Use `bg-linear-to-r` (not `bg-gradient-to-r`), `outline-hidden`, `ring` (default 1px), variable shorthand `bg-(--my-var)`. Banned v3 utilities: `bg-opacity-*`, `flex-shrink-*`, `overflow-ellipsis` (use `bg-black/50`, `shrink-*`, `text-ellipsis`).
- **Responsive**: Mobile-first (`sm:`, `md:`, `lg:` upward). Container queries (`@container`, `@md:`) for reusable cards.
- **Class Ordering**: Enforced by `prettier-plugin-tailwindcss`.

## `cn()` Helper & Variants

```ts
// lib/utils/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
```

- Merge caller `className` last: `cn("base-classes", variantClasses, className)`.
- Use typed lookup objects (`Record<Variant, string>`), never chained ternaries.
- Complete class literals only; never construct dynamic classes (e.g. `text-${color}-500`).

## Component Rules

- **Primitives (`components/ui`)**: Extend native props (`React.ComponentProps<"button">`), `ref` as prop (React 19), spread `...props`.
- **Composition**: Data fetching lives in server parents; pass schema-derived DTOs (`z.infer`). Favor slots and `children` over boolean prop proliferation.
- **4 States**: Every data view implements loading (skeleton matching layout), empty (CTA), error (retry action), and success.
- **Interactions**: `<button>` for actions, `next/link` for navigation (never `<div onClick>`). Touch targets ≥ 44×44px. No horizontal scroll at 360px, 768px, or 1280px.
- **Transitions**: Mutating handlers use `useTransition` / `useActionState` and disable triggers while pending.

## Forms UI Wiring

- **`FormField` Primitive**: Integrates `<label htmlFor>`, input control, hint, and error alert with generated IDs. Control sets `aria-invalid` and `aria-describedby="<id>-hint <id>-error"`.
- **Errors**: Field errors mapped from `state.result.error.fieldErrors[name]`. Form-level errors render in an alert above submit. Focus first invalid field on failed submit.
- **Error Copy**: Mapped in `ERROR_COPY satisfies Record<ErrorCode, string>`. Shared by Server Actions and `callApi` failures.
- **Inputs**: Set explicit `type`, `autocomplete`, `inputMode`, and `name` matching schema key. Rehydrate via `defaultValue={state.values[name]}` (passwords/files excluded).
- **Feedback**: Success surfaced in live regions (toast or inline); destructive actions require confirmation dialogs. Optimistic UI (`useOptimistic`) reverts on error.

## Icons (`lucide-react`)

- Named imports only (`import { Check, Loader2 } from "lucide-react"`). Never wildcard `* as Icons`.
- Size and color via utilities (`size-4 text-muted-foreground`); stroke width consistent app-wide.
- Decorative icons take `aria-hidden="true"`; icon-only buttons require `aria-label`.

## Motion (`framer-motion`)

- Import from `"framer-motion"` exclusively in `"use client"` leaf components.
- Wrap app with `<MotionConfig reducedMotion="user">`; non-essential motion degrades to opacity or instant transitions.
- Animate only composite properties (`transform`, `opacity`); never animate layout geometry (`width`, `height`, `top`, `left`).
- Durations 150–400ms with ease-out curves; shared variants centralized in `lib/motion.ts`.
- LCP Safety: Above-the-fold content must never start with `opacity: 0`. Scroll animations use `viewport={{ once: true }}`.

## Accessibility (WCAG 2.2 AA)

- **Landmarks**: Semantic tags (`header`, `nav`, `main`, `footer`), single `<h1>` per page, sequential heading levels, skip-to-content link.
- **Keyboard Navigation**: All interactive elements reachable via Tab; visible `:focus-visible` ring. Modals/drawers trap focus and restore on `Escape`.
- **Contrast & Meaning**: Contrast ≥ 4.5:1 (text) and ≥ 3:1 (large text/UI). Never convey state with color alone.
- **Screen Readers**: Meaningful `alt` text (or `alt=""` for decorative); inputs linked to `<label>`. Dynamic updates announced via `aria-live="polite"` or `role="alert"`.
- **Typography & Zoom**: Support 200% text zoom without clipping or overflow; use `rem` units.
- **Linting**: Keep `jsx-a11y` rules active without file-wide suppressions.

## Theming & Localization

- Prevent dark mode flash with cookie/inline theme script before render.
- Keep user-facing strings centralized; format dates, numbers, and currencies using native `Intl.*`.
