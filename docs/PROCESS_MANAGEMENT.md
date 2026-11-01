# Process management and operations

The production Compose stack contains the application, cron worker, migration image, and optional Bluetooth scale listener. The app and cron services run in Docker; the deployment workflow drives builds, migrations, release, and health checks through `scripts/devops/deploy.sh`.

## Inspect service state

Run commands from the deployment host and the project directory:

```bash
docker compose ps
docker compose logs --tail 100 app
docker compose logs --tail 100 cron
docker compose logs --tail 100 scale-listener
```

The scale-listener service may be absent or inactive when `SCALE_WEBHOOK_SECRET` is not configured. It is optional and its failure does not roll back the application release.

## Health checks

The application container's health check calls `/api/health`. The deployment script waits for the application and cron services, then makes a local request to the app health endpoint. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for release and rollback steps.

Local helper scripts exposed in `package.json` include:

```bash
bun run health:check
bun run health:monitoring
bun run health:line-oauth
bun run health:proxy
```

These scripts inspect the environment where they run; they do not replace the production deployment health check.

## Scheduled jobs

The cron container uses the repository's root `crontab` and calls app endpoints with `CRON_SECRET`. Schedule management for application-level jobs is separate and stored in PostgreSQL. See [Cron Jobs](./CRON-JOBS.md) for the active schedule and authentication details.

## Manual deploy steps

The deployment workflow calls these stages in order:

```bash
bash scripts/devops/deploy.sh preflight
bash scripts/devops/deploy.sh backup
bash scripts/devops/deploy.sh build
bash scripts/devops/deploy.sh migrate
bash scripts/devops/deploy.sh release
```

These operations require the production environment and Docker access. Prefer the configured workflow; only run stages manually when following the repository's release procedure. Rollback restores the previous app and cron images, but does not reverse database migrations.

## Script inventory

- `scripts/devops/deploy.sh` — deployment stages and release rollback behavior
- `scripts/devops/docker-entrypoint.sh` — production app startup and optional migration invocation
- `scripts/devops/cron-request.sh` — cron-to-app request wrapper
- `scripts/monitoring/health-check.sh` — application health probe
- `scripts/monitoring/monitoring-dashboard.sh` — operational dashboard helper
- `scripts/monitoring/check-line-oauth.sh` — LINE OAuth diagnostic
- `scripts/monitoring/check-proxy-headers.sh` — proxy header diagnostic
