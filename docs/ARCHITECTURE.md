# System architecture

The application is a React 19 and TanStack Start web app. TanStack Router owns file-based routing, Vite builds the app, and Bun runs scripts and the server. PostgreSQL is accessed through Prisma 7. Most business logic is organized under feature modules in `src/features/`.

## Repository map

```text
src/
├── routes/             # File-based pages and API handlers
│   └── api/            # Server handlers grouped by endpoint
├── features/           # Domain UI, hooks, services, schemas, and helpers
├── components/         # Reusable application and UI components
├── hooks/              # Shared React hooks
└── lib/                # Auth, database, env, validation, and utilities
prisma/
├── schema.prisma       # PostgreSQL data model
└── migrations/         # Versioned schema changes
scripts/                # Maintenance and operational scripts
public/                 # Static assets and PDF fonts
```

Current feature modules include `air-quality`, `attendance`, `auth`, `body-weight`, `calendar`, `cron-jobs`, `crypto`, `dashboard`, `dca`, `exchanges`, `expenses`, `help`, `home`, `leave`, `line`, `monitoring`, `onsite-report`, `planning-poker`, `settings`, `subscriptions`, `tools`, and `weather`.

## Request flow

### Web pages

Page files under `src/routes/` define URL, metadata, and route guards, then render pages from feature modules. Route guards such as `requireAuth` and `requireAdmin` protect pages that need a session or admin role. Feature pages own the domain UI, and hooks encapsulate client data requests and interactions.

### API handlers

Files under `src/routes/api/` define TanStack server route handlers. The handler parses request input, performs session or integration authentication, validates data, calls a feature service, and returns a response. Keep database queries and business rules in server-only modules such as `*.server.ts`; do not import these modules into browser components.

See [API route reference](./API.md) for the current endpoint map.

### LINE bot

The LINE webhook enters through `/api/line`. LINE-specific routing and command handlers live in `src/features/line/`; domain services are reused when an operation also has a web/API entry point. AI command routing uses a registry to select an allowlisted handler and validates structured input before execution.

## Feature module layout

Feature directories can contain:

```text
features/<domain>/
├── pages/       # Route-level page components
├── components/  # Domain UI
├── hooks/       # Client state and API interactions
├── services/    # Business and persistence logic; server files use *.server.ts
├── lib/         # Feature-local utilities and schemas
├── helpers/     # Pure transformations and calculations
├── types/       # Domain contracts
└── constants/   # Domain configuration
```

The tree reflects a working convention, not a requirement that every feature have every folder. Keep module-local logic beside the owning feature and extract shared logic only when multiple domains use it.

## Persistence and data ownership

Prisma schema and migrations are under `prisma/`. The current database provider is PostgreSQL. Most records are associated with a user, and service/API methods must scope reads and writes to the authenticated owner. Admin paths may intentionally broaden access and must check the admin role.

Some features have distinct storage and operational characteristics:

- **Planning Poker** stores active room state in process memory; rooms are not persisted or synchronized across application instances.
- **Onsite reports** store report fields and signatures in the database, scope reports to their owner, and render PDFs on the server.
- **Body Weight** stores scale profiles and measurements; the server computes derived metrics and scopes ordinary users to their profiles.
- **DCA** uses database records for orders and imported Bitkub history; credential handling is server-only.

## Authentication and integration boundaries

Better Auth handles web sessions and LINE Login. API handlers use the server session and feature-specific authorization checks. LINE webhooks verify provider requests before dispatch. Device and cron endpoints use shared server secrets where configured. Secrets belong in environment variables or deployment secret storage and must never be included in client bundles.

Not every endpoint uses the same access model: Planning Poker is intentionally public; scale webhooks and cron integrations use secrets; feature pages may require per-user permissions in addition to authentication. Check each route handler before changing its policy.

## Runtime and CI tools

- Bun is the application runtime and package manager. Production containers currently use Bun 1.4.4 stable.
- Type checking uses `bun check`; tests use `bun test`.
- The Bun linter rules live in `bunfig.toml`. The stable application runtime does not provide `bun lint`, so local hook and GitHub lint steps use the repository's pinned Bun 1.4.4 canary.
- `lefthook.yml` runs lint on staged JavaScript and TypeScript files. Lint is a local pre-commit check only — there is no CI lint workflow.
- Prettier formats source and documentation.

See [developer guide](./DEVELOPER_GUIDE.md) for commands and [deployment guide](./DEPLOYMENT.md) for runner constraints.
