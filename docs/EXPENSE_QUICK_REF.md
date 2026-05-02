# Expense Commands - Quick Reference

## 💸 รายจ่าย (Expense)

```
/จ่าย 250 อาหาร                        # บันทึกรายจ่าย
/จ่าย 250 อาหาร #ข้าวมันไก่            # เพิ่ม note
/จ่าย 250 อาหาร @lunch @office         # เพิ่ม tags
/expense                                # สรุปเดือนนี้
/expense list 10                        # รายการล่าสุด 10 รายการ
/expense today                          # สรุปวันนี้
/expense week                           # สรุปสัปดาห์นี้
/expense month 04                       # สรุปเดือน เม.ย.
/expense อาหาร                         # ดูเฉพาะหมวดหมู่
/expense del                            # ลบรายการ (Quick Reply)
/expense edit 300                       # แก้จำนวนเงิน
```

## 💰 รายรับ (Income)

```
/รับ 30000 เงินเดือน                    # บันทึกรายรับ
/รับ 5000 โบนัส #Q1                    # เพิ่ม note
/income 2000 freelance @side-hustle     # รายได้เสริม
```

## 📁 หมวดหมู่ (Category)

```
/category list                          # ดูทั้งหมด
/category add คาเฟ่ ☕                   # สร้างใหม่
/category del คาเฟ่                    # ลบ
```

## 💵 งบประมาณ (Budget)

```
/budget                                 # สถานะงบทั้งหมด
/budget set อาหาร 5000                # ตั้งงบหมวดหมู่
/budget set อาหาร 5000 90              # + แจ้งเตือน 90%
/budget set total 20000                # งบรวม
/budget list                            # รายการงบ
/budget del อาหาร                      # ลบงบ
/budget alert อาหาร 85                 # ตั้งแจ้งเตือน
```

## 🤖 AI Natural Language

```
/ai จ่าย 250 คาเฟ่
/ai บันทึกรายจ่าย 120 ค่าเดินทาง
/ai ดูสรุปเงินเดือนนี้
/ai เช้านี้กินข้าว 65
/ai สรุปสัปดาห์นี้
/ai ตั้งงบคาเฟ่ 3000
/ai เพิ่มหมวดกีฬา
```

## 🎯 Status Icons

- 🔴 เกินงบ
- 🟡 ใกล้เกินงบ
- 🟢 ปลอดภัย

## 📝 Shortcuts

```
/e       = /expense
/exp     = /expense
/i       = /รับ
/cat     = /category
```

## 💡 Tips

- ใช้ `#note` เพิ่มหมายเหตุ
- ใช้ `@tags` เพิ่มป้ายกำกับ
- ไม่ระบุหมวด → ใช้ "อื่นๆ" อัตโนมัติ
- AI เข้าใจภาษาธรรมชาติได้

## 🔧 Help

```
/help              # ดูคำสั่งทั้งหมด
/expense help      # ดูวิธีใช้ expense
/budget help       # ดูวิธีใช้ budget
```
