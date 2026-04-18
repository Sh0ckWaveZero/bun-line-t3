#!/bin/bash
# 🔍 LINE OAuth Configuration Checker
# ตรวจสอบ configuration ที่จำเป็นสำหรับ LINE login ใน production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 LINE OAuth Configuration Checker${NC}"
echo "======================================"
echo ""

# Get production domain from user or env
PRODUCTION_DOMAIN=${1:-$(grep -m 1 "APP_URL=" .env 2>/dev/null | cut -d'=' -f2 | sed 's/https:\/\///' | sed 's/\/$//' | head -1)}

if [ -z "$PRODUCTION_DOMAIN" ]; then
  echo -e "${RED}❌ Error: Please provide production domain${NC}"
  echo "Usage: $0 <your-production-domain.com>"
  echo ""
  echo "Example: $0 myapp.example.com"
  exit 1
fi

echo -e "${BLUE}Production Domain:${NC} $PRODUCTION_DOMAIN"
echo ""

# Test 1: Check if application is accessible
echo -e "${BLUE}Test 1: Application Accessibility${NC}"
echo "--------------------------------------"
if curl -s -f "https://$PRODUCTION_DOMAIN/api/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Application is accessible${NC}"
else
  echo -e "${RED}❌ Application is not accessible at https://$PRODUCTION_DOMAIN${NC}"
  echo -e "${YELLOW}Please check:${NC}"
  echo "  - Domain is correct"
  echo "  - DNS is configured"
  echo "  - SSL certificate is valid"
  echo "  - Application is running"
fi
echo ""

# Test 2: Check debug endpoint
echo -e "${BLUE}Test 2: LINE OAuth Configuration${NC}"
echo "--------------------------------------"
DEBUG_RESPONSE=$(curl -s "https://$PRODUCTION_DOMAIN/api/debug/line-oauth" 2>/dev/null || echo '{}')

if [ "$DEBUG_RESPONSE" = '{}' ]; then
  echo -e "${RED}❌ Cannot fetch debug endpoint${NC}"
  echo -e "${YELLOW}Possible issues:${NC}"
  echo "  - Application not running"
  echo "  - Debug endpoint disabled"
  echo "  - Network connectivity issue"
else
  echo -e "${GREEN}✅ Debug endpoint accessible${NC}"
  echo ""
  echo "Configuration:"

  # Parse JSON response (using jq if available, otherwise basic grep)
  if command -v jq &> /dev/null; then
    echo "$DEBUG_RESPONSE" | jq '.'

    APP_URL_SAFE=$(echo "$DEBUG_RESPONSE" | jq -r '.security.appUrl.isSafe')
    CALLBACK_URL_SAFE=$(echo "$DEBUG_RESPONSE" | jq -r '.security.callbackUrl.isSafe')

    echo ""
    echo -e "${BLUE}Security Validation:${NC}"
    if [ "$APP_URL_SAFE" = "true" ]; then
      echo -e "${GREEN}✅ APP_URL is safe${NC}"
    else
      echo -e "${RED}❌ APP_URL validation failed${NC}"
    fi

    if [ "$CALLBACK_URL_SAFE" = "true" ]; then
      echo -e "${GREEN}✅ Callback URL is safe${NC}"
    else
      echo -e "${RED}❌ Callback URL validation failed${NC}"
    fi

    CALLBACK_URL=$(echo "$DEBUG_RESPONSE" | jq -r '.callbackUrl')
    echo ""
    echo -e "${BLUE}Expected Callback URL in LINE Console:${NC}"
    echo -e "${YELLOW}$CALLBACK_URL${NC}"
  else
    echo "$DEBUG_RESPONSE"
    echo ""
    echo -e "${YELLOW}Note: Install jq for better formatting: apt install jq${NC}"
  fi
fi
echo ""

# Test 3: Check GitHub Secrets (if .env file exists)
echo -e "${BLUE}Test 3: Environment Variables Check${NC}"
echo "--------------------------------------"

# Check for common .env files
ENV_FILE=""
if [ -f ".env" ]; then
  ENV_FILE=".env"
elif [ -f ".env.production" ]; then
  ENV_FILE=".env.production"
elif [ -f ".env.prod" ]; then
  ENV_FILE=".env.prod"
fi

