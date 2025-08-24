# Dockerfile สำหรับ Bun + Next.js + Prisma Production
# 🛡️ Security-First Docker Build ปรับปรุงจากแนวทางที่ work
# เลียนแบบ Node.js Alpine pattern แต่ใช้ Bun แทน
# 🔧 Multi-platform support for ARM64 (Raspberry Pi) และ AMD64

###################
# BUILD FOR PRODUCTION  
###################
FROM --platform=$BUILDPLATFORM oven/bun:1-alpine AS build

# 🔐 SECURITY: เพิ่ม metadata สำหรับ container security
LABEL maintainer="security@company.com" \
      version="1.0" \
      description="Secure Bun + Next.js + Prisma Production Container (Multi-platform)" \
      org.opencontainers.image.source="https://github.com/your-org/bun-line-t3" \
      org.opencontainers.image.title="Bun LINE T3 App" \
      org.opencontainers.image.description="Secure production container for Bun + Next.js + Prisma application"

# 🔧 Multi-platform build arguments
ARG TARGETPLATFORM
ARG BUILDPLATFORM
RUN echo "Building on $BUILDPLATFORM for $TARGETPLATFORM"

WORKDIR /app

# 🔐 SECURITY: ติดตั้ง system packages ที่จำเป็นสำหรับ Prisma และ production
# ✅ SECURITY: อัปเดต package index ก่อนติดตั้งเพื่อความปลอดภัย
# 🔧 Multi-platform: ปรับ node-prune installation ให้รองรับ ARM64
# 🎨 CANVAS: เพิ่ม dependencies สำหรับ node-canvas
RUN apk update && apk add --no-cache \
    curl \
    bash \
    openssl \
    ca-certificates \
    dumb-init \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    build-base \
    python3 \
    && rm -rf /var/cache/apk/*

# 🔧 Multi-platform: Skip node-prune ใน ARM64 เนื่องจากไม่มี ARM64 binary
# RUN curl -sfL https://gobinaries.com/tj/node-prune | bash -s -- -b /usr/local/bin || echo "node-prune not available for this platform"

# 🚀 OPTIMIZATION: คัดลอกไฟล์ dependency เพื่อใช้ Docker layer caching
# ✅ SECURITY: คัดลอก lockfile เพื่อ ensure consistency
COPY package.json bun.lock ./

# 🔐 SECURITY: คัดลอก Prisma schema ก่อนติดตั้ง dependencies เพื่อให้ postinstall script ทำงานได้
COPY prisma ./prisma

# 🚀 OPTIMIZATION: ติดตั้ง dependencies โดยไม่รัน postinstall script
# ✅ SECURITY: ใช้ dependencies ทั้งหมดสำหรับ build stage
# 🔧 RASPBERRY PI: ลด memory usage และ parallel jobs
RUN NODE_OPTIONS="--max_old_space_size=1536" bun install --frozen-lockfile --ignore-scripts

# 🎨 CANVAS: Install npm and rebuild canvas module with native dependencies
RUN apk add --no-cache npm \
    && cd node_modules/canvas && npm rebuild

# 🚀 OPTIMIZATION: Generate Prisma Client แยกต่างหาก
# 🔧 RASPBERRY PI: จำกัด memory สำหรับ Prisma generation
RUN NODE_OPTIONS="--max_old_space_size=1024" bunx prisma generate

# 🔐 SECURITY: คัดลอกไฟล์ที่จำเป็นทั้งหมด
COPY . .

# 🔐 SECURITY: Build arguments สำหรับ environment variables
ARG DATABASE_URL
ARG NEXTAUTH_URL  
ARG NEXTAUTH_SECRET
ARG APP_DOMAIN
ARG ALLOWED_DOMAINS
ARG LINE_CLIENT_ID
ARG LINE_CLIENT_SECRET
ARG LINE_CHANNEL_SECRET
ARG LINE_MESSAGING_API
ARG LINE_CHANNEL_ACCESS
ARG CMC_URL
ARG CMC_API_KEY
ARG FRONTEND_URL
ARG AIRVISUAL_API_KEY
ARG OPENAI_API_KEY

# 🔐 SECURITY: ตั้งค่า Prisma สำหรับ production build
# 🔧 RASPBERRY PI OPTIMIZATION: ตั้งค่า memory limits สำหรับ Node.js
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true
ENV SKIP_ENV_VALIDATION=true
# 🔧 ARM64: ลด memory limit สำหรับ ARM64 และปิด memory warnings
ENV NODE_OPTIONS="--max_old_space_size=1024 --no-warnings"

# 🔐 SECURITY: ตั้งค่า environment variables สำหรับ build time
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV APP_DOMAIN=${APP_DOMAIN}
ENV ALLOWED_DOMAINS=${ALLOWED_DOMAINS}
ENV LINE_CLIENT_ID=${LINE_CLIENT_ID}
ENV LINE_CLIENT_SECRET=${LINE_CLIENT_SECRET}
ENV LINE_CHANNEL_SECRET=${LINE_CHANNEL_SECRET}
ENV LINE_MESSAGING_API=${LINE_MESSAGING_API:-"https://api.line.me/v2/bot/message"}
ENV LINE_CHANNEL_ACCESS=${LINE_CHANNEL_ACCESS}
ENV CMC_URL=${CMC_URL:-"https://pro-api.coinmarketcap.com"}
ENV CMC_API_KEY=${CMC_API_KEY}
ENV FRONTEND_URL=${FRONTEND_URL}
ENV AIRVISUAL_API_KEY=${AIRVISUAL_API_KEY}
ENV OPENAI_API_KEY=${OPENAI_API_KEY}

# 🚀 OPTIMIZATION: Generate Prisma Client และ build Next.js
# 🔧 ARM64: แยก commands เพื่อลด memory peak usage สำหรับ ARM64
RUN NODE_OPTIONS="--max_old_space_size=768 --no-warnings" bunx prisma generate

# 🔧 ARM64: ใช้ Node.js แทน Bun สำหรับ Next.js build เพื่อหลีกเลี่ยง worker issues
ENV NEXT_BUILD_WORKERS=0
ENV NEXT_WORKER_THREADS=false
ENV NEXT_PARALLEL=false
RUN NODE_OPTIONS="--max_old_space_size=1024 --no-warnings" npx next build

# 🚀 OPTIMIZATION: ทำความสะอาดไฟล์ที่ไม่จำเป็น และ reduce attack surface
# 🔧 Multi-platform: ใช้ manual cleanup แทน node-prune สำหรับ ARM64 compatibility
RUN bun pm cache rm \
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

# 🔧 Multi-platform build arguments for runtime
ARG TARGETPLATFORM
ARG BUILDPLATFORM

# 🔐 SECURITY: ติดตั้ง runtime dependencies ที่จำเป็น
# ✅ SECURITY: เพิ่ม dumb-init สำหรับ proper signal handling
# 🎨 CANVAS: เพิ่ม runtime dependencies สำหรับ node-canvas
RUN apk update && apk add --no-cache \
    curl \
    ca-certificates \
    dumb-init \
    cairo \
    jpeg \
    pango \
    giflib \
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
ENV HOSTNAME=0.0.0.0

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
