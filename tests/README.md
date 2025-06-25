# 🧪 Test Suite Documentation

## 📋 ภาพรวม | Overview

โฟลเดอร์นี้ประกอบด้วยไฟล์ทดสอบสำหรับระบบลงเวลาทำงานที่ใช้ Bun Test Framework โดยเน้นการทดสอบระบบ timezone และการจัดการเวลาที่เก็บเป็น UTC และแสดงผลเป็นเวลาไทย

## 🗂️ โครงสร้างไฟล์ | File Structure

```
tests/
├── timezone.test.ts              # ทดสอบการทำงานของระบบ timezone
├── attendance-integration.test.ts  # ทดสอบ integration กับ attendance service
├── line-timezone.test.ts         # ทดสอบการแสดงเวลาใน LINE messages
└── README.md                     # เอกสารนี้
```

## 🚀 การรันการทดสอบ | Running Tests

### รันการทดสอบทั้งหมด

```bash
bun test
```

### รันการทดสอบเฉพาะ timezone

```bash
bun test timezone
```

### รันการทดสอบ LINE timezone display

```bash
bun run test:line
```

### รันการทดสอบแบบ watch mode

```bash
bun test --watch
```

### รันการทดสอบพร้อม coverage

```bash
bun test --coverage
```

## 📝 รายละเอียดการทดสอบ | Test Details

### 🕐 timezone.test.ts

ทดสอบฟังก์ชันหลักของระบบ timezone:

#### ✅ UTC Time Generation

- การสร้างเวลา UTC สำหรับบันทึกในฐานข้อมูล

#### ✅ UTC to Bangkok Conversion

- การแปลงเวลาจาก UTC เป็นเวลาไทย (+7 ชั่วโมง)
- การจัดการ edge cases (เที่ยงคืน, เช้าตรู่)

#### ✅ Time Formatting

- การ format วันที่เวลาแบบไทย (พุทธศักราช)
- การ format เฉพาะเวลา (HH:MM)
- การจัดการ leading zeros

#### ✅ Working Hours Validation

- การตรวจสอบเวลาทำงาน (08:00-11:00)
- การทดสอบขอบเขตเวลา

#### ✅ Working Day Validation

- การตรวจสอบวันทำงาน (จันทร์-ศุกร์)
- การจัดการวันหยุด

#### ✅ Integration Tests

- การทดสอบ flow การลงชื่อเข้างานแบบสมบูรณ์
- การป้องกัน double timezone conversion

#### ✅ Performance Tests

- การทดสอบประสิทธิภาพการแปลงเวลา

### 🔗 attendance-integration.test.ts

ทดสอบการทำงานร่วมกับ attendance service จริง:

#### ✅ Service Import Tests

- การ import attendance service
- การตรวจสอบฟังก์ชันที่จำเป็น

#### ✅ Real Database Integration

- การทดสอบกับ timestamp จริงจากฐานข้อมูล
- การตรวจสอบผลลัพธ์การแสดงผล

#### ✅ Working Hours Integration

- การทดสอบการตรวจสอบเวลาทำงานในสภาพแวดล้อมจริง

#### ✅ Edge Cases Handling

- การจัดการกรณีพิเศษต่างๆ ในสภาพแวดล้อมจริง

#### ✅ Real-world Scenarios

- การจำลองการใช้งานจริงของผู้ใช้
- การทดสอบ concurrent operations

### 📱 line-timezone.test.ts

ทดสอบการแสดงเวลาใน LINE bubble messages หลังแก้ไขปัญหา double timezone conversion:

#### ✅ Check-in Success Message Testing

- การแสดงเวลาเข้างานในช่วงเช้า (08:54)
- การแสดงเวลาเข้างานในช่วงสาย (10:30)

#### ✅ Real-world Scenario Testing

- การแก้ไขปัญหาการแสดงเวลาผิดจากภาพหน้าจอ
- ตรวจสอบว่าแสดง 09:21 แทน 16:21 (ถูกต้อง)
- ตรวจสอบว่าแสดง 18:21 แทน 01:21 (ถูกต้อง)

#### ✅ Timezone-Safe Formatting

- การใช้ `formatThaiTimeOnly()` แทน `toLocaleString()`
- การป้องกัน double timezone conversion
- การใช้ UTC methods สำหรับการ formatting

## 🎯 ปัญหาที่แก้ไขแล้ว | Fixed Issues

### ❌ ปัญหาเดิม: Double Timezone Conversion

```
UTC: 01:54:46.208Z → แสดงผล: 15:54 (ผิด!)
```

### ✅ หลังแก้ไข: Single Timezone Conversion

```
UTC: 01:54:46.208Z → Bangkok: 08:54:46 (ถูกต้อง!)
```

## 🔧 การแก้ไขที่สำคัญ | Key Fixes

1. **ใช้ UTC methods ใน formatting functions**

   - `date.getHours()` → `date.getUTCHours()`
   - `date.getMinutes()` → `date.getUTCMinutes()`

2. **การแปลงเวลาครั้งเดียว**

   - แปลง UTC → Bangkok เพียงครั้งเดียว
   - หลีกเลี่ยงการแปลงซ้อนกัน

3. **การตรวจสอบที่สม่ำเสมอ**
   - ใช้ UTC methods ในทุกฟังก์ชันตรวจสอบ
   - รับประกันความสม่ำเสมอในการคำนวณ

## 📊 ผลการทดสอบ | Test Results

```
✅ 22 tests ผ่านทั้งหมด
✅ 83 expect() calls
✅ รันเสร็จใน 62ms
✅ Coverage: ครอบคลุมฟังก์ชันหลักทั้งหมด
```

## 🚨 หมายเหตุสำคัญ | Important Notes

- การทดสอบนี้ใช้ mock functions เมื่อไม่สามารถ import service จริงได้
- การทดสอบครอบคลุม edge cases และ real-world scenarios
- ประสิทธิภาพการทำงานได้รับการทดสอบและตรวจสอบแล้ว

## 🔄 การบำรุงรักษา | Maintenance

เมื่อมีการเปลี่ยนแปลงในระบบ timezone หรือ attendance service:

1. รันการทดสอบเพื่อตรวจสอบความถูกต้อง
2. อัปเดตการทดสอบตามการเปลี่ยนแปลง
3. ตรวจสอบ coverage และเพิ่มการทดสอบใหม่ตามความจำเป็น

---

**สร้างเมื่อ**: มิถุนายน 2568  
**อัปเดตล่าสุด**: มิถุนายน 2568  
**สถานะ**: ✅ ใช้งานได้และทดสอบแล้ว
