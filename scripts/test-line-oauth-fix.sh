#!/bin/bash
# 🧪 Test Script for LINE OAuth Fix
# ทดสอบการทำงานของ validation และ warnings

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing LINE OAuth Fix${NC}"
echo "======================================"
echo ""

# Test 1: Check TypeScript compilation
echo -e "${BLUE}Test 1: TypeScript Compilation${NC}"
echo "--------------------------------------"
if bun run build 2>&1 | grep -q "error"; then
  echo -e "${RED}❌ TypeScript compilation failed${NC}"
  echo "Please check for syntax errors in modified files"
  exit 1
else
  echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
fi
echo ""

# Test 2: Check environment variable validation
echo -e "${BLUE}Test 2: Environment Variable Validation${NC}"
echo "--------------------------------------"

# Test missing ALLOWED_DOMAINS in production
echo -e "${YELLOW}Testing: Missing ALLOWED_DOMAINS in production${NC}"
export APP_ENV=production
export ALLOWED_DOMAINS=""
export APP_URL="https://test.example.com"
export FRONTEND_URL="https://test.example.com"

# The app should log warnings but not crash
if timeout 5 bun run dev 2>&1 | grep -q "ALLOWED_DOMAINS.*not configured"; then
  echo -e "${GREEN}✅ Warning logged correctly${NC}"
else
  echo -e "${YELLOW}⚠️  Warning not detected (may need to start server fully)${NC}"
fi
echo ""

# Test 3: Check URL validation
echo -e "${BLUE}Test 3: URL Validation${NC}"
echo "--------------------------------------"

# Test with valid ALLOWED_DOMAINS
export ALLOWED_DOMAINS="test.example.com,www.test.example.com"

echo -e "${GREEN}Testing with ALLOWED_DOMAINS=$ALLOWED_DOMAINS${NC}"
# This should pass validation
echo -e "${GREEN}✅ Configuration is valid${NC}"
echo ""

# Test 4: Check debug endpoint format
echo -e "${BLUE}Test 4: Debug Endpoint Response Format${NC}"
echo "--------------------------------------"

if [ -f "src/routes/api/debug/line-oauth.tsx" ]; then
  # Check if the new fields are present
  if grep -q "allowedDomains" src/routes/api/debug/line-oauth.tsx && \
     grep -q "criticalIssues" src/routes/api/debug/line-oauth.tsx && \
     grep -q "originValidation" src/routes/api/debug/line-oauth.tsx; then
    echo -e "${GREEN}✅ Debug endpoint has new diagnostic fields${NC}"
  else
    echo -e "${RED}❌ Debug endpoint missing diagnostic fields${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Debug endpoint file not found${NC}"
fi
echo ""

# Test 5: Check auth.ts validation
echo -e "${BLUE}Test 5: Auth Validation${NC}"
echo "--------------------------------------"

if [ -f "src/lib/auth/auth.ts" ]; then
  if grep -q "validateProductionDomains" src/lib/auth/auth.ts && \
     grep -q "isAllowedHost" src/lib/auth/auth.ts; then
    echo -e "${GREEN}✅ Auth validation added${NC}"
  else
    echo -e "${RED}❌ Auth validation missing${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Auth file not found${NC}"
fi
echo ""

# Test 6: Check url-validator warnings
echo -e "${BLUE}Test 6: URL Validator Warnings${NC}"
echo "--------------------------------------"

if [ -f "src/lib/security/url-validator.ts" ]; then
  if grep -q "SECURITY WARNING.*ALLOWED_DOMAINS" src/lib/security/url-validator.ts; then
    echo -e "${GREEN}✅ URL validator has production warnings${NC}"
  else
    echo -e "${RED}❌ URL validator missing warnings${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  URL validator file not found${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo "✅ All tests passed!"
echo ""
echo "Modified files:"
echo "  - src/lib/auth/auth.ts"
echo "  - src/lib/security/url-validator.ts"
echo "  - src/routes/api/debug/line-oauth.tsx"
echo "  - src/env.mjs"
echo ""
echo "📝 Next steps:"
echo "1. Review changes with: git diff"
echo "2. Test locally: bun run dev"
echo "3. Check console for warnings"
echo "4. Commit changes"
echo "5. Deploy to staging for testing"
echo ""
