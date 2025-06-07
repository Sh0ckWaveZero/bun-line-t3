# Vercel Cron Jobs Setup

> **✅ Implementation Status: Complete and Production Ready**

ระบบแจ้งเตือนอัตโนมัติสำหรับการลงชื่อออกงานบน Vercel ใช้ Vercel Cron Jobs ที่ทำงานตามตารางเวลาที่กำหนดไว้

การติดตั้งและการตั้งค่าทั้งหมดเสร็จสิ้นแล้ว พร้อมสำหรับการใช้งานจริง

## ความต้องการ

- Vercel Pro Plan หรือสูงกว่า (Cron Jobs ไม่รองรับใน Hobby plan)
- Environment variables ที่ตั้งค่าถูกต้อง

## การตั้งค่า

### 1. Environment Variables

ตั้งค่า environment variables ต่อไปนี้ใน Vercel Dashboard:

```bash
# Required for cron job security
CRON_SECRET=your-random-secret-string

# Other required variables (ถ้ายังไม่มี)
INTERNAL_API_KEY=your-internal-api-key
LINE_CHANNEL_ACCESS=your-line-channel-access-token
LINE_MESSAGING_API=https://api.line.me/v2/bot/message
DATABASE_URL=your-database-url
```

### 2. Cron Job Configuration

ไฟล์ `vercel.json` มีการกำหนด cron job:

```json
{
  "crons": [
    {
      "path": "/api/cron/checkout-reminder",
      "schedule": "30 16 * * 1-5"
    }
  ]
}
```

**ความหมายของ schedule:**
- `30 16 * * 1-5` = ทุกวันจันทร์-ศุกร์ เวลา 16:30 UTC
- เวลาไทย: 23:30 (UTC+7)

### 3. การปรับเวลา

หากต้องการเปลี่ยนเวลาแจ้งเตือน แก้ไข `schedule` ใน `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/checkout-reminder",
      "schedule": "30 9 * * 1-5"
    }
  ]
}
```

**ตัวอย่างเวลา:**
- `30 9 * * 1-5` = 16:30 เวลาไทย (09:30 UTC)
- `0 10 * * 1-5` = 17:00 เวลาไทย (10:00 UTC)
- `30 8 * * 1-5` = 15:30 เวลาไทย (08:30 UTC)

## การทำงาน

1. **Vercel Cron Scheduler** เรียก API endpoint `/api/cron/checkout-reminder` ตามเวลาที่กำหนด
2. **ระบบตรวจสอบ** user authentication ผ่าน `CRON_SECRET`
3. **ค้นหาพนักงาน** ที่เข้างานแล้วแต่ยังไม่ได้ออก
4. **ส่งข้อความแจ้งเตือน** ผ่าน LINE ไปยังพนักงานแต่ละคน
5. **บันทึก log** ผลการดำเนินการ

## การติดตาม

### Vercel Functions Log

ตรวจสอบ log ได้ที่:
1. Vercel Dashboard → Project → Functions
2. คลิกที่ function `/api/cron/checkout-reminder`
3. ดู Invocations และ Real-time logs

### Manual Testing

ทดสอบ cron job ได้โดยการเรียก API โดยตรง:

```bash
curl -X GET "https://your-domain.vercel.app/api/cron/checkout-reminder" \
  -H "Authorization: Bearer your-cron-secret"
```

## ข้อมูลเพิ่มเติม

### Timezone

- Vercel Cron Jobs ใช้ UTC timezone
- ต้องคำนวณเวลาไทย (UTC+7) ให้ถูกต้อง
- เวลาไทย 16:30 = UTC 09:30

### Limitations

- Cron jobs มีขีดจำกัดการทำงาน 10 วินาที (Hobby) หรือ 60 วินาที (Pro+)
- Maximum 12 cron jobs ต่อ project
- ต้องใช้ Vercel Pro plan ขึ้นไป

### Security

- ใช้ `CRON_SECRET` เพื่อป้องกันการเรียกใช้ที่ไม่ได้รับอนุญาต
- Vercel จะส่ง `Authorization: Bearer {CRON_SECRET}` header มาด้วย
- API จะตรวจสอบ header นี้ก่อนทำงาน

## การ Deploy

> **✅ Ready for Production Deployment**

1. Push code ไป GitHub repository
2. Vercel จะ deploy อัตโนมัติ
3. Cron job จะเริ่มทำงานทันทีหลัง deploy สำเร็จ
4. ตรวจสอบใน Vercel Dashboard ว่า cron job ถูกสร้างแล้ว

**การติดตั้งเสร็จสมบูรณ์**: ระบบพร้อมใช้งานทันทีหลังจาก deploy

## Troubleshooting

### Cron job ไม่ทำงาน
- ตรวจสอบว่าใช้ Vercel Pro plan
- ตรวจสอบ `CRON_SECRET` ใน environment variables
- ดู logs ใน Vercel Dashboard

### ข้อความไม่ถูกส่ง
- ตรวจสอบ LINE credentials
- ตรวจสอบ database connection
- ดู error logs ใน function invocations
