#!/bin/sh
# 🚀 Docker Entrypoint Script สำหรับ Bun + TanStack Start + Prisma

set -e

echo "🔍 Verifying runtime environment..."

if [ ! -d "node_modules/.prisma/client" ]; then
    echo "❌ Prisma Client not found"
    exit 1
fi

if [ ! -f "dist/server/server.js" ] || [ ! -d "dist/client" ]; then
    echo "❌ TanStack Start build output not found"
    exit 1
fi

echo "✅ Runtime environment verified"

if [ "${RUN_DB_PUSH:-false}" = "true" ]; then
    echo "🗄️ Running prisma db push..."
    if bunx prisma db push --skip-generate 2>/dev/null; then
        echo "✅ Prisma schema synced"
    else
        echo "⚠️ Prisma schema sync failed or database not available"
    fi
else
    echo "⏭️ Prisma db push skipped (set RUN_DB_PUSH=true to enable)"
fi

echo "🚀 Starting TanStack Start application..."

export HOSTNAME=0.0.0.0
export PORT=${PORT:-12914}

echo "🌐 Binding to $HOSTNAME:$PORT"
exec bun server.ts
