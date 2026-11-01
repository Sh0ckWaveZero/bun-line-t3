# ติดตั้งและตั้งค่า

คู่มือนี้อิงกับ Bun, TanStack Start, Prisma 7 และ PostgreSQL ที่ใช้ใน repository ปัจจุบัน

## สิ่งที่ต้องมี

- Bun 1.4.4 stable สำหรับติดตั้งและรันแอป
- PostgreSQL และ database URL ที่แอปเข้าถึงได้
- Git
- LINE Developers credentials หากจะใช้ LINE Login หรือ LINE bot

## ติดตั้ง

```bash
git clone <repository-url>
cd bun-line-t3
bun install
cp .env.example .env
```

กำหนด environment variables ก่อนเรียก Prisma หรือเริ่มแอป ใน `.env` ควรตรวจตัวแปรใน `src/env.mjs` และตั้งค่าอย่างน้อย `DATABASE_URL`, `APP_URL`, `FRONTEND_URL`, `AUTH_SECRET`, `APP_DOMAIN`, `ALLOWED_DOMAINS`, LINE credentials และ CoinMarketCap credentials ตาม validation ของแอป ค่า `AUTH_SECRET` ต้องยาวอย่างน้อย 32 ตัวอักษร และค่า URL ต้องเป็น URL ที่ถูกต้อง

หากตัวอย่าง environment file มีตัวแปร legacy หรือบริการที่คุณไม่ได้ตั้งค่า ให้ตรวจ source of truth ใน [`src/env.mjs`](../src/env.mjs) และ [`docker-compose.yml`](../docker-compose.yml); อย่ากำหนดค่าที่ไม่ได้ใช้เพียงเพราะมีชื่ออยู่ในไฟล์ตัวอย่าง

ตัวแปรเสริมที่เปิดใช้ความสามารถเฉพาะ ได้แก่:

- `OPENAI_API_KEY` และ `MCP_AI_MODEL` สำหรับการเรียก AI
- `BITKUB_CREDENTIAL_ENCRYPTION_KEY` สำหรับจัดเก็บ Bitkub credentials ที่เข้ารหัส เป็น 64 ตัวอักษร hex และต้องคงเดิมเพื่อถอดรหัสข้อมูลเดิม
- `SCALE_WEBHOOK_SECRET` สำหรับ webhook และ BLE scale listener
- `CRON_SECRET` สำหรับ cron integration

ไม่ใส่ค่าจริงของ secrets ลงใน git หรือ client-side configuration

## ตั้งค่าฐานข้อมูล

Prisma CLI อ่าน `.env.local` และ `.env` ผ่าน [`prisma.config.ts`](../prisma.config.ts). สร้าง/ปรับ migration สำหรับ development ด้วย:

```bash
bun run db:migrate
```

เพื่อ apply migrations ที่ commit ไว้และ generate Prisma Client:

```bash
bun run db:deploy
```

`bun run db:push` ใช้สำหรับทดลอง schema ในเครื่องเท่านั้น ไม่ใช้แทน migration ใน production. ใช้ `bun run db:studio` เพื่อเปิด Prisma Studio

## เริ่มแอป

```bash
bun run dev
```

Development server ใช้ `http://localhost:4325`. ถ้าเริ่มระบบแล้วเจอ environment validation error ให้แก้ค่าตามชื่อ field และเงื่อนไขใน `src/env.mjs`; อย่าปิด validation เพื่อซ่อนค่าที่ขาด

## ตรวจการเปลี่ยนแปลง

```bash
bun check
bun test
bun run format:check
bun run build
```

Bun 1.4.4 stable ที่ใช้รันแอปไม่มี built-in linter. ใช้ Bun 1.4.4 canary เวอร์ชันที่ pin ไว้กับ Bun linter:

```bash
bunx --package bun@1.4.4-canary.20261031.1 bun lint
```

ดูขั้นตอนเพิ่มเติมใน [คู่มือนักพัฒนา](./DEVELOPER_GUIDE.md) และ [คู่มือ deploy](./DEPLOYMENT.md)
