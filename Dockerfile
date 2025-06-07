# Dockerfile สำหรับ Bun + Next.js + Prisma Production
# 🛡️ Security-First Docker Build ปรับปรุงจากแนวทางที่ work
# เลียนแบบ Node.js Alpine pattern แต่ใช้ Bun แทน

###################
# BUILD FOR PRODUCTION
###################
FROM oven/bun:1-alpine AS build

# 🔐 SECURITY: เพิ่ม metadata สำหรับ container security
LABEL maintainer="security@company.com" \
      version="1.0" \
      description="Secure Bun + Next.js + Prisma Production Container" \
      org.opencontainers.image.source="https://github.com/your-org/bun-line-t3" \
      org.opencontainers.image.title="Bun LINE T3 App" \
      org.opencontainers.image.description="Secure production container for Bun + Next.js + Prisma application"

WORKDIR /app

# 🔐 SECURITY: ติดตั้ง system packages ที่จำเป็นสำหรับ Prisma และ production
# ✅ SECURITY: อัปเดต package index ก่อนติดตั้งเพื่อความปลอดภัย
RUN apk update && apk add --no-cache \
    curl \
    bash \
    openssl \
    ca-certificates \
    dumb-init \
    && curl -sfL https://gobinaries.com/tj/node-prune | bash -s -- -b /usr/local/bin \
    && rm -rf /var/cache/apk/*

# 🚀 OPTIMIZATION: คัดลอกไฟล์ dependency เพื่อใช้ Docker layer caching
# ✅ SECURITY: คัดลอก lockfile เพื่อ ensure consistency
COPY package.json bun.lockb ./

# 🔐 SECURITY: คัดลอก Prisma schema ก่อนติดตั้ง dependencies เพื่อให้ postinstall script ทำงานได้
COPY prisma ./prisma

# 🚀 OPTIMIZATION: ติดตั้ง dependencies โดยไม่รัน postinstall script
# ✅ SECURITY: ใช้ dependencies ทั้งหมดสำหรับ build stage
RUN bun install --frozen-lockfile --ignore-scripts

# 🚀 OPTIMIZATION: Generate Prisma Client แยกต่างหาก
RUN bunx prisma generate

# 🔐 SECURITY: คัดลอกไฟล์ที่จำเป็นทั้งหมด
COPY . .

# 🔐 SECURITY: ตั้งค่า Prisma สำหรับ production build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true
ENV SKIP_ENV_VALIDATION=true

# 🚀 OPTIMIZATION: Generate Prisma Client และ build Next.js
RUN bunx prisma generate \
    && bun run build

# 🚀 OPTIMIZATION: ทำความสะอาดไฟล์ที่ไม่จำเป็น และ reduce attack surface
RUN bun pm cache rm \
    && /usr/local/bin/node-prune \
    && rm -rf \
    node_modules/.cache/ \
    node_modules/@prisma/engines/ \
    node_modules/@prisma/engines-version \
    /root/.cache/ \
    /root/.bun/install/cache/ \
    .next/cache/ \
    /tmp/* \
    && find /app/node_modules/ -type f -iname "*.md" -delete \
    && find /app/node_modules/ -type f -iname "*.map" -delete \
    && find /app/node_modules/ -type f -iname "*.d.ts" -delete \
    && find /app/node_modules/ -type d -name "__tests__" -exec rm -rf {} + 2>/dev/null || true \
    && find /app/node_modules/ -type d -name "test" -exec rm -rf {} + 2>/dev/null || true \
    && find /app/node_modules/ -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true

###################
# BASE FOR RUNTIME
###################
FROM oven/bun:1-alpine AS base
WORKDIR /app

# 🔐 SECURITY: ติดตั้ง runtime dependencies ที่จำเป็น
# ✅ SECURITY: เพิ่ม dumb-init สำหรับ proper signal handling
RUN apk update && apk add --no-cache \
    curl \
    ca-certificates \
    dumb-init \
    && rm -rf /var/cache/apk/*

###################
# RUNNER STAGE
###################
# 🛡️ SECURITY: สร้าง minimal runtime image ที่ปลอดภัยสำหรับ production
FROM base AS runner
WORKDIR /app

# 🔐 SECURITY: ตั้งค่า environment variables สำหรับ production runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUN_ENV=production
ENV PORT=12914

# 🛡️ SECURITY: สร้างผู้ใช้ non-root สำหรับการรันแอปพลิเคชัน
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 🚀 OPTIMIZATION: คัดลอก public assets (ถ้ามี)
COPY --from=build /app/public ./public

# 🚀 OPTIMIZATION: คัดลอก Next.js standalone build output พร้อม permissions ที่ถูกต้อง
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# 🔐 SECURITY: คัดลอก Prisma Client และ binaries ที่จำเป็นสำหรับ runtime
COPY --from=build --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma

# 🚀 OPTIMIZATION: คัดลอก package.json สำหรับ metadata
COPY --from=build --chown=nextjs:nodejs /app/package.json ./package.json

# 🔐 SECURITY: คัดลอก startup script
COPY --from=build --chown=nextjs:nodejs /app/scripts/docker-entrypoint.sh ./scripts/
COPY --from=build --chown=nextjs:nodejs /app/scripts/health-check.sh ./scripts/
RUN chmod +x ./scripts/docker-entrypoint.sh ./scripts/health-check.sh

# 🔐 SECURITY: คัดลอก env schema สำหรับ runtime validation (ถ้าจำเป็น)
COPY --from=build --chown=nextjs:nodejs /app/src/env.mjs ./src/env.mjs

# 🛡️ SECURITY: ตรวจสอบ Prisma Client และ dependencies ใน runtime stage
RUN test -d node_modules/.prisma/client || (echo "❌ Prisma Client missing in runtime" && exit 1) \
    && test -f src/env.mjs || (echo "❌ Environment schema missing" && exit 1) \
    && echo "✅ Runtime dependencies verified"

# 🔐 SECURITY: สลับไปใช้ผู้ใช้ non-root
USER nextjs

# 🚀 OPTIMIZATION: ตั้งค่า runtime optimizations (PORT ถูกตั้งไว้แล้วข้างบน)
EXPOSE 12914

# 🔐 SECURITY: ลด healthcheck interval เพื่อลด overhead แต่ยังคงการตรวจสอบความปลอดภัย
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD ["./scripts/health-check.sh"]

# 🚀 OPTIMIZATION & 🔐 SECURITY: Startup script ที่รองรับ Prisma และ Database Migration
# ตรวจสอบและเตรียม database ก่อนเริ่ม application พร้อม proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["./scripts/docker-entrypoint.sh"]
