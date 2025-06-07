# LINE Work Attendance System

ระบบลงชื่อเข้างานผ่าน LINE Bot ที่รองรับการคำนวณเวลาทำงาน 9 ชั่วโมงอัตโนมัติ

## คุณสมบัติหลัก

### 1. 🟢 ลงชื่อเข้างาน (Check-In)
- บันทึกเวลาเข้างานแบบเรียลไทม์
- คำนวณเวลาเลิกงานอัตโนมัติ (บวก 9 ชั่วโมง)
- ป้องกันการลงชื่อซ้ำในวันเดียวกัน
- แสดงข้อมูลเวลาทำงานในรูปแบบ Bubble Message

### 2. 🔴 ลงชื่อออกงาน (Check-Out)
- บันทึกเวลาออกงานจริง
- คำนวณชั่วโมงทำงานที่แท้จริง
- แสดงสรุปการทำงานของวัน

### 3. 📊 ตรวจสอบสถานะ
- ดูสถานะการทำงานปัจจุบัน
- แสดงเวลาเข้างาน, เวลาเลิกงาน (คาดการณ์/จริง)
- แสดงจำนวนชั่วโมงทำงาน

## วิธีการใช้งาน

### ผ่านคำสั่งข้อความ (Text Commands)

#### 1️⃣ ลงชื่อเข้างาน
```
/work หรือ /งาน หรือ /เข้างาน หรือ /checkin
- เปิดเมนูระบบลงชื่อเข้างาน
```

#### 2️⃣ ลงชื่อออกงาน
```
/เลิกงาน หรือ /ออกงาน หรือ /checkout
- ลงชื่อออกงานทันที
```

#### 3️⃣ ตรวจสอบสถานะ
```
/สถานะ หรือ /status
- ตรวจสอบสถานะการทำงานวันนี้
```

#### 4️⃣ ดูรายงานการทำงาน
```
/รายงาน หรือ /report
- ดูรายงานการทำงานประจำเดือน
```

#### 5️⃣ ดูนโยบายการทำงาน
```
/นโยบาย หรือ /policy หรือ /กฎ หรือ /rule
- ดูนโยบายการทำงานและข้อมูลเวลาทำงาน
```

**หมายเหตุ:** สามารถดูคำสั่งทั้งหมดได้ที่เอกสาร [LINE_COMMANDS_THAI.md](./LINE_COMMANDS_THAI.md)

### ผ่านปุ่มใน Bubble Message
- **🟢 เข้างาน**: ลงชื่อเข้างาน
- **🔴 ออกงาน**: ลงชื่อออกงาน
- **📊 ดูสถานะการทำงาน**: ตรวจสอบสถานะปัจจุบัน

## Database Schema

### WorkAttendance Model
```prisma
model WorkAttendance {
    id            String    @id @default(auto()) @map("_id") @db.ObjectId
    userId        String    @map("user_id") @db.ObjectId
    checkInTime   DateTime  @map("check_in_time")
    checkOutTime  DateTime? @map("check_out_time")
    workDate      String    @map("work_date") // YYYY-MM-DD format
    status        String    @default("checked_in") // checked_in, checked_out
    createdAt     DateTime  @default(now()) @map("created_at")
    updatedAt     DateTime  @updatedAt @map("updated_at")
    user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@unique([userId, workDate])
    @@map("work_attendance")
}
```

## API Endpoints

### POST /api/attendance-push
ส่ง Push Message เกี่ยวกับระบบลงชื่อเข้างาน

#### Request Body
```json
{
  "userId": "LINE_USER_ID",
  "messageType": "checkin_menu" | "reminder" | "checkout_reminder"
}
```

#### Message Types
- `checkin_menu`: เมนูลงชื่อเข้างาน
- `reminder`: แจ้งเตือนให้ลงชื่อเข้างาน
- `checkout_reminder`: แจ้งเตือนให้ลงชื่อออกงาน

#### Example Usage
```bash
curl -X POST http://localhost:3000/api/attendance-push \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "U1234567890abcdef",
    "messageType": "checkin_menu"
  }'
```

## การทำงานของระบบ

### 1. การลงชื่อเข้างาน
```
เวลาเข้างาน: 09:00
เวลาเลิกงานคาดการณ์: 18:00 (บวก 9 ชั่วโมง)
สถานะ: กำลังทำงาน
```

### 2. การลงชื่อออกงาน
```
เวลาเข้างาน: 09:00
เวลาออกงานจริง: 17:30
ชั่วโมงทำงาน: 8 ชม. 30 นาที
สถานะ: ออกงานแล้ว
```

### 3. ข้อจำกัด
- ลงชื่อเข้างานได้เพียงครั้งเดียวต่อวัน
- ต้องลงชื่อเข้างานก่อนจึงจะลงชื่อออกงานได้
- ข้อมูลจะถูกจัดเก็บตาม User ID และวันที่

## ตัวอย่าง Bubble Messages

### Check-In Menu
![Check-In Menu](docs/checkin-menu.png)

### Check-In Success
![Check-In Success](docs/checkin-success.png)

### Work Status
![Work Status](docs/work-status.png)

### Check-Out Success
![Check-Out Success](docs/checkout-success.png)

## การติดตั้งและใช้งาน

### 1. Database Migration
```bash
npx prisma generate
npx prisma db push
```

### 2. Environment Variables
ตรวจสอบให้แน่ใจว่ามี environment variables ต่อไปนี้:
```
LINE_CHANNEL_ACCESS=your_line_channel_access_token
LINE_MESSAGING_API=https://api.line.me/v2/bot/message
DATABASE_URL=your_mongodb_connection_string
```

### 3. การทดสอบ
1. ส่งข้อความ `/work` ใน LINE Chat
2. กดปุ่ม "🟢 เข้างาน" เพื่อลงชื่อเข้างาน
3. ตรวจสอบสถานะด้วยคำสั่ง `/status`
4. ลงชื่อออกงานด้วยคำสั่ง `/checkout`

## การแจ้งเตือนอัตโนมัติ (Automated Reminders)

สามารถใช้ Cron Job หรือ Scheduler เพื่อส่งข้อความแจ้งเตือน:

### เตือนลงชื่อเข้างาน (เวลา 08:45)
```javascript
// ส่งไปยัง /api/attendance-push
{
  "userId": "USER_ID",
  "messageType": "reminder"
}
```

### เตือนลงชื่อออกงาน (เวลา 18:00)
```javascript
// ส่งไปยัง /api/attendance-push
{
  "userId": "USER_ID", 
  "messageType": "checkout_reminder"
}
```

## การปรับปรุงในอนาคต

- [ ] รายงานสรุปรายเดือน
- [ ] การตั้งค่าเวลาทำงานที่ยืดหยุ่น
- [ ] การจัดการวันหยุด
- [ ] ระบบอนุมัติการลา
- [ ] Dashboard สำหรับ HR
- [ ] การส่งออกข้อมูลเป็น Excel/PDF

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย
1. **ไม่สามารถลงชื่อเข้างานได้**: ตรวจสอบการลงทะเบียนผู้ใช้
2. **เวลาไม่ถูกต้อง**: ตรวจสอบ timezone setting (Asia/Bangkok)
3. **ข้อความไม่ส่ง**: ตรวจสอบ LINE Channel Access Token

### Log Debugging
```javascript
console.log('Attendance Debug:', {
  userId,
  checkInTime,
  expectedCheckOutTime,
  workDate
});
```
