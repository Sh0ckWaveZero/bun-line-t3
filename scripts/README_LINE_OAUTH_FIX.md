# 🔧 LINE OAuth Production Fix Tools

## 📁 Files Overview

### 1. LINE_LOGIN_PRODUCTION_FIX.md
📖 **Complete analysis and fix documentation**

Contains:
- 🔍 Root cause analysis of LINE login issues
- ✅ Step-by-step fix instructions
- 🚨 Common errors and solutions
- 📝 Testing checklist

### 2. scripts/check-line-oauth.sh
🔍 **Configuration checker script**

Usage:
```bash
./scripts/check-line-oauth.sh your-production-domain.com
```

What it does:
- ✅ Checks if application is accessible
- ✅ Tests LINE OAuth debug endpoint
- ✅ Validates environment variables
- ✅ Checks ALLOWED_DOMAINS configuration
- ✅ Generates recommended configuration

### 3. scripts/generate-github-secrets.sh
🔧 **GitHub Secrets generator**

Usage:
```bash
./scripts/generate-github-secrets.sh your-production-domain.com
```

What it does:
- ✅ Generates GitHub Secrets configuration
- ✅ Creates proper ALLOWED_DOMAINS setup
- ✅ Provides LINE Console setup instructions
- ✅ Includes verification commands

---

## 🚀 Quick Start

### Step 1: Diagnose Issue
```bash
./scripts/check-line-oauth.sh your-production-domain.com
```

This will show you:
- What's configured correctly
- What's missing
- Exact errors to fix

### Step 2: Generate Secrets
```bash
./scripts/generate-github-secrets.sh your-production-domain.com
```

This creates a file with all GitHub Secrets you need to set.

### Step 3: Apply Fixes

1. **Copy secrets to GitHub:**
   - Open generated file: `github-secrets-your-domain-*.txt`
   - Go to: https://github.com/YOUR_ORG/YOUR_REPO/settings/secrets/actions
   - Add each secret from the file

2. **Update LINE Developers Console:**
   - Go to: https://developers.line.biz/console/
   - Your Channel → Login → App settings
   - Add callback URL: `https://your-domain.com/api/auth/callback/line`

3. **Redeploy:**
   ```bash
   git add .
   git commit -m "docs: add LINE OAuth diagnostic tools"
   git push origin fix/line-login-production
   ```

### Step 4: Verify
```bash
./scripts/check-line-oauth.sh your-production-domain.com
```

All checks should pass ✅

---

## 📋 Detailed Fix Instructions

See **LINE_LOGIN_PRODUCTION_FIX.md** for:
- Complete root cause analysis
- Detailed fix steps
- Error messages and solutions
- Testing procedures

---

## 🔍 Understanding the Problem

### Root Cause

LINE login fails in production because of **missing or incorrect `ALLOWED_DOMAINS`** configuration.

The application has strict URL validation (`src/lib/security/url-validator.ts`):
- Development: Allows `localhost`, `127.0.0.1`
- Production: **Only allows domains in `ALLOWED_DOMAINS`**

If `ALLOWED_DOMAINS` is not set, it falls back to `localhost`, blocking all production requests.

### The Fix

Set `ALLOWED_DOMAINS=your-domain.com,www.your-domain.com` in GitHub Secrets.

This tells the URL validator that your production domain is trusted.

---

## 🧪 Testing

### Manual Test
```bash
curl https://your-domain.com/api/debug/line-oauth | jq '.security'
```

Expected:
```json
{
  "appUrl": { "isSafe": true },
  "frontendUrl": { "isSafe": true },
  "callbackUrl": { "isSafe": true }
}
```

### Automated Test
```bash
./scripts/check-line-oauth.sh your-domain.com
```

All checks should pass ✅

### Login Test
1. Visit: `https://your-domain.com/login`
2. Click: "Log in with LINE"
3. Should: Redirect to LINE, authorize, and return to app

---

## 🚨 Common Issues

### Issue 1: "Host not allowed"
**Cause:** `ALLOWED_DOMAINS` missing production domain
**Fix:** Add to GitHub Secrets:
```
ALLOWED_DOMAINS=your-domain.com,www.your-domain.com
```

### Issue 2: "Invalid code" OAuth error
**Cause:** Callback URL mismatch
**Fix:** Ensure exact match in LINE Console:
```
https://your-domain.com/api/auth/callback/line
```

### Issue 3: Debug endpoint returns errors
**Cause:** Missing environment variables
**Fix:** Check all required variables:
```bash
./scripts/check-line-oauth.sh your-domain.com
```

---

## 📞 Support

For issues or questions:
1. Check: `LINE_LOGIN_PRODUCTION_FIX.md`
2. Run diagnostics: `./scripts/check-line-oauth.sh your-domain.com`
3. Review logs: `docker compose logs -f | grep -i "line\|oauth"`
