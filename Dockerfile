# Dockerfile สำหรับ Bun + Next.js + Prisma

# ---- Base Stage ----
# ใช้ Bun image เป็น base
FROM oven/bun:1 AS base
WORKDIR /app

# ---- Dependencies Stage ----
# ติดตั้ง dependencies เท่านั้นใน layer นี้
# เพื่อให้ Docker cache layer นี้ได้ ถ้า dependencies ไม่เปลี่ยนแปลง
FROM base AS deps
WORKDIR /app

# คัดลอกไฟล์ที่จำเป็นสำหรับการติดตั้ง dependencies
COPY package.json bun.lockb ./
COPY prisma ./prisma/

# ติดตั้ง dependencies ด้วย Bun
# Bun จะรัน postinstall script (prisma generate) โดยอัตโนมัติ
RUN bun install --frozen-lockfile

# ---- Builder Stage ----
# สร้าง production build
FROM base AS builder
WORKDIR /app

# คัดลอก dependencies ที่ติดตั้งแล้วจาก deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# คัดลอกโค้ดที่เหลือของแอปพลิเคชัน
COPY . .

# คัดลอก .env.prod สำหรับ build time environment variables
# Next.js ต้องการ environment variables ใน build time สำหรับ validation
COPY .env.prod .env

# สร้าง Next.js production build
# BUN_ENV=production เพื่อให้แน่ใจว่า build สำหรับ production
ENV NODE_ENV=production
RUN bun run build

# ลบไฟล์ .env หลังจาก build เสร็จเพื่อความปลอดภัย
# ไฟล์นี้จะไม่ถูกคัดลอกไปยัง runtime stage
RUN rm -f .env

# ---- Runner Stage ----
# สร้าง image สุดท้ายที่เล็กและพร้อมสำหรับ production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# คัดลอกไฟล์ build จาก builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json # Next.js standalone ต้องการ package.json

# Prisma Client files (ถ้าจำเป็นต้องใช้ใน runtime โดยตรง)
# โดยทั่วไป Next.js standalone build จะ bundle สิ่งที่จำเป็น
# แต่ถ้ามีปัญหา runtime เกี่ยวกับ Prisma ให้ uncomment ส่วนนี้
# COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# COPY --from=builder /app/prisma ./prisma

# ตั้งค่า PORT (Next.js standalone จะใช้ PORT environment variable)
# Default port, จะถูก override ด้วยค่าจาก .env.prod ผ่าน docker-compose
ENV PORT 12914
EXPOSE 12914

# คำสั่งสำหรับรันแอปพลิเคชัน
# ใช้ "bun run start" หรือ "node server.js" ขึ้นอยู่กับ output ของ standalone
# Next.js standalone สร้าง server.js ในไดเรกทอรี standalone
CMD ["node", "server.js"]
