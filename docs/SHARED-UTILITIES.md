# Shared Utilities

เอกสารนี้สรุป utility ที่ใช้ร่วมกันใน API และงาน cron ปัจจุบัน โดยอิงจาก `src/lib/utils/` และ route ที่เรียกใช้งาน ตัวอย่างใช้ Web `Request`/`Response` ของ runtime ปัจจุบัน ไม่ใช่ `NextRequest` ของ Next.js รุ่นเก่า

## Cron authentication และ response

`src/lib/utils/cron-auth.ts` มีฟังก์ชันตรวจ `Authorization: Bearer <CRON_SECRET>` สองแบบ:

- `validateCronAuth(request)` คืน `{ success, error?, status? }` เพื่อให้ route สร้าง error response ต่อได้
- `validateSimpleCronAuth(authorizationHeader)` คืน boolean

ทั้งสองแบบเปรียบเทียบ token ด้วย `crypto.timingSafeEqual` หลังตรวจความยาวให้เท่ากัน หากไม่มี secret จะปฏิเสธคำขอ อย่าเขียน secret ลง log หรือ response

`src/lib/utils/cron-response.ts` มี response ที่ใช้ซ้ำได้:

- `createErrorResponse(error, status, details?)`
- `createSkippedResponse(message, holidayInfo?)`
- `createReminderSentResponse(messageText, sentUserCount, failedUserCount)`
- `createNoUsersResponse()`

ตัวอย่างรูปแบบ handler:

```ts
import { validateCronAuth } from "@/lib/utils/cron-auth";
import { createErrorResponse } from "@/lib/utils/cron-response";

export async function GET(request: Request) {
  const auth = validateCronAuth(request);
  if (!auth.success) {
    return createErrorResponse(auth.error ?? "Unauthorized", auth.status ?? 401);
  }

  return Response.json({ success: true });
}
```

ตรวจ route จริงก่อนเพิ่ม middleware เพราะแต่ละ cron อาจใช้รูปแบบ auth และ rate limit ต่างกัน

## Rate limiting

`src/lib/utils/rate-limiter.ts` มี `RateLimiter.checkCronRateLimit(request)` ซึ่งใช้ค่าเริ่มต้น 5 คำขอต่อ 60 วินาทีต่อ identifier ที่ประกอบจาก IP header และ User-Agent hash ตัวนับเก็บใน `Map` ของ process ปัจจุบัน จึงไม่แชร์ข้าม instance และไม่ใช่ distributed rate limiter มีบาง route ที่เรียก utility นี้ บาง route ไม่ได้เรียก

## Check-in reminder

Route `src/routes/api/cron/check-in-reminder.ts` ประกอบ utility เหล่านี้ตามลำดับ: rate limit, cron auth, ตรวจวันทำงาน, ตรวจช่วงเวลา, ส่งข้อความ และสร้าง response

- `validateReminderTime(date)` ใน `cron-time-validation.ts` อนุญาตทุกเวลาเมื่อ `APP_ENV` ไม่ใช่ `production`; ใน production ตรวจ `date.getHours()` ว่าอยู่ระหว่าง 1 ถึง 2 ตามที่โค้ดคาดหมายว่าเป็น UTC 01:00–02:59
- `validateWorkingDay(date)` ใน `cron-working-day.ts` เรียก `attendanceService.isWorkingDay` และขอข้อมูลวันหยุดจาก `holidayService` เมื่อไม่ใช่วันทำงาน
- `sendCheckInReminders(dateString)` ใน `cron-reminder-sender.ts` ดึง LINE user IDs ที่มีสิทธิ์รับ reminder สำหรับวันนั้น ถ้าไม่มี OpenAI key จะใช้ข้อความ fallback; ถ้ามีจะเรียกตัวสร้างข้อความที่รองรับบริบทเวลา วัน และสภาพอากาศ จากนั้นส่งข้อความเดียวกันเป็นชุด ชุดละไม่เกิน 5 ผู้ใช้ และนับผลสำเร็จ/ล้มเหลวแยกรายคน

`dateString` ที่ส่งให้ `sendCheckInReminders` ควรเป็นวันที่ของกรุงเทพฯ รูปแบบ `YYYY-MM-DD` ตาม route ที่เรียกใช้

## วันเวลา

`src/lib/utils/datetime.ts` มี helper ที่เกี่ยวข้องกับเวลาไทย เช่น:

- `getBangkokDateString(date?)` และ `getTodayDateString()` คืนวันที่ตาม timezone `Asia/Bangkok`
- `resolveAutoCheckoutTarget(now?)` คำนวณวันทำงานที่เพิ่งจบและเวลา checkout `23:59:59.999` ตาม offset `+07:00` สำหรับงาน auto-checkout
- `convertUTCToBangkok`, `formatThaiTime`, `formatThaiTimeOnly` และ `formatUTCTimeAsThaiTime` ใช้แปลงหรือจัดรูปแบบเวลาสำหรับแสดงผล

`Date` เก็บเวลาเป็น instant; ให้เลือก helper ตามรูปแบบข้อมูลและตรวจ caller ก่อนแปลงซ้ำ อย่าสมมติว่า `Date` ที่ผ่านการ format แล้วเป็น instant ใหม่ที่ใช้คำนวณได้โดยไม่ตรวจ timezone

## LINE messaging และรูปภาพกราฟ

`src/lib/utils/line-messaging.ts` มี helper สำหรับ Messaging API:

- `sendPushMessage(userId, messages)` ส่ง push message ด้วย LINE channel access token จาก environment
- `sendImageMessage(userId, imageUrl, previewUrl?)` ส่ง image message
- `createFlexCarousel(bubbleItems)` สร้าง Flex carousel
- `uploadImageToTemporaryHost(imageBuffer, filename?)` บันทึกภาพและ preview ใต้ `public/temp-charts` แล้วคืน URL ของแอป
- `sendChartImage(userId, chartBuffer, filename?)` อัปโหลดภาพและส่งเข้า LINE

ฟังก์ชันสำหรับอัปโหลดสร้างชื่อไฟล์ที่สุ่มและ sanitize ชื่อที่ระบุไว้ ทั้งนี้การเก็บไฟล์ยังอาศัย filesystem ของ instance; ตรวจ deployment/storage และงาน cleanup ใน [CRON-JOBS.md](./CRON-JOBS.md) ก่อนใช้กับระบบหลาย instance

อีกชุดหนึ่งคือ `src/lib/utils/line-push.ts` และ `src/lib/utils/line-utils.ts` ซึ่งมีหน้าที่/รูปแบบ input ต่างกัน อย่าสลับ import โดยดูจากชื่อ `sendPushMessage` อย่างเดียว ให้ยึด caller และชนิดข้อมูลของแต่ละ utility

## ขอบเขตเอกสาร

รายการนี้ครอบคลุม utility ที่อธิบายด้านบน ไม่ใช่ catalog ครบทุกไฟล์ใน `src/lib/utils/` และไม่ได้ยืนยันว่าทุก helper ถูกใช้ใน production ตรวจ `rg` ของ caller และ source ก่อนพึ่งพาฟังก์ชันที่ไม่ได้กล่าวถึง เอกสาร API และ feature อยู่ที่ [API](./API.md), [Onsite Reports](./ONSITE_REPORTS.md), [DCA](./DCA.md) และ [Body Weight](./BODY_WEIGHT.md)
