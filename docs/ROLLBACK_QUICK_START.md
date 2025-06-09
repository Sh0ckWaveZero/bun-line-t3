# 🔄 Quick Start Guide: Rollback Deployment System

## 🚀 การใช้งานระบบ Rollback

### 📋 ขั้นตอนการ Deploy ด้วย Rollback Protection

#### 1. 🔄 Push Code to Repository
```bash
git add .
git commit -m "feat: Add new feature with rollback protection"
git push origin main
```

#### 2. 📱 Monitor Deployment ผ่าน GitHub Actions
- ไปที่ **Actions** tab ใน GitHub repository
- ดูขั้นตอนการ deployment real-time
- ระบบจะทำ rollback อัตโนมัติหาก deployment ล้มเหลว

#### 3. ✅ Verification Steps หลัง Deployment

```bash
# ตรวจสอบสถานะ containers
docker-compose ps

# ทดสอบ application health
curl http://localhost:4325/api/health

# ดู logs หากมีปัญหา
docker-compose logs --tail=50
```

## 🛠️ Manual Rollback (Emergency)

### หาก GitHub Actions ล้มเหลวทั้งหมด:

```bash
# 1. หยุดบริการปัจจุบัน
docker-compose down

# 2. ดู backups ที่มี
ls -la /tmp/backup-*

# 3. โหลด backup ล่าสุด
docker load -i /tmp/backup-[TIMESTAMP]/current-images.tar

# 4. เริ่มบริการใหม่
docker-compose up -d

# 5. ตรวจสอบว่าทำงาน
curl http://localhost:4325/api/health
```

## 🔧 Manual Deployment (ถ้าต้องการ)

### Force Rebuild:
1. ไปที่ **Actions** → **Deploy to Production**
2. คลิก **Run workflow**
3. เลือก **Force rebuild Docker images**: ✅
4. คลิก **Run workflow**

### Skip Health Checks (Emergency):
⚠️ **ใช้เฉพาะกรณีฉุกเฉิน**
1. ไปที่ **Actions** → **Deploy to Production**
2. คลิก **Run workflow**  
3. เลือก **Skip health checks**: ✅
4. คลิก **Run workflow**

## 📊 Monitoring & Troubleshooting

### ✅ การตรวจสอบสถานะระบบ

```bash
# สถานะ containers
docker-compose ps

# การใช้ทรัพยากร
docker stats --no-stream

# ดู logs ล่าสุด
docker-compose logs --tail=100 --follow

# ตรวจสอบ network connectivity
curl -v http://localhost:4325/api/health
```

### ❌ การแก้ไขปัญหาที่พบบ่อย

#### ปัญหา: Container ไม่เริ่มงาน
```bash
# ดู error logs
docker-compose logs

# ลบ containers เก่าและเริ่มใหม่
docker-compose down
docker-compose up -d --force-recreate
```

#### ปัญหา: Database connection failed
```bash
# ตรวจสอบ environment variables
cat .env | grep DATABASE_URL

# ทดสอบ database connectivity
docker-compose exec app bun prisma db pull
```

#### ปัญหา: Port already in use
```bash
# หา process ที่ใช้ port
lsof -i :4325

# หยุด process
sudo kill -9 [PID]

# เริ่ม services ใหม่
docker-compose up -d
```

## 📞 Emergency Contacts

### กรณีที่ระบบไม่ทำงาน:

1. **ตรวจสอบ GitHub Actions logs** ก่อน
2. **ลอง manual rollback** ตามขั้นตอนข้างต้น
3. **ถ้ายังไม่ได้** ให้ดู logs และ error messages
4. **กรณีฉุกเฉิน** ให้ติดต่อทีมพัฒนา

## 🔐 Security Notes

- ✅ **ไม่แชร์ environment variables** หรือ secrets
- ✅ **ใช้ HTTPS** สำหรับการเข้าถึงจากภายนอก
- ✅ **ตรวจสอบ logs** หา suspicious activities
- ✅ **Update dependencies** เป็นประจำ

---

💡 **Tip**: GitHub Actions จะทำ rollback อัตโนมัติ ดังนั้นไม่ต้องกังวลเรื่อง downtime!
