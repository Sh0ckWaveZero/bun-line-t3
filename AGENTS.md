# Agent Development Guide

## Agent Skills

> **For LLMs**: This project uses [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills). Before creating React/TanStack Start components or UI code, reference the **Vercel React Best Practices** and **Web Design Guidelines** skills for performance optimization and accessibility compliance.

### Installed Skills (Global)

- **vercel-react-best-practices** - React/TanStack Start performance optimization (data fetching, bundle size, re-renders)
- **web-design-guidelines** - UI audit against 100+ best practices (accessibility, dark mode, i18n)
- **vercel:deploy** - Deploy to Vercel directly from conversation

Skills activate automatically when you describe relevant tasks naturally (e.g., "review my UI", "optimize this component", "deploy to production")

<!-- intent-skills:start -->
# Skill mappings - when working in these areas, load the linked skill file into context.
skills:
  - task: "React/TanStack Start setup, root route shell, hydration, or React Start imports"
    load: "node_modules/@tanstack/react-start/skills/react-start/SKILL.md"
  - task: "TanStack Start project structure, Vite plugin, route tree, or core Start conventions"
    load: "node_modules/@tanstack/start-client-core/skills/start-core/SKILL.md"
  - task: "Production deploy, Docker/Bun hosting, SSR mode, static assets, or prerendering"
    load: "node_modules/@tanstack/start-client-core/skills/start-core/deployment/SKILL.md"
  - task: "Server functions, server-only logic, useServerFn, validation, or server context utilities"
    load: "node_modules/@tanstack/start-client-core/skills/start-core/server-functions/SKILL.md"
  - task: "API routes under src/routes/api, HTTP handlers, request parsing, or route middleware"
    load: "node_modules/@tanstack/start-client-core/skills/start-core/server-routes/SKILL.md"
<!-- intent-skills:end -->

## Commands

- **Dev**: `bun run dev` (TanStack Start via Vite on :4325)
- **Build**: `bun run build` (TanStack Start production build)
- **Lint**: `bun run lint` (ESLint flat config)
- **Format**: `bun run format` (Prettier with Tailwind plugin)
- **Type Check**: `bun run type-check`
- **Test All**: `bun test`
- **Test Single**: `bun test <filename>` or `bun test <pattern>`
- **Test Watch**: `bun test --watch`
- **DB Push**: `bun run db:push` (MongoDB - **NEVER** use migrations)
- **DB Generate**: `bun run db:generate` (Generate Prisma Client)

## Code Style

### Runtime & Tools

- **Always use Bun**, never npm/npx (use `bunx` for CLI tools)
- TypeScript strict mode with `noUncheckedIndexedAccess`
- Prefer interfaces over types for objects, avoid enums (use const maps)

### Project Structure

```
src/
├── routes/             # TanStack Start file-based routes (thin configs, 6-10 lines)
│   ├── api/**          # HTTP handlers (thin layer: parse → call service → respond)
│   └── *.tsx           # Route configuration with beforeLoad guards
├── features/<domain>/  # Feature-based modules (domain-driven)
│   ├── pages/          # Page components (extracted from routes)
│   ├── components/     # Feature-specific React UI components
│   ├── hooks/          # Feature-specific React hooks
│   ├── services/       # *.server.ts — DB queries, external APIs (server-only)
│   ├── lib/            # Feature-specific utilities/helpers
│   ├── types/          # Shared types (isomorphic — safe everywhere)
│   ├── helpers/        # Pure functions (isomorphic — safe everywhere)
│   ├── constants/      # Shared constants (isomorphic — safe everywhere)
│   └── index.ts        # Re-exports barrel
├── components/         # Shared UI components
│   └── ui/             # Base UI components (shadcn/ui)
├── lib/                # Shared utilities
│   ├── auth/           # Authentication & route guards
│   ├── database/       # Database connection
│   ├── constants/      # Global constants
│   ├── utils/          # General utilities
│   └── validation/     # Zod schemas
└── hooks/              # Shared React hooks (rare - prefer feature-specific hooks)
```

**File naming conventions (TanStack Start):**
- `*.server.ts` — server-only code (Prisma, secrets, external APIs) — **never import in components/hooks**
- `*.tsx` — React components (client-safe)
- `*.ts` — isomorphic code (pure functions, types, constants)

**Thin Route Pattern:**
- Routes are thin configuration files (6-10 lines) that:
  1. Import page component from `features/*/pages/`
  2. Apply route guards via `beforeLoad`
  3. Export the route configuration

```typescript
// ✅ Example: src/routes/attendance-report.tsx
import { createFileRoute } from "@tanstack/react-router"
import { requireAuth } from "@/lib/auth/route-guard"
import { AttendanceReportPage } from "@/features/attendance/pages/AttendanceReportPage"

export const Route = createFileRoute("/attendance-report")({
  beforeLoad: requireAuth,
  component: AttendanceReportPage,
})
```

**Separation rules:**
- `features/*/services/*.server.ts` is the **Service/Repository layer** shared by both:
  - `routes/api/**` — REST HTTP handlers
  - `features/line/commands/**` — LINE Bot command handlers
- `features/*/pages/` contains page components extracted from routes
- `features/*/components/` contains feature-specific React components
- `features/*/hooks/` contains feature-specific React hooks
- `src/components/ui/` contains shared base UI components (shadcn/ui)

### Imports & Structure

- Use path aliases: `@/`, `@/features/*`, `@/lib/*`, `@/components/ui/*`
- Import pages from feature directories: `@/features/*/pages/*`
- Import components from feature directories: `@/features/*/components/*`
- Import hooks from feature directories: `@/features/*/hooks/*`
- Import route guards from `@/lib/auth/route-guard`
- Component order: exports → subcomponents → helpers → types
- Functional programming patterns: pure functions, immutability, early returns

