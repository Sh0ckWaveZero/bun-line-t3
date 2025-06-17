# 📚 เอกสารประกอบโปรเจกต์ | Project Documentation

> **📋 ภาพรวมเอกสารสำหรับระบบ Bun LINE T3 Attendance**
> 
> อัปเดตล่าสุด: 14 มิถุนายน 2025

## 🚀 เอกสารหลัก | Core Documentation

### 📖 การเริ่มต้น | Getting Started
- **[README.md](../README.md)** - ภาพรวมโปรเจกต์และการติดตั้ง ⭐⭐⭐
- **[SETUP.md](./SETUP.md)** - คู่มือการติดตั้งและการกำหนดค่าโดยละเอียด
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - คู่มือการพัฒนาและ workflow

### 🏗️ สถาปัตยกรรมและการออกแบบ | Architecture & Design
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - สถาปัตยกรรมระบบและการออกแบบ
- **[BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)** - โครงสร้าง backend แบบ feature-based
- **[API.md](./API.md)** - เอกสาร API และตัวอย่างการใช้งาน
- **[DATABASE.md](./DATABASE.md)** - โครงสร้างฐานข้อมูลและ Prisma schema

## 🎯 เอกสารฟีเจอร์ | Feature Documentation

### 🏢 ระบบลงเวลา | Attendance System
- **[ATTENDANCE_SYSTEM.md](./ATTENDANCE_SYSTEM.md)** - ระบบบันทึกเวลาเข้างานและออกงาน
- **[AUTOMATED_CHECKOUT.md](./AUTOMATED_CHECKOUT.md)** - ระบบแจ้งเตือนออกงานอัตโนมัติ
- **[MONTHLY_REPORTS.md](./MONTHLY_REPORTS.md)** - ระบบรายงานรายเดือน

### 💬 LINE Bot Integration
- **[LINE_COMMANDS.md](./LINE_COMMANDS.md)** - คำสั่ง LINE Bot (English)
- **[LINE_COMMANDS_THAI.md](./LINE_COMMANDS_THAI.md)** - คำสั่ง LINE Bot (ไทย)
- **[LINE_WEBHOOK.md](./LINE_WEBHOOK.md)** - การตั้งค่า LINE Webhook และ security

### 💰 ระบบติดตาม Cryptocurrency
- **[CRYPTO_TRACKING.md](./CRYPTO_TRACKING.md)** - ระบบติดตามราคาเหรียญดิจิทัล

### 🌍 ระบบตรวจสอบคุณภาพอากาศ
- **[AIR_QUALITY.md](./AIR_QUALITY.md)** - ระบบแจ้งคุณภาพอากาศ

## 🔐 ความปลอดภัยและการ Deploy | Security & Deployment

### 🛡️ ความปลอดภัย | Security
- **[SECURITY.md](./SECURITY.md)** - แนวทางการรักษาความปลอดภัย
- **[SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)** - รายการตรวจสอบความปลอดภัย
- **[CRYPTO_SECURITY.md](./CRYPTO_SECURITY.md)** - การจัดการ cryptographic operations
- **[HYDRATION_SAFETY.md](./HYDRATION_SAFETY.md)** - การป้องกัน hydration mismatch errors

### 🚀 การ Deploy | Deployment
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - คู่มือการ deploy production
- **[GITHUB_ACTIONS.md](./GITHUB_ACTIONS.md)** - การตั้งค่า CI/CD pipeline
- **[DOCKER.md](./DOCKER.md)** - การใช้งาน Docker containerization
- **[ENVIRONMENT.md](./ENVIRONMENT.md)** - การจัดการ environment variables

## 🧪 การทดสอบ | Testing

### 🔬 Test Infrastructure
- **[TESTING.md](./TESTING.md)** - คู่มือการทดสอบและ test framework
- **[TEST_SETUP.md](../tests/TEST_SETUP.md)** - การตั้งค่า test infrastructure
- **[PERFORMANCE_TESTING.md](./PERFORMANCE_TESTING.md)** - การทดสอบประสิทธิภาพ
- **[HYDRATION_SAFETY.md](./HYDRATION_SAFETY.md)** - การทดสอบ hydration safety

## 🛠️ การพัฒนา | Development

### 💻 Development Workflow
- **[CODING_STANDARDS.md](./CODING_STANDARDS.md)** - มาตรฐานการเขียนโค้ด
- **[GIT_WORKFLOW.md](./GIT_WORKFLOW.md)** - Git workflow และ branching strategy
- **[CODE_REVIEW.md](./CODE_REVIEW.md)** - แนวทางการ review โค้ด

