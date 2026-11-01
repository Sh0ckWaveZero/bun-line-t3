# Security guide

This guide describes security controls visible in the current application source and deployment files. Route handlers define the actual policy; review them when adding or changing an endpoint.

## Authentication and authorization

- Better Auth provides browser sessions and LINE Login integration in [`src/lib/auth/`](../src/lib/auth/).
- Use `requireAuth` and `requireAdmin` for protected pages. API handlers should resolve the server session and return an appropriate unauthorized/forbidden response.
- Scope database reads and writes by the authenticated user. A `userId` or LINE ID supplied by a client is data, not proof of identity.
- Check feature permissions as well as sign-in where required. Onsite Service Report permits admins and users with an approved LINE account plus the `canUseOnsiteReport` permission.
- Treat Planning Poker as intentionally public. It uses per-participant tokens and rate limits but does not provide authenticated identity; do not put confidential work details in its stories.

## Webhooks and service credentials

- The LINE webhook at [`src/routes/api/line.ts`](../src/routes/api/line.ts) computes an HMAC-SHA256 signature over the raw request body and compares it to `x-line-signature` using a timing-safe comparison before dispatch.
- The body-weight listener uses `SCALE_WEBHOOK_SECRET` in the `x-webhook-secret` header. Do not put the secret in query strings or expose it to browser code. Keep the listener on a trusted network and rotate its shared credential if exposed.
- Cron request authentication uses `CRON_SECRET`; keep it only in the app and cron service environments.
- Bitkub API credentials are encrypted server-side with AES-256-GCM using `BITKUB_CREDENTIAL_ENCRYPTION_KEY`. Keep the key stable and secret. Use Bitkub credentials with trading, deposit, and withdrawal permissions disabled because the integration only reads market history.

See [DCA and Bitkub details](./DCA.md) and [Body Weight](./BODY_WEIGHT.md) for integration behavior.

## Input and data handling

- Validate request bodies, query values, file types, and limits at runtime using the feature's Zod schema or equivalent.
- Keep database access, external API calls, and secrets in server-only modules. Do not import `*.server.ts` into client components or hooks.
- Avoid returning raw exception messages to clients. Log only the information needed to diagnose the failure and never log secret values, API credentials, webhook headers, or complete auth tokens.
- For uploads, validate actual file content and size on the server. Do not rely on the browser-provided MIME type alone.
- Store personal or health-related data only for the feature's intended use and preserve ownership checks when adding exports or admin views.

## Secrets and configuration

Values such as `DATABASE_URL`, `AUTH_SECRET`, LINE credentials, `OPENAI_API_KEY`, `CRON_SECRET`, `INTERNAL_API_KEY`, `BITKUB_CREDENTIAL_ENCRYPTION_KEY`, and `SCALE_WEBHOOK_SECRET` belong in local environment files excluded from git or deployment secret storage. Use strong unique values for production. `AUTH_SECRET` is validated to be at least 32 characters.

The runtime environment schema is [`src/env.mjs`](../src/env.mjs). Review it together with Docker and deployment configuration when adding variables; a variable appearing in a template does not prove that it is used or required.

## Container and deployment controls

- The main runtime container uses Bun 1.4.4 stable and starts as a non-root user.
- App build secrets use Docker BuildKit secret mounts in the Dockerfile; do not move credentials into Docker build arguments, source files, or image labels.
- Docker Compose gives the BLE listener only the network mode and Linux capabilities it needs for Bluetooth, and does not pass the database or LINE credentials to it.
- The production deployment runs on a self-hosted Linux ARM64 runner with production access. Restrict repository administrators, workflow changes, runner access, and secrets accordingly.
- Lint is a local pre-commit check only (lefthook); CI does not lint. Do not rely on CI as a code-quality gate — review and tests in `deploy.yml` are the enforcement points.
- Deployment rollback restores application/cron images but does not reverse database migrations. Verify migration compatibility and backups before release.

See [deployment guide](./DEPLOYMENT.md) for runner and release behavior.

## Review checklist for a new endpoint

1. Decide whether it is session, admin, provider-signature, or shared-secret authenticated.
2. Validate all untrusted input and cap request size or result volume where relevant.
3. Resolve ownership on the server and scope every database operation.
4. Return only fields the caller needs; never serialize secret columns or internal tokens.
5. Handle failures with safe client messages and useful secret-free logs.
6. Add focused coverage for authorization boundaries and update the relevant API/feature documentation.
