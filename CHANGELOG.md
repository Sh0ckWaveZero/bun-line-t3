# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-04-26

### Added
- **Feature-Based Architecture** — แปลงโครงสร้างโปรเจกต์เป็น feature-based architecture สำหรับ scalability และ maintainability
- **Route Guard Pattern** — เพิ่ม `requireAuth` และ `requireAdmin` helpers สำหรับ protected routes ด้วย `beforeLoad`
- **Feature Pages** — Extract page components จาก route files ไปยัง `src/features/*/pages/`
- **Feature Hooks** — จัดระเบียบ custom hooks ไว้ใน `src/features/*/hooks/` แทน `src/hooks/`
- **Auth Pages** — เพิ่ม `src/features/auth/pages/` สำหรับ `PendingApprovalPage`

### Changed
- **Route Files (Thinning)** — แปลง route files จาก 800+ บรรทัดให้เหลือ 6-10 บรรทัด (thin configs)
  - `src/routes/expenses.tsx` → 8 lines
  - `src/routes/attendance-report.tsx` → 8 lines
  - `src/routes/dca-history.tsx` → 8 lines
  - `src/routes/subscriptions.tsx` → 8 lines
  - `src/routes/dashboard.tsx` → 8 lines
  - `src/routes/calendar.tsx` → 8 lines
  - `src/routes/monitoring.tsx` → 8 lines
  - `src/routes/line-approval.tsx` → 8 lines
  - `src/routes/pending-approval.tsx` → 3 lines
  - `src/routes/calendar.mobile.tsx` → 3 lines
- **Auth Standardization** — ทำให้ protected routes ใช้ `beforeLoad: requireAuth` แบบ declarative ทั้งหมด
- **Component Organization** — ย้าย components จาก `src/components/[feature]/` ไป `src/features/[feature]/components/`
  - `src/components/attendance/` → `src/features/attendance/components/`
  - `src/components/expenses/` → `src/features/expenses/components/`
  - `src/components/subscriptions/` → `src/features/subscriptions/components/`
  - `src/components/calendar/` → `src/features/calendar/components/`
  - `src/components/thai-id/` → `src/features/tools/components/`
- **Hook Organization** — ย้าย hooks ไปยัง feature directories
  - `src/hooks/useDca*.ts` → `src/features/dca/hooks/`
  - `src/hooks/useAttendance*.ts` → `src/features/attendance/hooks/`
  - `src/hooks/useLineApproval.ts` → `src/lib/auth/hooks/`
- **Lib Modules** — ย้าย feature-specific lib ไปยัง feature directories
  - `src/lib/dca/` → `src/features/dca/lib/`
  - `src/lib/line/` + `src/lib/line-utils/` → `src/features/line/`
- **Import Paths** — อัปเดต import paths ทั้งหมดให้สอดคล้องกับ feature-based architecture
- **Documentation** — อัปเดตเอกสารทั้งหมดให้สะท้อนโครงสร้างใหม่
  - `docs/ARCHITECTURE.md` — อัปเดต directory structure และ tech stack
  - `docs/DEVELOPER_GUIDE.md` — อัปเดต coding standards และ import patterns
  - `README.md` — อัปเดต architecture section
  - `AGENTS.md` — อัปเดต development guide สำหรับ AI agents

### Fixed
- **React Key Conflict** — แก้ duplicate key warning `closed-new` ใน modal components
  - เพิ่ม unique prefixes: `transaction-` และ `category-`
- **Finance Menu Auth** — เพิ่ม `requiresAuth: true` สำหรับ finance menu
- **DCA History Auth** — เพิ่ม `beforeLoad: requireAuth` สำหรับ `/dca-history`
- **TypeScript Errors** — แก้ type errors หลังจาก refactor (session type narrowing)

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
- **Header Component Refactor** — แยก Header component เป็น modules พร้อม navigation config และ type safety
- **Logout Flow** — ปรับปรุง logout process พร้อม clear browser state และ proper redirect handling
- **Service Worker Caching** — เพิ่ม smart exclusion rules สำหรับ auth routes และ build assets

### Fixed
- **deps**: เปลี่ยน xlsx จาก SheetJS CDN tgz เป็น npm `xlsx@0.18.5` เพื่อแก้ Docker `--frozen-lockfile` error
- **manifest**: เพิ่ม `scope: "/"` แก้ปัญหา PWA shortcuts warnings ใน browser
- **auth**: ลบ debug console.logs ที่เหลืออยู่จาก development

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
