# เอกสาร Bun LINE T3

เอกสารชุดนี้ครอบคลุมระบบที่อยู่ใน repository ปัจจุบัน ลิงก์ด้านล่างชี้ไปยังไฟล์ Markdown ที่มีอยู่จริงในโครงการ

## เริ่มต้นและพัฒนา

- [ติดตั้งและตั้งค่าระบบ](./SETUP.md) — Bun, PostgreSQL, environment variables และการเริ่มแอป
- [คู่มือนักพัฒนา](./DEVELOPER_GUIDE.md) — โครงสร้างงาน คำสั่งพัฒนา lint และ workflow
- [สถาปัตยกรรม](./ARCHITECTURE.md) — routes, feature modules, data access และ runtime
- [API routes](./API.md) — รายการ API ปัจจุบันตามไฟล์ route
- [สารบัญเอกสารแบบย่อ](./DOCUMENTATION_INDEX.md)

## ปฏิบัติการและความปลอดภัย

- [Deploy และ CI](./DEPLOYMENT.md) — Docker, GitHub Actions, runner และข้อจำกัดที่ยืนยันแล้ว
- [ความปลอดภัย](./SECURITY.md) — ขอบเขตการยืนยันตัวตน การตรวจข้อมูล และการจัดการ secrets
- [Cron jobs](./CRON-JOBS.md) — schedule, endpoints และงานที่ระบบเรียกตามเวลา
- [Process management](./PROCESS_MANAGEMENT.md) — การตรวจ service และคำสั่ง operational ที่มีใน repository
- [Shared utilities](./SHARED-UTILITIES.md) — utilities ที่ใช้ข้ามโมดูล

## ฟีเจอร์

- [รายงานเข้าบริการหน้างาน](./ONSITE_REPORTS.md) — บริษัท รายงาน ผู้เข้าร่วม ลายเซ็น และ PDF
- [DCA tracking](./DCA.md) — DCA, การเชื่อม Bitkub และการนำเข้าประวัติซื้อ
- [Body Weight](./BODY_WEIGHT.md) — โปรไฟล์ การวัดน้ำหนัก และ BLE scale listener
- [Planning Poker](./PLANNING_POKER.md) — ห้องประเมินงาน ไพ่ บทบาท และข้อจำกัดของสถานะห้อง
- [รายรับรายจ่ายและงบประมาณ](./EXPENSE_TRACKING.md) — ภาพรวมการจัดการรายการและงบผ่าน LINE
- [คำสั่งรายรับรายจ่าย](./EXPENSE_QUICK_REF.md) — ตัวอย่างคำสั่ง LINE แบบย่อ
- [ปฏิทิน](./CALENDAR_SYSTEM.md) — ปฏิทิน desktop/mobile และการจัดการกิจกรรม
- [LINE AI command routing](./AI_COMMAND_ROUTING.md) — การส่งคำขอภาษาธรรมชาติไปยังคำสั่งที่ลงทะเบียน
- [การผูก LINE Login กับ LINE Bot](./LINE_ACCOUNT_LINKING.md) — แนวคิดการเชื่อมบัญชีและการอนุมัติ
- [ตั้งค่า LINE Login และ Bot channel](./LINE_LOGIN_BOT_CHANNEL_SETUP.md)
- [แก้ปัญหา LINE user ID](./LINE_USER_ID_DEBUG_GUIDE.md)
- [Bitkub DCA](./bitkub-dca.md)
- [Planning Poker visual effects](./PLANNING_POKER_FX.md)
- [Theme toggle](./THEME_TOGGLE_COMPONENT.md)
- [UI design system](./UI_DESIGN_SYSTEM.md)
- [ข้อความ AI สำหรับ check-in](./ai-checkin-messages.md)

## เอกสารอ้างอิงที่เป็น snapshot

- [งานวิจัยโมเดล AI วันที่ 2026-08-02](./AI_MODEL_RESEARCH_2026-08-02.md) — บันทึกตามวันที่จัดทำ ควรตรวจข้อมูลโมเดลและราคาใหม่ก่อนใช้ตัดสินใจ
- [API reference เดิม](./API_COMPLETE.md) — แจ้งสถานะและชี้ไปยัง API route inventory ที่ดูแลอยู่ใน `API.md`

## ดูแลเอกสาร

เมื่อเปลี่ยน route, feature, environment variable, script, migration หรือ workflow ให้ปรับเอกสารที่เกี่ยวข้องใน commit เดียวกัน ตรวจ local links ใน README และ `docs/` ก่อนส่ง review และอย่าใส่ค่า secret จริงในตัวอย่าง
