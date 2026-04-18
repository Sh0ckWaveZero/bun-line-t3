#!/bin/bash

# 🔍 Script to check if reverse proxy is sending correct headers
# Run this on your server to verify X-Forwarded-* headers configuration

echo "🔍 Checking Reverse Proxy Headers Configuration"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check from server itself (localhost)
echo "1️⃣ Testing from localhost (should show HTTP):"
echo "-------------------------------------------"
LOCALHOST_RESPONSE=$(curl -s http://localhost:3000/api/debug/line-oauth 2>/dev/null)
LOCALHOST_REQUEST_URL=$(echo "$LOCALHOST_RESPONSE" | grep -o '"requestUrl":"[^"]*"' | cut -d'"' -f4)

if [[ "$LOCALHOST_REQUEST_URL" == https://* ]]; then
    echo -e "${GREEN}✅${NC} Localhost test passed (unexpected but OK)"
else
    echo -e "${YELLOW}⚠️${NC}  Localhost test: $LOCALHOST_REQUEST_URL (expected)"
fi
echo ""

# Check from external (should show HTTPS with proper headers)
echo "2️⃣ Testing from external URL (should show HTTPS):"
echo "--------------------------------------------------"
if [ -n "$1" ]; then
    EXTERNAL_URL="$1"
else
    # Try to detect from environment
    EXTERNAL_URL="https://bun-line.midseelee.com"
fi

EXTERNAL_RESPONSE=$(curl -s "$EXTERNAL_URL/api/debug/line-oauth" 2>/dev/null)
EXTERNAL_REQUEST_URL=$(echo "$EXTERNAL_RESPONSE" | grep -o '"requestUrl":"[^"]*"' | cut -d'"' -f4)

if [[ "$EXTERNAL_REQUEST_URL" == https://* ]]; then
    echo -e "${GREEN}✅${NC} External test passed: $EXTERNAL_REQUEST_URL"
    echo ""
    echo "🎉 Success! Your reverse proxy is correctly forwarding HTTPS headers."
else
    echo -e "${RED}❌${NC} External test FAILED: $EXTERNAL_REQUEST_URL"
    echo ""
    echo "⚠️  Your reverse proxy is NOT sending X-Forwarded-* headers correctly!"
    echo ""
    echo "🔧 Fix: Configure your reverse proxy to send these headers:"
    echo "   X-Forwarded-Proto: https"
    echo "   X-Forwarded-Host: bun-line.midseelee.com"
    echo "   X-Forwarded-For: <client-ip>"
    echo ""
    echo "📖 See: docs/reverse-proxy-https-headers.md"
fi
echo ""

# Show headers received
echo "3️⃣ Full headers received by application:"
echo "-----------------------------------------"
curl -s -I "$EXTERNAL_URL/api/debug/line-oauth" | grep -i "x-forwarded"
echo ""

# Check if X-Forwarded-Proto is set
if curl -s -I "$EXTERNAL_URL/api/debug/line-oauth" | grep -qi "x-forwarded-proto: https"; then
    echo -e "${GREEN}✅${NC} X-Forwarded-Proto header is set correctly"
else
    echo -e "${RED}❌${NC} X-Forwarded-Proto header is MISSING or incorrect"
fi
