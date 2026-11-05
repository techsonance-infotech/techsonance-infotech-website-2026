# 11b — Resilience: UI Crash Handling, Observability & Failure-Path Tests

Continues `11` (sections 4–6 keep their numbers). Policy table: `11` §1.

## 4. UI crash handling

**Boundaries (all required):**

| File | Scope | Contents |
|---|---|---|
| `app/global-error.tsx` | root layout failure | own `<html><body>`, message, `reset`, reference id |
| `app/(group)/error.tsx` | route group | friendly panel, retry, link home, `digest` |
| `app/(group)/loading.tsx` | route group | layout-matching skeleton |
| `app/not-found.tsx` + `notFound()` | missing resources | helpful links |
| `<WidgetBoundary label="chat">` | optional widgets: chat, booking modal, estimator, third-party embeds | compact fallback; rest of page unaffected |

```tsx
// app/(marketing)/error.tsx
"use client";
import { useEffect } from "react";
import { reportClientError } from "@/lib/api/reportClientError";
import { ERROR_COPY } from "@/lib/errorCopy";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportClientError(error); }, [error]);
  return (
    <div role="alert" className="mx-auto max-w-lg p-8 text-center">
      <h2 className="text-xl font-semibold">{ERROR_COPY.INTERNAL}</h2>
      {error.digest ? <p className="mt-2 text-sm text-muted-foreground">Reference: {error.digest}</p> : null}
      <button type="button" onClick={reset} className="mt-4 min-h-11 rounded-md bg-primary px-4 text-primary-foreground">Try again</button>
    </div>
  );
}
```

```tsx
// components/feedback/WidgetBoundary.tsx
"use client";
import { Component, type ReactNode } from "react";
import { reportClientError } from "@/lib/api/reportClientError";

type Props = { label: string; children: ReactNode; fallback?: ReactNode };
type State = { failed: boolean };

export class WidgetBoundary extends Component<Props, State> {
  override state: State = { failed: false };
  static getDerivedStateFromError(): State { return { failed: true }; }
  override componentDidCatch(error: Error): void { reportClientError(error, { widget: this.props.label }); }
  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return this.props.fallback ?? (
      <p role="status" className="text-sm text-muted-foreground">
        This section is unavailable right now. <button type="button" onClick={() => this.setState({ failed: false })} className="underline">Retry</button>
      </p>
    );
  }
}
```
⚠ type-check both templates against installed React/Next (`09`).

**Rules:**

1. Expected failures are `Result`s rendered inline; boundaries are only for bugs. Never throw from a Server Action to signal validation.
2. Pair every `<Suspense>` with a boundary above it; every data view implements loading, empty, error (retry) and success (`05`).
3. **Forms**: preserve input on failure (`echoValues`), focus the first invalid field, announce errors with `role="alert"`, disable submit while pending, show countdown for `RATE_LIMITED`, show retry for `UNAVAILABLE`. Never clear the form on error.
4. **Mutations** use `useOptimistic` with rollback on `ok: false`; list refetch failures keep the existing items visible with an inline "couldn't refresh" notice.
5. **Network**: `callApi` never throws. Fetch rejection/timeout becomes `UNAVAILABLE`; offline shows a banner but does not rely on `navigator.onLine` alone. Long loads (> 10 s) show "this is taking longer than usual" with cancel/retry. Abort in-flight requests on unmount (`AbortController`).
6. **Stale deployments**: chunk-load failures or "Failed to find Server Action" trigger one automatic `location.reload()` guarded by a `sessionStorage` flag (wrapped in `try/catch`), then a "new version available, reload" prompt.
7. **Client storage (Dexie/IndexedDB, localStorage)**: may be unavailable (private mode, quota, blocked). Every access is `try/catch` with in-memory fallback; stored data is parsed with Zod and version-migrated; corrupted records are dropped, not thrown.
8. **Third-party scripts and embeds** load with `next/script` and `onError` handlers; their failure never blocks rendering or interaction. Images use `onError` fallbacks.
9. **Animations (GSAP/Lenis/framer-motion)**: client leaf components only; cleanup on unmount (`gsap.context().revert()`, kill ScrollTriggers, `lenis.destroy()`); disabled under `prefers-reduced-motion`; wrapped by `WidgetBoundary` when decorative, so an animation bug never blanks the page. Above-the-fold content never starts at `opacity: 0`.
10. **Hydration**: no `Date.now()`, `Math.random()`, `window` in render output; client-only values read in effects.
11. **Auth**: `UNAUTHENTICATED` from any action or `callApi` triggers a redirect with `next=`; the draft is kept in memory/`sessionStorage` where the form is long.
12. **Error copy** lives in `lib/errorCopy.ts` as `ERROR_COPY satisfies Record<ErrorCode, string>`, shared by actions and `callApi`.

## 5. Observability

- Every request has `x-request-id` (set in `proxy.ts`), present in logs, error responses and the error UI.
- Sentry via `instrumentation.ts`; client errors via `reportClientError` (rate-limited, redacted).
- Alerts: readiness failing > 1 min, 5xx rate, `UNAVAILABLE` rate, outbox backlog age, rate-limiter fallback active, idempotency conflicts spike.
- Dashboards track p95 latency per route and DB pool wait.

## 6. Required tests for failure paths

Per route/action: success, `VALIDATION`, `UNAUTHENTICATED`, `FORBIDDEN`, `CONFLICT` (where uniqueness/version exists), `UNAVAILABLE` (simulate pool/timeout error through a mocked repository), and a response-drift case (handler returns wrong shape → `INTERNAL`, no leak).

Also: `mapDbError` table test (every SQLSTATE in `03b` §8), `withTransaction` retry test (two `40001` then success; three → `UNAVAILABLE`), idempotent replay, rate-limit fallback, malformed JSON, oversize body, `inArray([])` guard, every `WidgetBoundary` fallback renders when its child throws, `error.tsx` renders with `reset`, form keeps input on `UNAVAILABLE`, chunk-reload guard runs once.
