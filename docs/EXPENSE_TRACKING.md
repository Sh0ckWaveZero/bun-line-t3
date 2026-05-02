# ระบบติดตามรายรับรายจ่าย (Expense Tracking)

## 📋 ภาพรวม

ระบบติดตามรายรับรายจ่ายแบบครบวงจรผ่าน LINE Bot พร้อมฟีเจอร์:

- ✅ บันทึกรายรับ-รายจ่ายง่ายๆ ด้วย Natural Language
- ✅ จัดการหมวดหมู่รายจ่าย
- ✅ ดูสรุปรายรับรายจ่ายรายวัน/สัปดาห์/เดือน
- ✅ ตั้งงบประมาณรายเดือน (Budget System)
- ✅ แจ้งเตือนเมื่อใกล้หรือเกินงบ
- ✅ รองรับ AI Command (/ai)

---

## 🚀 Phase 1: Basic Features (100% Complete)

### 1. บันทึกรายจ่าย

```
/จ่าย 250 อาหาร
/จ่าย 250 อาหาร #ข้าวมันไก่
/จ่าย 250 อาหาร @lunch @office
/expense 1200 เดินทาง #แท็กซี่ไปสนามบิน
```

**Parameters:**
- `จำนวนเงิน` - จำนวนเงิน (บาท)
- `หมวดหมู่` - ชื่อหมวดหมู่ (ถ้าไม่ระบุ → ใช้ "อื่นๆ")
- `#note` - หมายเหตุ (optional)
- `@tags` - ป้ายกำกับ (optional, ใส่ได้หลายตัว)

### 2. บันทึกรายรับ

```
/รับ 30000 เงินเดือน
/รับ 5000 โบนัส #Q1
/income 2000 freelance @side-hustle
```

### 3. ดูสรุปรายรับรายจ่าย

```
/expense                    # สรุปเดือนปัจจุบัน (Flex Message)
/expense list               # รายการล่าสุด 5 รายการ
/expense list 10            # รายการล่าสุด 10 รายการ
/expense today              # สรุปวันนี้
/expense week               # สรุปสัปดาห์นี้
/expense month 04           # สรุปเดือน เม.ย. ปีนี้
/expense month 2025-04      # สรุปเดือน เม.ย. 2025
/expense อาหาร             # ดูเฉพาะหมวดหมู่
```

### 4. แก้ไขรายการ

```
/expense edit               # แก้ไขรายการล่าสุด (แสดงเมนู)
/expense edit 300           # แก้จำนวนเงินเป็น 300
/expense edit amount 300    # แก้จำนวนเงินเป็น 300 (explicit)
/expense edit note ข้าวมันไก่          # แก้ note
/expense edit category อาหาร           # แก้หมวดหมู่
```

### 5. ลบรายการ

```
/expense del                # แสดง Quick Reply เลือกรายการ
/expense del [id]           # ลบรายการโดยตรง
```

### 6. จัดการหมวดหมู่

```
/category list              # ดูหมวดหมู่ทั้งหมด
/category add คาเฟ่ ☕       # สร้างหมวดหมู่ใหม่
/category add ค่ารถ 🚗     # สร้างพร้อม emoji
/category del คาเฟ่        # ลบหมวดหมู่
```

---

## 💰 Phase 2: Advanced Features (Complete)

### 7. ระบบงบประมาณ (Budget System)

#### ดูสถานะงบ

```
/budget                     # ดูสถานะงบทั้งหมด
/budget status              # ดูสถานะงบทั้งหมด
```

**สถานะ:**
- 🔴 เกินงบ (Over budget)
- 🟡 ใกล้เกินงบ (Near limit)
- 🟢 ปลอดภัย (Safe)

#### ตั้งงบประมาณ

```
/budget set อาหาร 5000                   # ตั้งงบหมวดหมู่
/budget set อาหาร 5000 90               # ตั้งงบ + แจ้งเตือน 90%
/budget set total 20000                  # ตั้งงบรวมทุกหมวด
```

#### จัดการงบ

```
/budget list                            # รายการงบทั้งหมด
/budget del อาหาร                      # ลบงบหมวดหมู่
/budget del total                       # ลบงบรวม
/budget alert อาหาร 85                 # ตั้งแจ้งเตือน 85%
```

**Features:**
- ตั้งงบรายเดือนต่อหมวดหมู่ หรืองบรวม
- แจ้งเตือนอัตโนมัติเมื่อใช้ถึงเป้าหมาย (default 80%)
- Track การใช้จริง vs งบที่ตั้งไว้
- แสดง % การใช้งบและยอดคงเหลือ

---

## 🤖 AI Command Features

### Natural Language Processing

ใช้ภาษาธรรมชาติได้เลย ไม่ต้องจำคำสั่ง:

```
/ai จ่าย 250 คาเฟ่
/ai บันทึกรายจ่าย 120 ค่าเดินทาง
/ai รับเงินเดือน 30000 บาท
/ai ดูสรุปเงินเดือนนี้
/ai เช้านี้กินข้าว 65 บาท
/ai สรุปสัปดาห์นี้หน่อย
/ai เพิ่มหมวดหมู่กีฬา ใช้ emoji บาสเกตบอล
/ai ตั้งงบคาเฟ่ 3000 บาท
/ai ดูสถานะงบทั้งหมด
```

