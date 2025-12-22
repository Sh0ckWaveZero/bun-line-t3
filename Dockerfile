# 🐳 Dockerfile for Bun + Next.js + Prisma Production
# 🛡️ Security-First Docker Build with Size Optimization
# 🔧 Multi-platform support for ARM64 (Raspberry Pi) and AMD64
# 📦 Optimized for minimal image size

###################
# 🏗️ BUILD STAGE
###################
FROM --platform=$BUILDPLATFORM oven/bun:1-alpine AS build

LABEL maintainer="security@company.com" \
    version="1.0" \
    description="Secure Bun + Next.js + Prisma Production Container (Multi-platform)" \
    org.opencontainers.image.source="https://github.com/your-org/bun-line-t3" \
    org.opencontainers.image.title="Bun LINE T3 App" \
    org.opencontainers.image.description="Secure production container for Bun + Next.js + Prisma application"

ARG TARGETPLATFORM
ARG BUILDPLATFORM
RUN echo "🔧 Building on $BUILDPLATFORM for $TARGETPLATFORM"

WORKDIR /app

# 📦 Install build dependencies (using --virtual for cleanup)
RUN apk update && apk add --no-cache --virtual .build-deps \
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
    npm \
    && rm -rf /var/cache/apk/*

# 📋 Copy dependency files for Docker layer caching
COPY package.json bun.lock ./

# 🗄️ Copy Prisma schema before installing dependencies
COPY prisma ./prisma

# 📥 Install dependencies (with cache mount for faster rebuilds)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    NODE_OPTIONS="--max_old_space_size=1536" bun install --frozen-lockfile --ignore-scripts

# 🎨 Rebuild canvas module with native dependencies
RUN cd node_modules/canvas && npm rebuild 2>/dev/null || true

# 🗄️ Generate Prisma Client (with cache mount)
RUN --mount=type=cache,target=/root/.cache/prisma \
    NODE_OPTIONS="--max_old_space_size=1024" bunx prisma generate

# 📋 Copy source files
COPY . .

# 🔐 Build arguments for environment variables
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
ARG SPOTIFY_CLIENT_ID
ARG SPOTIFY_CLIENT_SECRET

# ⚙️ Set environment variables for build
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    CI=true \
    SKIP_ENV_VALIDATION=true \
    NODE_OPTIONS="--max_old_space_size=1024 --no-warnings" \
    DATABASE_URL=${DATABASE_URL} \
    NEXTAUTH_URL=${NEXTAUTH_URL} \
    NEXTAUTH_SECRET=${NEXTAUTH_SECRET} \
    APP_DOMAIN=${APP_DOMAIN} \
    ALLOWED_DOMAINS=${ALLOWED_DOMAINS} \
    LINE_CLIENT_ID=${LINE_CLIENT_ID} \
    LINE_CLIENT_SECRET=${LINE_CLIENT_SECRET} \
    LINE_CHANNEL_SECRET=${LINE_CHANNEL_SECRET} \
    LINE_MESSAGING_API=${LINE_MESSAGING_API:-"https://api.line.me/v2/bot/message"} \
    LINE_CHANNEL_ACCESS=${LINE_CHANNEL_ACCESS} \
    CMC_URL=${CMC_URL:-"https://pro-api.coinmarketcap.com"} \
    CMC_API_KEY=${CMC_API_KEY} \
    FRONTEND_URL=${FRONTEND_URL} \
    AIRVISUAL_API_KEY=${AIRVISUAL_API_KEY} \
    OPENAI_API_KEY=${OPENAI_API_KEY} \
    SPOTIFY_CLIENT_ID=${SPOTIFY_CLIENT_ID} \
    SPOTIFY_CLIENT_SECRET=${SPOTIFY_CLIENT_SECRET}

# 🔧 ARM64 build optimizations
ENV NEXT_BUILD_WORKERS=0 \
    NEXT_WORKER_THREADS=false \
    NEXT_PARALLEL=false

# 🎨 Build Tailwind CSS and 🚀 Next.js (with cache mount)
RUN --mount=type=cache,target=/app/.next/cache \
    echo "🎨 Building Tailwind CSS..." && \
    bunx @tailwindcss/cli -i ./src/input.css -o ./src/output.css && \
    echo "🚀 Building Next.js..." && \
    NODE_OPTIONS="--max_old_space_size=1024 --no-warnings" npx next build && \
    echo "✅ Build completed"

# 🧹 Aggressive cleanup to reduce image size
RUN echo "🧹 Cleaning up..." && \
    bun pm cache rm 2>/dev/null || true && \
    rm -rf /root/.cache /root/.bun/install/cache /root/.npm /tmp/* && \
    rm -rf .next/cache && \
    rm -rf node_modules/@prisma/engines node_modules/@prisma/engines-version && \
    rm -rf node_modules/.prisma/client/libquery_engine-* 2>/dev/null || true && \
    rm -rf node_modules/.cache && \
    find /app/node_modules -type f \( -iname "*.md" -o -iname "*.map" -o -iname "*.d.ts" -o -iname "CHANGELOG*" -o -iname "LICENSE*" -o -iname "README*" -o -iname "*.txt" \) -delete 2>/dev/null || true && \
    find /app/node_modules -type d \( -name "__tests__" -o -name "test" -o -name "tests" -o -name "docs" -o -name "example" -o -name "examples" -o -name ".github" \) -exec rm -rf {} + 2>/dev/null || true && \
    find /app/node_modules -type f \( -iname "*.ts" -not -iname "*.d.ts" \) -delete 2>/dev/null || true && \
    rm -rf node_modules/.bin 2>/dev/null || true && \
    apk del .build-deps 2>/dev/null || true && \
    echo "✅ Cleanup completed"

###################
# 🚀 RUNTIME STAGE
###################
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# 📦 Install only runtime dependencies
RUN apk update && apk add --no-cache \
    curl \
    ca-certificates \
    dumb-init \
    cairo \
    jpeg \
    pango \
    giflib \
    && rm -rf /var/cache/apk/* /tmp/*

# ⚙️ Set production environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    BUN_ENV=production \
    PORT=12914 \
    HOSTNAME=0.0.0.0

# 🔐 Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 📋 Copy Next.js standalone build output
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# 🗄️ Copy Prisma Client (minimal files only)
COPY --from=build --chown=nextjs:nodejs /app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=build --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma

# 📋 Copy essential files
COPY --from=build --chown=nextjs:nodejs /app/package.json ./package.json

# 📋 Copy startup scripts
COPY --from=build --chown=nextjs:nodejs /app/scripts/docker-entrypoint.sh ./scripts/
COPY --from=build --chown=nextjs:nodejs /app/scripts/health-check.sh ./scripts/
RUN chmod +x ./scripts/docker-entrypoint.sh ./scripts/health-check.sh

# 📋 Copy environment schema
COPY --from=build --chown=nextjs:nodejs /app/src/env.mjs ./src/env.mjs

# ✅ Verify critical files exist
RUN test -d node_modules/.prisma/client || (echo "❌ Prisma Client missing" && exit 1) && \
    test -f src/env.mjs || (echo "❌ Environment schema missing" && exit 1) && \
    echo "✅ Runtime dependencies verified"

# 🔐 Switch to non-root user
USER nextjs

EXPOSE 12914

# 🏥 Health check configuration
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
    CMD ["./scripts/health-check.sh"]

# 🚀 Startup with proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["./scripts/docker-entrypoint.sh"]
