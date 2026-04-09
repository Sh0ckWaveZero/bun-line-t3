# Agent Development Guide

## Agent Skills

> **For LLMs**: This project uses [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills). Before creating React/TanStack Start components or UI code, reference the **Vercel React Best Practices** and **Web Design Guidelines** skills for performance optimization and accessibility compliance.

### Installed Skills (Global)

- **vercel-react-best-practices** - React/TanStack Start performance optimization (data fetching, bundle size, re-renders)
- **web-design-guidelines** - UI audit against 100+ best practices (accessibility, dark mode, i18n)
- **vercel:deploy** - Deploy to Vercel directly from conversation

Skills activate automatically when you describe relevant tasks naturally (e.g., "review my UI", "optimize this component", "deploy to production")

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

### Imports & Structure

- Use path aliases: `@/`, `@/features/*`, `@/lib/*`, `@/components/*`, `@/hooks/*`
- Component order: exports → subcomponents → helpers → types
- Functional programming patterns: pure functions, immutability, early returns

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

### Security & Validation

- Validate ALL inputs with Zod schemas at runtime
- Never expose sensitive data in errors or logs
- Use `crypto.randomBytes()` for security-critical operations
- Implement authentication/authorization checks on API routes
- Never store sensitive data in client state

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

## GitHub Copilot Instructions

See `.github/copilot-instructions.md` for comprehensive guidelines on:

- Tailwind CSS dark mode (class-based strategy)
- WCAG 2.1 AA contrast requirements (4.5:1 normal text, 3:1 large text)
- Security-first development with OWASP compliance
- MongoDB + Prisma patterns (use `db:push`, manual relations, no foreign keys)
- Functional programming with TypeScript
