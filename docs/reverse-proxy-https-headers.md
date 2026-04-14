# 🌐 Reverse Proxy HTTPS Headers Configuration

## 🚨 Problem

Application receives requests as `http://` but environment expects `https://`, causing OAuth callbacks to fail.

## ✅ Solution: Configure Reverse Proxy to Send HTTPS Headers

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name bun-line.midseelee.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # 🔒 HTTPS Headers (REQUIRED for OAuth)
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_redirect off;
    }
}
```

### Caddy Configuration

```caddyfile
bun-line.midseelee.com {
    reverse_proxy localhost:3000 {
        # WebSocket support
        header_up Upgrade {http_upgrade}
        header_up Connection "upgrade"
    }
}

# Caddy automatically sets X-Forwarded-* headers correctly
```

### Cloudflare Workers (Vercel Edge)

If using Cloudflare in front of Vercel, make sure:
1. **SSL/TLS** is set to "Full (strict)"
2. Enable "Forwarding URLs" -> "Automatic HTTPS rewrites"

### Docker Compose

```yaml
services:
  app:
    environment:
      - TRUST_PROXY=true  # Trust X-Forwarded-* headers
      - APP_URL=https://bun-line.midseelee.com
```

## 🔍 Verification

After updating reverse proxy config, check:

```bash
curl https://bun-line.midseelee.com/api/debug/line-oauth
```

Should return `"requestUrl": "https://bun-line.midseelee.com/..."` instead of `http://`
