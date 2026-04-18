# 🐛 คู่มือ Debug LINE User ID Logging

## 📋 วัตถุประสงค์

อธิบายวิธีดูและอ่าน Log เพื่อ Debug ปัญหา LINE User ID ที่ไม่ตรงกันระหว่าง Bot และ LINE Login

---

## 🔍 จุดที่มี Logging

### 1. **LINE Webhook** (`/api/line`)
เวลา Bot รับข้อความ/เหตุการณ์

```bash
📨 [LINE Webhook] Event 1/1:
  eventType: "message"
  messageType: "text"
  botUserId: "Ufbce63127fe031cd09521720ec5ac8cd"
  timestamp: 1234567890
```

### 2. **Bot Commands** (`handleDcaCommand.ts`)
เวลา Bot ประมวลผลคำสั่ง

```bash
🤖 [DCA Add] Bot User ID from webhook: Ufbce6312...
🔗 [DCA Add] User ID mapping:
  botUserId: Ufbce63127fe031cd09521720ec5ac8cd
  loginUserId: U2b569682d48c37664b6d0b92c2179a7f
  finalUserId: U2b569682d48c37664b6d0b92c2179a7f
  source: "Login User ID (from approval)"
```

### 3. **Web Query** (`getLineUserIds`)
เวลา Web query ข้อมูล

```bash
🔍 [getLineUserIds] Session user:
  userId: "6789..."
  email: "U2b569682...@line.local"
  name: "John Doe"

📋 [getLineUserIds] Login User IDs (from OAuth):
  - U2b569682d48c37664b6d0b92c2179a7f

🔗 [getLineUserIds] Linked approvals:
  - botId: Ufbce6312..., loginId: U2b569682...

👤 [getLineUserIds] Profile-matched Bot IDs:
  - Ufbce63127fe031cd09521720ec5ac8cd

✅ [getLineUserIds] Final User IDs (3):
  - Ufbce63127fe031cd09521720ec5ac8cd (Bot)
  - U2b569682d48c37664b6d0b92c2179a7f (Login)
  - U123...
```

### 4. **Authorization Check** (`getAuthorizedLineUserId`)
เวลาตรวจสอบสิทธิ์

```bash
🔐 [getAuthorizedLineUserId] Authorization check:
  requestedId: "U2b569682..."
  authorizedId: "U2b569682..."
  isAuthorized: true
  availableIds: [Ufbce6312..., U2b569682...]
```

---

## 🧪 วิธี Debug ทีละกรณี

### กรณีที่ 1: Bot สร้าง DCA แต่ Web ไม่เจอ

**Step 1:** ส่งคำสั่งผ่าน Bot
```bash
/dca add 100 BTC 0.001 2000000
```

**Step 2:** ดู Log ฝั่ง Bot
```bash
# ควรเห็น:
🤖 [DCA Add] Bot User ID from webhook: Ufbce6312...
🔗 [DCA Add] User ID mapping:
  botUserId: Ufbce6312...
  loginUserId: U2b569682...
  finalUserId: U2b569682...  ← ใช้อันนี้ในการสร้าง DCA
  source: "Login User ID (from approval)"
```

**Step 3:** เปิด Web
```bash
https://bun-line.midseelee.com/dca-history
```

**Step 4:** ดู Log ฝั่ง Web
```bash
# ควรเห็น:
🔍 [getLineUserIds] Session user: ...
✅ [getLineUserIds] Final User IDs (3):
  - U2b569682...  ← ต้องมีอันนี้
  - Ufbce6312...
```

**ถ้าไม่เจอ:**
- ตรวจสอบว่า `loginUserId` ตรงกันในทั้ง 2 log
- ถ้าไม่ตรง → อาจเป็นปัญหา approval mapping

---

### กรณีที่ 2: ต้องการทราบว่า ID ไหนคืออะไร

**อ่าน Log จาก `source`:**

```bash
# source: "Login User ID (from approval)"
→ ใช้ Login ID ที่ได้จาก approval
→ หมายความว่า Bot ID และ Login ID ผูกกันแล้ว

# source: "Bot User ID (fallback)"
→ ใช้ Bot ID เพราะไม่มี Login ID
→ หมายความว่ายังไม่มีการ approve
```

---

### กรณีที่ 3: ต้องการดู Mapping ทั้งหมด

**Query Database:**

```javascript
// MongoDB Console
db.lineApprovalRequest.find({ status: "APPROVED" })
  .map(doc => ({
    botId: doc.lineUserId,
    loginId: doc.loginLineUserId,
    name: doc.displayName,
  }))

// ผลลัพธ์:
[
  {
    botId: "Ufbce63127fe031cd09521720ec5ac8cd",
    loginId: "U2b569682d48c37664b6d0b92c2179a7f",
    name: "John Doe"
  }
]
```

