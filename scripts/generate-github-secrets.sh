#!/bin/bash
# 🔧 GitHub Secrets Generator for LINE OAuth
# Generate GitHub Secrets configuration from production domain

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 GitHub Secrets Generator for LINE OAuth${NC}"
echo "======================================"
echo ""

# Get production domain
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Please provide production domain${NC}"
  echo "Usage: $0 <your-production-domain.com>"
  echo ""
  echo "Example: $0 myapp.example.com"
  exit 1
fi

PRODUCTION_DOMAIN=$1

echo -e "${BLUE}Production Domain:${NC} $PRODUCTION_DOMAIN"
echo ""

# Validate domain format
if [[ ! $PRODUCTION_DOMAIN =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
  echo -e "${RED}❌ Invalid domain format${NC}"
  exit 1
fi

# Generate output file
OUTPUT_FILE="github-secrets-$PRODUCTION_DOMAIN-$(date +%Y%m%d).txt"

cat > "$OUTPUT_FILE" << EOF
# =============================================================================
# GitHub Secrets Configuration for LINE OAuth
# Generated: $(date -Iseconds)
# Production Domain: $PRODUCTION_DOMAIN
# =============================================================================

# 📋 Copy these to GitHub Repository Settings > Secrets > Actions
# Repository: https://github.com/YOUR_ORG/YOUR_REPO/settings/secrets/actions

# =============================================================================
# 🌐 Application URLs (REQUIRED)
# =============================================================================

# Main application URL - used for OAuth callbacks
APP_URL=https://$PRODUCTION_DOMAIN

# Frontend URL - should match APP_URL for single-domain setups
FRONTEND_URL=https://$PRODUCTION_DOMAIN

# Application domain for security validation
APP_DOMAIN=https://$PRODUCTION_DOMAIN

# =============================================================================
# 🔐 Security Configuration (REQUIRED)
# =============================================================================

# Allowed domains for URL validation (comma-separated)
# IMPORTANT: Include all domain variants you use
ALLOWED_DOMAINS=$PRODUCTION_DOMAIN,www.$PRODUCTION_DOMAIN

# Auth secret for session management (generate with: openssl rand -base64 32)
AUTH_SECRET=YOUR_AUTH_SECRET_HERE

# =============================================================================
# 📱 LINE Login Configuration (REQUIRED)
# =============================================================================

# LINE Login Client ID (from LINE Developers Console)
LINE_CLIENT_ID=YOUR_LINE_CLIENT_ID_HERE

# LINE Login Client Secret (from LINE Developers Console)
LINE_CLIENT_SECRET=YOUR_LINE_CLIENT_SECRET_HERE

# LINE Channel Secret (from LINE Developers Console > Messaging API)
LINE_CHANNEL_SECRET=YOUR_LINE_CHANNEL_SECRET_HERE

# LINE Channel Access Token (from LINE Developers Console > Messaging API)
LINE_CHANNEL_ACCESS=YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE

# =============================================================================
# 👥 Admin Configuration (OPTIONAL)
# =============================================================================

# Comma-separated list of LINE User IDs for admin users
# Find your LINE User ID at: https://developers.line.biz/console/
ADMIN_LINE_USER_IDS=YOUR_ADMIN_LINE_USER_ID_1,YOUR_ADMIN_LINE_USER_ID_2

# =============================================================================
# 🌐 LINE Developers Console Configuration
# =============================================================================

# Add this callback URL to your LINE Login Channel:
# https://developers.line.biz/console/
#
# Callback URL:
# https://$PRODUCTION_DOMAIN/api/auth/callback/line
#
# Also add these variants (if applicable):
# https://$PRODUCTION_DOMAIN/api/auth/callback/line/
# https://www.$PRODUCTION_DOMAIN/api/auth/callback/line
# https://www.$PRODUCTION_DOMAIN/api/auth/callback/line/

# =============================================================================
# ✅ Setup Checklist
# =============================================================================

# 1. Copy all secrets above to GitHub Secrets
# 2. Update LINE Developers Console with callback URL
# 3. Generate AUTH_SECRET: openssl rand -base64 32
# 4. Add LINE credentials from LINE Developers Console
# 5. Redeploy application
# 6. Test login at: https://$PRODUCTION_DOMAIN/login

# =============================================================================
# 🔍 Verification Commands
# =============================================================================

# Check configuration after deployment:
curl https://$PRODUCTION_DOMAIN/api/debug/line-oauth | jq '.'

# Expected output should show:
# - appUrl: "https://$PRODUCTION_DOMAIN"
# - callbackUrl: "https://$PRODUCTION_DOMAIN/api/auth/callback/line"
# - security.appUrl.isSafe: true
# - security.callbackUrl.isSafe: true

EOF

echo -e "${GREEN}✅ Generated GitHub Secrets configuration${NC}"
echo ""
echo "Output file: $OUTPUT_FILE"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. 📋 Copy contents from $OUTPUT_FILE"
echo "2. 🔐 Add secrets to GitHub:"
echo "   https://github.com/YOUR_ORG/YOUR_REPO/settings/secrets/actions"
echo "3. 📱 Update LINE Developers Console:"
echo "   Callback URL: https://$PRODUCTION_DOMAIN/api/auth/callback/line"
echo "4. 🚀 Redeploy application"
echo ""
echo -e "${BLUE}Quick commands:${NC}"
echo "cat $OUTPUT_FILE"
echo ""
echo -e "${YELLOW}Important: Update YOUR_* placeholders with actual values!${NC}"
