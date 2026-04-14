# 🔧 LINE OAuth Production Fix - Complete Guide

## 🚨 ปัญหา
LINE OAuth ล้มเหลวเพราะ HTTP/HTTPS mismatch

```
requestUrl: "http://bun-line.midseelee.com/..." ❌
ควรจะเป็น:
requestUrl: "https://bun-line.midseelee.com/..." ✅
```

---

## ✅ วิธีแก้ไข (3 ขั้นตอน)

### 1️⃣ Deploy Code Changes

```bash
# Make deploy script executable
chmod +x scripts/deploy-oauth-fix.sh

# Run deployment
./scripts/deploy-oauth-fix.sh
```

หรือทำ manually:
```bash
git checkout main
git merge fix/line-login-production
git push origin main
```

### 2️⃣ Configure Nginx (CRITICAL!)

บน server production ของคุณ:

```bash
# 1. Copy nginx config
sudo cp nginx-bun-line.conf /etc/nginx/sites-available/bun-line.midseelee.com

# 2. Enable site
sudo ln -s /etc/nginx/sites-available/bun-line.midseelee.com /etc/nginx/sites-enabled/

# 3. Test configuration
sudo nginx -t

# 4. Reload nginx
sudo systemctl reload nginx
```

### 3️⃣ Verify Fix

หลัง deploy และ config nginx แล้ว:

```bash
# Check debug endpoint
curl https://bun-line.midseelee.com/api/debug/line-oauth | jq
```

ต้องได้:
```json
"requestUrl": "https://bun-line.midseelee.com/api/debug/line-oauth" ✅
```

ไม่ใช่:
```json
"requestUrl": "http://bun-line.midseelee.com/api/debug/line-oauth" ❌
```

---

## 🔍 ถ้ายังไม่ได้

### Check 1: Nginx Headers
```bash
curl -I https://bun-line.midseelee.com/api/debug/line-oauth
```

ต้องเห็น headers เหล่านี้:
```
X-Forwarded-Proto: https
X-Forwarded-Host: bun-line.midseelee.com
```

### Check 2: Docker Container Logs
```bash
docker logs bun-line-t3-app -f --tail=50
```

ดูว่ามี log เกี่ยวกับ X-Forwarded headers หรือไม่

### Check 3: Test LINE Login
1. ไปที่ https://bun-line.midseelee.com/login
2. กด "LINE Login"
3. Login ด้วย LINE
4. ต้อง redirect กลับมายัง application โดยไม่มี error

---

## 📝 สิ่งที่ Fix แล้ว:

✅ **server.ts** - Handle X-Forwarded headers from Nginx
✅ **src/lib/auth/auth.ts** - Enable secure cookies for production
✅ **nginx-bun-line.conf** - Nginx config template
✅ **scripts/deploy-oauth-fix.sh** - Deploy automation

---

## 🎯 Timeline:

- **Deploy**: 5-10 นาที (GitHub Actions)
- **Nginx Config**: 2 นาที
- **Verify**: 1 นาที
- **Total**: ~15 นาที

---

## 📞 ถ้ายังไม่ได้:

1. ส่งผลลัพธ์จาก `/api/debug/line-oauth` มา
2. ส่ง Nginx config มา
3. ส่ง Docker logs มา

จะช่วย debug ต่อได้เลยครับ! 🔧