if [ -n "$ENV_FILE" ]; then
  echo -e "${GREEN}Found environment file: $ENV_FILE${NC}"
  echo ""

  # Check required variables
  REQUIRED_VARS=(
    "APP_URL"
    "FRONTEND_URL"
    "APP_DOMAIN"
    "ALLOWED_DOMAINS"
    "LINE_CLIENT_ID"
    "LINE_CLIENT_SECRET"
    "AUTH_SECRET"
  )

  MISSING_VARS=()
  for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^$var=" "$ENV_FILE" 2>/dev/null; then
      VALUE=$(grep "^$var=" "$ENV_FILE" | cut -d'=' -f2)
      if [ -n "$VALUE" ] && [ "$VALUE" != '""' ]; then
        echo -e "${GREEN}✅ $var is set${NC}"
      else
        echo -e "${RED}❌ $var is empty${NC}"
        MISSING_VARS+=("$var")
      fi
    else
      echo -e "${RED}❌ $var is missing${NC}"
      MISSING_VARS+=("$var")
    fi
  done

  if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}Missing variables: ${MISSING_VARS[*]}${NC}"
  fi
else
  echo -e "${YELLOW}No local .env file found${NC}"
  echo "If using GitHub Secrets, check manually in:"
  echo "https://github.com/[YOUR_REPO]/settings/secrets/actions"
fi
echo ""

# Test 4: Check ALLOWED_DOMAINS configuration
echo -e "${BLUE}Test 4: ALLOWED_DOMAINS Configuration${NC}"
echo "--------------------------------------"

if [ -n "$ENV_FILE" ]; then
  ALLOWED_DOMAINS=$(grep "^ALLOWED_DOMAINS=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 | tr ',' '\n')

  if [ -z "$ALLOWED_DOMAINS" ]; then
    echo -e "${RED}❌ ALLOWED_DOMAINS is not set${NC}"
    echo -e "${YELLOW}This is CRITICAL for production!${NC}"
  else
    echo -e "${GREEN}ALLOWED_DOMAINS found:${NC}"
    echo "$ALLOWED_DOMAINS" | while read -r domain; do
      if [ -n "$domain" ]; then
        echo "  - $domain"
        # Check if production domain is in the list
        if echo "$domain" | grep -q "$PRODUCTION_DOMAIN"; then
          echo -e "    ${GREEN}✅ Matches production domain${NC}"
        fi
      fi
    done

    # Check if production domain is included
    if ! echo "$ALLOWED_DOMAINS" | grep -q "$PRODUCTION_DOMAIN"; then
      echo ""
      echo -e "${RED}❌ Production domain ($PRODUCTION_DOMAIN) is NOT in ALLOWED_DOMAINS${NC}"
      echo -e "${YELLOW}This will cause ALL requests to be rejected!${NC}"
      echo ""
      echo "Fix: Add to ALLOWED_DOMAINS:"
      echo "  ALLOWED_DOMAINS=$PRODUCTION_DOMAIN,www.$PRODUCTION_DOMAIN"
    fi
  fi
else
  echo -e "${YELLOW}Cannot check ALLOWED_DOMAINS without .env file${NC}"
  echo "If using GitHub Secrets, verify manually:"
  echo "ALLOWED_DOMAINS=$PRODUCTION_DOMAIN,www.$PRODUCTION_DOMAIN"
fi
echo ""

# Test 5: Generate recommended configuration
echo -e "${BLUE}Test 5: Recommended Configuration${NC}"
echo "--------------------------------------"
echo ""
echo "Add these to your GitHub Secrets or .env file:"
echo ""
echo "# Core URLs"
echo "APP_URL=https://$PRODUCTION_DOMAIN"
echo "FRONTEND_URL=https://$PRODUCTION_DOMAIN"
echo "APP_DOMAIN=https://$PRODUCTION_DOMAIN"
echo ""
echo "# Security"
echo "ALLOWED_DOMAINS=$PRODUCTION_DOMAIN,www.$PRODUCTION_DOMAIN"
echo ""
echo "# LINE Configuration"
echo "LINE_CLIENT_ID=your-actual-line-client-id"
echo "LINE_CLIENT_SECRET=your-actual-line-client-secret"
echo ""
echo "# Expected Callback URL in LINE Developers Console:"
echo "https://$PRODUCTION_DOMAIN/api/auth/callback/line"
echo ""

# Summary
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo "Next Steps:"
echo "1. 📝 Update GitHub Secrets with recommended configuration"
echo "2. 🔗 Add callback URL to LINE Developers Console:"
echo "   https://$PRODUCTION_DOMAIN/api/auth/callback/line"
echo "3. 🚀 Redeploy application"
echo "4. ✅ Test login at: https://$PRODUCTION_DOMAIN/login"
echo ""
echo "For detailed fix instructions, see: LINE_LOGIN_PRODUCTION_FIX.md"