---

## 🔧 วิธี Enable Logging (ถ้าปิดอยู่)

Logging เปิดอยู่แล้วโดย default แต่ถ้าต้องการปรับแต่ง:

```typescript
// .env.local
LOG_LEVEL=debug          // verbose logging
LOG_LINE_USER_IDS=true   // log LINE User IDs
```

---

## 📊 ตัวอย่าง Log Flow ที่สมบูรณ์

### สถานการณ์: User ส่ง `/dca add` ผ่าน Bot

```bash
# ===== 1. Bot รับข้อความ =====
📨 [LINE Webhook] Event 1/1:
  eventType: "message"
  messageType: "text"
  botUserId: "Ufbce63127fe031cd09521720ec5ac8cd"

# ===== 2. Bot ประมวลผลคำสั่ง =====
🤖 [DCA Add] Bot User ID from webhook: Ufbce6312...

# ===== 3. หา Login ID จาก approval =====
🔗 [DCA Add] User ID mapping:
  botUserId: "Ufbce63127fe031cd09521720ec5ac8cd"
  loginUserId: "U2b569682d48c37664b6d0b92c2179a7f"
  finalUserId: "U2b569682d48c37664b6d0b92c2179a7f"
  source: "Login User ID (from approval)"

# ===== 4. สร้าง DCA Order =====
[DCA Service] Creating order:
  lineUserId: "U2b569682d48c37664b6d0b92c2179a7f"  ← ใช้อันนี้
  coin: "BTC"
  amountTHB: 100

# ===== 5. Web query DCA =====
🔍 [getLineUserIds] Session user: ...

📋 [getLineUserIds] Login User IDs:
  - U2b569682d48c37664b6d0b92c2179a7f

🔗 [getLineUserIds] Linked approvals:
  - botId: Ufbce6312..., loginId: U2b569682...

✅ [getLineUserIds] Final User IDs (2):
  - Ufbce6312... (Bot)
  - U2b569682... (Login)

# ===== 6. Query DCA Orders =====
[DCA Service] Querying orders:
  lineUserId: ["U2b569682..."]
  → เจอ order ที่สร้างจาก Bot!
```

---

## 🚨 ปัญหาที่พบบั่อย

### ปัญหา 1: `source: "Bot User ID (fallback)"`

**หมายความ:** ยังไม่มีการ approve

**วิธีแก้:**
1. User ต้อง approve ก่อน: `/login`
2. หรือตั้งค่า LINE Login ให้ใช้ Channel เดียวกับ Bot

---

### ปัญหา 2: `loginUserId` เป็น `null`

**หมายความ:** ไม่มีการผูก Bot ID กับ Login ID

**วิธีแก้:**
1. ตรวจสอบ `lineApprovalRequest` collection
2. ตรวจสอบว่า `loginLineUserId` ถูกตั้งค่าหรือยัง
3. Re-approve ผ่าน `/login` อีกครั้ง

---

### ปัญหา 3: `finalUserId` ไม่ตรงกับที่ Web query

**หมายความ:** Mapping ผิดพลาด

**วิธีแก้:**
1. Clear browser cache
2. Logout และ login ใหม่
3. ตรวจสอบ `accounts` collection ว่ามีการ update หรือยัง

---

## 📝 Check List ก่อน Debug

- [ ] เปิด Console Log (Server)
- [ ] เปิด Browser DevTools Console
- [ ] ทดสอบด้วย Bot command ก่อน
- [ ] ทดสอบด้วย Web query หลังจากนั้น
- [ ] เปรียบเทียบ User ID จากทั้ง 2 ทาง
- [ ] ตรวจสอบ Database ถ้าจำเป็น

---

## 💡 Tips

1. **Search Log ง่ายๆ:**
   ```bash
   # Search ด้วย Bot User ID
   grep "Ufbce6312" logs/server.log

   # Search ด้วย Login User ID
   grep "U2b569682" logs/server.log

   # Search DCA operations
   grep "\[DCA" logs/server.log
   ```

2. **Filter Log ตาม Event:**
   ```bash
   # Webhook events only
   grep "\[LINE Webhook\]" logs/server.log

   # User ID mapping only
   grep "\[DCA.*User ID mapping\]" logs/server.log
   ```

3. **Monitor Real-time:**
   ```bash
   # Tail logs แบบ real-time
   tail -f logs/server.log | grep LINE
   ```

---

**สรุป:** Logging จะช่วยให้เห็นภาพรวมว่าระบบใช้ User ID อะไรในแต่ละขั้นตอน ✅
