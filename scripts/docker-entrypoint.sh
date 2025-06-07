#!/bin/sh
# 🚀 Docker Entrypoint Script สำหรับ Bun + Next.js + Prisma
# 🔐 SECURITY: Secure startup sequence with proper error handling

set -e  # Exit on any error

echo "🔍 Verifying runtime environment..."

# ตรวจสอบ Prisma Client
if [ ! -d "node_modules/.prisma/client" ]; then
    echo "❌ Prisma Client not found"
    exit 1
fi

# ตรวจสอบ Next.js build output
if [ ! -f "server.js" ] && [ ! -d ".next" ]; then
    echo "❌ Next.js build output not found"
    exit 1
fi

echo "✅ Runtime environment verified"

# 🗄️ Database Migration (ถ้าไม่ skip)
if [ "$SKIP_DB_MIGRATIONS" != "true" ]; then
    echo "🗄️ Running database migrations..."
    if bunx prisma migrate deploy 2>/dev/null; then
        echo "✅ Database migrations completed"
    else
        echo "⚠️ No migrations to run or database not available"
    fi
    
    if bunx prisma generate 2>/dev/null; then
        echo "✅ Prisma client regenerated"
    else
        echo "⚠️ Prisma client already exists"
    fi
else
    echo "⏭️ Database migrations skipped"
fi

# 🚀 Start Application
echo "🚀 Starting Next.js application..."
if [ -f "server.js" ]; then
    echo "✅ Using Next.js standalone mode"
    exec node server.js
else
    echo "⚠️ Fallback to bun start"
    exec bun start
fi