AI จะ:
1. ✨ เข้าใจ intent จากภาษาธรรมชาติ
2. 🎯 Map ไปยัง command ที่เหมาะสม
3. 📝 Extract parameters (amount, category, note, tags)
4. ⚡ Execute ให้อัตโนมัติ

---

## 📁 โครงสร้างหมวดหมู่เริ่มต้น

ระบบจะสร้างหมวดหมู่เริ่มต้นให้อัตโนมัติ:

- 🍜 อาหาร
- 🚗 เดินทาง
- ☕ คาเฟ่
- 🛒 ช้อปปิ้ง
- 🏠 ที่อยู่อาศัย
- 📱 บันเทิ้ง
- 🎮 บันเทิง
- 🏥 สุขภาพ
- 📚 การศึกษา
- 🎁 ของขวัญ
- 👕 เสื้อผ้า
- 📦 อื่นๆ

---

## 🔒 Privacy Settings

ซ่อนจำนวนเงินใน LINE Bot ได้:

1. เข้าเว็บไซต์
2. ไปที่ Settings (ตั้งค่า)
3. เปิด/ปิด "ซ่อนจำนวนเงินใน LINE"
   - **แชทส่วนตัว:** Hide amounts in personal chat
   - **กลุ่ม:** Hide amounts in group chats

เมื่อเปิด → จำนวนเงินจะแสดงเป็น `••••••`

---

## 💡 เคล็ดลับการใช้งาน

### Shortcuts

```
/e       = /expense           (ดูสรุปเดือน)
/exp     = /expense
/i       = /รับ               (บันทึกรายรับ)
/cat     = /category          (จัดการหมวดหมู่)
```

### Natural Language Input

ใช้ AI ได้เลย ไม่ต้องจำ format:

```
กินข้าวมันไก่ 65
ค่าน้ำมัน 500 บาท
เดือนนี้ใช้เงินไปเท่าไหรี่
สรุปงบประมาณหน่อย
```

### Tags สำหรับ Filter

ใช้ `@tags` เพื่อ categorize เพิ่มเติม:

```
/จ่าย 120 อาหาร @lunch @office
/จ่าย 3000 เที่ยว @vacation @phuket
```

---

## 🔧 Technical Details

### Database Schema

- **Transaction** - บันทึกรายการ
- **ExpenseCategory** - หมวดหมู่
- **Budget** - งบประมาณรายเดือน
- **RecurringTransaction** - รายการประจำ (TODO)
- **SavingsGoal** - เป้าหมายการออม (TODO)

### Services

- `transaction.server.ts` - CRUD transactions + summary
- `category.server.ts` - Manage categories
- `budget.server.ts` - Manage budgets + alerts
- `recurring.server.ts` - Auto-create transactions (TODO)
- `savings.server.ts` - Track savings goals (TODO)

### LINE Commands

- `handleExpenseCommand.ts` - รายรับรายจ่าย
- `handleCategoryCommand.ts` - หมวดหมู่
- `handleBudgetCommand.ts` - งบประมาณ
- `handleAiCommand.ts` - Natural language routing

---

## 📊 ตัวอย่าง Flex Messages

### Monthly Summary

```
💰 สรุปรายรับรายจ่าย
📅 พฤษภาคม 2026
─────────────────────
📈 รายรับ: +15,000 บาท
📉 รายจ่าย: -8,500 บาท
⚖️ คงเหลือ: +6,500 บาท
📋 23 รายการ
```

### Budget Status

```
💰 สถานะงบประมาณ
📅 พฤษภาคม 2026
─────────────────────
🟢 🍜 อาหาร
  ใช้ 3,200 / 5,000 (64%)
  เหลือ 1,800 บาท

🟡 ☕ คาเฟ่
  ใช้ 2,700 / 3,000 (90%)
  เหลือ 300 บาท
```

---

## 🚀 Next Features (TODO)

- [ ] Recurring Transactions - รายจ่ายประจำ (ค่าเช่า, ค่าน้ำ-ไฟ)
- [ ] Savings Goals - เป้าหมายการออม (ซื้อ iPhone, เที่ยวญี่ปุ่น)
- [ ] Weekly Digest - สรุปรายสัปดาห์ทุกวันจันทร์
- [ ] Spending Insights - วิเคราะห์รูปแบบการใช้จ่าย
- [ ] Multi-currency - รองรับสกุลเงินหลายสกุล

---

## 📞 ช่วยเหลือ

หากพบปัญหา:

1. พิมพ์ `/help` - ดูคำสั่งทั้งหมด
2. พิมพ์ `/expense help` - ดูวิธีใช้ expense commands
3. ติดต่อผู้ดูแลระบบ

---

**Version:** 2.0.0 (Phase 1 + Phase 2: Budget System)
**Last Updated:** 2026-05-02
**Status:** ✅ Production Ready