### 🏗️ Technical References
- **[TYPESCRIPT_GUIDE.md](./TYPESCRIPT_GUIDE.md)** - แนวทางการใช้ TypeScript
- **[REACT_PATTERNS.md](./REACT_PATTERNS.md)** - React 19 patterns และ best practices
- **[NEXTJS_GUIDE.md](./NEXTJS_GUIDE.md)** - Next.js 15 App Router guide

## 📊 การตรวจสอบและบำรุงรักษา | Monitoring & Maintenance

### 🔍 Monitoring
- **[MONITORING.md](./MONITORING.md)** - การตรวจสอบระบบและ logging
- **[PERFORMANCE.md](./PERFORMANCE.md)** - การปรับปรุงประสิทธิภาพ
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - การแก้ไขปัญหาที่พบบ่อย

### 🔄 Maintenance
- **[BACKUP.md](./BACKUP.md)** - การสำรองข้อมูลและการกู้คืน
- **[UPDATES.md](./UPDATES.md)** - การอัปเดต dependencies และ security patches

## 🚀 แผนการพัฒนา | Development Roadmap

### 📅 Plans & Timeline
- **[ROADMAP.md](./ROADMAP.md)** - แผนการพัฒนาระยะสั้นและระยะยาว
- **[FUTURE_FEATURES.md](./FUTURE_FEATURES.md)** - ฟีเจอร์ที่วางแผนไว้
- **[CHANGELOG.md](./CHANGELOG.md)** - บันทึกการเปลี่ยนแปลงและ releases

## 🤝 การมีส่วนร่วม | Contributing

### 👥 Community
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - แนวทางการมีส่วนร่วมในโปรเจกต์
- **[ISSUES.md](./ISSUES.md)** - การรายงานปัญหาและการแก้ไข
- **[FEATURE_REQUESTS.md](./FEATURE_REQUESTS.md)** - การขอฟีเจอร์ใหม่

## 📋 Quick Reference | การอ้างอิงด่วน

### 🔧 เทคโนโลยีหลัก | Core Technologies
- **Bun** - JavaScript runtime และ package manager
- **Next.js 15** - React framework ด้วย App Router
- **React 19** - UI library พร้อม Server Components
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Type-safe database ORM
- **MongoDB** - Document database
- **Tailwind CSS** - Utility-first CSS framework
- **LINE Messaging API** - Bot integration

### 📞 การติดต่อและการช่วยเหลือ | Support & Contact
- **GitHub Issues** - สำหรับรายงานปัญหา
- **Discussions** - สำหรับคำถามและการสนทนา
- **Documentation Updates** - แจ้งเมื่อเอกสารล้าสมัย

---

## 🎯 การใช้งานเอกสาร | How to Use This Documentation

### สำหรับผู้เริ่มต้น | For Beginners
1. อ่าน **README.md** เพื่อทำความเข้าใจภาพรวม
2. ติดตาม **SETUP.md** เพื่อติดตั้งและรัน
3. ศึกษา **DEVELOPMENT.md** เพื่อเริ่มพัฒนา

### สำหรับนักพัฒนา | For Developers
1. ศึกษา **ARCHITECTURE.md** เพื่อเข้าใจโครงสร้าง
2. อ่าน **CODING_STANDARDS.md** เพื่อรู้มาตรฐาน
3. ดูที่ **API.md** สำหรับการพัฒนา API

### สำหรับ DevOps | For DevOps
1. ตรวจสอบ **DEPLOYMENT.md** สำหรับการ deploy
2. อ่าน **SECURITY.md** เพื่อความปลอดภัย
3. ดูที่ **MONITORING.md** สำหรับการตรวจสอบ

### สำหรับผู้ใช้งาน | For Users
1. อ่าน **LINE_COMMANDS_THAI.md** เพื่อใช้งาน LINE Bot
2. ดูที่ **ATTENDANCE_SYSTEM.md** เพื่อเข้าใจระบบลงเวลา

---

**📝 หมายเหตุ**: เอกสารนี้จะได้รับการอัปเดตอย่างสม่ำเสมอเพื่อให้ทันสมัยกับการพัฒนาของโปรเจกต์

**🔄 อัปเดตล่าสุด**: 14 มิถุนายน 2025 - จัดระเบียบโครงสร้างเอกสารใหม่และเพิ่มเนื้อหาที่สำคัญ
