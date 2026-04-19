# 🐳 Dockerfile for Bun + TanStack Start + Prisma Production
# 🛡️ Security-first multi-stage build for Bun runtime

###################
# 🏗️ BASE BUILD STAGE
###################
FROM --platform=$BUILDPLATFORM oven/bun:1-alpine AS build-base

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

RUN apk add --no-cache \
    bash \
    build-base \
    cairo-dev \
    ca-certificates \
    curl \
    dumb-init \
    giflib-dev \
    jpeg-dev \
    npm \
    openssl \
    pango-dev \
    python3 \
    && rm -rf /var/cache/apk/*

###################
# 🏗️ APP BUILD STAGE
###################
FROM build-base AS build

COPY package.json bun.lock ./
COPY prisma ./prisma

RUN --mount=type=cache,target=/root/.bun/install/cache \
    NODE_OPTIONS="--max_old_space_size=1536" bun install --frozen-lockfile --ignore-scripts

RUN --mount=type=cache,target=/root/.cache/prisma \
    NODE_OPTIONS="--max_old_space_size=1024" bunx prisma generate

COPY . .

ARG DATABASE_URL
ARG APP_URL
ARG AUTH_SECRET
ARG APP_DOMAIN
ARG ALLOWED_DOMAINS
ARG LINE_CLIENT_ID
ARG LINE_CLIENT_SECRET
ARG LINE_CHANNEL_SECRET
ARG LINE_MESSAGING_API
ARG LINE_CHANNEL_ACCESS
ARG ADMIN_LINE_USER_IDS
ARG CMC_URL
ARG CMC_API_KEY
ARG FRONTEND_URL
ARG AQICN_TOKEN
ARG OPENAI_API_KEY
ARG SPOTIFY_CLIENT_ID
ARG SPOTIFY_CLIENT_SECRET

ENV NODE_ENV=production \
    CI=true \
    SKIP_ENV_VALIDATION=true \
    NODE_OPTIONS="--max_old_space_size=1024 --no-warnings" \
    DATABASE_URL=${DATABASE_URL} \
    APP_URL=${APP_URL} \
    AUTH_SECRET=${AUTH_SECRET} \
    APP_DOMAIN=${APP_DOMAIN} \
    ALLOWED_DOMAINS=${ALLOWED_DOMAINS} \
    LINE_CLIENT_ID=${LINE_CLIENT_ID} \
    LINE_CLIENT_SECRET=${LINE_CLIENT_SECRET} \
    LINE_CHANNEL_SECRET=${LINE_CHANNEL_SECRET} \
    LINE_MESSAGING_API=${LINE_MESSAGING_API:-"https://api.line.me/v2/bot/message"} \
    LINE_CHANNEL_ACCESS=${LINE_CHANNEL_ACCESS} \
    ADMIN_LINE_USER_IDS=${ADMIN_LINE_USER_IDS} \
    CMC_URL=${CMC_URL:-"https://pro-api.coinmarketcap.com"} \
    CMC_API_KEY=${CMC_API_KEY} \
    FRONTEND_URL=${FRONTEND_URL} \
    AQICN_TOKEN=${AQICN_TOKEN} \
    OPENAI_API_KEY=${OPENAI_API_KEY} \
    SPOTIFY_CLIENT_ID=${SPOTIFY_CLIENT_ID} \
    SPOTIFY_CLIENT_SECRET=${SPOTIFY_CLIENT_SECRET}

RUN echo "🚀 Building TanStack Start..." && \
    bun run build && \
    echo "✅ Build completed"

###################
# 📦 PRODUCTION DEPENDENCIES STAGE
###################
FROM build-base AS prod-deps

ENV SKIP_PRISMA_GENERATE=1 \
    NODE_ENV=production

COPY package.json bun.lock ./

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --production --frozen-lockfile

# Copy Prisma dependencies (already generated in node_modules)
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/pg ./node_modules/pg
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

###################
# 🚀 RUNTIME STAGE
###################
FROM oven/bun:1-alpine AS runner
WORKDIR /app

RUN apk add --no-cache \
    bash \
    cairo \
    ca-certificates \
    curl \
    dumb-init \
    giflib \
    jpeg \
    pango \
    && rm -rf /var/cache/apk/* /tmp/*

ENV NODE_ENV=production \
    BUN_ENV=production \
    PORT=12914 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

COPY --from=build --chown=appuser:appgroup /app/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/public ./public
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
    CMD ["./scripts/monitoring/health-check.sh"]

ENTRYPOINT ["dumb-init", "--"]
CMD ["./scripts/devops/docker-entrypoint.sh"]
