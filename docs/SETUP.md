# 🚀 คู่มือการติดตั้งและการกำหนดค่า | Setup Guide

> **🎯 คู่มือการติดตั้งโปรเจกต์ Bun LINE T3 Attendance System**
>
> **⚡ ใช้เทคโนโลยี**: Bun + TanStack Start + React 19 + TypeScript + MongoDB

## 📋 สารบัญ | Table of Contents

- [🔧 ข้อกำหนดระบบ](#-ข้อกำหนดระบบ)
- [⚡ การติดตั้งอย่างรวดเร็ว](#-การติดตั้งอย่างรวดเร็ว)
- [🔐 การกำหนดค่า Environment](#-การกำหนดค่า-environment)
- [🗄️ การตั้งค่าฐานข้อมูล](#️-การตั้งค่าฐานข้อมูล)
- [💬 การตั้งค่า LINE Bot](#-การตั้งค่า-line-bot)
- [🚀 การรันโปรเจกต์](#-การรันโปรเจกต์)
- [🧪 การทดสอบ](#-การทดสอบ)
- [🐳 Docker Setup](#-docker-setup)
- [🛠️ การแก้ไขปัญหา](#️-การแก้ไขปัญหา)

## 🔧 ข้อกำหนดระบบ | Prerequisites

### ✅ ซอฟต์แวร์ที่จำเป็น

| เครื่องมือ                        | เวอร์ชันขั้นต่ำ | แนะนำ   | วัตถุประสงค์                           |
| --------------------------------- | --------------- | ------- | -------------------------------------- |
| **[Bun](https://bun.sh)**         | 1.0.0+          | 1.1.34+ | JavaScript runtime และ package manager |
| **[Node.js](https://nodejs.org)** | 18.0.0+         | 20.11+  | สำหรับ fallback และ compatibility      |
| **[Git](https://git-scm.com)**    | 2.25+           | latest  | Version control                        |
| **MongoDB**                       | 6.0+            | 7.0+    | ฐานข้อมูลหลัก                          |

### 🔍 ตรวจสอบการติดตั้ง | Verification

```bash
# ตรวจสอบ Bun
bun --version

# ตรวจสอบ Node.js
node --version

# ตรวจสอบ Git
git --version

# ตรวจสอบ MongoDB (หากติดตั้งแบบ local)
mongod --version
```

### 📝 การติดตั้ง Bun (หากยังไม่มี)

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"

# ตรวจสอบการติดตั้ง
bun --version
```

## ⚡ การติดตั้งอย่างรวดเร็ว | Quick Installation

### 1. Clone Repository

```bash
# Clone โปรเจกต์
git clone <repository-url>
cd bun-line-t3

# หรือใช้ GitHub CLI
gh repo clone <username>/bun-line-t3
cd bun-line-t3
```

### 2. ติดตั้ง Dependencies

```bash
# ติดตั้งด้วย Bun (แนะนำ)
bun install
```

### 3. Copy Environment File

```bash
# Copy ไฟล์ example
cp .env.example .env

# เปิดไฟล์เพื่อแก้ไข
nano .env
# หรือ
code .env
```

### 4. Setup ฐานข้อมูล

```bash
# Generate Prisma client
bun run db:generate

# Push schema ไปยังฐานข้อมูล
bun run db:push

# (Optional) Seed ข้อมูลพื้นฐาน
bun run seed:holidays
```

### 5. รัน Development Server

```bash
# รัน development server
bun run dev

# เปิดเบราว์เซอร์ไปที่
# http://localhost:4325
```

## 🔐 การกำหนดค่า Environment | Environment Configuration

### 📋 Environment Variables ที่จำเป็น

สร้างไฟล์ `.env` จาก `.env.example` และกำหนดค่าตามตาราง:

#### 🗄️ Database Configuration

```env
# MongoDB Connection String
DATABASE_URL="mongodb://username:password@localhost:27017/bun_line_t3"

# สำหรับ MongoDB Atlas
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/bun_line_t3"
```

#### 🔐 Authentication

```env
# Better Auth Configuration
AUTH_SECRET="your-secure-secret-key-here"
APP_URL="http://localhost:4325"
```

#### 💬 LINE Bot Configuration

```env
# LINE Developer Console
LINE_CLIENT_ID="your-line-client-id"
LINE_CLIENT_SECRET="your-line-client-secret"
LINE_CHANNEL_SECRET="your-line-channel-secret"
LINE_CHANNEL_ACCESS="your-line-channel-access-token"
```

#### 🌐 Application Settings

```env
# Environment
NODE_ENV="development"
APP_ENV="development"
NEXT_PUBLIC_APP_ENV="development"

# URLs
APP_URL="http://localhost:4325"
FRONTEND_URL="http://localhost:4325"
LINE_MESSAGING_API="https://api.line.me/v2/bot/message"
```

#### 🔧 Optional Services

```env
# Cryptocurrency API (เฉพาะถ้าใช้ฟีเจอร์ crypto)
CMC_URL="https://pro-api.coinmarketcap.com"
CMC_API_KEY="your-coinmarketcap-api-key"

# Air Quality API (เฉพาะถ้าใช้ฟีเจอร์ air quality)
AIRVISUAL_API_KEY="your-airvisual-api-key"
```

### 🔒 การสร้าง Secret Keys

```bash
# สร้าง AUTH_SECRET
openssl rand -base64 32

# หรือใช้ script ที่เตรียมไว้
bun run generate:secrets
```

## 🗄️ การตั้งค่าฐานข้อมูล | Database Setup

### 🏠 Local MongoDB

#### 1. ติดตั้ง MongoDB

```bash
# macOS (Homebrew)
brew install mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb

# Windows - ดาวน์โหลดจาก https://www.mongodb.com/try/download/community
```

#### 2. รัน MongoDB Service

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

#### 3. สร้างฐานข้อมูลและผู้ใช้

```bash
# เข้า MongoDB shell
mongosh

# สร้างฐานข้อมูล
use bun_line_t3

# สร้างผู้ใช้
db.createUser({
  user: "bun_user",
  pwd: "secure_password",
  roles: [
    { role: "readWrite", db: "bun_line_t3" }
  ]
})
```

### ☁️ MongoDB Atlas (Cloud)

#### 1. สร้างฟรี Cluster

1. ไปที่ [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. สร้างบัญชีและ Cluster ใหม่
3. เลือก FREE tier (M0)
4. เลือก region ที่ใกล้ที่สุด

#### 2. กำหนดค่าความปลอดภัย

```bash
# IP Whitelist - เพิ่ม IP ของเครื่องคุณ
# หรือ 0.0.0.0/0 สำหรับ development (ไม่แนะนำสำหรับ production)

# สร้าง Database User
Username: bun_user
Password: [generate secure password]
Roles: Atlas admin
```

#### 3. รับ Connection String

```bash
# รูปแบบ Connection String
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
```

### 🔄 Prisma Setup

```bash
# Generate Prisma client
bunx prisma generate

# Push schema ไปยังฐานข้อมูล (สำหรับ development)
bunx prisma db push

# เปิด Prisma Studio เพื่อดูข้อมูล
bunx prisma studio
```

## 💬 การตั้งค่า LINE Bot | LINE Bot Setup

### 1. สร้าง LINE Channel

1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง Provider และ Channel ใหม่
3. เลือก **Messaging API**

### 2. กำหนดค่าพื้นฐาน

#### Basic Settings

- **Channel name**: ชื่อ Bot ของคุณ
- **Channel description**: คำอธิบาย Bot
- **Channel icon**: รูปไอคอน Bot

#### Messaging API Settings

```bash
# ใน LINE Developers Console
Webhook URL: https://your-domain.com/api/line
Use webhook: Enable
Auto-reply messages: Disable
Greeting messages: Disable
```

### 3. รับ Credentials

```bash
# ใน Basic Settings
Channel ID: 1234567890
Channel Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ใน Messaging API
Channel Access Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. LINE Login Setup (Optional)

```bash
# ใน LINE Login
Callback URL: https://your-domain.com/api/auth/callback/line
```

### 5. ทดสอบ Webhook

```bash
# ใช้ ngrok สำหรับ development
ngrok http 4325

# Update Webhook URL ใน LINE Console
https://xxxxx.ngrok.io/api/line
```

## 🚀 การรันโปรเจกต์ | Running the Project

### 🛠️ Development Mode

```bash
# รัน development server
bun run dev

# รัน development server พร้อม clean cache
bun run dev:clean

# รัน development server พร้อม local environment
bun run dev:local
```

### 🏗️ Production Build

```bash
# สร้าง production build
bun run build

# รัน production server
bun run start
```

### 🔧 Additional Scripts

```bash
# Database operations
bun run db:push          # Push schema changes
bun run db:generate      # Generate Prisma client
bun run db:deploy        # Deploy migrations

# Code quality
bun run lint             # Run ESLint
bun run type-check       # TypeScript type checking

# Testing
bun run test             # Run tests
bun run test:watch       # Run tests in watch mode

# Build tools
bun run tailwind:build   # Build Tailwind CSS
bun run tailwind:watch   # Watch Tailwind changes
```

## 🧪 การทดสอบ | Testing

### 🔍 Manual Testing

```bash
# ทดสอบระบบลงเวลา
bun run scripts/test-attendance.ts

# ทดสอบ LINE OAuth
bun run scripts/test-line-oauth.ts

# ทดสอบ timezone
bun run test:timezone
```

### 🏗️ Unit Testing

```bash
# รัน unit tests
bun test

# รัน tests ในโฟลเดอร์เฉพาะ
bun test tests/components
bun test tests/features

# รัน tests พร้อม watch mode
bun test --watch
```

### 🔒 Security Testing

```bash
# ตรวจสอบ dependencies
bun audit

# ตรวจสอบ TypeScript
bunx tsc --noEmit

# ตรวจสอบ linting
bun run lint
```

## 🐳 Docker Setup | การใช้งาน Docker

### 🔧 Prerequisites

```bash
# ติดตั้ง Docker และ Docker Compose
# https://docs.docker.com/get-docker/
```

### 🚀 Development with Docker

```bash
# สร้างและรัน containers
docker-compose up -d

# รัน development mode
docker-compose -f docker-compose.dev.yml up

# ดู logs
docker-compose logs -f app

# หยุด containers
docker-compose down
```

### 🏗️ Production Docker Build

```bash
# Build production image
docker build -t bun-line-t3 .

# รัน production container
docker run -p 3000:3000 --env-file .env.prod bun-line-t3

# หรือใช้ Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

## 🛠️ การแก้ไขปัญหา | Troubleshooting

### 🚫 ปัญหาที่พบบ่อย

#### 1. Bun Installation Issues

```bash
# ปัญหา: bun command not found
# แก้ไข: เพิ่ม bun ลง PATH
export PATH="$HOME/.bun/bin:$PATH"

# ปัญหา: Permission denied
# แก้ไข: ใช้ sudo หรือเปลี่ยน ownership
sudo chown -R $(whoami) ~/.bun
```

#### 2. Database Connection Issues

```bash
# ปัญหา: Unable to connect to MongoDB
# ตรวจสอบ:
1. MongoDB service running: systemctl status mongod
2. Connection string ถูกต้อง
3. Network connectivity
4. Authentication credentials

# แก้ไข: รีสตาร์ท MongoDB
sudo systemctl restart mongod
```

#### 3. LINE Bot Issues

```bash
# ปัญหา: Webhook verification failed
# ตรวจสอบ:
1. Channel Secret ถูกต้อง
2. Webhook URL accessible
3. SSL certificate valid (for production)

# ทดสอบ webhook locally
ngrok http 4325
# Update webhook URL: https://xxxxx.ngrok.io/api/line
```

#### 4. Build Issues

```bash
# ปัญหา: Type errors during build
# แก้ไข: ตรวจสอบ TypeScript
bunx tsc --noEmit

# ปัญหา: Out of memory during build
# แก้ไข: เพิ่ม memory limit
NODE_OPTIONS="--max_old_space_size=4096" bun run build
```

### 🔍 Debugging Commands

```bash
# ตรวจสอบ environment variables
bun run env:status

# ตรวจสอบ database connection
bun run scripts/test-db-connection.ts

# ตรวจสอบ health endpoint
curl http://localhost:4325/api/health

# ดู detailed logs
DEBUG=* bun run dev
```

### 📊 System Requirements

#### Minimum Requirements

- **RAM**: 2 GB
- **Disk**: 1 GB free space
- **Network**: Stable internet connection

#### Recommended Requirements

- **RAM**: 4 GB+
- **Disk**: 5 GB+ free space
- **CPU**: 2+ cores
- **Network**: Broadband connection

### 🆘 การขอความช่วยเหลือ | Getting Help

#### 📚 เอกสารเพิ่มเติม

- **[Development Guide](./DEVELOPMENT.md)** - คู่มือการพัฒนา
- **[API Documentation](./API.md)** - เอกสาร API
- **[Security Guide](./SECURITY.md)** - แนวทางความปลอดภัย

#### 🐛 รายงานปัญหา

1. ตรวจสอบ [Issues](https://github.com/your-repo/issues) ที่มีอยู่
2. สร้าง issue ใหม่พร้อมรายละเอียด:
   - เวอร์ชัน OS และ Node.js
   - ขั้นตอนการทำซ้ำปัญหา
   - Error messages และ logs
   - Environment configuration (ไม่รวม secrets)

#### 💬 Community Support

- **GitHub Discussions** - สำหรับคำถามทั่วไป
- **Discord/Slack** - สำหรับการสนทนาแบบ real-time
- **Stack Overflow** - tag: `bun-line-t3`

---

## ✅ Checklist การติดตั้งสำเร็จ

หลังจากติดตั้งเสร็จ ตรวจสอบรายการต่อไปนี้:

- [ ] Bun และ Node.js ติดตั้งเสร็จและรันได้
- [ ] MongoDB service running และเชื่อมต่อได้
- [ ] Environment variables กำหนดค่าครบถ้วน
- [ ] Prisma client generate สำเร็จ
- [ ] Database schema push สำเร็จ
- [ ] Development server รันได้ที่ port 4325
- [ ] เข้าถึง http://localhost:4325 ได้
- [ ] LINE Bot webhook ตั้งค่าถูกต้อง (ถ้าใช้)
- [ ] Health check endpoint (/api/health) ตอบกลับ OK

**🎉 ยินดีด้วย! โปรเจกต์พร้อมใช้งานแล้ว**

---

**📝 อัปเดตล่าสุด**: 14 มิถุนายน 2025
**👨‍💻 ผู้ดูแล**: Development Team
