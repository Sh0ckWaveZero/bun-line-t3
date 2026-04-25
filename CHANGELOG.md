# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-04-25

### Added
- **Expense Tracker** — บันทึกรายรับรายจ่ายรายเดือน พร้อม categories และ LINE bot integration
- **Expense Charts** — Donut chart แสดงสัดส่วนรายจ่ายต่อหมวดหมู่ และ Bar chart เปรียบเทียบ 6 เดือนย้อนหลัง (lazy load)
- **Expense Export** — Export รายการเป็น Excel (.xlsx) 2 sheet (รายการ + สรุป) พร้อมวันที่ในรูปแบบพุทธศักราช
- **Hide Amounts Toggle** — ซ่อน/แสดงจำนวนเงินทั้งหน้า
- **PWA Icons** — icon-192x192.png และ icon-512x512.png สำหรับ Web App Manifest

### Changed
- **Expense Tracker Refactor** — แยก `expenses.tsx` (~1800 บรรทัด) ออกเป็น components และ custom hooks แยกไฟล์
  - Components: `AddTransactionModal`, `AddCategoryModal`, `CategoryManagerModal`, `EmojiPickerModal`, `ExpenseDonutChart`, `MonthlyBarChart`, `SummaryCard`, `TransactionRow`
  - Hooks: `useExpenseTransactions`, `useExpenseCategories`, `useMonthlyCharts`, `useMonthNavigation`, `useTransactionModal`, `useCategoryModalFlow`, `useExpensePageUI`

### Fixed
- **deps**: เปลี่ยน xlsx จาก SheetJS CDN tgz เป็น npm `xlsx@0.18.5` เพื่อแก้ Docker `--frozen-lockfile` error

---

## [1.1.0] - 2026-04-18

### Added
- **Calendar Holidays Management** — ระบบจัดการวันหยุดและวันลาแบบครบวงจร
- **Mobile Calendar (PWA)** — ปฏิทินเพิ่มประสิทธิภาพสำหรับมือถือ รองรับ Add to Home Screen
- **Dark Mode** — รองรับ dark mode ทั่วทั้งหน้า calendar
- **Holiday/Leave Modals** — modal สำหรับเพิ่ม/แก้ไขวันหยุดและวันลา พร้อม Thai calendar
- **LINE Messaging API User Linking** — เชื่อมบัญชี LINE Login กับ LINE Messaging API user ID
- **Air Quality (AQICN)** — ย้ายจาก Open-Meteo ไปใช้ AQICN สำหรับข้อมูล AQI แบบ real-time

### Changed
- **Auth (Prisma 7)** — อัปเกรด better-auth ให้ใช้ Prisma 7 PostgreSQL adapter
- **Docker** — ลด image size โดยย้าย dev-only packages ไป devDependencies

### Fixed
- **auth**: แก้ LINE account unique constraint ด้วย custom adapter
- **auth**: ป้องกัน duplicate session token บน LINE OAuth callback
- **auth**: เพิ่ม Cloudflare Tunnel support สำหรับ LINE OAuth
- **docker**: แก้ Prisma generated client copy path
- **cron**: แก้ cronjobs ที่ทำงานไม่ถูกต้อง 4 จุด
- **attendance**: เพิ่ม `canReceiveReminders` check ก่อนส่ง checkout reminder
- **line**: แก้ webhook signature, account checks และ remove invalid 401 responses

### Removed
- ฟีเจอร์ที่ไม่ใช้: Spotify, health-activity, debug endpoint

---

## [1.0.0] - 2026-04-14

### Added
- LINE Login OAuth ด้วย better-auth
- DCA (Dollar Cost Averaging) tracking ผ่าน LINE bot
- Attendance check-in/check-out ผ่าน LINE bot
- Air quality monitoring
- Calendar วันหยุดไทย
- Dashboard หน้าหลัก
- Docker production deployment พร้อม self-hosted GitHub Actions runner
