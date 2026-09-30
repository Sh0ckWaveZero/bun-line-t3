# การ deploy production

GitHub Actions รันบน self-hosted runner เมื่อ push เข้า `main` หรือ `production` และเรียกด้วยมือได้ผ่าน `workflow_dispatch` โดยทุกการ deploy รอคิวเดียวกัน

## สิ่งที่ runner ต้องมี

- Docker Engine, Docker Compose ที่รองรับ `up --wait --wait-timeout` และ BuildKit secrets จาก environment (Compose 2.19 ขึ้นไป)
- network `yadom` ที่สร้างไว้แล้ว และการเชื่อมต่อ PostgreSQL
- GitHub repository secrets ตามรายการ `env` ใน `.github/workflows/deploy.yml` โดย `PORT` ใช้ 12914 หากไม่กำหนด และ `ADMIN_LINE_USER_IDS` เป็นค่าเสริม
- พื้นที่และหน่วยความจำเพียงพอสำหรับสร้าง image บน Raspberry Pi

## ลำดับการทำงาน

1. ตรวจ secrets และ Compose โดยไม่พิมพ์ค่าลับ และไม่สร้าง `.env.prod`
2. เก็บ image ID ของ app และ cron ที่ใช้อยู่จริงไว้ด้วย tag สำหรับ rollback
3. สร้าง app, cron และ migration image ด้วย tag ของ commit และรอบ workflow
4. รัน Prisma CLI ที่ติดตั้งจาก lockfile ใน migration image ด้วย `migrate deploy` หากล้มเหลวจะหยุดก่อนเปลี่ยนบริการ
5. ใช้ Compose เปลี่ยนบริการและรอทั้ง app และ cron ผ่าน health check แล้วตรวจ HTTP จาก runner อีกครั้ง โดย `/api/health` ตรวจ PostgreSQL ด้วย `SELECT 1` และคืน 503 หากฐานข้อมูลหรือ environment ไม่พร้อม
6. หากขั้นตอนเปลี่ยนบริการล้มเหลว จะกลับไปใช้ image เดิมเมื่อมีครบสองบริการ โดย workflow ยังรายงานล้มเหลว

Compose ยังต้องหยุด container เดิมระหว่างสร้างตัวแทน จึงมีช่วงหยุดบริการสั้น ๆ ขั้นตอนนี้ไม่ได้รับรองการ deploy แบบไม่หยุดบริการ

## ข้อจำกัดและการกู้คืน

- Rollback คืนเฉพาะ image ใช้ configuration และ secrets ของรอบปัจจุบัน และไม่ย้อน schema หรือข้อมูลใน PostgreSQL ต้องเขียน migration ให้รองรับแอปรุ่นเดิมและสำรองฐานข้อมูลก่อน migration ที่เปลี่ยนหรือลบข้อมูล
- การ deploy ครั้งแรกไม่มี image เดิมให้กู้คืน หากผิดพลาดให้ตรวจสถานะด้วย `docker compose ps` บน runner และแก้สาเหตุก่อนรันใหม่
- หาก migration ล้มเหลว ให้ตรวจสถานะ migration และทำตามขั้นตอนแก้ไขของ Prisma ก่อน retry ห้ามเปลี่ยนเป็น `db push`
- ไม่มีการ prune volume หรือ image อัตโนมัติ เพื่อเก็บข้อมูลและ image สำหรับกู้คืน จัดการพื้นที่บน runner แยกต่างหาก
- ตัวเลือก staging เดิมถูกนำออก เพราะ Compose ใช้ชื่อ container, port และ network ของ production ชุดเดียว หากต้องการ staging ต้องแยก configuration และ runner ให้ชัดเจนก่อน
- เมื่อรัน Compose โดยตรง ต้องรัน migration image ก่อนและกำหนด `RUN_MIGRATIONS=false` ให้ app; runtime image ไม่มี Prisma CLI และจะหยุดหากขอให้รัน migration ตอนเปิดแอป

เอกสารอ้างอิง: [Docker Compose up](https://docs.docker.com/reference/cli/docker/compose/up/) และ [Prisma migrate deploy](https://www.prisma.io/docs/orm/v7/prisma-client/deployment/deploy-database-changes-with-prisma-migrate)

## Base image

ใช้ `oven/bun:1.4.2-slim` สำหรับ build, production dependencies และ runtime ทั้งหมด โดย migration สืบทอดจาก build ใช้ Debian และติดตั้ง Cairo/Pango พร้อม font สำหรับวาดกราฟและข้อความไทย ไม่บังคับ build stage เป็น BUILDPLATFORM เพื่อให้ native dependencies ตรงกับ target architecture

ยังไม่ตรึง digest เนื่องจากต้องทดสอบ image จริงบน runner ก่อน ส่วน cron ใช้ Alpine แยกต่างหากและไม่ได้คัดลอก native dependencies จากแอป

## Raspberry Pi 4 RAM 4 GB

ปลายทางใช้ Linux 64 บิตบน ARM กำหนด `platform: linux/arm64` ให้ทุก service และกำหนด `COMPOSE_PARALLEL_LIMIT=1` เพื่อให้ Compose build ทีละ service ลดการใช้ RAM พร้อมกัน โดยไม่เพิ่ม memory limit ของ app (1.5 GB) และ cron (512 MB)

การ build ยังใช้หน่วยความจำร่วมกับบริการเดิมที่กำลังรัน ค่า `NODE_OPTIONS` จำกัด heap ของ Node.js แต่ไม่ได้จำกัดหน่วยความจำทั้งหมดของ Bun หรือ native compiler ต้องตรวจ peak memory บน runner จริงก่อนยืนยันว่า RAM เพียงพอ
