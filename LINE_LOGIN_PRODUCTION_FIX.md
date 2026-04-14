# 🔧 LINE Login Production Fix Analysis

## 📋 Required Environment Variables

### Core Configuration
```bash
APP_URL=https://your-production-domain.com
FRONTEND_URL=https://your-production-domain.com
APP_DOMAIN=https://your-production-domain.com
ALLOWED_DOMAINS=your-production-domain.com
```

### LINE Configuration
```bash
LINE_CLIENT_ID=your-line-client-id
LINE_CLIENT_SECRET=your-line-client-secret
```

### Security Configuration
```bash
AUTH_SECRET=your-auth-secret-min-32-chars
```

## 🔍 Common Issues Found

### Issue 1: Missing ALLOWED_DOMAINS
**Problem**: `ALLOWED_DOMAINS` environment variable is required for URL validation in production

**Location**: `src/lib/security/url-validator.ts:23-27`
```typescript
function getAllowedDomains(): string[] {
  if (process.env.ALLOWED_DOMAINS) {
    return process.env.ALLOWED_DOMAINS.split(",").map((d) => d.trim());
  }
  // fallback เดิม
  return ["localhost", "127.0.0.1"];
}
```

**Impact**: If `ALLOWED_DOMAINS` is not set, the URL validator will only allow `localhost` and `127.0.0.1`, blocking production requests.

**Fix**: Set `ALLOWED_DOMAINS=your-production-domain.com` in GitHub Secrets

---

### Issue 2: Callback URL Construction
**Problem**: Callback URL is constructed from `APP_URL` but might not match LINE Developers Console

**Location**: `src/routes/api/debug/line-oauth.tsx:20-22`
```typescript
const callbackBase = safeAppUrl ?? "";
const callbackUrl = callbackBase ? `${callbackBase}/api/auth/callback/line` : null;
```

**Expected Callback URL**: `https://your-production-domain.com/api/auth/callback/line`

**Fix**:
1. Ensure `APP_URL` in production exactly matches the domain in LINE Console
2. Add this exact URL to LINE Developers Console callback URLs

---

### Issue 3: URL Validation Failures
**Problem**: Strict URL validation can block legitimate production requests

**Location**: `src/lib/security/url-validator.ts:31-56`

**Validation Logic**:
```typescript
export const isAllowedHost = (
  hostname: string,
  env: Environment = detectEnvironment(),
): boolean => {
  let allowedHosts: string[];
  if (env === "production") {
    allowedHosts = getAllowedDomains(); // 👈 Must include production domain
  } else {
    allowedHosts = ["localhost", "127.0.0.1"];
  }

  // 🔍 Exact match for allowed hosts
  if (allowedHosts.includes(hostname)) {
    return true;
  }

  // 🔍 Check for subdomain matches in production
  if (env === "production") {
    return allowedHosts.some(
      (allowedHost) =>
        hostname === allowedHost || hostname.endsWith(`.${allowedHost}`),
    );
  }

  return false;
};
```

**Impact**: If production domain is not in `ALLOWED_DOMAINS`, ALL requests will be rejected.

---

## ✅ Step-by-Step Fix

### Step 1: Check Current Configuration
Visit debug endpoint on production:
```bash
curl https://your-production-domain.com/api/debug/line-oauth
```

**Expected Response**:
```json
{
  "nodeEnv": "production",
  "appEnv": "production",
  "clientId": "***configured***",
  "appUrl": "https://your-production-domain.com",
  "frontendUrl": "https://your-production-domain.com",
  "callbackUrl": "https://your-production-domain.com/api/auth/callback/line",
  "security": {
    "appUrl": {
      "isSafe": true
    },
    "frontendUrl": {
      "isSafe": true
    },
    "callbackUrl": {
      "isSafe": true
    }
  }
}
```

### Step 2: Update GitHub Secrets
Add/update these secrets in GitHub Repository Settings:

```bash
# Required - Core Application URLs
APP_URL=https://your-production-domain.com
FRONTEND_URL=https://your-production-domain.com
APP_DOMAIN=https://your-production-domain.com

# Required - Security
ALLOWED_DOMAINS=your-production-domain.com,www.your-production-domain.com

# Required - LINE Configuration
LINE_CLIENT_ID=your-actual-line-client-id
LINE_CLIENT_SECRET=your-actual-line-client-secret

# Required - Auth
AUTH_SECRET=your-secure-auth-secret-min-32-chars
```

### Step 3: Update LINE Developers Console
1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Select your channel → **Login** > **App settings**
3. Add callback URLs (all variants):
   ```
   https://your-production-domain.com/api/auth/callback/line
   https://your-production-domain.com/api/auth/callback/line/
   https://www.your-production-domain.com/api/auth/callback/line
   https://www.your-production-domain.com/api/auth/callback/line/
   ```

### Step 4: Redeploy
```bash
git commit --allow-empty -m "Trigger deployment after LINE OAuth configuration fix"
git push origin fix/line-login-production
```

### Step 5: Verify Fix
After deployment, test the debug endpoint again:
```bash
curl https://your-production-domain.com/api/debug/line-oauth | jq '.security'
```

All `isSafe` values should be `true`.

---

## 🧪 Testing Checklist

- [ ] Debug endpoint returns all URLs as safe
- [ ] Callback URL matches LINE Developers Console exactly
- [ ] ALLOWED_DOMAINS includes production domain
- [ ] Click "Log in with LINE" button
- [ ] Login flow completes successfully
- [ ] User is redirected back to application
- [ ] Session is created correctly

---

## 🚨 Error Messages & Solutions

### Error: "Host not allowed"
**Cause**: `ALLOWED_DOMAINS` missing production domain
**Solution**: Add domain to `ALLOWED_DOMAINS` environment variable

### Error: "Invalid code" or OAuth error
**Cause**: Callback URL mismatch between app and LINE Console
**Solution**: Ensure exact match in LINE Developers Console

### Error: "State mismatch"
**Cause**: OAuth flow interrupted or expired
**Solution**: Already handled in code (`skipStateCookieCheck: true`), retry login

---

## 📝 Notes

- The application uses `better-auth` library for authentication
- LINE login state cookie check is disabled to support LINE app redirects
- URL validation is strict for security purposes
- Debug endpoint is available at `/api/debug/line-oauth`
