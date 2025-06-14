#!/bin/bash

# Restart development server and check LINE OAuth configuration
echo "🔄 Restarting development server with proper environment configuration..."

# Kill any existing processes on port 4325
echo "🛑 Stopping existing processes..."
pkill -f "next dev" || true
lsof -ti:4325 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 2

# Load environment variables and start server
echo "🚀 Starting server with environment variables..."
cd /Users/sh0ckpro/Works/Freelance/Bun/bun-line-t3

# Export environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Verify critical environment variables
echo "📋 Environment Check:"
echo "  NEXTAUTH_URL: $NEXTAUTH_URL"
echo "  FRONTEND_URL: $FRONTEND_URL"
echo "  LINE_CLIENT_ID: $LINE_CLIENT_ID"
echo ""

# Start development server
echo "🌐 Starting Next.js development server..."
bun run dev &

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test LINE OAuth URL generation
echo "🔍 Testing LINE OAuth URL generation..."
curl -s "http://localhost:4325/api/debug/line-oauth" | jq '.'

echo ""
echo "✅ Server restarted. Check the OAuth URL above to verify it uses production domain."
echo "🌐 Access your app at: http://localhost:4325"
echo "🔗 Test OAuth at: http://localhost:4325/line-oauth-test"
