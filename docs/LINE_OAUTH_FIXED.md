# LINE OAuth URL แก้ไขการตั้งค่า Redirect URL

## 🔧 สรุปปัญหา

ปัญหาที่พบ:
1. LINE OAuth URL ยังคงใช้ `localhost:4325` เป็น `redirect_uri` แม้จะตั้งค่า environment variables ให้ใช้ production domain แล้ว
2. NextAuth.js มีการใช้ค่า `NEXTAUTH_URL` เพื่อสร้าง callback URL โดยอัตโนมัติ แต่ไม่ได้ถูกโหลดหรือใช้งานอย่างถูกต้อง

## ✅ การแก้ไข

เราได้ดำเนินการดังต่อไปนี้เพื่อแก้ไขปัญหานี้:

### 1. สร้าง Custom LINE Provider

เราได้สร้าง custom LINE provider ที่บังคับให้ใช้ production URL เสมอ:
- สร้างไฟล์ `src/features/auth/line-provider.ts` เพื่อกำหนด custom LINE provider
- กำหนด `redirect_uri` เป็น production URL โดยตรงใน provider configuration
- ใช้ custom provider นี้แทน default LINE provider

### 2. แก้ไข Auth Configuration

- แก้ไข `src/lib/auth/index.ts` เพื่อใช้ custom LINE provider
- บังคับให้ใช้ production domain (`https://line-login.midseelee.com`) สำหรับ callback URL ในทุกกรณี
- เพิ่ม custom `redirect` callback ใน NextAuth configuration เพื่อบังคับให้ใช้ production URL

### 3. สร้าง Middleware เพื่อบังคับใช้ Production URL

- สร้าง middleware ที่จะแทรกแซง requests ไปยัง `/api/auth` paths
- โดยตั้งค่า headers เพื่อให้ NextAuth เข้าใจว่า request มาจาก production domain

### 4. สร้าง Debug Tools

- สร้าง API endpoint `/api/debug/line-oauth` เพื่อช่วยตรวจสอบการตั้งค่า
- ปรับปรุงหน้า `/line-oauth-test` เพื่อทดสอบการสร้าง LINE OAuth URL และตรวจสอบ `redirect_uri`
- สร้างสคริปต์ `restart-and-check.sh` เพื่อรีสตาร์ทเซิร์ฟเวอร์และตรวจสอบการตั้งค่า

## 📋 การตรวจสอบ

เมื่อทำการทดสอบ เราได้ยืนยันว่า:
1. LINE OAuth URL ที่สร้างขึ้นใช้ `https://line-login.midseelee.com/api/auth/callback/line` เป็น `redirect_uri` เสมอ
2. ไม่มีการใช้ `localhost` ในส่วนใดๆ ของ URL
3. การตั้งค่าทำงานได้ทั้งใน development และ production environment

## 🔒 ข้อควรจำ

1. อย่าลืมตั้งค่า environment variables ให้ครบถ้วน:
   ```
   NEXTAUTH_URL=https://line-login.midseelee.com
   FRONTEND_URL=https://line-login.midseelee.com
   NEXT_PUBLIC_NEXTAUTH_URL=https://line-login.midseelee.com
   ```

2. สำหรับ LINE Login ต้องตั้งค่า callback URL ใน LINE Developer Console ให้ตรงกับที่ใช้ (`https://line-login.midseelee.com/api/auth/callback/line`)

3. การเปลี่ยน domain name ในอนาคตจะต้องแก้ไขค่าใน:
   - Environment variables
   - Custom LINE provider (`line-provider.ts`)
   - Middleware configuration (`middleware.ts`)
   - LINE Developer Console settings
