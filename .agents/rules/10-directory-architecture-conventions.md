# 10 — Project Directory Architecture & Development Conventions

Owns: Directory layout, route group structure, feature-slice boundaries, file naming conventions, and service wiring for all new implementations.

---
## 1. Directory Structure

All new implementations and refactors must strictly follow this structure:

```
📂 app/                      # Route groups, pages, layouts, and API routes
  🔐 (auth)/                 # Auth routes (/login, /register, etc.)
  📊 (dashboard)/            # Authenticated user & admin dashboard routes
  🌐 (marketing)/            # Public marketing routes (/about, /services, /blog, etc.)
  🔗 api/                    # API route handlers (/api/chat, /api/book, etc.)
  layout.tsx                 # Root layout
  globals.css
  not-found.tsx

🧩 components/               # Cross-feature and primitive presentation components
  🎨 ui/                     # Base design system primitives (Button, Input, Modal, Badge)
  📝 forms/                  # Generic reusable form controls (FormField, FormError)
  🧱 layouts/                # Universal shell components (Navbar, SiteFooter, LenisProvider)

⚙️ features/                 # Domain-driven business modules (co-located logic)
  🔐 auth/                   # Auth components, session hooks, and auth state
  💬 chat/                   # Chat widget, message lists, streaming UI
  📅 booking/                # Consultation booking modal, slot pickers
  ✉️ contact/                # Scoping estimator, inquiry forms
  💼 careers/                # Job boards, application modal

🗄️ lib/                      # Core infrastructure, services, and utilities
  💉 di/                     # Needle DI container (`container.ts`) & tokens (`tokens.ts`)
  🧠 services/               # Injectable business logic & I/O services (Needle DI)
  🗃️ db/                     # Database configurations (Client Dexie, Supabase client)
  ✅ validations/            # Zod validation schemas (*.schema.ts)
  ⚙️ config/                 # Centralized configuration objects (*Config.ts)
  🪝 hooks/                  # Project-wide reusable React hooks (use*.ts)
  📐 types/                  # Project-wide TypeScript types & declarations
  🛠️ utils/                  # Pure helper functions (camelCase: cn.ts, text.ts)
🖼️ public/                   # Static public assets (images, fonts, icons)
```
---
## 2. Best Practices for New Implementations
1. **Use Route Groups `( )`**:
   - Organize routes by lifecycle and access: `(marketing)` for public pages, `(auth)` for login/registration, `(dashboard)` for authenticated portals.
   - Route groups keep URLs clean without polluting path segments.

2. **Always Provide `loading.tsx` and `error.tsx`**:
   - Every route group (`(marketing)`, `(auth)`, `(dashboard)`) must declare `loading.tsx` and `error.tsx` boundaries to prevent waterfall flash and unhandled error screens.
3. **Keep Related Files Together (Co-location)**:
   - Business features (`features/<domain>`) group their specific components, hooks, and presentation state in one place.
   - If a component or utility is used exclusively by one feature, it stays inside that feature folder. Only promote to `components/` or `lib/` when shared across multiple features.

4. **Always Use Absolute Imports (`@/`)**:
   - Imports must use `@/` alias (e.g. `@/lib/di/container`, `@/components/ui/Button`).
   - Deep relative imports (`../../../`) are banned.

5. **Limit Folder Depth**:
   - Keep folder nesting shallow (maximum 3–4 levels from root). Avoid excessive subdirectories.

6. **One Component = One File**:
   - Every UI component lives in its own dedicated file. No multi-component bundle files.

7. **DO NOT Touch Third-Party Component Library UI Code**:
   - Never edit, modify, or rewrite third-party or vendored UI library code (e.g. Radix UI primitives, Lucide icons, GSAP/Lenis wrappers, or pre-installed base UI components in `components/ui/`).
   - Treat third-party UI primitives as immutable external dependencies: consume and compose them from the outside, never alter their internals.

## 3. File & Symbol Naming Rules

| Entity | Convention | Example |
|---|---|---|
| **React Components** | `PascalCase.tsx` | `Button.tsx`, `ChatWidget.tsx`, `Navbar.tsx` |
| **Helper Utilities** | `camelCase.ts` | `formatDate.ts`, `cn.ts`, `text.ts` |
| **Custom Hooks** | `useCamelCase.ts` | `useAuth.ts`, `useChat.ts`, `useBooking.ts` |
| **Constants & Tokens** | `UPPER_CASE` | `BOT_CONFIG`, `RATE_LIMIT_WINDOW_MS`, `ENV_CONFIG_TOKEN` |
| **Services (Needle DI)**| `kebab-case.service.ts` | `email.service.ts`, `booking.service.ts` |
| **Validation Schemas** | `kebab-case.schema.ts` | `booking.schema.ts`, `contact.schema.ts` |
| **Config Objects** | `camelCaseConfig.ts` | `botConfig.ts`, `seoConfig.ts` |
| **Database Tables (Postgres)** | `ts_web_snake_case` | `ts_web_chat_messages`, `ts_web_consultation_bookings` |

> [!CAUTION]
> **Shared Supabase Instance Rule**: The connected Supabase project is shared with other applications (HRMS, ERP, CMS). NEVER drop, alter, rename, or write to any existing non-website tables. All tables, functions, indexes, and policies for this website MUST use the `ts_web_` prefix.

---

## 4. Needle Dependency Injection (DI) Workflow

For any new service, I/O operation, or stateful backend workflow:

1. **Define the Service**:
   - Create the service in `lib/services/<name>.service.ts`.
   - Inject required dependencies using Needle DI's `inject(...)` constructor injection:
     ```typescript
     import { inject } from "@needle-di/core";
     import { ENV_CONFIG_TOKEN } from "@/lib/di/tokens";
     import { EmailService } from "@/lib/services/email.service";

     export class OrderService {
       constructor(
         private emailService = inject(EmailService),
         private env = inject(ENV_CONFIG_TOKEN)
       ) {}
     }
     ```

2. **Register in the Container**:
   - Add the service to `lib/di/container.ts` inside `configureContainer()`:
     ```typescript
     container.bind(OrderService);
     ```

3. **Consume in Route Handlers and Server Actions**:
   - Resolve the service via the root container:
     ```typescript
     const orderService = getContainer().get(OrderService);
     ```
   - Never instantiate stateful services directly with `new OrderService()` inside route handlers or actions.

4. **Testing with Test Containers**:
   - Unit tests use `createTestContainer([...overrides])` to mock external APIs or databases cleanly without monkey-patching modules.
