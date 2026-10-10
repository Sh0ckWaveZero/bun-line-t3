# 🐳 Dockerfile for Bun + TanStack Start + Prisma Production
# 🛡️ Security-first multi-stage build for Bun runtime

###################
# 🏗️ BASE BUILD STAGE
###################
FROM oven/bun:1.4.3-slim AS build-base

LABEL maintainer="security@company.com" \
    version="1.0" \
    description="Secure Bun + TanStack Start + Prisma production container" \
    org.opencontainers.image.source="https://github.com/your-org/bun-line-t3" \
    org.opencontainers.image.title="Bun LINE T3 App" \
    org.opencontainers.image.description="Secure production container for Bun + TanStack Start application"

ARG TARGETPLATFORM
ARG BUILDPLATFORM
RUN echo "🔧 Building on $BUILDPLATFORM for $TARGETPLATFORM"

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libgif-dev \
    libjpeg-dev \
    libpango1.0-dev \
    python3 \
    && rm -rf /var/lib/apt/lists/*

###################
# 🏗️ APP BUILD STAGE
###################
FROM build-base AS build

COPY package.json bun.lock ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

RUN --mount=type=cache,target=/root/.bun/install/cache \
    NODE_OPTIONS="--max_old_space_size=1536" \
    bun install --frozen-lockfile --ignore-scripts

RUN --mount=type=cache,target=/root/.cache/prisma \
    NODE_OPTIONS="--max_old_space_size=1024" \
    bunx prisma generate

COPY . .

# 🌐 Public build configuration (non-sensitive — safe as build args)
ARG APP_URL
ARG APP_DOMAIN
ARG ALLOWED_DOMAINS
ARG FRONTEND_URL

ENV NODE_ENV=production \
    CI=true \
    SKIP_ENV_VALIDATION=true \
    NODE_OPTIONS="--max_old_space_size=1024 --no-warnings" \
    APP_URL=${APP_URL} \
    APP_DOMAIN=${APP_DOMAIN} \
    ALLOWED_DOMAINS=${ALLOWED_DOMAINS} \
    FRONTEND_URL=${FRONTEND_URL}

# 🔐 Secrets injected via BuildKit secret mounts — never stored in image layers,
#    build cache, or `docker history`.
#    Usage: docker build --secret id=database_url,env=DATABASE_URL ...
RUN --mount=type=secret,id=database_url \
    --mount=type=secret,id=auth_secret \
    --mount=type=secret,id=openai_api_key \
    --mount=type=secret,id=admin_line_user_ids \
    export DATABASE_URL="$(cat /run/secrets/database_url 2>/dev/null || true)" \
        AUTH_SECRET="$(cat /run/secrets/auth_secret 2>/dev/null || true)" \
        OPENAI_API_KEY="$(cat /run/secrets/openai_api_key 2>/dev/null || true)" \
        ADMIN_LINE_USER_IDS="$(cat /run/secrets/admin_line_user_ids 2>/dev/null || true)" \
    && echo "🚀 Building TanStack Start..." \
    && bun run build \
    && echo "✅ Build completed"

###################
# 📦 PRODUCTION DEPENDENCIES STAGE
###################
FROM oven/bun:1.4.3-slim AS prod-deps

WORKDIR /app

ENV SKIP_PRISMA_GENERATE=1 \
    NODE_ENV=production

# Install build tools needed for native modules (canvas)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libgif-dev \
    libjpeg-dev \
    libpango1.0-dev \
    python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./

# Install production dependencies with native modules (canvas)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --production --frozen-lockfile

# Copy Prisma dependencies (already generated in node_modules)
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/pg ./node_modules/pg
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Prisma CLI ใช้ dependency จาก build stage โดยไม่ดาวน์โหลดขณะ deploy
FROM build AS migrate
CMD ["bun", "node_modules/prisma/build/index.js", "migrate", "deploy"]

###################
# 🚀 RUNTIME STAGE
###################
FROM oven/bun:1.4.3-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libgif7 \
    libjpeg62-turbo \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    ca-certificates \
    curl \
    dumb-init \
    fontconfig \
    fonts-noto-core \
    openssl \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    BUN_ENV=production \
    PORT=12914 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup --no-create-home appuser

COPY --from=build --chown=appuser:appgroup /app/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/public ./public

# Remove source maps from dist to reduce size
RUN find ./dist -name "*.map" -delete 2>/dev/null || true
COPY --from=prod-deps --chown=appuser:appgroup /app/node_modules ./node_modules

COPY --from=build --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=build --chown=appuser:appgroup /app/prisma.config.ts ./prisma.config.ts

COPY --from=build --chown=appuser:appgroup /app/package.json ./package.json
COPY --from=build --chown=appuser:appgroup /app/server.ts ./server.ts
COPY --from=build --chown=appuser:appgroup /app/scripts ./scripts

RUN chmod +x ./scripts/devops/docker-entrypoint.sh ./scripts/monitoring/health-check.sh && \
    test -f dist/server/server.js || (echo "❌ TanStack Start server bundle missing" && exit 1) && \
    test -d dist/client || (echo "❌ TanStack Start client bundle missing" && exit 1) && \
    test -f node_modules/.prisma/client/default.js || (echo "❌ Prisma Client missing" && exit 1) && \
    echo "✅ Runtime dependencies verified"

USER appuser

EXPOSE 12914

HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
    CMD curl --fail --silent --max-time 5 "http://127.0.0.1:${PORT}/api/health" >/dev/null

ENTRYPOINT ["dumb-init", "--"]
CMD ["./scripts/devops/docker-entrypoint.sh"]
