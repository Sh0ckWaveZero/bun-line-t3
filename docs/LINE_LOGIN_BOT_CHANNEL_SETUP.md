# 📱 ตั้งค่า LINE Login ให้ใช้ Channel เดียวกับ LINE Bot

## 🎯 วัตถุประสงค์

แก้ปัญหา **LINE User ID ไม่ตรงกัน** ระหว่าง LINE Messaging API (Bot) และ LINE Login

**ปัญหา:**
- Bot User ID: `Ufbce6312...` (จาก Webhook)
- Login User ID: `U2b569682...` (จาก OAuth)
- ❌ คนละตัว → ข้อมูล DCA ไม่ตรงกัน

**วิธีแก้:**
ใช้ LINE Login และ LINE Messaging API อยู่ใน **Channel เดียวกัน**

---

## 🛠️ วิธีตั้งค่า (ทีละสภาพ)

### สำหรับ Production (bun-line.midseelee.com)

1. **เข้าสู่ [LINE Developers Console](https://developers.line.biz/console)**

2. **เลือก Channel ที่ใช้เป็น Bot อยู่แล้ว**
   - หา Channel ที่มี **LINE Messaging API** ใช้งานอยู่
   - จด Channel ID ไว้ (เช่น `2001234567`)

3. **เปิดใช้งาน LINE Login ใน Channel เดียวกัน**
   - ไปที่ tab **LINE Login**
   - กด **Enable** หรือ **Add**
   - เลือก:
     - **Callback URL**: `https://bun-line.midseelee.com/api/auth/callback/line`
     - **Email permission**: เปิดตามต้องการ

4. **คัดลอก Credentials**
   - **LINE Channel ID**: ใช้อันเดียวกับ Bot
   - **LINE Channel Secret**: ใช้อันเดียวกับ Bot
   - **LINE Login Client ID**: ใช้อันเดียวกับ Bot
   - **LINE Login Client Secret**: ใช้อันเดียวกับ Bot

5. **อัปเดต Environment Variables**
   ```bash
   # .env.production
   LINE_CHANNEL_ID=2001234567              # Bot + Login (เดียวกัน)
   LINE_CHANNEL_SECRET=your_channel_secret
   LINE_CLIENT_ID=your_login_client_id      # ใช้อันเดียวกับ Channel ID
   LINE_CLIENT_SECRET=your_login_secret    # ใช้อันเดียวกับ Channel Secret
   LINE_ACCESS_TOKEN=your_bot_token
   ```

6. **Redeploy**
   ```bash
   bun run deploy
   ```

---

### สำหรับ Local (line-login.midseelee.com)

ทำเหมือนกัน แต่ใช้ Channel อื่น:

1. **สร้าง Channel ใหม่** (ถ้ายังไม่มี)
   - ไปที่ [LINE Developers Console](https://developers.line.biz/console)
   - กด **Create new provider**
   - กด **Create a Channel**
   - เลือก **LINE Login**

2. **เปิดใช้งาน LINE Messaging API**
   - ไปที่ tab **LINE Messaging API**
   - กด **Enable**
   - Generate **Channel Secret** และ **Access Token**

3. **ตั้งค่า Local Environment**
   ```bash
   # .env.local
   LINE_CHANNEL_ID=2009876543              # Local channel
   LINE_CHANNEL_SECRET=local_channel_secret
   LINE_CLIENT_ID=local_login_client_id
   LINE_CLIENT_SECRET=local_login_secret
   LINE_ACCESS_TOKEN=local_bot_token
   ```

---

## ✅ ตรวจสอบว่าทำถูกต้อง

หลังจากตั้งค่าแล้ว:

1. **ทดสอบ LINE Login**
   - เข้า `https://bun-line.midseelee.com/login`
   - กด "Login with LINE"
   - ตรวจสอบใน Database:
     ```typescript
     // ดูใน MongoDB compass
     db.accounts.find({ providerId: "line" })
       // accountId ควรเป็น LINE User ID เดียวกับ Bot
     ```

2. **ทดสอบ Bot + Login Matching**
   - ส่งข้อความหา Bot: `/dca help`
   - Bot จะตอบกลับมา
   - ตรวจสอบใน `lineApprovalRequest`:
     - `lineUserId`: Bot User ID
     - `loginLineUserId`: ควรตรงกับ `accountId` ใน `accounts`

3. **ทดสอบ DCA Integration**
   - สร้าง DCA ผ่าน Bot: `/dca add 100 BTC 0.001 2000000`
   - เปิดเว็บ: `https://bun-line.midseelee.com/dca-history`
   - ควรเห็นรายการที่เพิ่งสร้าง

---

## 🔍 Debug ถ้ายังไม่ตรงกัน

### 1. เช็ค LINE User IDs

```typescript
// ใน line-user-id.ts
console.log("Account IDs (Login):", accountLineUserIds);
console.log("Bot IDs (Approval):", botIds);
console.log("All IDs:", allIds);
```

### 2. เช็ค Database

```javascript
// MongoDB Compass
db.accounts.find({ providerId: "line" })
  // accountId ควรเป็น U2b569682...

db.lineApprovalRequest.find({ status: "APPROVED" })
  // lineUserId: Ufbce6312... (Bot)
  // loginLineUserId: U2b569682... (Login) ← ควรตรงกัน
```

### 3. เช็ค Webhook vs OAuth

```bash
# Bot Webhook → Console log
console.log("Bot User ID:", event.source.userId)
// Ufbce6312...

# LINE Login → Browser Console
console.log("Login User ID:", session.user.email)
// U2b569682...@line.local
```

---

## 📋 Checklist ก่อน Deploy

- [ ] LINE Login และ LINE Messaging API อยู่ใน Channel เดียวกัน
- [ ] Callback URL ตรงกับ production domain
- [ ] Environment variables อัปเดตแล้ว
- [ ] ทดสอบ LINE Login แล้ว
- [ ] ทดสอบ Bot command แล้ว
- [ ] DCA data ตรงกันระหว่าง Bot และ Web
- [ ] Deploy แล้ว

---

## 💡 เคล็ดลับ

### ถ้ามีหลาย Environment

```
Development → Channel A (Local)
Staging     → Channel B (Test)
Production  → Channel C (Live)
```

แต่ละ Channel ควรมีทั้ง:
- ✅ LINE Messaging API (Bot)
- ✅ LINE Login

### ถ้าต้องใช้คนละ Channel (ไม่แนะนำ)

ถ้าจำเป็นต้องใช้คนละ channel:
- ต้องแก้โค้ดให้รองรับการ map ID (เช่น ผ่าน `loginLineUserId`)
- ต้องมีการ approve เสมอ
- ซับซ้อนกว่า

---

## 🆘 ถ้ามีปัญหา

1. **Login ไม่ผ่าน**
   - เช็ค Callback URL
   - เช็จ Environment variables
   - ดู Console log

2. **Bot ส่งข้อความไม่ได้**
   - เช็ค Webhook URL
   - เช็ค Channel Secret
   - เช็ค Signature verification

3. **DCA data ไม่ตรงกัน**
   - เช็ค `getLineUserIds()` ว่า return อะไร
   - เช็คว่า Bot ใช้ ID ตัวไหน
   - Clear browser cache

---

**สรุป:** ใช้ Channel เดียวกัน = ง่ายที่สุด ✅
