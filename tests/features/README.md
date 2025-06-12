# 🎯 Features Tests

ทดสอบฟีเจอร์ต่างๆ ของระบบตามโดเมนธุรกิจ

## 📁 โครงสร้าง

- `air-quality/` - ทดสอบระบบตรวจสอบคุณภาพอากาศ
- `attendance/` - ทดสอบระบบลงเวลาทำงาน
- `auth/` - ทดสอบระบบการยืนยันตัวตนและสิทธิ์
- `crypto/` - ทดสอบระบบ cryptographic utilities
- `line/` - ทดสอบ LINE Bot integration
- `timestamp-tracker/` - ทดสอบระบบติดตามเวลา

## 🧪 การรัน Test

```bash
# รัน feature tests ทั้งหมด
bun test tests/features

# รัน test เฉพาะ feature
bun test tests/features/attendance
bun test tests/features/line
```

## 🔐 Security Features

ฟีเจอร์ที่เกี่ยวข้องกับความปลอดภัยจะได้รับการทดสอบอย่างละเอียด:
- Input validation และ sanitization
- Authentication และ authorization
- Cryptographic functions
- Session management
