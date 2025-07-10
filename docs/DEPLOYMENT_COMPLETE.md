# 🚀 Complete Deployment Guide

## Overview

This comprehensive guide covers deploying the Bun LINE T3 application across different environments including local development, staging, and production.

---

## 📋 Prerequisites

### System Requirements
- **Bun** >= 1.0.0
- **Node.js** >= 18.0.0  
- **Docker** >= 20.10.0 (for containerized deployment)
- **Docker Compose** >= 2.0.0
- **Git** for version control

### External Services
- **MongoDB** database (Atlas or self-hosted)
- **LINE Developer Console** account
- **SSL certificates** (for HTTPS)

---

## 🏠 Local Development Setup

### 1. Environment Configuration

**Create environment files:**
```bash
# Development environment
cp .env.example .env.development

# Production environment  
cp .env.example .env.production
```

**Configure `.env.development`:**
```env
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
FRONTEND_URL=https://localhost:4325
NEXTAUTH_URL=https://localhost:4325

# Database
DATABASE_URL="mongodb://localhost:27017/bun_line_t3_dev"

# Security
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
JWT_EXPIRES_IN=1d

# LINE Integration
LINE_CLIENT_ID=your_line_client_id
LINE_CLIENT_SECRET=your_line_client_secret
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS=your_line_channel_access_token
LINE_MESSAGING_API=https://api.line.me/v2/bot

# External APIs
CMC_URL=https://pro-api.coinmarketcap.com
CMC_API_KEY=your_coinmarketcap_api_key
AIRVISUAL_API_KEY=your_airvisual_api_key

# Cron Authentication
CRON_SECRET_TOKEN=secure-random-token-for-cron-jobs
```

### 2. Installation & Setup

```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Push database schema
bun run db:push

# Seed holiday data
bun run seed:holidays

# Generate secure secrets
bun run generate:secrets
```

### 3. Development Server

```bash
# Start development server with SSL
bun run dev

# Alternative: Basic development server
bun run dev:basic

# Clean start (clear cache)
bun run dev:clean
```

**Development server features:**
- HTTPS on `localhost:4325` with self-signed certificates
- Process lock to prevent multiple instances
- Automatic cleanup on Ctrl+C
- Hot reload enabled

---

## 🏗️ Production Deployment

### Option 1: Docker Deployment (Recommended)

#### 1. Build Configuration

**Create `Dockerfile.prod`:**
```dockerfile
FROM oven/bun:1-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Build application
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
```

#### 2. Docker Compose Setup

**Create `docker-compose.prod.yml`:**
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - mongodb
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongodb:
    image: mongo:7-jammy
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGO_DATABASE:-bun_line_t3}
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./docker/mongo-init:/docker-entrypoint-initdb.d
    restart: unless-stopped

  # Cron service for automated tasks
  cron:
    build:
      context: .
      dockerfile: Dockerfile.cron
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - CRON_SECRET_TOKEN=${CRON_SECRET_TOKEN}
      - LINE_CHANNEL_ACCESS=${LINE_CHANNEL_ACCESS}
    depends_on:
      - app
      - mongodb
    restart: unless-stopped
    volumes:
      - ./crontab:/etc/cron.d/app-crontab

  # Reverse proxy with SSL
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./certificates:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongodb_data:
```

#### 3. Production Build & Deploy

```bash
# Build for production
bun run build:docker

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Check deployment status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### Option 2: VPS/Cloud Server Deployment

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js, Bun, and dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
curl -fsSL https://bun.sh/install | bash

# Install PM2 for process management
sudo npm install -g pm2

# Install MongoDB (if self-hosting)
sudo apt-get install -y mongodb-org
```

#### 2. Application Deployment

```bash
# Clone repository
git clone <your-repo-url> /var/www/bun-line-t3
cd /var/www/bun-line-t3

# Install dependencies
bun install --production

# Build application
bun run build

# Configure environment
cp .env.example .env.production
# Edit .env.production with production values

# Setup database
bun run db:push
bun run seed:holidays
```

#### 3. Process Management with PM2

**Create `ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [
    {
      name: 'bun-line-t3',
      script: 'bun',
      args: 'run start',
      cwd: '/var/www/bun-line-t3',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_file: '.env.production',
      error_file: '/var/log/pm2/bun-line-t3-error.log',
      out_file: '/var/log/pm2/bun-line-t3-out.log',
      log_file: '/var/log/pm2/bun-line-t3.log',
      max_memory_restart: '500M',
      restart_delay: 5000
    }
  ]
}
```

```bash
# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

---

## 🔧 Environment-Specific Configuration

### Production Environment Variables

**Security Configuration:**
```env
# Strong secrets for production
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
CRON_SECRET_TOKEN="$(openssl rand -base64 32)"
JWT_SECRET="$(openssl rand -base64 32)"

# Production URLs
NEXTAUTH_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Database with connection pooling
DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/bun_line_t3?retryWrites=true&w=majority"

# Production LINE webhook
LINE_WEBHOOK_URL=https://yourdomain.com/api/line
```

### Development vs Production Differences

| Feature | Development | Production |
|---------|-------------|------------|
| HTTPS | Self-signed cert | Valid SSL cert |
| Database | Local MongoDB | MongoDB Atlas/Cluster |
| Secrets | Simple values | Cryptographically secure |
| Caching | Disabled | Redis/Memory cache |
| Logging | Console | File + External service |
| Monitoring | Basic | Comprehensive |

---

## 🔒 SSL/TLS Configuration

### Option 1: Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Option 2: Custom SSL Certificate

**Nginx configuration with SSL:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ⏰ Cron Jobs Setup

### Docker Cron Service

**`Dockerfile.cron`:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install cron
RUN apk add --no-cache dcron

