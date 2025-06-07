# 🚀 Deployment Guide

Complete guide for deploying the Bun LINE T3 application to production.

## 📋 Table of Contents

- [🌐 Overview](#-overview)
- [🔧 Prerequisites](#-prerequisites)
- [⚙️ Environment Setup](#️-environment-setup)
- [🏗️ Build Process](#️-build-process)
- [🚀 Platform Deployments](#-platform-deployments)
- [🔒 Security Configuration](#-security-configuration)
- [📊 Monitoring Setup](#-monitoring-setup)
- [🔄 CI/CD Pipeline](#-cicd-pipeline)
- [⚡ Performance Optimization](#-performance-optimization)
- [🛠️ Maintenance](#️-maintenance)

## 🌐 Overview

This application can be deployed on various platforms:
- **Vercel** (Recommended) - Optimal for Next.js applications
- **Railway** - Full-stack deployment with databases
- **Digital Ocean App Platform** - Scalable containerized deployment
- **AWS/GCP/Azure** - Enterprise cloud deployment

## 🔧 Prerequisites

### Required Services

- **MongoDB Database** (5.0+)
  - Production-ready instance
  - Backup strategy configured
  - Connection pooling enabled

- **LINE Developer Account**
  - LINE Official Account
  - Messaging API enabled
  - OAuth 2.0 configured

- **Domain & SSL**
  - Custom domain (recommended)
  - SSL certificate
  - DNS configuration

### External API Keys

- **CoinMarketCap API** - Cryptocurrency data
- **AirVisual API** - Air quality monitoring
- **Email Service** (optional) - Notifications

## ⚙️ Environment Setup

### Production Environment Variables

Create a production `.env` file with secure values:

```env
# Application
APP_ENV=production
FRONTEND_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com

# Security
NEXTAUTH_SECRET=super-secure-random-string-min-32-chars

# Database
DATABASE_URL=mongodb://username:password@host:port/database?retryWrites=true&w=majority

# LINE Integration
LINE_CLIENT_ID=your-production-line-client-id
LINE_CLIENT_SECRET=your-production-line-client-secret
LINE_CHANNEL_SECRET=your-production-line-channel-secret
LINE_CHANNEL_ACCESS=your-production-line-channel-access-token
LINE_MESSAGING_API=https://api.line.me/v2/bot

# External APIs
CMC_URL=https://pro-api.coinmarketcap.com
CMC_API_KEY=your-production-cmc-api-key
AIRVISUAL_API_KEY=your-production-airvisual-api-key

# JWT Configuration
JWT_EXPIRES_IN=7d
```

### Environment Validation

Ensure all required variables are set:

```bash
# Validate environment
bunx tsx scripts/validate-env.ts
```

Create the validation script:

```typescript
// scripts/validate-env.ts
import { env } from '../src/env.mjs'

console.log('✅ Environment validation passed')
console.log('📊 Configuration summary:')
console.log(`- App Environment: ${env.APP_ENV}`)
console.log(`- Frontend URL: ${env.FRONTEND_URL}`)
console.log(`- Database: ${env.DATABASE_URL.split('@')[1]}`)
console.log(`- LINE Client: ${env.LINE_CLIENT_ID}`)
```

## 🏗️ Build Process

### Local Build Test

```bash
# Clean previous builds
rm -rf .next

# Install dependencies
bun install --frozen-lockfile

# Generate Prisma client
bunx prisma generate

# Build application
bun run build

# Test production build locally
bun run start
```

### Build Optimization

```bash
# Analyze bundle size
ANALYZE=true bun run build

# Check build output
du -sh .next/static/**/*
```

### Build Configuration

Update `next.config.mjs` for production:

```javascript
/** @type {import("next").NextConfig} */
const config = {
  // Enable standalone output for containerized deployments
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['@prisma/client'],
  },
}

export default config
```

## 🚀 Platform Deployments

### Vercel (Recommended)

#### 1. Install Vercel CLI

```bash
bun add -g vercel
```

#### 2. Configure Project

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Set environment variables
vercel env add NEXTAUTH_SECRET
vercel env add DATABASE_URL
vercel env add LINE_CLIENT_ID
# ... continue for all variables
```

#### 3. Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### 4. Configure Domain

```bash
# Add custom domain
vercel domains add your-domain.com

# Configure DNS
# A record: @ -> 76.76.21.21
# CNAME record: www -> cname.vercel-dns.com
```

#### 5. Vercel Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "bun run build",
  "devCommand": "bun run dev",
  "installCommand": "bun install",
  "framework": "nextjs",
  "functions": {
    "src/app/api/line/route.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["sin1"],
  "env": {
    "SKIP_ENV_VALIDATION": "1"
  }
}
```

### Railway

#### 1. Install Railway CLI

```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh
```

#### 2. Setup Project

```bash
# Login
railway login

# Create new project
railway init

# Add MongoDB database
railway add mongodb

# Set environment variables
railway variables set NEXTAUTH_SECRET=your-secret
railway variables set FRONTEND_URL=https://your-app.railway.app
```

#### 3. Configure Build

Create `railway.toml`:

```toml
[build]
builder = "nixpacks"
buildCommand = "bun install && bun run build"

[deploy]
startCommand = "bun run start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[[services]]
name = "web"
source = "."
```

#### 4. Deploy

```bash
# Deploy to Railway
railway up
```

### Digital Ocean App Platform

#### 1. App Specification

Create `.do/app.yaml`:

```yaml
name: bun-line-t3
services:
- name: web
  source_dir: /
  github:
    repo: your-username/bun-line-t3
    branch: main
  run_command: bun run start
  build_command: bun install && bun run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
  envs:
  - key: APP_ENV
    value: production
  - key: NEXTAUTH_SECRET
    value: ${NEXTAUTH_SECRET}
  - key: DATABASE_URL
    value: ${DATABASE_URL}

databases:
- name: mongodb-db
  engine: MONGODB
  version: "5.0"
  size: db-s-1vcpu-1gb
```

#### 2. Deploy

```bash
# Install doctl
brew install doctl

# Authenticate
doctl auth init

# Create app
doctl apps create .do/app.yaml

# Update app
doctl apps update APP_ID --spec .do/app.yaml
```

### Docker Deployment

#### 1. Dockerfile

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
ENV SKIP_ENV_VALIDATION 1
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["bun", "server.js"]
```

#### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mongodb://mongodb:27017/bun_line_t3
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - mongodb
    
  mongodb:
    image: mongo:5.0
    environment:
      MONGO_INITDB_DATABASE: bun_line_t3
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

#### 3. Build and Run

```bash
# Build image
docker build -t bun-line-t3 .

# Run with compose
docker-compose up -d

# Check logs
docker-compose logs -f app
```

## 🔒 Security Configuration

### SSL/TLS Setup

```bash
# For custom domains, ensure SSL is configured
# Vercel: Automatic SSL
# Railway: Automatic SSL
# Digital Ocean: Enable in dashboard
# Docker: Use reverse proxy (nginx/traefik)
```

### Environment Security

```bash
# Use secure environment variable storage
# Never commit .env files
# Rotate secrets regularly
# Use different keys for different environments
```

### Database Security

```sql
-- Create dedicated database user
CREATE USER 'app_user'@'%' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON bun_line_t3.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
```

### LINE Security

1. **Webhook URL Verification**
   - Set webhook URL to production domain
   - Enable signature verification
   - Test webhook connectivity

2. **OAuth Configuration**
   - Set correct redirect URIs
   - Configure allowed domains
   - Enable PKCE if available

## 📊 Monitoring Setup

### Health Checks

Create health check endpoint:

```typescript
// src/app/api/health/route.ts
import { db } from '@/lib/database'

export async function GET() {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`
    
    // Check external APIs (optional)
    const checks = {
      database: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    }
    
    return Response.json(checks)
  } catch (error) {
    return Response.json(
      { 
        database: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
```

### Application Monitoring

#### Vercel Analytics

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

#### Error Tracking

```bash
# Add Sentry for error tracking
bun add @sentry/nextjs

# Configure in next.config.js
const { withSentryConfig } = require('@sentry/nextjs')
```

### Performance Monitoring

```typescript
// Monitor API response times
export async function GET(request: Request) {
  const start = performance.now()
  
  try {
    // API logic here
    const result = await someOperation()
    
    const duration = performance.now() - start
    console.log(`API took ${duration}ms`)
    
    return Response.json(result)
  } catch (error) {
    const duration = performance.now() - start
    console.error(`API failed after ${duration}ms:`, error)
    throw error
  }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  SKIP_ENV_VALIDATION: 1

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
          
      - name: Install dependencies
        run: bun install --frozen-lockfile
        
      - name: Type check
        run: bunx tsc --noEmit
        
      - name: Lint
        run: bun run lint
        
      - name: Build
        run: bun run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Pre-deployment Checks

```bash
# Create pre-deploy script
#!/bin/bash
set -e

echo "🔍 Running pre-deployment checks..."

# Type checking
bunx tsc --noEmit

# Linting
bun run lint

# Build test
bun run build

# Database schema check
bunx prisma validate

# Environment validation
bunx tsx scripts/validate-env.ts

echo "✅ All checks passed!"
```

## ⚡ Performance Optimization

### Database Optimization

```typescript
// Enable Prisma query optimization
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : [],
})

// Use connection pooling
export const db = prisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const start = performance.now()
        const result = await query(args)
        const end = performance.now()
        
        if (end - start > 1000) {
          console.warn(`Slow query detected: ${model}.${operation} took ${end - start}ms`)
        }
        
        return result
      },
    },
  },
})
```

### Caching Strategy

```typescript
// Implement Redis caching for expensive operations
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export async function getCachedData(key: string, fetcher: () => Promise<any>, ttl = 3600) {
  const cached = await redis.get(key)
  if (cached) return cached
  
  const data = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(data))
  return data
}
```

### CDN Configuration

```javascript
// next.config.mjs
const config = {
  images: {
    domains: ['cdn.your-domain.com'],
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  },
  
  async rewrites() {
    return [
      {
        source: '/assets/:path*',
        destination: 'https://cdn.your-domain.com/assets/:path*',
      },
    ]
  },
}
```

## 🛠️ Maintenance

### Database Maintenance

```bash
# Regular maintenance tasks
bunx prisma db pull          # Sync schema
bunx prisma format          # Format schema
bunx prisma validate        # Validate schema

# Backup database
mysqldump -h host -u user -p database > backup.sql

# Monitor database performance
mysql -e "SHOW PROCESSLIST;"
mysql -e "SHOW ENGINE INNODB STATUS;"
```

### Monitoring Commands

```bash
# Check application health
curl https://your-domain.com/api/health

# Monitor logs (Vercel)
vercel logs

# Monitor logs (Railway)
railway logs

# Monitor server resources
top
df -h
free -m
```

### Update Dependencies

```bash
# Check for updates
bun outdated

# Update dependencies
bun update

# Test after updates
bun run build
bun run lint
```

### Security Updates

```bash
# Security audit
bun audit

# Update security-critical packages
bun add @prisma/client@latest
bun add next@latest
bun add next-auth@latest
```

## 📋 Post-Deployment Checklist

- [ ] **Application Health**
  - [ ] Health check endpoint responds
  - [ ] Database connection working
  - [ ] All environment variables set

- [ ] **LINE Integration**
  - [ ] Webhook URL updated and verified
  - [ ] OAuth redirect URIs configured
  - [ ] Bot responses working correctly

- [ ] **Security**
  - [ ] SSL certificate valid
  - [ ] Security headers configured
  - [ ] Environment secrets secured

- [ ] **Performance**
  - [ ] Page load times acceptable
  - [ ] API response times good
  - [ ] Database queries optimized

- [ ] **Monitoring**
  - [ ] Error tracking configured
  - [ ] Performance monitoring active
  - [ ] Log aggregation working

- [ ] **Backup & Recovery**
  - [ ] Database backups scheduled
  - [ ] Disaster recovery plan tested
  - [ ] Rollback procedure documented

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear caches
   rm -rf .next node_modules bun.lockb
   bun install
   bun run build
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   bunx prisma db pull
   bunx prisma studio
   ```

3. **LINE Webhook Issues**
   - Verify webhook URL in LINE Console
   - Check signature validation
   - Test with LINE webhook debugger

4. **Environment Variable Issues**
   ```bash
   # Validate environment
   bunx tsx scripts/validate-env.ts
   ```

### Rollback Procedure

```bash
# Vercel rollback
vercel rollback [deployment-url]

# Railway rollback
railway rollback [deployment-id]

# Docker rollback
docker run -d previous-image-tag
```

---

## 📚 Additional Resources

- [Vercel Deployment Documentation](https://vercel.com/docs/deployments)
- [Railway Deployment Guide](https://docs.railway.app/deploy/deployments)
- [Digital Ocean App Platform](https://docs.digitalocean.com/products/app-platform/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 🎯 Success Metrics

Monitor these key metrics post-deployment:
- Application uptime > 99.9%
- API response time < 500ms
- Error rate < 0.1%
- Database query time < 100ms
- PAGE load time < 2s
