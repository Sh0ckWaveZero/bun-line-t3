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

### 3. ⏰ การแจ้งเตือนอัตโนมัติ (Automated Reminder)
- แจ้งเตือนเมื่อใกล้ถึงเวลาเลิกงานหากยังไม่ได้เช็คเอาท์
- ส่งข้อความเตือนเฉพาะผู้ใช้ที่ลงชื่อเข้างานในวันนั้น
- แสดงข้อมูลเวลาเข้างานและจำนวนชั่วโมงที่ทำงานไปแล้ว
- ตั้งเวลาการแจ้งเตือนได้ (ค่าเริ่มต้น: 16:30 น. ทุกวันจันทร์-ศุกร์)

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

### การลงชื่อเข้างานช่วงเช้าตรู่ (00:01-07:59)
```
เวลาเข้างาน: บันทึกเวลาจริงที่มาถึง (เช่น 01:30)
เวลาเลิกงาน: กำหนดเป็น 17:00 น.
สถานะ: กำลังทำงาน
```

### 2. การลงชื่อออกงาน
```
เวลาเข้างาน: 09:00
เวลาออกงานจริง: 17:30
ชั่วโมงทำงาน: 8 ชม. 30 นาที
สถานะ: ออกงานแล้ว
```

### 3. นโยบายการทำงาน
- **วันทำงาน**: จันทร์-ศุกร์ (ไม่รวมวันหยุดราชการ)
- **เวลาทำงานปกติ**: 08:00-11:00 (เริ่มงาน) กับเวลาเลิกงาน +9 ชั่วโมง
- **เวลาทำงานช่วงเช้าตรู่**: 00:01-07:59 บันทึกเวลาจริง แต่เลิกงาน 17:00
- **ชั่วโมงทำงาน**: 9 ชั่วโมงต่อวัน (รวมพักกลางวัน 1 ชั่วโมง)

### 4. ข้อจำกัด
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

### ✓ การปรับปรุงล่าสุด (มิถุนายน 2025)
- [x] **ลงเวลาช่วงเช้าตรู่**: รองรับการลงเวลาเข้างานช่วง 00:01-07:59 น. โดยบันทึกเวลาจริงที่มาถึง แต่กำหนดเวลาออกเป็น 17:00 น.
- [x] **ปรับปรุงข้อความแจ้งเตือน**: แสดงข้อความแจ้งเตือนที่ชัดเจนสำหรับการลงเวลาช่วงเช้าตรู่

### 📋 แผนการพัฒนาต่อไป
- [ ] **รายงานสรุปรายเดือน**: รายงานสรุปการทำงานประจำเดือนพร้อมกราฟวิเคราะห์
- [ ] **การตั้งค่านโยบายเวลาทำงาน**: ให้ผู้ดูแลระบบสามารถปรับเปลี่ยนนโยบายเวลาทำงานได้
- [ ] **การลงเวลาแบบ GPS**: ตรวจสอบตำแหน่งที่ลงเวลาเพื่อความแม่นยำ
- [ ] **การลงเวลาด้วยการสแกนใบหน้า**: เพิ่มความปลอดภัยในการยืนยันตัวตน
- [ ] **ระบบอนุมัติการลา**: ผู้ใช้สามารถส่งคำขอลาผ่าน LINE
- [ ] **Dashboard สำหรับ HR**: หน้าจอการบริหารจัดการสำหรับฝ่าย HR
- [ ] **การจัดการวันหยุดยืดหยุ่น**: ระบบจัดการวันหยุดพิเศษและวันหยุดส่วนตัว
- [ ] **การส่งออกข้อมูล**: ส่งออกรายงานเป็นรูปแบบ Excel, PDF หรือ CSV
- [ ] **การแจ้งเตือนอัตโนมัติ**: แจ้งเตือนเมื่อชั่วโมงทำงานไม่ครบตามนโยบาย

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
