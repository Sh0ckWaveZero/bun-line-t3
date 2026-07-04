#!/bin/sh
# 🚀 Docker Entrypoint Script สำหรับ Bun + TanStack Start + Prisma v7

set -e

echo "🔍 Verifying runtime environment..."

# Check for Prisma v7 client (supports both custom alias and default location)
if [ ! -d "prisma/generated/client" ] && [ ! -d "node_modules/@prisma/client" ]; then
    echo "❌ Prisma Client not found (checked prisma/generated/client and node_modules/@prisma/client)"
    exit 1
fi

if [ ! -f "dist/server/server.js" ] && [ ! -f "dist/index/index.js" ]; then
    echo "❌ TanStack Start server bundle not found"
    exit 1
fi

if [ ! -d "dist/client" ] && [ ! -d "dist/assets" ]; then
    echo "❌ TanStack Start client bundle not found"
    exit 1
fi

echo "✅ Runtime environment verified"

# ─────────────────────────────────────────────
# Database Migrations
# ─────────────────────────────────────────────
# Run pending migrations on every container start.
# `migrate deploy` is idempotent — it only applies migrations not yet in the
# `_prisma_migrations` table, so it's safe to run on every boot.
#
# Use `migrate deploy` (not `db push`) in production because:
#   - Tracks applied migrations in history (db push does not)
#   - Cannot cause data loss by design (migrations are authored, not generated)
#   - Required by AGENTS.md: "ALWAYS use migrations for production schema changes"
#
# Opt out via RUN_MIGRATIONS=false (e.g. for read-only replicas or CI smoke tests).
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "🗄️ Running prisma migrate deploy..."
    if bunx prisma migrate deploy 2>&1; then
        echo "✅ Database migrations applied"
    else
        echo "⚠️ Database migration failed — starting app anyway (DB may be unavailable)"
    fi
else
    echo "⏭️ Prisma migrate deploy skipped (set RUN_MIGRATIONS=false to disable)"
fi

echo "🚀 Starting TanStack Start application..."

export HOSTNAME=0.0.0.0
export PORT=${PORT:-12914}

echo "🌐 Binding to $HOSTNAME:$PORT"
exec bun server.ts
