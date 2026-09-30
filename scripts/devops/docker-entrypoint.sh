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
# Migration ต้องผ่านก่อนเปิดแอป ใช้ RUN_MIGRATIONS=false เมื่อ pipeline ทำแล้ว
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "🗄️ Running prisma migrate deploy..."
    if [ ! -f node_modules/prisma/build/index.js ]; then
        echo "❌ ไม่พบ Prisma CLI ให้รัน migration ผ่าน image target migrate ก่อน"
        exit 1
    fi
    if bun node_modules/prisma/build/index.js migrate deploy; then
        echo "✅ Database migrations applied"
    else
        echo "❌ Migration ล้มเหลว ยกเลิกการเปิดแอป"
        exit 1
    fi
else
    echo "⏭️ Prisma migrate deploy skipped (set RUN_MIGRATIONS=false to disable)"
fi

echo "🚀 Starting TanStack Start application..."

export HOSTNAME=0.0.0.0
export PORT=${PORT:-12914}

echo "🌐 Binding to $HOSTNAME:$PORT"
exec bun server.ts