**Import examples:**
```typescript
// ✅ Good - Import from feature directories
import { AttendanceReportPage } from "@/features/attendance/pages/AttendanceReportPage"
import { AttendanceTable } from "@/features/attendance/components/AttendanceTable"
import { useAttendanceData } from "@/features/attendance/hooks/useAttendanceData"
import { attendanceService } from "@/features/attendance/services"

// ✅ Good - Import route guards
import { requireAuth, requireAdmin } from "@/lib/auth/route-guard"

// ✅ Good - Import shared UI components
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
```

### Naming & Formatting

- Variables: descriptive with auxiliary verbs (`isLoading`, `hasError`, `canAccess`)
- Event handlers: prefix with `handle` (`handleClick`, `handleSubmit`)
- Components: named exports (`export const LoginForm`)
- Higher-order functions: `with/create/make` pattern (`withAuth`, `createValidator`)

### React & TanStack Start

- Prefer TanStack Start server routes and server functions for sensitive logic and data loading
- Minimize client-only directives carried over from the old Next.js codebase
- Use TanStack Router patterns (`createFileRoute`, route loaders, server handlers) instead of Next.js App Router APIs
- Support dark/light mode in ALL components (use Tailwind `dark:` or CSS variables)
- Use thin route pattern: routes are 6-10 line configs, page logic in `features/*/pages/`
- Apply route guards declaratively via `beforeLoad` for protected routes

**Route guard pattern:**
```typescript
// src/lib/auth/route-guard.ts
import { redirect } from "@tanstack/react-router"

interface GuardArgs {
  context: { session: AppSession | null }
  location: { pathname: string }
}

export function requireAuth({ context, location }: GuardArgs) {
  if (!context.session?.user?.id) {
    throw redirect({
      to: "/login",
      search: { callbackUrl: location.pathname }
    })
  }
}

export function requireAdmin({ context, location }: GuardArgs) {
  requireAuth({ context, location })
  if (!context.session!.isAdmin) {
    throw redirect({ to: "/dashboard" })
  }
}
```

### Security & Validation

- Validate ALL inputs with Zod schemas at runtime
- Never expose sensitive data in errors or logs
- Use `crypto.randomBytes()` for security-critical operations
- Implement authentication/authorization checks via route guards (`beforeLoad`)
- Apply route guards to protected routes: `beforeLoad: requireAuth` or `beforeLoad: requireAdmin`
- Never store sensitive data in client state
- Server functions automatically validate session via route guards

### Error Handling

- Use try-catch with secure error messages
- Log security events without sensitive data
- Return user-friendly errors (in Thai for user-facing messages)

### Thai Language Requirement

**CRITICAL**: All user communication MUST be in Thai (ภาษาไทย). Code/variables can be English.

### MongoDB + Prisma ORM

- **USE Prisma v6.19.2** - MongoDB is NOT supported in Prisma v7 yet
- **NEVER upgrade to Prisma v7** until MongoDB support is added
- **NEVER use `prisma migrate`** - MongoDB doesn't support migrations
- **ALWAYS use `db:push`** for schema changes (prototyping workflow)
- ID fields: `@id @default(auto()) @map("_id") @db.ObjectId`
- Relations: use `String` type with `@db.ObjectId` for foreign keys
- No foreign key constraints - manage relations manually in code
- Schema is flexible - `db push` syncs without migration files

### Testing

- Write tests for all business logic and security-critical code
- Test coverage for `src/**/*.{ts,tsx}` files
- Use Bun test runner with patterns: `**/tests/**/*.test.{ts,tsx}`

### Feature-Based Architecture Best Practices

**When creating new features:**
1. Create feature directory: `src/features/<feature-name>/`
2. Organize into subdirectories: `pages/`, `components/`, `hooks/`, `services/`, `lib/`, `types/`, `helpers/`, `constants/`
3. Create page component in `pages/` and extract from route file
4. Create thin route config in `src/routes/<route>.tsx` with `beforeLoad` guard
5. Import from feature directories using `@/features/<feature-name>/`

**Example structure for a new "reports" feature:**
```
src/features/reports/
├── pages/
│   ├── ReportsPage.tsx          # Main page component
│   └── ReportDetailPage.tsx     # Detail page component
├── components/
│   ├── ReportCard.tsx           # Feature-specific component
│   └── ReportFilters.tsx        # Feature-specific component
├── hooks/
│   └── useReportsData.ts        # Feature-specific hook
├── services/
│   └── report.server.ts         # Server-only business logic
├── lib/
│   └── formatters.ts            # Report formatting utilities
├── types/
│   └── index.ts                 # Report types
├── helpers/
│   └── calculations.ts          # Pure helper functions
├── constants/
│   └── limits.ts                # Report constants
└── index.ts                     # Barrel export
```

**Route file for the feature:**
```typescript
// src/routes/reports.tsx
import { createFileRoute } from "@tanstack/react-router"
import { requireAuth } from "@/lib/auth/route-guard"
import { ReportsPage } from "@/features/reports/pages/ReportsPage"

export const Route = createFileRoute("/reports")({
  beforeLoad: requireAuth,
  component: ReportsPage,
})
```

## GitHub Copilot Instructions

See `.github/copilot-instructions.md` for comprehensive guidelines on:

- Tailwind CSS dark mode (class-based strategy)
- WCAG 2.1 AA contrast requirements (4.5:1 normal text, 3:1 large text)
- Security-first development with OWASP compliance
- MongoDB + Prisma patterns (use `db:push`, manual relations, no foreign keys)
- Functional programming with TypeScript