# Copy crontab
COPY crontab /etc/cron.d/app-crontab
RUN chmod 0644 /etc/cron.d/app-crontab
RUN crontab /etc/cron.d/app-crontab

# Copy application
COPY . .
RUN npm install --production

# Start cron daemon
CMD ["crond", "-f", "-d", "8"]
```

**`crontab` file:**
```bash
# Check-in reminder (7:30 AM Bangkok time = 00:30 UTC)
30 0 * * 1-5 curl -X POST -H "Content-Type: application/json" -d '{"authToken":"'"$CRON_SECRET_TOKEN"'"}' http://app:3000/api/cron/check-in-reminder

# Checkout reminder (5:30 PM Bangkok time = 10:30 UTC)  
30 10 * * 1-5 curl -X POST -H "Content-Type: application/json" -d '{"authToken":"'"$CRON_SECRET_TOKEN"'"}' http://app:3000/api/cron/checkout-reminder

# Enhanced checkout reminder (6:00 PM Bangkok time = 11:00 UTC)
0 11 * * 1-5 curl -X POST -H "Content-Type: application/json" -d '{"authToken":"'"$CRON_SECRET_TOKEN"'"}' http://app:3000/api/cron/enhanced-checkout-reminder

# Auto checkout (8:00 PM Bangkok time = 13:00 UTC)
0 13 * * 1-5 curl -X POST -H "Content-Type: application/json" -d '{"authToken":"'"$CRON_SECRET_TOKEN"'"}' http://app:3000/api/cron/auto-checkout
```

### System Cron (Alternative)

```bash
# Edit system crontab
sudo crontab -e

# Add production cron jobs
30 0 * * 1-5 curl -X POST -H "Content-Type: application/json" -d '{"authToken":"your-secret-token"}' https://yourdomain.com/api/cron/check-in-reminder
30 10 * * 1-5 curl -X POST -H "Content-Type: application/json" -d '{"authToken":"your-secret-token"}' https://yourdomain.com/api/cron/checkout-reminder
```

---

## 📊 Monitoring & Health Checks

### Health Check Endpoints

```bash
# Basic health check
curl https://yourdomain.com/api/health

# Enhanced health check with system info
curl https://yourdomain.com/api/health/enhanced

# Monitoring dashboard
curl https://yourdomain.com/api/monitoring/dashboard
```

### Docker Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Monitoring Setup

**Basic monitoring with PM2:**
```bash
# Install PM2 monitoring
pm2 install pm2-server-monit

# View monitoring dashboard
pm2 monit

# Setup log rotation
pm2 install pm2-logrotate
```

---

## 🛡️ Security Considerations

### Production Security Checklist

- [ ] **Strong secrets**: Use cryptographically secure random values
- [ ] **HTTPS**: Enforce SSL/TLS for all connections
- [ ] **Environment variables**: Never commit secrets to version control
- [ ] **Database security**: Use connection strings with authentication
- [ ] **Network security**: Configure firewall rules
- [ ] **Input validation**: Ensure all user inputs are validated
- [ ] **Rate limiting**: Implement API rate limiting
- [ ] **CORS**: Configure appropriate CORS headers
- [ ] **Security headers**: Add security-related HTTP headers

### Security Headers (Nginx)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
```

---

## 🔄 Backup Strategy

### Database Backup

```bash
# MongoDB backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
DB_NAME="bun_line_t3"

# Create backup
mongodump --host localhost:27017 --db $DB_NAME --out $BACKUP_DIR/$DATE

# Compress backup
tar -czf $BACKUP_DIR/$DATE.tar.gz -C $BACKUP_DIR $DATE
rm -rf $BACKUP_DIR/$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Application Backup

```bash
# Application code backup
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/bun-line-t3"
BACKUP_DIR="/backups/app"

# Backup application files (excluding node_modules)
tar --exclude='node_modules' --exclude='.next' --exclude='.git' \
    -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR .

# Keep only last 3 backups
ls -t $BACKUP_DIR/app_*.tar.gz | tail -n +4 | xargs rm -f
```

---

## 🚨 Troubleshooting

### Common Issues

**1. Application won't start**
```bash
# Check logs
pm2 logs bun-line-t3

# Check process status
pm2 status

# Restart application
pm2 restart bun-line-t3
```

**2. Database connection issues**
```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017/bun_line_t3"

# Check database status
systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod
```

**3. LINE webhook not working**
```bash
# Check webhook signature validation
curl -X POST https://yourdomain.com/api/line \
  -H "Content-Type: application/json" \
  -H "x-line-signature: test" \
  -d '{"events":[]}'

# Verify LINE channel configuration
curl https://yourdomain.com/api/debug/line-oauth
```

**4. SSL certificate issues**
```bash
# Check certificate validity
openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew --dry-run
```

### Log Locations

- **Application logs**: `/var/log/pm2/bun-line-t3.log`
- **Error logs**: `/var/log/pm2/bun-line-t3-error.log`
- **Nginx logs**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- **MongoDB logs**: `/var/log/mongodb/mongod.log`

---

## 📈 Performance Optimization

### Production Optimizations

**Next.js Configuration:**
```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  reactStrictMode: true
}

export default nextConfig
```

**Database Connection Pooling:**
```javascript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

// Connection pooling in production
// DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/db?maxPoolSize=10&maxIdleTimeMS=30000"
```

### Caching Strategy

```nginx
# Static asset caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# API response caching (selective)
location /api/health {
    expires 30s;
    add_header Cache-Control "public, max-age=30";
}
```

---

This deployment guide provides comprehensive instructions for deploying your Bun LINE T3 application in various environments. Choose the deployment method that best fits your infrastructure and requirements.