# Project Architecture & Directory Restructuring Design Spec

## 1. Overview
This specification details the end-to-end restructuring of the TechSonance codebase to align with modern Next.js 16 App Router best practices, feature-driven domain boundaries, consistent naming conventions, and Needle DI integration.

## 2. Target Directory Hierarchy

```
app/
  (auth)/                     # Auth route group (login, register, forgot-password)
    login/page.tsx
    register/page.tsx
    layout.tsx
    loading.tsx
    error.tsx
  (dashboard)/                # Protected dashboard route group
    dashboard/page.tsx
    layout.tsx
    loading.tsx
    error.tsx
  (marketing)/                # Public marketing pages with shared layout
    about/page.tsx
    blog/page.tsx
    careers/page.tsx
    contact/page.tsx
    demo/page.tsx
    locations/page.tsx
    portfolio/page.tsx
    privacy-policy/page.tsx
    services/page.tsx
    technologies/page.tsx
    terms/page.tsx
    layout.tsx
    loading.tsx
    error.tsx
    page.tsx                  # Home page
  api/                        # API route handlers
    book/route.ts
    careers/route.ts
    chat/route.ts
    contact/route.ts
    health/route.ts
    slots/route.ts
  layout.tsx                  # Root layout
  globals.css
  not-found.tsx

components/
  ui/                         # Atomic base UI primitives (PascalCase)
    Button.tsx
    Input.tsx
    Badge.tsx
    Card.tsx
    Modal.tsx
  forms/                      # Reusable form elements
    FormField.tsx
    FormError.tsx
  layouts/                    # Top-level shell layouts
    Navbar.tsx
    SiteFooter.tsx
    LenisProvider.tsx
    CookieConsent.tsx

features/                     # Domain modules (components, hooks, logic co-located)
  auth/
    components/
      LoginForm.tsx
      RegisterForm.tsx
    hooks/
      useAuth.ts
  chat/
    components/
      ChatWidget.tsx
      ChatMessageList.tsx
      QuickChips.tsx
    hooks/
      useChat.ts
  booking/
    components/
      BookingModal.tsx
      SlotPicker.tsx
    hooks/
      useBooking.ts
  contact/
    components/
      ContactForm.tsx
      ScopingCalculator.tsx
  careers/
    components/
      CareerApplicationModal.tsx
      JobCard.tsx

lib/                          # Shared core utilities and infrastructure
  di/                         # Needle DI container & tokens
    container.ts
    tokens.ts
  services/                   # Injectable business services (Needle DI)
    email.service.ts
    ratelimit.service.ts
    booking.service.ts
    kb-search.service.ts
    rag.service.ts
    llm-health.service.ts
    llm-provider.service.ts
    llm-router.service.ts
    chat-storage.service.ts
    analytics.service.ts
  db/                         # Database configurations (Client Dexie, Supabase)
    chatDb.ts
  validations/                # Zod schemas
    booking.schema.ts
    contact.schema.ts
    chat.schema.ts
    career.schema.ts
    env.schema.ts
  config/                     # Centralized static configuration
    botConfig.ts
    servicesConfig.ts
    seoConfig.ts
    capabilitiesConfig.ts
  hooks/                      # General-purpose React hooks
    useMediaQuery.ts
    useScrollProgress.ts
  types/                      # Type definitions
    index.ts
    llm.types.ts
    booking.types.ts
  utils/                      # Helper utilities (camelCase)
    cn.ts
    text.ts
    gsapUtils.ts
    prompt.ts

public/                       # Static public assets
```

## 3. Best Practices & Naming Conventions
- **Route Groups**: `(auth)`, `(dashboard)`, `(marketing)`.
- **Loading & Error Boundaries**: Add `loading.tsx` and `error.tsx` to each route group.
- **Import Aliases**: All imports use absolute `@/` path aliases pointing to the project root.
- **Components**: `PascalCase` (`Button.tsx`, `ChatWidget.tsx`).
- **Utils**: `camelCase` (`cn.ts`, `gsapUtils.ts`).
- **Hooks**: `useCamelCase` (`useAuth.ts`, `useChat.ts`).
- **Constants**: `UPPER_CASE` within files.
- **Max Folder Depth**: Kept under 3-4 levels.
- **Single Component Per File**: One component per file with clean default/named exports.

## 4. Migration Strategy
1. **Remove Stray Directory**: Delete unused `Users/` directory created accidentally.
2. **Reorganize `lib/`**:
   - Move config files into `lib/config/`.
   - Move db helpers into `lib/db/`.
   - Move schemas into `lib/validations/`.
   - Move pure helpers into `lib/utils/`.
   - Retain backward compatibility via index/re-export files so existing imports do not break simultaneously.
3. **Consolidate `components/`**:
   - Move navigation and footer into `components/layouts/`.
   - Organize shared UI primitives in `components/ui/`.
   - Organize form primitives in `components/forms/`.
4. **Create `features/` Modules**:
   - Extract domain-specific components into `features/chat/`, `features/booking/`, `features/contact/`, and `features/careers/`.
   - Scaffold `features/auth/` and `features/dashboard/`.
5. **Organize `app/` Route Groups**:
   - Move marketing pages into `app/(marketing)/` with dedicated `loading.tsx` and `error.tsx`.
   - Scaffold `app/(auth)/` and `app/(dashboard)/` with `layout.tsx`, `loading.tsx`, `error.tsx`.
6. **Update Imports & Verify**:
   - Run `npm run typecheck` and `npm test` after each phase.
