# 🕛 ระบบลงชื่อออกงานอัตโนมัติตอนเที่ยงคืน

## 🎯 วัตถุประสงค์

สร้างระบบที่จะลงชื่อออกงานอัตโนมัติตอนเที่ยงคืน (00:00) สำหรับพนักงานที่ลืมลงชื่อออกงาน เพื่อป้องกันปัญหา:
- การคำนวณชั่วโมงทำงานที่ผิดพลาด
- ข้อมูลการเข้างานที่ไม่สมบูรณ์
- ความยุ่งยากในการจัดทำรายงาน

## 🛠️ การทำงานของระบบ

### 1. Cron Job Schedule
```cron
# ลงชื่อออกงานอัตโนมัติตอนเที่ยงคืน (00:00) ทุกวัน
0 0 * * * curl -H "Authorization: Bearer $CRON_SECRET" http://app:12914/api/cron/auto-checkout
```

### 2. API Endpoint
- **URL**: `/api/cron/auto-checkout`
- **Method**: GET
- **Authentication**: x-api-key header
- **Schedule**: ทุกวัน 00:00 (Asia/Bangkok)

### 3. กระบวนการทำงาน

#### ขั้นตอนที่ 1: ค้นหาผู้ใช้ที่ต้องลงชื่อออกอัตโนมัติ
- ใช้ `attendanceService.getUsersWithPendingCheckout()`
- ค้นหาพนักงานที่เข้างานแล้วแต่ยังไม่ออกงาน

#### ขั้นตอนที่ 2: ลงชื่อออกงานอัตโนมัติ
- ตั้งเวลาออกงานเป็น 00:00 ของวันถัดไป
- อัปเดต status เป็น `AUTO_CHECKOUT_MIDNIGHT`
- คำนวณชั่วโมงทำงานรวม

#### ขั้นตอนที่ 3: ส่งแจ้งเตือน
- ส่งข้อความแจ้งเตือนผ่าน LINE
- แจ้งให้ทราบว่ามีการลงชื่อออกอัตโนมัติ
- แสดงสรุปเวลาทำงาน

## 💾 โครงสร้างข้อมูล

### Prisma Schema Update
```prisma
enum AttendanceStatusType {
  CHECKED_IN_ON_TIME
  CHECKED_IN_LATE
  CHECKED_OUT
  AUTO_CHECKOUT_MIDNIGHT  // 🆕 เพิ่มใหม่
}

model WorkAttendance {
  id           String               @id @default(auto()) @map("_id") @db.ObjectId
  userId       String               @map("user_id") @db.ObjectId
  checkInTime  DateTime             @map("check_in_time")
  checkOutTime DateTime?            @map("check_out_time")
  workDate     String               @map("work_date")
  status       AttendanceStatusType @default(CHECKED_IN_ON_TIME)
  // ...
}
```

## 📱 การแจ้งเตือน

### ข้อความที่ส่งให้ผู้ใช้
```
🕛 แจ้งเตือนการลงชื่อออกงานอัตโนมัติ

เนื่องจากคุณลืมลงชื่อออกงาน ระบบจึงลงชื่อออกให้อัตโนมัติตอนเที่ยงคืน

📅 วันที่: [วันที่]
🕐 เข้างาน: [เวลา] น.
🕛 ออกงาน: 00:00 น. (อัตโนมัติ)
⏱️ รวม: [X.XX] ชั่วโมง

💡 หากมีข้อผิดพลาด กรุณาติดต่อ HR เพื่อแก้ไข
```

## 🔧 การติดตั้งและทดสอบ

### 1. อัปเดต Database Schema
```bash
cd /path/to/project
bunx prisma generate
bunx prisma db push
```

### 2. ทดสอบ API Endpoint
```bash
# ใช้สคริปต์ทดสอบ
bun run scripts/test-auto-checkout.ts

# หรือเรียก API โดยตรง
curl -H "x-api-key: YOUR_API_KEY" \
     http://localhost:4325/api/cron/auto-checkout
```

### 3. ตรวจสอบ Cron Job
```bash
# ดู crontab
docker exec <cron-container> crontab -l

# ตรวจสอบ timezone
docker exec <cron-container> date

# ดู logs
docker logs <cron-container> -f
```

## 📊 การตรวจสอบและ Monitoring

### 1. Response Format
```json
{
  "success": true,
  "message": "ลงชื่อออกงานอัตโนมัติเสร็จสิ้น: 3 คน",
  "summary": {
    "processed": 5,
    "successful": 3,
    "failed": 0,
    "skipped": 2
  },
  "results": [
    {
      "userId": "user123",
      "status": "success",
      "checkInTime": "2024-01-15T01:30:00.000Z",
      "autoCheckoutTime": "2024-01-16T00:00:00.000Z",
      "workingHours": "22.50"
    }
  ]
}
```

### 2. การตรวจสอบผลการทำงาน
- ตรวจสอบ logs ใน cron container
- ตรวจสอบข้อมูลใน database
- ติดตามการส่งข้อความ LINE

## ⚠️ ข้อควรระวัง

### 1. ความถูกต้องของเวลา
- ต้องมั่นใจว่า timezone ถูกต้อง (Asia/Bangkok)
- ตรวจสอบการคำนวณชั่วโมงทำงาน
- ระวังปัญหา daylight saving time

### 2. ข้อมูลที่อาจผิดพลาด
- พนักงานที่ทำงานข้ามวัน (night shift)
- วันหยุดพิเศษหรือวันลา
- การเข้างานหลายครั้งในวันเดียวกัน

### 3. การแจ้งเตือน
- ตรวจสอบว่า LINE token ยังใช้งานได้
- จัดการกรณีที่ส่งข้อความไม่สำเร็จ
- หลีกเลี่ยงการส่งซ้ำ

## 🔄 การบำรุงรักษา

### 1. การติดตาม (Monitoring)
- ตั้งการแจ้งเตือนเมื่อ cron job ไม่ทำงาน
- ตรวจสอบสถิติการใช้งานประจำเดือน
- บันทึก error logs สำหรับการวิเคราะห์

### 2. การปรับปรุง
- เพิ่มกฎพิเศษสำหรับแผนกต่างๆ
- ปรับเวลา auto checkout ตามนโยบายบริษัท
- เพิ่มการยืนยันก่อน auto checkout

### 3. การ Backup
- สำรองข้อมูล attendance ก่อนการอัปเดต
- เก็บ logs การทำงานของ auto checkout
- มีแผนการ rollback หากเกิดปัญหา

## 📅 Schedule ทั้งหมด

| เวลา | กิจกรรม | คำอธิบาย |
|------|---------|----------|
| **17:30** | แจ้งเตือนออกงาน | เตือนพนักงานให้ลงชื่อออก |
| **00:00** | Auto Checkout | ลงชื่อออกงานอัตโนมัติสำหรับคนที่ลืม |

## 🚀 การ Deploy

### Development
```bash
# เริ่มต้นระบบ
docker-compose up --build

# ทดสอบ endpoint
bun run scripts/test-auto-checkout.ts
```

### Production
```bash
# Deploy ผ่าน CI/CD
git add .
git commit -m "เพิ่มระบบ auto checkout ตอนเที่ยงคืน"
git push origin main
```
