# 🔐 LINE OAuth Configuration Guide | คู่มือการตั้งค่า LINE OAuth

> **ปัญหาปัจจุบัน**: LINE Login callback URL ไม่ตรงกันระหว่าง development และ production

## 🚨 ปัญหาที่พบ | Current Issue

### Error Details
```
GET https://access.line.me/oauth2/v2.1/authorize?client_id=1657339595&...&redirect_uri=http%3A%2F%2Flocalhost%3A4325%2Fapi%2Fauth%2Fcallback%2Fline 400 (Bad Request)
```

### สาเหตุ | Root Cause
- **Production Callback URL**: `https://line-login.midseelee.com/api/auth/callback/line`
- **Development Callback URL**: `http://localhost:4325/api/auth/callback/line`
- **ปัญหา**: LINE Client ID `1657339595` ถูกกำหนดให้ใช้กับ production domain เท่านั้น

## 🛠️ วิธีแก้ไข | Solutions

### Option 1: สร้าง LINE Login Channel ใหม่สำหรับ Development (แนะนำ)

#### 1. เข้าไปที่ LINE Developers Console
```
https://developers.line.biz/console/
```

#### 2. สร้าง New Provider หรือใช้ Provider เดิม

#### 3. สร้าง New Channel
- **Channel Type**: LINE Login
- **Channel Name**: `Your App Dev` (หรือชื่ที่ระบุว่าเป็น development)
- **Channel Description**: Development environment for LINE Login

#### 4. กำหนด Callback URL
```
http://localhost:4325/api/auth/callback/line
```

#### 5. Copy Credentials ใหม่
- **Channel ID**: `[NEW_DEV_CHANNEL_ID]`
- **Channel Secret**: `[NEW_DEV_CHANNEL_SECRET]`

#### 6. อัพเดท `.env.development`
```bash
# LINE Login Provider - DEVELOPMENT
LINE_CLIENT_ID=[NEW_DEV_CHANNEL_ID]
LINE_CLIENT_SECRET=[NEW_DEV_CHANNEL_SECRET]
LINE_LOGIN_CHANNEL_ID=[NEW_DEV_CHANNEL_ID]
LINE_LOGIN_CHANNEL_SECRET=[NEW_DEV_CHANNEL_SECRET]
```

### Option 2: เพิ่ม Callback URL ใน Channel เดิม

#### 1. ไปที่ LINE Developers Console
- เลือก Channel ID `1657339595`
- ไปที่ **LINE Login** tab

#### 2. เพิ่ม Callback URL ใหม่
เพิ่ม URL ต่อไปนี้ใน **Callback URL** list:
```
http://localhost:4325/api/auth/callback/line
```

**Final Callback URLs:**
```
https://line-login.midseelee.com/api/auth/callback/line
http://localhost:4325/api/auth/callback/line
```

## 🔧 การใช้งาน Environment Files | Environment File Usage

### Development Mode
```bash
# ใช้ .env.development
bun run dev
```

### Production Mode
```bash
# ใช้ .env.local (production settings)
bun run build
bun run start
```

### ไฟล์ Environment ที่ถูกสร้าง | Environment Files Created

#### `.env.development` - สำหรับ Development
```bash
NEXTAUTH_URL=http://localhost:4325
FRONTEND_URL=http://localhost:4325
# + LINE credentials สำหรับ development
```

#### `.env.local` - สำหรับ Production
```bash
NEXTAUTH_URL=https://line-login.midseelee.com
FRONTEND_URL=https://line-login.midseelee.com
# + LINE credentials สำหรับ production
```

## 📋 Checklist การแก้ไข | Fix Checklist

### ✅ ขั้นตอนที่ทำเสร็จแล้ว | Completed Steps
- [x] สร้าง `.env.development` สำหรับ local development
- [x] อัพเดท `.env.local` ให้เป็น production configuration
- [x] ระบุปัญหาและวิธีแก้ไขในเอกสาร

### 🔄 ขั้นตอนที่ต้องทำต่อ | Next Steps Required
- [ ] **Option 1**: สร้าง LINE Login Channel ใหม่สำหรับ development
- [ ] **Option 2**: เพิ่ม localhost callback URL ใน Channel เดิม
- [ ] อัพเดท credentials ใน `.env.development`
- [ ] ทดสอบ LINE Login ใน development environment

## 🚀 วิธีทดสอบหลังแก้ไข | Testing After Fix

### 1. รีสตาร์ท Development Server
```bash
# Stop current server
# Restart with development environment
NODE_ENV=development bun run dev
```

### 2. ทดสอบ LINE Login
1. เปิด `http://localhost:4325`
2. คลิก "Login with LINE"
3. ตรวจสอบว่าไม่มี 400 Bad Request error
4. ตรวจสอบว่า callback สำเร็จ

### 3. ตรวจสอบ Console
```bash
# ไม่ควรมี errors เหล่านี้:
# - GET https://access.line.me/oauth2/v2.1/authorize ... 400 (Bad Request)
# - ERR_BLOCKED_BY_CONTENT_BLOCKER
```

## 🔐 ข้อมูล LINE Channel ปัจจุบัน | Current LINE Channel Info

### Production Channel (Client ID: 1657339595)
- **Domain**: `https://line-login.midseelee.com`
- **Callback URL**: `https://line-login.midseelee.com/api/auth/callback/line`
- **Status**: ✅ Working for production

### Development Channel (ต้องสร้างใหม่หรือแก้ไข)
- **Domain**: `http://localhost:4325`
- **Required Callback URL**: `http://localhost:4325/api/auth/callback/line`
- **Status**: ❌ Not configured yet

## 📞 ขั้นตอนต่อไป | Next Actions

1. **เลือกวิธีแก้ไข**: Option 1 (แนะนำ) หรือ Option 2
2. **ดำเนินการใน LINE Developers Console** ตามวิธีที่เลือก
3. **อัพเดท credentials** ใน `.env.development`
4. **ทดสอบ LINE Login** ใน development environment
5. **อัพเดทเอกสารนี้** เมื่อแก้ไขเสร็จสิ้น

---

**🎯 เป้าหมาย**: ให้ LINE Login ทำงานได้ทั้งใน development (`localhost:4325`) และ production (`https://line-login.midseelee.com`) โดยไม่มีข้อผิดพลาด
