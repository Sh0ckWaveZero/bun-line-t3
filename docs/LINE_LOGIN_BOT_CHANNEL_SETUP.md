# ตั้งค่า LINE Login และ LINE Messaging API

ระบบใช้ credentials แยกตามการใช้งาน: Better Auth ใช้ LINE Login client credentials ส่วน webhook/bot ใช้ LINE Messaging API access token และ channel secret อย่าสรุปว่า ID จากสองเส้นทางจะตรงกันโดยอัตโนมัติจากการตั้งค่า channel เพียงอย่างเดียว; ตรวจค่าที่ระบบได้รับจริงและดู [คู่มือ account identity](./LINE_ACCOUNT_LINKING.md)

## ค่า environment ที่เกี่ยวข้อง

| ตัวแปร | ใช้สำหรับ |
| --- | --- |
| `LINE_CLIENT_ID` | LINE Login provider ใน Better Auth |
| `LINE_CLIENT_SECRET` | LINE Login provider ใน Better Auth |
| `LINE_CHANNEL_ACCESS` | ส่งข้อความผ่าน LINE Messaging API |
| `LINE_CHANNEL_SECRET` | ตรวจ `x-line-signature` ของ webhook |
| `LINE_MESSAGING_API` | Messaging API endpoint; ค่าในตัวอย่างคือ `https://api.line.me/v2/bot/message` |
| `LINE_GET_CONTENT` | Messaging API content endpoint |
| `APP_URL`, `FRONTEND_URL`, `APP_DOMAIN`, `ALLOWED_DOMAINS` | URL และ allowed origins ของแอป/auth |

กำหนด credentials ใน environment ของแต่ละ environment โดยใช้ test channel สำหรับ development และ staging แยกจาก production. เก็บค่าจริงใน secret manager หรือไฟล์ local ที่ไม่ commit.

## LINE Login setup

1. ตั้งค่า LINE Login provider ใน Better Auth ด้วย `LINE_CLIENT_ID` และ `LINE_CLIENT_SECRET`.
2. ตั้ง application URL และ trusted domains ให้ตรงกับ environment ของแอป.
3. กำหนด callback URL ใน LINE Developers Console ให้ตรงกับ Better Auth route ที่ใช้งานจริง (`/api/auth/*`). อย่าใช้ callback ตัวอย่างจากระบบรุ่นเก่าโดยไม่ตรวจ route/config ปัจจุบัน.
4. ทดสอบ login ผ่าน `/login` และยืนยันว่ามี `Account` record ที่ `providerId = "line"`.

## Bot setup

1. ตั้ง webhook URL เป็น `https://<app-domain>/api/line`.
2. ตั้ง `LINE_CHANNEL_SECRET` และ `LINE_CHANNEL_ACCESS` สำหรับ bot channel.
3. เปิด webhook ใน LINE Developers Console แล้วส่ง event ทดสอบ.
4. ตรวจว่าคำขอผ่าน signature validation ก่อน command handler ทำงาน.

## ตรวจสอบการอนุมัติและตัวตน

ผู้ใช้ LINE bot ครั้งแรกจะมี approval request ซึ่งแอดมินอนุมัติและกำหนด feature permissions ได้จากหน้า `/line-approval` และ `/admin/line-permissions`. LINE Login profile sync สร้าง/อัปเดต approval record ด้วย Login ID; ไม่มีการจับคู่ข้าม channel โดยดูจากชื่อหรือรูปโปรไฟล์.

ทดสอบ bot และ web ในบัญชี development แล้วตรวจเฉพาะว่า ID ที่ใช้แต่ละเส้นทางตรงกับข้อมูลที่คาดไว้หรือไม่ อย่าเผยแพร่ ID เต็ม, session cookie, access token หรือ webhook secret ใน logs/screenshots. ถ้า Login ID กับ Bot ID ไม่ตรงกัน การตั้งค่า channel อย่างเดียวไม่ได้สร้าง mapping ใน source ปัจจุบัน; ต้องออกแบบ/ตรวจ flow linking ก่อนพึ่งพาการแชร์ข้อมูลระหว่างสองเส้นทาง.

## Source map

- [`src/lib/auth/auth.ts`](../src/lib/auth/auth.ts) — Better Auth และ LINE Login provider
- [`src/routes/api/line.ts`](../src/routes/api/line.ts) — LINE webhook และ signature check
- [`src/features/line/services/approval.service.server.ts`](../src/features/line/services/approval.service.server.ts) — approval flow
- [LINE identity notes](./LINE_ACCOUNT_LINKING.md)
