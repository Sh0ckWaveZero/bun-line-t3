# 🚀 GitHub Actions Deployment with GitHub Secrets

> **✅ การปรับปรุงเสร็จสิ้น**: ระบบ deployment ได้รับการปรับปรุงให้ใช้ GitHub Secrets แทนไฟล์ `.env.prod` บน runner อย่างปลอดภัย

## 📋 สรุปการเปลี่ยนแปลง

### 🔄 ไฟล์ที่ได้รับการปรับปรุง

1. **`.github/workflows/deploy.yml`** (ใหม่/แทนที่)
   - ✅ Multi-job workflow: security-check → deploy → monitor → verify
   - ✅ GitHub Secrets validation และ system resource checks
   - ✅ สร้าง `.env.prod` จาก GitHub Secrets แบบ dynamic
   - ✅ Security cleanup ด้วย `shred` command
   - ✅ Comprehensive health checks และ monitoring
   - ✅ Manual deployment trigger พร้อม options

2. **`docker-compose.yml`** (ปรับปรุง)
   - ✅ Environment variables override สำหรับ production
   - ✅ รองรับการใช้ GitHub Secrets แทนไฟล์ .env.prod
   - ✅ Fallback ไปยัง .env.prod ถ้าไม่มี environment variables

3. **`docs/SELF_HOSTED_RUNNER_SETUP.md`** (มีอยู่แล้ว)
   - ✅ คู่มือการตั้งค่า self-hosted runner บน Raspberry Pi
   - ✅ Security configuration และ monitoring setup

4. **`docs/GITHUB_SECRETS_SETUP.md`** (มีอยู่แล้ว)
   - ✅ คู่มือการตั้งค่า GitHub Secrets อย่างละเอียด
   - ✅ รายการ secrets ที่จำเป็นพร้อมคำอธิบาย

5. **`scripts/generate-github-secrets.ts`** (มีอยู่แล้ว)
   - ✅ สคริปต์สำหรับสร้าง secrets อัตโนมัติ
   - ✅ Cryptographically secure random generation

## 🔐 Required GitHub Secrets

### 📝 รายการ Secrets ที่จำเป็น

| Secret Name | คำอธิบาย | ตัวอย่าง |
|-------------|----------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb://user:pass@host:27017/db` |
| `NEXTAUTH_URL` | Application base URL | `https://your-domain.com` |
| `NEXTAUTH_SECRET` | NextAuth.js session secret | *Auto-generated* |
| `LINE_CHANNEL_SECRET` | LINE Bot channel secret | `your-line-channel-secret` |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Bot access token | `your-line-access-token` |
| `AIRVISUAL_API_KEY` | AirVisual API key | `your-airvisual-key` |
| `CMC_API_KEY` | CoinMarketCap API key | `your-cmc-key` |
| `ENCRYPTION_KEY` | Data encryption key | *Auto-generated* |
| `HMAC_SECRET` | HMAC signing secret | *Auto-generated* |
| `PORT` | Application port (optional) | `12914` |

## 🚀 วิธีการใช้งาน

### 1. 📋 เตรียม GitHub Secrets

```bash
# สร้าง secrets อัตโนมัติ
bun run scripts/generate-github-secrets.ts generate

# ดูรายการ secrets ที่จำเป็น
bun run scripts/generate-github-secrets.ts info

# ตรวจสอบ .env.prod ปัจจุบัน
bun run scripts/generate-github-secrets.ts validate
```

### 2. 🔧 ตั้งค่า GitHub Secrets

1. ไปที่ **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**
2. คลิก **"New repository secret"**
3. เพิ่ม secrets ทั้งหมดตามรายการข้าง
4. ตรวจสอบว่าทุก secret ถูกตั้งค่าถูกต้อง

### 3. 🏃‍♂️ ติดตั้ง Self-hosted Runner (ถ้าต้องการ)

```bash
# ดูคู่มือ setup runner
cat docs/SELF_HOSTED_RUNNER_SETUP.md
```

### 4. 🚀 Deploy Application

#### Auto Deployment (Push to main/production)
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

