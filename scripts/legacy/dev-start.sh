#!/bin/bash

# 🚀 Start Clean Development Environment
# สคริปต์สำหรับเริ่ม development environment อย่างสะอาด

echo "🧹 Cleaning development environment..."

# ลบ cache ต่างๆ
rm -rf .next
rm -rf node_modules/.cache
rm -rf .env.production*

# ตรวจสอบว่า .env.local มี localhost configuration
if grep -q "your-app.example.com" .env.local 2>/dev/null; then
    echo "⚠️  Found production URLs in .env.local, fixing..."
    sed -i '' 's/https:\/\/line-login\.midseelee\.com/http:\/\/localhost:4325/g' .env.local
fi

echo "🔧 Setting up development environment variables..."

# Export development environment variables
export NODE_ENV=development
export NEXT_PUBLIC_APP_ENV=development
export NEXTAUTH_URL=http://localhost:4325
export FRONTEND_URL=http://localhost:4325
export NEXT_PUBLIC_BASE_URL=http://localhost:4325

echo "📊 Environment check:"
echo "NODE_ENV: $NODE_ENV"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"
echo "FRONTEND_URL: $FRONTEND_URL"
echo "NEXT_PUBLIC_BASE_URL: $NEXT_PUBLIC_BASE_URL"

echo ""
echo "🚀 Starting development server on http://localhost:4325"
echo "📝 Please open your browser to: http://localhost:4325"
echo "❌ Do NOT use: https://your-app.example.com"
echo ""

# Start development server
exec next dev --port 4325 --hostname localhost
