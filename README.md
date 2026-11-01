# Bun LINE T3

เว็บแอปและ LINE bot สำหรับจัดการงานประจำวัน สร้างด้วย Bun, React และ TanStack Start ใช้ PostgreSQL ผ่าน Prisma และรองรับการทำงานใน Docker

## ฟีเจอร์

- **ลงเวลาทำงานและลา** — check-in/check-out, รายงานเวลา, วันหยุด และคำขอลา
- **LINE bot** — คำสั่งงานประจำวัน การอนุมัติผู้ใช้ และการเชื่อมบัญชี LINE Login กับ LINE Messaging API
- **รายรับรายจ่าย** — บันทึกและสรุปรายการ หมวดหมู่ และงบประมาณ
- **คริปโตและ DCA** — ดูราคา เชื่อม Bitkub จัดการรายการ DCA นำเข้า/ส่งออกข้อมูล และดูสรุปพอร์ต
- **ปฏิทิน** — ดูและจัดการกิจกรรม พร้อมมุมมองมือถือ
- **รายงานเข้าบริการหน้างาน** — จัดการรายงาน ผู้ร่วมงาน การดำเนินการต่อ บริษัท และลายเซ็น พร้อมแสดงตัวอย่างและส่งออก PDF
- **Subscriptions** — จัดการบริการ สมาชิก และการชำระเงิน
- **น้ำหนักและสุขภาพ** — บันทึกน้ำหนักและจัดการการเชื่อมต่อเครื่องชั่งที่รองรับ
- **Planning Poker** — ห้องประเมินงานและสรุปผลการโหวต
- **ดูแลระบบและเครื่องมือ** — dashboard ตรวจสอบระบบ งาน cron, Thai ID และเครื่องมือช่วยเหลืออื่น

รายละเอียดและขอบเขตของแต่ละส่วนดูได้ใน [สารบัญเอกสาร](./docs/README.md)

## โครงสร้างระบบ

```text
src/
├── routes/             # TanStack Router pages และ API handlers
├── features/           # โมดูลแยกตามโดเมน เช่น expenses, calendar, onsite-report
├── components/         # UI components ที่ใช้ร่วมกัน
├── hooks/              # React hooks ที่ใช้ร่วมกัน
└── lib/                # auth, database, validation และ utilities
prisma/                 # Prisma schema และ migrations
scripts/                # งานดูแลระบบและเครื่องมือพัฒนา
docs/                   # คู่มือติดตั้ง ระบบ ฟีเจอร์ และปฏิบัติการ
```

หน้าเว็บอยู่ใน `src/routes/`; ส่วนการทำงานของแต่ละโดเมนอยู่ใน `src/features/<domain>/`. API อยู่ใน `src/routes/api/` และเรียกใช้ service ของฟีเจอร์ตามความเหมาะสม

## เริ่มต้นพัฒนา

ต้องมี Bun, PostgreSQL และค่า environment ที่แอปต้องใช้ ดู `.env.example` เป็นตัวอย่างตั้งต้น และตรวจชื่อตัวแปรกับเงื่อนไขที่ใช้งานจริงใน [`src/env.mjs`](./src/env.mjs) ขั้นตอนโดยละเอียดอยู่ใน [คู่มือติดตั้ง](./docs/SETUP.md)

```bash
bun install
cp .env.example .env
# กำหนด DATABASE_URL และ secrets ที่จำเป็นใน .env
bun run db:deploy
bun run dev
```

แอป dev ใช้ `http://localhost:4325`. การใช้ `db:deploy` จะ apply migrations ที่มีอยู่และ generate Prisma Client; ใช้ `db:push` เฉพาะการทดลอง schema ในเครื่อง

## คำสั่งพัฒนา

| งาน | คำสั่ง |
| --- | --- |
| Dev server | `bun run dev` |
| Build | `bun run build` |
| Preview build | `bun run start` |
| เริ่ม server bundle | `bun run start:prod` |
| ตรวจ TypeScript | `bun check` |
| Tests | `bun test` |
| Format | `bun run format` |
| ตรวจ format | `bun run format:check` |
| Prisma migrations สำหรับ dev | `bun run db:migrate` |
| Apply migrations และ generate client | `bun run db:deploy` |
| Generate Prisma Client | `bun run db:generate` |

### Lint และ pre-commit

กฎของ Bun linter อยู่ใน `bunfig.toml`. Bun 1.4.4 stable ที่ใช้รันแอปในปัจจุบันไม่มีคำสั่ง built-in linter ดังนั้นให้รัน lint ด้วย canary ที่ pin ไว้:

```bash
bunx --package bun@1.4.4-canary.20261031.1 bun lint
```

Lefthook ติดตั้ง pre-commit hook ระหว่าง `bun install`; หากข้ามการติดตั้ง ให้ใช้ `bunx lefthook install`. Hook lint เฉพาะไฟล์ JS/TS ที่ staged ด้วย canary เวอร์ชันเดียวกัน

GitHub Actions มี workflow lint แยกจาก runner production และข้าม PR จาก fork. Workflow เลือก runner labels `self-hosted`, `linux`, `ARM64`, `lint-isolated`; ยังต้อง provision runner ที่มี label นี้ก่อน งานจึงจะถูกรัน และงานที่ถูก skip ไม่ได้ยืนยันว่า lint ผ่าน ดูข้อกำหนดใน [คู่มือ deploy](./docs/DEPLOYMENT.md#แยก-runner-สำหรับ-lint)

## เอกสาร

- [สารบัญเอกสาร](./docs/README.md)
- [ติดตั้งและกำหนดค่า](./docs/SETUP.md)
- [คู่มือนักพัฒนา](./docs/DEVELOPER_GUIDE.md)
- [สถาปัตยกรรม](./docs/ARCHITECTURE.md)
- [API routes](./docs/API.md)
- [ความปลอดภัย](./docs/SECURITY.md)
- [Deploy และ CI](./docs/DEPLOYMENT.md)
- [LINE bot และ AI routing](./docs/AI_COMMAND_ROUTING.md)
- [รายงานเข้าบริการหน้างาน](./docs/ONSITE_REPORTS.md)

## เทคโนโลยีหลัก

- Bun runtime, package manager และ test runner
- React 19, TanStack Start, TanStack Router และ Vite
- TypeScript, Tailwind CSS และ Radix UI
- PostgreSQL, Prisma 7 และ Zod
- Better Auth สำหรับการยืนยันตัวตน และ LINE Messaging API สำหรับ bot
- Docker Compose และ GitHub Actions สำหรับ deploy
