# 🔧 Vercel Deployment Fix for LINE OAuth

## Problem
LINE OAuth fails because Vercel isn't forwarding headers correctly.

## ✅ Solution

### Step 1: Update Vercel Configuration

The `vercel.json` file has already been created in the project root.

### Step 2: Redeploy

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy to production
vercel --prod
```

### Step 3: Verify Headers

After deployment, check:
```
https://bun-line.midseelee.com/api/debug/line-oauth
```

Should show:
```json
"requestUrl": "https://bun-line.midseelee.com/api/debug/line-oauth" ✅
```

### Step 4: Configure LINE Platform

Make sure LINE Developers Console has:
```
Callback URL: https://bun-line.midseelee.com/api/auth/callback/line
```

---

## 🚨 If Still Not Working

If after redeploying, `requestUrl` is still `http://`, you may need to add headers in Vercel:

Create/Update `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/api/auth/(.*)",
      "headers": [
        {
          "key": "X-Forwarded-Proto",
          "value": "https"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/:path*"
    }
  ]
}
```

Then redeploy again.
