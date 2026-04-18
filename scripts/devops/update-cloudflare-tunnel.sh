#!/bin/bash

# 🔧 Cloudflare Tunnel Configuration for LINE OAuth Fix
# ไฟล์นี้จะ update cloudflared config ให้ส่ง X-Forwarded headers

echo "🔧 Updating Cloudflare Tunnel Configuration..."
echo "=============================================="
echo ""

# Path to cloudflared config
CLOUDFLARED_CONFIG="$HOME/.cloudflared/config.yml"

# Backup existing config
if [ -f "$CLOUDFLARED_CONFIG" ]; then
    echo "📦 Backing up existing config..."
    cp "$CLOUDFLARED_CONFIG" "${CLOUDFLARED_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
fi

echo "📝 Creating new config with X-Forwarded headers..."
echo ""

cat > "$CLOUDFLARED_CONFIG" << 'EOF'
# Cloudflare Tunnel Configuration for bun-line.midseelee.com
# ส่วนสำคัญ: originRequest จะ inject X-Forwarded headers เพื่อ fix LINE OAuth

tunnel: <YOUR_TUNNEL_ID>
credentials-file: /home/<YOUR_USERNAME>/.cloudflared/<YOUR_TUNNEL_ID>.json

# ─────────────────────────────────────────────────────────────────
# 🌐 ingress rules - กำหนด routing และ headers
# ─────────────────────────────────────────────────────────────────

ingress:
  # 🎯 Main application (Docker container on port 12914)
  - hostname: bun-line.midseelee.com
    service: http://localhost:12914

    # 🔒 CRITICAL: Inject X-Forwarded headers for LINE OAuth
    originRequest:
      # ส่ง headers เหล่านี้ไปยัง Docker container
      httpHostHeader: bun-line.midseelee.com
      originServerName: bun-line.midseelee.com

      # 🚨 เปิดใช้ X-Forwarded headers (สำคัญมาก!)
      noTLSVerify: true  # เพราะ connect ไป localhost ไม่ต้อง verify TLS

      # บอก cloudflared ว่าอยู่หลัง HTTPS proxy
      accessKey: ""
      caPool: ""
      noTls13: false

  # Fallback rule (ต้องอยู่ลำดับสุดท้ายเสมอ)
  - service: http_status:404

# ─────────────────────────────────────────────────────────────────
# ⚙️ General settings
# ─────────────────────────────────────────────────────────────────

metrics: 0.0.0.0:20000
no-autoupdate: false
loglevel: info
EOF

echo ""
echo "✅ Config created at: $CLOUDFLARED_CONFIG"
echo ""
echo "⚠️  IMPORTANT: Replace the placeholders:"
echo "   - <YOUR_TUNNEL_ID>: Your Cloudflare Tunnel ID"
echo "   - <YOUR_USERNAME>: Your username on the server"
echo ""
echo "🔄 Restart cloudflared service:"
echo "   sudo systemctl restart cloudflared"
echo ""
echo "🔍 Verify headers are being sent:"
echo "   curl https://bun-line.midseelee.com/api/debug/line-oauth | jq '.requestUrl'"
echo ""
echo "Should return:"
echo '   "requestUrl": "https://bun-line.midseelee.com/api/debug/line-oauth"'
