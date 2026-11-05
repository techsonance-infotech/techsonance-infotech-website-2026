---
trigger: always_on
---

# 05 — UI: States, Forms, Crash Handling, Tailwind 4 & Accessibility

Owns: styling, components, async states, form UI, crash boundaries, motion, a11y. Validation: `04`; Contracts: `08`; Resilience: `11`.

## 0. Version & Syntax Invariant Matrix

| Topic | Active Tech | Breaking Point / Critical Syntax |
| --- | --- | --- |
| **CSS Engine** | Tailwind CSS 4 | `@import "tailwindcss";` in `globals.css`. `@theme` replaces `tailwind.config.js`. |
| **Gradients & Props** | Tailwind 4 Syntax | `bg-linear-to-r`, `outline-hidden`, `shrink-*`. Banned: `bg-gradient-to-*`, `flex-shrink-*`. |
| **React UI** | React 19 | `ref` as standard prop. Form mutations via `useActionState` and `useTransition`. |
| **Motion** | Framer Motion / GSAP | Cleanup on unmount (`gsap.context().revert()`, `lenis.destroy()`). `reducedMotion="user"`. |
| **Error Copy** | `lib/errorCopy.ts` | `ERROR_COPY` keyed by `ErrorCode` enum members. |

## 1. Tailwind CSS 4 & Utility Styling

- Tokens configured in `app/globals.css` via `@theme { --color-brand-500: …; }`. Dark mode via `.dark` / `prefers-color-scheme`.
- No raw arbitrary hex classes (`bg-[#3b82f6]`) without architectural justification.
- Class merging: `cn()` (`lib/utils/cn.ts`) wraps `twMerge(clsx(inputs))`. Pass caller `className` last.
- Variants use typed lookup objects (`Record<Variant, string>`), never nested ternaries.
- Complete class literals only (no dynamic string interpolation like `text-${color}-500`).

## 2. Component Architecture & Required Async States

- Primitives (`components/ui`): Extend native HTML props, support `ref` as prop (React 19), spread `...props`. Do not edit manually.
- Data fetching lives in Server Component parents; pass view models to children.
- **Every data view MUST implement 6 explicit UI states:**
  1. **Loading**: Layout-matching skeleton (no generic spinners for full pages).
  2. **Empty**: Contextual explanation + actionable CTA button.
  3. **Error**: User-friendly copy + retry action (`ErrorCode.UNAVAILABLE` / `ErrorCode.INTERNAL`).
  4. **Partial**: Render available content + non-blocking warning badge for failed sections.
  5. **Stale**: Retain previous data with a "refresh failed" indicator.
  6. **Forbidden / Offline**: Clear access-denied state or offline banner.
- Defensive rendering: Guard optional values with `?.` and `??` fallbacks.
- Accessible targets: Interactive touch targets ≥ 44×44px. Buttons for actions, `next/link` for navigation.

## 3. Forms UI & Rehydration

- Built with `<form action={formAction}>` + `useActionState`. Input `name` must match schema keys.
- `FormField`: Connects `<label htmlFor>`, input, hint, and error with generated IDs and `aria-describedby`.
- Display server errors via `aria-invalid` and `role="alert"`. Focus the first invalid field on error.
- Never wipe form data on validation error: rehydrate using `defaultValue={state.values[name]}` (exclude passwords/files).
- Mutations require a hidden `idempotencyKey` (`z.uuid()`). Disable submit buttons while pending.
- Form error messages source from `lib/errorCopy.ts` via `ErrorCode` enum.

## 4. UI Crash Boundaries & Fallbacks

- Expected errors are handled as `Result` objects rendered inline; error boundaries catch unexpected runtime faults.
- Root crashes: `app/global-error.tsx` (supplies `<html><body>`, message, retry `reset()`).
- Segment crashes: `app/(group)/error.tsx` (`role="alert"`, retry via `reset()`).
- Widget isolation: Wrap optional features (chat, modals, animations) in `<WidgetBoundary label="...">` so faults do not break the host page.
- Pair every `<Suspense>` with a corresponding error boundary.

## 5. Motion & Accessibility (WCAG 2.2 AA)

- Semantic landmarks (`header`, `nav`, `main`, `footer`), single `<h1>` per page, sequential heading levels.
- Full keyboard operability with visible `:focus-visible` styling. Modals trap and restore focus on `Escape`.
- Contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text/icons.
- Animations respect `prefers-reduced-motion`. Animate only `transform` and `opacity` (duration 150–400ms).
- Icons (`lucide-react`) require `aria-hidden="true"` or `aria-label` for icon-only buttons.
