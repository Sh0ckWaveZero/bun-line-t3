# 🔐 GitHub Secrets Configuration Guide

> **🛡️ Security-First Approach**: คู่มือการตั้งค่า GitHub Secrets สำหรับ deployment ที่ปลอดภัย

## 📋 สารบัญ

1. [การตั้งค่า GitHub Secrets](#การตั้งค่า-github-secrets)
2. [Required Secrets List](#required-secrets-list)
3. [การสร้าง Environment Variables](#การสร้าง-environment-variables)
4. [การตรวจสอบและ Troubleshooting](#การตรวจสอบและ-troubleshooting)
5. [Security Best Practices](#security-best-practices)

---

## 🔐 การตั้งค่า GitHub Secrets

### 📍 ขั้นตอนการเพิ่ม Secrets

1. **เข้าสู่ GitHub Repository**
   - ไปที่ repository ของคุณ
   - คลิก **Settings** tab

2. **เข้าไปที่ Secrets การตั้งค่า**
   - ใน sidebar คลิก **Secrets and variables**
   - เลือก **Actions**

3. **เพิ่ม Repository Secrets**
   - คลิก **New repository secret**
   - เพิ่ม secrets ตาม list ด้านล่าง

---

## 📝 Required Secrets List

> **⚠️ สำคัญ**: ต้องตั้งค่า secrets ทั้ง 16 รายการนี้ใน GitHub Repository Settings

### 🗄️ Database Configuration

| Secret Name | Description | Example/Format |
|-------------|-------------|----------------|
| `DATABASE_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |

### 🔐 Authentication & Security

| Secret Name | Description | Format/Length |
|-------------|-------------|---------------|
| `NEXTAUTH_URL` | Application base URL | `https://your-domain.com` |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Random string 32+ characters |
| `JWT_SECRET` | JWT signing secret | Random string 32+ characters |
| `INTERNAL_API_KEY` | Internal API authentication | 64-character hex string |
| `CRON_SECRET` | Cron job authentication | 64-character hex string |

### 📱 LINE Integration (4 Secrets)

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `LINE_CLIENT_ID` | LINE Login Client ID | LINE Developers Console > Login Channel |
| `LINE_CLIENT_SECRET` | LINE Login Client Secret | LINE Developers Console > Login Channel |
| `LINE_LOGIN_CHANNEL_ID` | LINE Login Channel ID | LINE Developers Console > Login Channel |
| `LINE_LOGIN_CHANNEL_SECRET` | LINE Login Channel Secret | LINE Developers Console > Login Channel |

### 🤖 LINE Messaging API (2 Secrets)

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `LINE_CHANNEL_ACCESS` | LINE Messaging API Access Token | LINE Developers Console > Messaging API |
| `LINE_CHANNEL_SECRET` | LINE Messaging API Channel Secret | LINE Developers Console > Messaging API |

### 🌐 External API Keys (3 Secrets)

| Secret Name | Description | Provider | Required |
|-------------|-------------|----------|----------|
| `AIRVISUAL_API_KEY` | Air quality monitoring | AirVisual/IQAir | Yes |
| `CMC_API_KEY` | Cryptocurrency data | CoinMarketCap | Yes |
| `OPENAI_API_KEY` | OpenAI API for AI features | OpenAI | Yes |

### 🔧 Optional Configuration

| Secret Name | Description | Default Value |
|-------------|-------------|---------------|
| `PORT` | Application port | `12914` |

---

## 🛠️ วิธีสร้าง Security Secrets

### 🔐 การสร้าง Random Secrets ด้วย Command Line

```bash
# สำหรับ NEXTAUTH_SECRET และ JWT_SECRET
openssl rand -base64 32

# สำหรับ INTERNAL_API_KEY และ CRON_SECRET  
openssl rand -hex 32

# ตัวอย่าง output:
# Base64: "Jg5qK8+2vN9LJn3z4xP7wQ2sF6hR1mT8eD9yB5cA3="
# Hex: "24cf31f7dcf3a2ab3d46b5f2e0a3115383146d927485daf506d8d395265d98c2"
```

### 🤖 การสร้างด้วย Bun Script (แนะนำ)

```bash
# ใช้ script ที่เราสร้างไว้
bun run generate:github-secrets

# หรือ
npm run generate:github-secrets
```

---

## 🔧 การสร้าง Environment Variables

### 📋 Complete Secrets Checklist

ตรวจสอบให้แน่ใจว่าคุณมี secrets ทั้งหมดนี้:

- [ ] `DATABASE_URL`
- [ ] `NEXTAUTH_URL`  
- [ ] `NEXTAUTH_SECRET`
- [ ] `LINE_CHANNEL_SECRET`
- [ ] `LINE_CHANNEL_ACCESS_TOKEN`
- [ ] `AIRVISUAL_API_KEY` (optional)
- [ ] `CMC_API_KEY` (optional)
- [ ] `ENCRYPTION_KEY`
- [ ] `HMAC_SECRET`

### 🎯 Development vs Production

**Development Environment:**
```bash
# สำหรับ local development
NEXTAUTH_URL="http://localhost:12914"
DATABASE_URL="mongodb://localhost:27017/bun-line-t3-dev"
```

**Production Environment:**
```bash
# สำหรับ production deployment
NEXTAUTH_URL="https://your-domain.com"
DATABASE_URL="mongodb://production-host:27017/bun-line-t3-prod"
```

---

## 🔍 การตรวจสอบและ Troubleshooting

### ✅ การทดสอบ Secrets

1. **ตรวจสอบใน GitHub Actions**
   - ไปที่ **Actions** tab
   - ดูใน **Security & Validation Checks** job
   - ตรวจสอบ output ของ step "Validate GitHub Secrets"

2. **ข้อผิดพลาดที่พบบ่อย**

**ERROR: Required secret not found**
```
❌ ERROR: DATABASE_URL secret ไม่พบ!
```
**แก้ไข:** เพิ่ม secret ใน repository settings

**ERROR: Invalid format**
```
❌ ERROR: Invalid DATABASE_URL format
```
**แก้ไข:** ตรวจสอบ connection string format

### 🔧 Debug Commands

**ตรวจสอบ Environment Variables ใน container:**
```bash
# เข้าไปใน running container
docker exec -it bun-line-t3-app sh

# ตรวจสอบ env vars (อย่าทำใน production!)
env | grep -E "(DATABASE|NEXTAUTH|LINE)" | head -5
```

**⚠️ WARNING:** อย่าแสดง secrets ใน production logs!

---

## 🛡️ Security Best Practices

### 🔐 Secrets Management Guidelines

1. **Never Commit Secrets to Git**
   - ใช้ `.gitignore` สำหรับ `.env*` files
   - ใช้ GitHub Secrets แทน hardcoding

2. **Rotate Secrets Regularly**
   - เปลี่ยน secrets ทุก 3-6 เดือน
   - ใช้ strong random generation

3. **Limit Access**
   - เฉพาะ repository admins ที่สามารถดู secrets
   - ใช้ environment-specific secrets เมื่อจำเป็น

4. **Monitor Usage**
   - ตรวจสอบ deployment logs เป็นประจำ
   - ติดตาม unusual access patterns

### 🔍 Security Validation

GitHub Actions workflow จะตรวจสอบ:
- ✅ Secrets availability
- ✅ Format validation  
- ✅ No hardcoded secrets in code
- ✅ Secure file permissions

### 📊 Security Monitoring

**ควรตรวจสอบเป็นประจำ:**
- GitHub Actions logs
- Failed deployment attempts
- Secret access patterns
- Container security updates

---

## 🚀 Example Workflow Usage

เมื่อตั้งค่า secrets เสร็จแล้ว workflow จะ:

1. **Validate Secrets** - ตรวจสอบว่ามี required secrets
2. **Create .env.prod** - สร้างไฟล์จาก secrets อย่างปลอดภัย
3. **Deploy Application** - รัน docker-compose ด้วย environment ที่ถูกต้อง
4. **Cleanup** - ลบ sensitive files หลัง deployment

### 📋 Generated .env.prod Structure

```bash
# Generated automatically from GitHub Secrets
DATABASE_URL="mongodb://..."
NEXTAUTH_URL="https://..."
NEXTAUTH_SECRET="..."
LINE_CHANNEL_SECRET="..."
LINE_CHANNEL_ACCESS_TOKEN="..."
AIRVISUAL_API_KEY="..."
CMC_API_KEY="..."
NODE_ENV="production"
PORT="12914"
ENCRYPTION_KEY="..."
HMAC_SECRET="..."
LOG_LEVEL="info"
ENABLE_METRICS="true"
```

---

## 🆘 Emergency Procedures

### 🚨 Compromised Secrets

หาก secrets ถูกเปิดเผย:

1. **ลบ secrets ทันที** จาก GitHub repository
2. **เปลี่ยน passwords/keys** ทั้งหมดที่เกี่ยวข้อง
3. **สร้าง secrets ใหม่** ด้วย random generation
4. **ตรวจสอบ logs** หา unauthorized access
5. **Re-deploy** ด้วย secrets ใหม่

### 🔄 Secret Rotation Process

```bash
# 1. สร้าง secrets ใหม่
./scripts/generate-secrets.ts

# 2. อัปเดตใน GitHub Secrets
# (ทำผ่าน GitHub web interface)

# 3. Re-deploy
git push origin main  # Trigger deployment
```

---

**🔐 Security Note**: อย่าลืมใช้ strong, unique secrets และเปลี่ยนเป็นประจำเพื่อความปลอดภัยสูงสุด!
