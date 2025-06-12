# 🔌 API Tests

ทดสอบ API endpoints ทั้งหมดของระบบ

## 📁 โครงสร้าง

- `attendance/` - ทดสอบ API การลงเวลา
- `attendance-export/` - ทดสอบ API การส่งออกข้อมูล
- `attendance-push/` - ทดสอบ API Push notifications
- `attendance-report/` - ทดสอบ API รายงาน
- `auth/` - ทดสอบ API การยืนยันตัวตน
- `checkout-reminder/` - ทดสอบ API การแจ้งเตือนออกงาน
- `cron/` - ทดสอบ API Cron jobs
- `debug/` - ทดสอบ API การ debug
- `health/` - ทดสอบ API Health checks
- `line/` - ทดสอบ API LINE Bot
- `timestamp-tracker/` - ทดสอบ API การติดตามเวลา

## 🧪 การรัน Test

```bash
# รัน API tests ทั้งหมด
bun test tests/api

# รัน test เฉพาะ feature
bun test tests/api/attendance
```
