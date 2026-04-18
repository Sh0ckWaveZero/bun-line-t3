# Scripts Directory

## 📁 Directory Structure

```
scripts/
├── migrations/          # Database migrations (one-time, historical)
├── db/                  # Database operations (seeding, checks, maintenance)
├── devops/              # DevOps & deployment scripts
├── monitoring/          # Health checks & monitoring
├── secrets/             # Secrets generation scripts
├── tests/               # Test & debug utilities
├── archive/             # Deprecated/unused scripts
└── README.md            # This file
```

---

## 🔄 migrations/

Database migration scripts (typically one-time use, kept for reference)

- `migrate-mongodb-to-postgres.ts` - MongoDB → PostgreSQL data migration
- `migrate-better-auth-canonical.ts` - Better Auth canonical fields migration
- `migrate-user-settings.ts` - User settings schema migration

---

## 💾 db/

Database operations: seeding, health checks, maintenance

- `seed-admin-roles.ts` - Create admin user accounts
- `check-indexes.ts` - Verify database indexes
- `create-missing-indexes.ts` - Create missing database indexes
- `delete-old-line-accounts.ts` - Clean up unused LINE accounts
- `update-holiday-notifications.ts` - Update holiday notification settings

---

## 🚀 devops/

DevOps, deployment, and environment management

- `docker-entrypoint.sh` - Docker container entrypoint
- `switch-env.sh` - Switch between dev/prod environments
- `deploy-oauth-fix.sh` - Deploy LINE OAuth fixes
- `update-cloudflare-tunnel.sh` - Update Cloudflare tunnel config
- `cron-request.sh` - Cron job request handler
- `optimize-bundle.sh` - Bundle optimization

---

## 📊 monitoring/

Health checks and monitoring utilities

- `health-check.sh` - General health check
- `monitoring-dashboard.sh` - Open monitoring dashboard
- `check-line-oauth.sh` - Check LINE OAuth status
- `check-proxy-headers.sh` - Verify proxy headers

---

## 🔐 secrets/

Secrets and configuration generation

- `generate-secrets.ts` - Generate app secrets
- `generate-github-secrets.ts` - Generate GitHub Actions secrets
- `generate-github-secrets.sh` - Shell wrapper for GitHub secrets

---

## 🧪 tests/

Test and debug utilities

- `test-line-webhook.ts` - Test LINE webhook endpoints

---

## 📦 archive/

Deprecated or unused scripts (kept for historical reference)

- `convert-thai-names-corpus.ts`
- `fix-holidays.ts`
- `fix-sessions-index.ts`
- `fix-users-email.ts`
- `simple-dev-server.ts`
- `simple-lock.ts`
- `test-line-oauth-fix.sh`

---

## 📝 NPM Scripts

Key scripts available via `bun run`:

```bash
# Database
bun run db:migrate              # Run Prisma migrations
bun run db:generate             # Generate Prisma client
bun run db:studio               # Open Prisma Studio
bun run db:check-indexes        # Check database indexes
bun run db:create-indexes       # Create missing indexes
bun run seed:admin              # Seed admin roles

# Migrations
bun run migrate:mongo-to-pg     # Migrate MongoDB → PostgreSQL
bun run migrate:mongo-to-pg:dry # Dry run migration

# Secrets
bun run generate:secrets        # Generate app secrets
bun run secrets:generate        # Generate GitHub secrets
bun run secrets:validate        # Validate GitHub secrets

# Health
bun run health:check            # Run health check
bun run health:monitoring       # Open monitoring dashboard
bun run health:line-oauth       # Check LINE OAuth

# DevOps
bun run env:dev                 # Switch to dev environment
bun run env:prod                # Switch to prod environment
bun run env:status              # Show current environment
```

---

## ⚙️ Adding New Scripts

1. Place the script in the appropriate subdirectory
2. Add an npm script to `package.json` if needed
3. Document the script in this README
4. Use descriptive filenames with kebab-case