#### Manual Deployment
1. ไปที่ **GitHub Repository** → **Actions**
2. เลือก **"🚀 Deploy to Production"**
3. คลิก **"Run workflow"**
4. เลือก options ตามต้องการ:
   - **Force rebuild**: บังคับ rebuild Docker images
   - **Skip health checks**: ข้าม health checks (สำหรับ emergency)
   - **Environment**: เลือก target environment

## 🔍 การ Monitor และ Troubleshooting

### 📊 การดู Logs

```bash
# GitHub Actions logs
# ดูใน GitHub Repository → Actions → เลือก workflow run

# Self-hosted runner logs (บน Pi)
sudo journalctl -u github-runner -f

# Application logs
docker-compose logs -f

# System monitoring
~/monitor-runner.sh
```

### 🔧 การแก้ไขปัญหา

#### 1. **Missing Secrets Error**
```
❌ Missing required secrets: DATABASE_URL, NEXTAUTH_SECRET
```
**แก้ไข**: ตั้งค่า GitHub Secrets ที่ขาดหายไป

#### 2. **Build Failed - Memory Issues**
```
❌ Build failed: Out of memory
```
**แก้ไข**: 
- เพิ่ม swap space บน Raspberry Pi
- ใช้ manual trigger พร้อม force rebuild

#### 3. **Health Check Failed**
```
❌ Application health check failed
```
**แก้ไข**:
- ตรวจสอบ application logs
- ตรวจสอบว่า port 12914 เปิดใช้งาน
- ตรวจสอบ database connectivity

#### 4. **Runner Offline**
```
Runner is offline or not responding
```
**แก้ไข**:
```bash
sudo systemctl restart github-runner
~/monitor-runner.sh
```

## 🛡️ Security Features

### 🔐 Enhanced Security

1. **Secrets Validation**: ตรวจสอบ secrets ทั้งหมดก่อน deployment
2. **Dynamic Environment File**: สร้าง `.env.prod` จาก GitHub Secrets
3. **Secure Cleanup**: ใช้ `shred` command ลบไฟล์ sensitive
4. **Resource Monitoring**: ตรวจสอบ system resources
5. **Multi-layer Health Checks**: ตรวจสอบ application และ services

### 🔒 Security Best Practices

- ✅ **ไม่มีไฟล์ .env.prod บน runner**: สร้างแบบ dynamic จาก GitHub Secrets
- ✅ **Secrets rotation**: ง่ายต่อการเปลี่ยน secrets ผ่าน GitHub UI
- ✅ **Audit trail**: บันทึกการ deployment ใน GitHub Actions logs
- ✅ **Limited permissions**: GitHub Actions ใช้ permissions แบบจำกัด
- ✅ **Secure cleanup**: ลบข้อมูลสำคัญหลัง deployment

## 📈 Performance Optimizations

### 🍓 Raspberry Pi Specific

1. **Memory Management**: จำกัด memory usage ของ containers
2. **Build Optimization**: ใช้ build cache และ multi-stage builds
3. **Resource Limits**: กำหนด CPU และ memory limits
4. **Auto Cleanup**: ลบ unused images และ volumes อัตโนมัติ

## 🎯 Next Steps

### 📋 สิ่งที่ต้องทำ

1. **ตั้งค่า GitHub Secrets** ใน repository settings
2. **ติดตั้ง self-hosted runner** (ถ้าต้องการใช้ Raspberry Pi)
3. **ทดสอบ deployment** ด้วย manual trigger
4. **Monitor logs** และปรับแต่งตามต้องการ

### 🔮 Future Enhancements

1. **Notification System**: เพิ่มการแจ้งเตือนผ่าน LINE Notify
2. **Multi-environment Support**: รองรับ staging และ production
3. **Rollback Mechanism**: ระบบ rollback อัตโนมัติ
4. **Performance Metrics**: เก็บและแสดงผล performance metrics

---

## 📞 Support

หากพบปัญหาหรือมีคำถาม:

1. ตรวจสอบ logs ใน GitHub Actions
2. ดูคู่มือใน `docs/` directory
3. ใช้ monitoring scripts บน Raspberry Pi
4. ตรวจสอบ GitHub Secrets configuration

**🎉 การ deployment ด้วย GitHub Secrets เสร็จสิ้น - ปลอดภัยและมีประสิทธิภาพมากขึ้น!**
