# Developer guide

This repository uses Bun 1.4.4 stable, React 19, TanStack Start, TypeScript, Tailwind CSS, and Prisma 7 with PostgreSQL. Read [setup](./SETUP.md) before running the app, and use [architecture](./ARCHITECTURE.md) to locate feature code.

## Common commands

| Task | Command |
| --- | --- |
| Install dependencies | `bun install` |
| Start dev server | `bun run dev` |
| Type check | `bun check` |
| Run tests | `bun test` |
| Run one test file/pattern | `bun test <file-or-pattern>` |
| Format all supported files | `bun run format` |
| Check formatting | `bun run format:check` |
| Build app | `bun run build` |
| Apply committed database migrations | `bun run db:deploy` |
| Create/apply a dev migration | `bun run db:migrate` |

The stable Bun build does not include the built-in linter. Run the pinned canary linter locally:

```bash
bunx --package bun@1.4.4-canary.20261031.1 bun lint
```

Lefthook installs a pre-commit hook during `bun install`; the hook runs this pinned linter on staged JS/TS files. To reinstall it after hooks were skipped:

```bash
bunx lefthook install
```

Lint rules are configured in [`bunfig.toml`](../bunfig.toml). Lint errors fail the hook; warnings are reported in the terminal. Lint runs locally only through the lefthook pre-commit hook — there is no CI lint workflow, so run it yourself before pushing.

## Code organization

- Keep route files under `src/routes/` focused on route configuration and server request handling.
- Put page components, UI, hooks, validation, and domain logic in `src/features/<domain>/`.
- Keep database access and secrets in server-only modules, conventionally named `*.server.ts`; never import them into a browser component or hook.
- Use shared `src/lib/` or `src/components/` only for behavior shared across features.
- Use the `@/` alias for imports.
- Validate untrusted input at runtime with Zod or the route's existing schema.
- Scope reads and mutations by the authenticated owner; admin access must be explicit.
- Prefer pure helpers for calculations and transformations, immutable updates, and early returns.
- Use strict TypeScript types; prefer interfaces for object contracts and const maps over enums.
- Support light and dark themes in UI changes.
- Keep user-facing messages in Thai where the feature already uses Thai.

The module structure is a convention rather than a requirement that every feature have every directory. See [architecture](./ARCHITECTURE.md#feature-module-layout).

## Making changes

1. Locate the owning feature and its route/API entry point.
2. Follow the existing service, schema, and authorization patterns in that feature.
3. Update the relevant feature guide and API index when behavior or contracts change.
4. Run applicable checks for the change: `bun check`, focused `bun test`, `bun run format:check`, `bun run build`, and the pinned Bun linter as appropriate.
5. Review the final diff and verify that documentation links point to existing files.

Do not claim CI or deployment passed based on local commands. The lint workflow depends on an isolated runner that has not been confirmed online; deployment runs separately on the production self-hosted runner. See [deployment guide](./DEPLOYMENT.md).

## Useful references

- [API route reference](./API.md)
- [Security guide](./SECURITY.md)
- [Cron jobs](./CRON-JOBS.md)
- [Onsite Service Report](./ONSITE_REPORTS.md)
- [DCA](./DCA.md)
- [Body Weight](./BODY_WEIGHT.md)
- [Planning Poker](./PLANNING_POKER.md)
