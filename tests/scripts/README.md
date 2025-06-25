# 📜 Scripts Tests

ทดสอบ automation scripts และ utilities

## 📁 โครงสร้าง

Scripts tests สำหรับทดสอบ:

- `checkout-reminder.ts` - ระบบแจ้งเตือนออกงานอัตโนมัติ
- `generate-secrets.ts` - ระบบสร้าง secrets ที่ปลอดภัย
- `health-check.sh` - Health monitoring scripts
- และ scripts อื่นๆ

## 🧪 การรัน Test

```bash
# รัน scripts tests ทั้งหมด
bun test tests/scripts
```

## ⚙️ Testing Focus

- **Automation Logic**: ทดสอบ logic ของ automated processes
- **Error Handling**: ทดสอบการจัดการ error ใน scripts
- **Security**: ทดสอบความปลอดภัยของ secret generation
- **Integration**: ทดสอบการทำงานร่วมกับ external systems
