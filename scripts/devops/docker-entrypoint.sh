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
