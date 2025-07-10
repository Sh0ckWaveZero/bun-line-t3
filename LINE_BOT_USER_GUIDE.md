# LINE Bot User Guide | คู่มือการใช้งาน LINE Bot

## 🤖 Introduction | การแนะนำ

This LINE Bot provides a comprehensive set of features for workplace management, cryptocurrency tracking, and general information services. The bot supports both Thai and English commands and offers rich interactive interfaces through postback actions and rich menus.

บอท LINE นี้ให้บริการครบครันสำหรับการจัดการงาน การติดตามราคาคริปโตเคอเรนซี และบริการข้อมูลทั่วไป รองรับคำสั่งทั้งภาษาไทยและอังกฤษ พร้อมส่วนต่อประสานแบบโต้ตอบผ่าน Rich Menu และ Postback Actions

---

## 📋 Table of Contents | สารบัญ

1. [Getting Started | การเริ่มต้น](#getting-started--การเริ่มต้น)
2. [Authentication | การยืนยันตัวตน](#authentication--การยืนยันตัวตน)
3. [Attendance System | ระบบลงเวลาทำงาน](#attendance-system--ระบบลงเวลาทำงาน)
4. [Leave Management | การจัดการวันลา](#leave-management--การจัดการวันลา)
5. [Cryptocurrency Features | ฟีเจอร์คริปโตเคอเรนซี](#cryptocurrency-features--ฟีเจอร์คริปโตเคอเรนซี)
6. [General Information | ข้อมูลทั่วไป](#general-information--ข้อมูลทั่วไป)
7. [Location Services | บริการตำแหน่งที่ตั้ง](#location-services--บริการตำแหน่งที่ตั้ง)
8. [Interactive Features | ฟีเจอร์โต้ตอบ](#interactive-features--ฟีเจอร์โต้ตอบ)
9. [Rich Menu Features | ฟีเจอร์ Rich Menu](#rich-menu-features--ฟีเจอร์-rich-menu)
10. [Error Handling | การจัดการข้อผิดพลาด](#error-handling--การจัดการข้อผิดพลาด)

---

## 🚀 Getting Started | การเริ่มต้น

### Basic Command Format | รูปแบบคำสั่งพื้นฐาน

All commands start with a forward slash (`/`) followed by the command name. Commands are case-insensitive and support both Thai and English.

คำสั่งทั้งหมดเริ่มต้นด้วยสแลช (`/`) ตามด้วยชื่อคำสั่ง ไม่ต้องใส่ใจเรื่องตัวพิมพ์เล็ก-ใหญ่ และรองรับทั้งภาษาไทยและอังกฤษ

**Format**: `/command [parameters]`

### Help Command | คำสั่งขอความช่วยเหลือ

```
/help
/ช่วยเหลือ
/คำสั่ง  
/commands
```

**Description**: Displays a link to the comprehensive help page with all available commands.

**คำอธิบาย**: แสดงลิงก์ไปยังหน้าคู่มือที่มีคำสั่งทั้งหมด

---

## 🔐 Authentication | การยืนยันตัวตน

### Sign In Process | กระบวนการลงชื่อเข้าใช้

Before using most features, users must authenticate through the LINE OAuth system.

ก่อนใช้งานฟีเจอร์ต่างๆ ผู้ใช้ต้องยืนยันตัวตนผ่านระบบ LINE OAuth ก่อน

**When authentication is required**:
- The bot will show a sign-in bubble with a login button
- Users must click "🔑 เข้าสู่ระบบ" to authenticate
- Session expires after a certain period and requires re-authentication

**เมื่อต้องการยืนยันตัวตน**:
- บอทจะแสดง Bubble ที่มีปุ่มสำหรับลงชื่อเข้าใช้
- ผู้ใช้ต้องคลิก "🔑 เข้าสู่ระบบ" เพื่อยืนยันตัวตน
- เซสชันจะหมดอายุหลังจากระยะเวลาหนึ่งและต้องยืนยันตัวตนใหม่

---

## ⏰ Attendance System | ระบบลงเวลาทำงาน

### Work Overview | ดูภาพรวมการทำงาน

```
/work
/งาน
```

**Description**: Opens the main work interface that adapts based on your current status:
- If not checked in: Shows check-in menu
- If checked in: Shows current work status

**คำอธิบาย**: เปิดส่วนต่อประสานหลักของงานที่ปรับตามสถานะปัจจุบัน:
- หากยังไม่ได้เข้างาน: แสดงเมนูลงชื่อเข้างาน
- หากเข้างานแล้ว: แสดงสถานะการทำงานปัจจุบัน

### Check In | ลงชื่อเข้างาน

```
/checkin
/เข้างาน
```

**Description**: Immediately records your check-in time with intelligent time handling:

**คำอธิบาย**: บันทึกเวลาเข้างานทันทีพร้อมการจัดการเวลาอัจฉริยะ:

**Time Scenarios | สถานการณ์เวลาต่างๆ**:

1. **Early Check-in (ก่อน 08:00)**:
   - Records actual arrival time
   - Work time calculation starts at 08:00
   - Shows both actual and recorded times

2. **On-time Check-in (08:00-11:00)**:
   - Normal check-in process
   - Shows expected checkout time (9 hours later)

3. **Late Check-in (หลัง 11:00)**:
   - Shows fun, randomized late messages
   - Still records attendance with appropriate timestamps

4. **Public Holiday**:
   - Prevents check-in on official Thai holidays
   - Shows holiday information

5. **Already Checked In**:
   - Shows current work status instead of duplicate check-in

### Check Out | ลงชื่อออกงาน

```
/checkout
/เลิกงาน
/ออกงาน
```

**Description**: Records your checkout time and calculates total work hours.

**คำอธิบาย**: บันทึกเวลาออกงานและคำนวณชั่วโมงทำงานรวม

**Features | ฟีเจอร์**:
- Calculates actual work duration
- Shows work summary for the day
- Prevents checkout if not checked in

### Status Check | ตรวจสอบสถานะ

```
/status
/สถานะ
```

**Description**: Displays your current work status for today including:

**คำอธิบาย**: แสดงสถานะการทำงานวันนี้รวมถึง:

- Check-in time | เวลาเข้างาน
- Checkout time (if completed) | เวลาออกงาน (หากออกแล้ว)
- Expected checkout time | เวลาออกงานที่คาดหวัง
- Work duration | ระยะเวลาทำงาน
- Current status | สถานะปัจจุบัน

**Status Types | ประเภทสถานะ**:
- 🟢 กำลังทำงาน (Currently working)
- ✅ ออกงานแล้ว (Checked out)
- 🕛 ออกงานอัตโนมัติ (Auto checkout at midnight)

### Reporting | รายงาน

```
/report
/รายงาน
```

**Description**: Access monthly attendance reports.

**คำอธิบาย**: เข้าถึงรายงานการเข้างานรายเดือน

**Options | ตัวเลือก**:
- Current month report | รายงานเดือนปัจจุบัน
- Previous month report | รายงานเดือนที่แล้ว  
- Detailed web report with charts | รายงานเว็บแบบละเอียดพร้อมกราฟ

**Report Information | ข้อมูลในรายงาน**:
- Total working days | วันทำงานรวม
- Total hours worked | ชั่วโมงทำงานรวม
- Attendance rate | เปอร์เซ็นต์การเข้างาน
- Average hours per day | ชั่วโมงเฉลี่ยต่อวัน
- Compliance rate | อัตราการทำงานครบเวลา

### Company Policy | นโยบายบริษัท

```
/policy
/นโยบาย
/กฎ
/rule
```

**Description**: Displays company workplace policies including:

**คำอธิบาย**: แสดงนโยบายการทำงานของบริษัท รวมถึง:

- Work schedule (Mon-Fri) | ตารางงาน (จันทร์-ศุกร์)
- Flexible working hours (08:00-11:00 check-in) | เวลาทำงานยืดหยุ่น
- 9-hour work day including 1-hour lunch | ทำงาน 9 ชั่วโมงรวมพักเที่ยง 1 ชั่วโมง
- Time recording procedures | ขั้นตอนการบันทึกเวลา

---

## 🏖️ Leave Management | การจัดการวันลา

### Request Leave | ขอลา

```
/leave YYYY-MM-DD [type] [reason]
/ลา YYYY-MM-DD [ประเภท] [เหตุผล]
```

**Description**: Submit a leave request for a specific date.

**คำอธิบาย**: ส่งคำขอลาสำหรับวันที่ระบุ

**Parameters | พารามิเตอร์**:
- `YYYY-MM-DD`: Date in ISO format (required) | วันที่ในรูปแบบ ISO (จำเป็น)
- `type`: Leave type (optional, defaults to "personal") | ประเภทการลา (ไม่จำเป็น, ค่าเริ่มต้น "personal")
- `reason`: Reason for leave (optional) | เหตุผลการลา (ไม่จำเป็น)

**Examples | ตัวอย่าง**:
```
/leave 2025-07-15
/leave 2025-07-15 sick เป็นไข้
/ลา 2025-07-20 personal ไปธุระ
```

**Features | ฟีเจอร์**:
- Prevents duplicate leave requests | ป้องกันการขอลาซ้ำ
- Automatic attendance record creation for leave days | สร้างบันทึกการเข้างานอัตโนมัติสำหรับวันลา
- Leave auto-stamp system with standardized times | ระบบประทับเวลาอัตโนมัติสำหรับวันลา

**Auto-Stamp Details | รายละเอียดการประทับเวลาอัตโนมัติ**:
- Check-in: 01:00 UTC (08:00 Bangkok time)
- Check-out: 10:00 UTC (17:00 Bangkok time)  
- Hours worked: 9.0 hours
- Status: LEAVE

---

## 💰 Cryptocurrency Features | ฟีเจอร์คริปโตเคอเรนซี

### Supported Exchanges | ตลาดแลกเปลี่ยนที่รองรับ

#### Bitkub
```
/bk [symbol1] [symbol2] ...
/bitkub [symbol1] [symbol2] ...
```

#### Satang Pro
```
/st [symbol1] [symbol2] ...
/satang [symbol1] [symbol2] ...
```

#### Bitazza
```
/btz [symbol1] [symbol2] ...
/bitazza [symbol1] [symbol2] ...
```

#### Binance
```
/bn [symbol1] [symbol2] ...     (USDT pairs)
/binance [symbol1] [symbol2] ... (USDT pairs)
/bnbusd [symbol1] [symbol2] ... (BUSD pairs)
```

#### Gate.io
```
/gate [symbol1] [symbol2] ...
/gateio [symbol1] [symbol2] ...
/gt [symbol1] [symbol2] ...
```

#### MEXC
```
/mexc [symbol1] [symbol2] ...
/mx [symbol1] [symbol2] ...
```

#### CoinMarketCap
```
/cmc [symbol1] [symbol2] ...
/coinmarketcap [symbol1] [symbol2] ...
```

**Description**: Get real-time cryptocurrency prices from various exchanges.

**คำอธิบาย**: ดูราคาคริปโตเคอเรนซีแบบเรียลไทม์จากตลาดแลกเปลี่ยนต่างๆ

**Examples | ตัวอย่าง**:
```
/bk btc
/bk btc eth bnb
/st btc eth
/bn sol ada
/cmc bitcoin ethereum
```

**Cryptocurrency Information Displayed | ข้อมูลคริปโตเคอเรนซีที่แสดง**:
- Current price | ราคาปัจจุบัน
- 24h price change | การเปลี่ยนแปลงราคา 24 ชั่วโมง
- High/Low prices (exchange dependent) | ราคาสูงสุด/ต่ำสุด (ขึ้นอยู่กับตลาด)
- Volume | ปริมาณการซื้อขาย
- Market cap ranking (CoinMarketCap) | อันดับมูลค่าตลาด
- Last updated time | เวลาอัปเดตล่าสุด

**Special Aliases | นามแฝงพิเศษ**:
- หมา → doge
- ยาย → iost

---

## 📊 General Information | ข้อมูลทั่วไป

### Gold Prices | ราคาทอง

```
/gold
/ทอง
```

**Description**: Get current Thai gold prices for both bar gold and jewelry gold.

**คำอธิบาย**: ดูราคาทองคำไทยปัจจุบันทั้งทองคำแท่งและทองรูปพรรณ

**Information Displayed | ข้อมูลที่แสดง**:
- Bar gold buy/sell prices | ราคารับซื้อ/ขายออกทองคำแท่ง
- Jewelry gold buy/sell prices | ราคารับซื้อ/ขายออกทองรูปพรรณ
- Daily price change | การเปลี่ยนแปลงราคารายวัน
- Purity information (96.5%) | ข้อมูลความบริสุทธิ์
- Last updated time | เวลาอัปเดตล่าสุด

### Lottery Results | ผลสลากกินแบ่ง

```
/lotto [date]
/หวย [วันที่]
```

**Description**: Check Thai government lottery results.

**คำอธิบาย**: ตรวจผลสลากกินแบ่งรัฐบาล

**Examples | ตัวอย่าง**:
```
/หวย 16/04/2566
/lotto 01/05/2023
```

### Gas Prices | ราคาน้ำมัน

```
/gas [type]
/น้ำมัน [ประเภท]
```

**Description**: Get current fuel prices in Thailand.

**คำอธิบาย**: ดูราคาน้ำมันปัจจุบันในประเทศไทย

**Examples | ตัวอย่าง**:
```
/gas diesel
/น้ำมัน เบนซิน
/gas gasohol
```

**Note**: Requires fuel type parameter or returns error.

**หมายเหตุ**: ต้องระบุประเภทน้ำมัน มิฉะนั้นจะขึ้นข้อผิดพลาด

---

## 📍 Location Services | บริการตำแหน่งที่ตั้ง

### Air Quality Information | ข้อมูลคุณภาพอากาศ

**How to use | วิธีใช้งาน**:
1. Share your location in the chat | แชร์ตำแหน่งของคุณในแชท
2. The bot will automatically fetch air quality data for the nearest city | บอทจะดึงข้อมูลคุณภาพอากาศของเมืองที่ใกล้ที่สุดโดยอัตโนมัติ

**Information Provided | ข้อมูลที่ให้บริการ**:
- Air Quality Index (AQI) | ดัชนีคุณภาพอากาศ
- Nearest monitoring station | สถานีตรวจวัดที่ใกล้ที่สุด
- Current air pollution levels | ระดับมลพิษทางอากาศปัจจุบัน
- Health recommendations based on AQI | คำแนะนำด้านสุขภาพตาม AQI

**To share location | การแชร์ตำแหน่ง**:
1. Tap the "+" button in LINE chat | แตะปุ่ม "+" ในแชท LINE
2. Select "Location" | เลือก "ตำแหน่ง"
3. Choose "Send Current Location" | เลือก "ส่งตำแหน่งปัจจุบัน"

---

## 🎭 Interactive Features | ฟีเจอร์โต้ตอบ

### Sticker Responses | การตอบสนองสติกเกอร์

The bot responds to emotional stickers with comforting messages.

บอทจะตอบสนองต่อสติกเกอร์ที่แสดงอารมณ์ด้วยข้อความปลอบใจ

**Triggering Keywords | คำสำคัญที่จะทำให้ตอบสนอง**:
- "Sad" | เศร้า
- "Crying" | ร้องไห้
- "Tears" | น้ำตา
- "Anguish" | ความเศร้าโศก

**Response Type | ประเภทการตอบสนอง**:
- Random consoling messages in Thai | ข้อความปลอบใจแบบสุ่มเป็นภาษาไทย
- Over 100 different supportive messages | ข้อความให้กำลังใจกว่า 100 แบบ
- Encouraging and understanding tone | น้ำเสียงให้กำลังใจและเข้าใจ

### Text Message Parsing | การแยกวิเคราะห์ข้อความ

**Format Recognition | การรู้จำรูปแบบ**:
- Commands start with "/" | คำสั่งเริ่มต้นด้วย "/"
- Multiple parameters separated by spaces | พารามิเตอร์หลายตัวคั่นด้วยเว้นวรรค
- Case-insensitive command matching | การจับคู่คำสั่งไม่สนใจตัวพิมพ์เล็ก-ใหญ่

**Example Text Processing | ตัวอย่างการประมวลผลข้อความ**:
```
Input: "/bk btc eth bnb"
- Command: "bk"
- Parameters: ["btc", "eth", "bnb"]
- Action: Fetch prices for all three cryptocurrencies from Bitkub
```

---

## 📱 Rich Menu Features | ฟีเจอร์ Rich Menu

### Postback Actions | การกระทำ Postback

The bot supports interactive buttons that trigger specific actions without typing commands.

บอทรองรับปุ่มโต้ตอบที่สามารถทำงานเฉพาะได้โดยไม่ต้องพิมพ์คำสั่ง

#### Available Postback Actions | การกระทำ Postback ที่มี:

1. **Check In | เข้างาน**
   - Action: `action=checkin`
   - Behavior: Same as `/checkin` command | ทำงานเหมือนคำสั่ง `/checkin`

2. **Check Out | ออกงาน**
   - Action: `action=checkout`
   - Behavior: Same as `/checkout` command | ทำงานเหมือนคำสั่ง `/checkout`

3. **Work Status | สถานะงาน**
   - Action: `action=status`
   - Behavior: Shows current work status | แสดงสถานะการทำงานปัจจุบัน

4. **Check-in Menu | เมนูเข้างาน**
   - Action: `action=checkin_menu`
   - Behavior: Shows attendance interface | แสดงส่วนต่อประสานการเข้างาน

5. **Monthly Report | รายงานรายเดือน**
   - Action: `action=monthly_report&month=current` | เดือนปัจจุบัน
   - Action: `action=monthly_report&month=previous` | เดือนที่แล้ว
   - Behavior: Generates attendance report | สร้างรายงานการเข้างาน

6. **Report Menu | เมนูรายงาน**
   - Action: `action=report_menu`
   - Behavior: Shows reporting options | แสดงตัวเลือกรายงาน

### Button Templates | เทมเพลตปุ่ม

The bot uses various button templates for better user experience:

บอทใช้เทมเพลตปุ่มหลากหลายเพื่อประสบการณ์ผู้ใช้ที่ดีขึ้น:

1. **Primary Buttons | ปุ่มหลัก**: For main actions like check-in/out | สำหรับการกระทำหลักเช่นเข้า/ออกงาน
2. **Secondary Buttons | ปุ่มรอง**: For supporting actions | สำหรับการกระทำสนับสนุน
3. **Link Buttons | ปุ่มลิงก์**: For external navigation | สำหรับการนำทางภายนอก
4. **URI Buttons | ปุ่ม URI**: For opening web interfaces | สำหรับเปิดส่วนต่อประสานเว็บ

---

## ⚠️ Error Handling | การจัดการข้อผิดพลาด

### Common Error Scenarios | สถานการณ์ข้อผิดพลาดทั่วไป

#### Authentication Errors | ข้อผิดพลาดการยืนยันตัวตน
- **Scenario**: Session expired or not logged in | เซสชันหมดอายุหรือยังไม่ได้ลงชื่อเข้าใช้
- **Response**: Sign-in bubble with authentication button | Bubble ลงชื่อเข้าใช้พร้อมปุ่มยืนยันตัวตน
- **Action Required**: Click "🔑 เข้าสู่ระบบ" | คลิก "🔑 เข้าสู่ระบบ"

#### Command Not Found | ไม่พบคำสั่ง
- **Scenario**: Invalid or unrecognized command | คำสั่งไม่ถูกต้องหรือไม่รู้จัก
- **Response**: "404" error bubble with friendly message | Bubble ข้อผิดพลาด "404" พร้อมข้อความเป็นมิตร
- **Suggestion**: Use `/help` to see available commands | ใช้ `/help` เพื่อดูคำสั่งที่มี

#### Duplicate Actions | การกระทำซ้ำ
- **Scenario**: Already checked in/out, duplicate leave request | เข้า/ออกงานแล้ว, ขอลาซ้ำ
- **Response**: Current status display or error message | แสดงสถานะปัจจุบันหรือข้อความข้อผิดพลาด
- **Behavior**: Prevents data corruption | ป้องกันการเสียหายของข้อมูล

#### Parameter Missing | ขาดพารามิเตอร์
- **Scenario**: Commands requiring parameters called without them | คำสั่งที่ต้องการพารามิเตอร์แต่ไม่มี
- **Response**: Error message with usage examples | ข้อความข้อผิดพลาดพร้อมตัวอย่างการใช้งาน
- **Examples**: Gas command without fuel type | คำสั่งน้ำมันโดยไม่ระบุประเภท

#### Holiday Restrictions | ข้อจำกัดวันหยุด
- **Scenario**: Attempting to check in on public holidays | พยายามเข้างานในวันหยุดราชการ
- **Response**: Holiday information bubble | Bubble ข้อมูลวันหยุด
- **Information**: Holiday name and normal working days | ชื่อวันหยุดและวันทำงานปกติ

### Error Message Types | ประเภทข้อความข้อผิดพลาด

1. **Friendly 404 Messages | ข้อความ 404 เป็นมิตร**:
   - Thai dialect phrases for unrecognized commands | วลีภาษาถิ่นไทยสำหรับคำสั่งที่ไม่รู้จัก
   - Animated GIF for visual appeal | GIF เคลื่อนไหวเพื่อความน่าสนใจ

2. **Validation Errors | ข้อผิดพลาดการตรวจสอบ**:
   - Clear format requirements | ข้อกำหนดรูปแบบที่ชัดเจน
   - Example usage provided | มีตัวอย่างการใช้งาน

3. **System Errors | ข้อผิดพลาดระบบ**:
   - Generic error handling with retry options | การจัดการข้อผิดพลาดทั่วไปพร้อมตัวเลือกลองใหม่
   - Contact information for support | ข้อมูลติดต่อสำหรับการสนับสนุน

---

## 🔧 Technical Details | รายละเอียดทางเทคนิค

### Supported Message Types | ประเภทข้อความที่รองรับ

1. **Text Messages | ข้อความตัวอักษร**: Command parsing and execution | แยกวิเคราะห์และประมวลผลคำสั่ง
2. **Stickers | สติกเกอร์**: Emotional response system | ระบบตอบสนองทางอารมณ์
3. **Location | ตำแหน่ง**: Air quality data retrieval | การดึงข้อมูลคุณภาพอากาศ
4. **Postback | โพสต์แบ็ก**: Interactive button responses | การตอบสนองปุ่มโต้ตอบ

### Time Zone Handling | การจัดการเขตเวลา

- **Server Time**: UTC | เวลาเซิร์ฟเวอร์: UTC
- **Display Time**: Asia/Bangkok (UTC+7) | เวลาแสดงผล: เอเชีย/กรุงเทพ (UTC+7)
- **Attendance Logic**: Based on Thai business hours | ตรรกะการเข้างาน: ตามเวลาทำงานไทย

### Data Storage | การเก็บข้อมูล

- **Database**: MongoDB with Prisma ORM | ฐานข้อมูล: MongoDB พร้อม Prisma ORM
- **User Sessions**: LINE OAuth tokens with expiration | เซสชันผู้ใช้: โทเค็น LINE OAuth พร้อมการหมดอายุ
- **Attendance Records**: Detailed work history with status tracking | บันทึกการเข้างาน: ประวัติงานละเอียดพร้อมติดตามสถานะ

### Security Features | ฟีเจอร์ความปลอดภัย

- **Webhook Verification**: LINE signature validation | การตรวจสอบ Webhook: การตรวจสอบลายเซ็น LINE
- **Authentication**: Session-based with TOKEN expiration | การยืนยันตัวตน: ตามเซสชันพร้อมการหมดอายุของโทเค็น
- **Data Validation**: Zod schema validation for all inputs | การตรวจสอบข้อมูล: การตรวจสอบ Schema ด้วย Zod สำหรับข้อมูลทั้งหมด

---

## 💡 Tips and Best Practices | เคล็ดลับและแนวปฏิบัติที่ดี

### For Attendance | สำหรับการลงเวลา
- Check in as early as possible to ensure accurate records | เข้างานเร็วที่สุดเพื่อให้บันทึกถูกต้อง
- Use the status command to verify your work hours | ใช้คำสั่งสถานะเพื่อตรวจสอบชั่วโมงทำงาน
- Review monthly reports for attendance patterns | ตรวจสอบรายงานรายเดือนเพื่อดูรูปแบบการเข้างาน

### For Cryptocurrency | สำหรับคริปโตเคอเรนซี
- Use multiple symbols to compare prices across exchanges | ใช้สัญลักษณ์หลายตัวเพื่อเปรียบเทียบราคาข้ามตลาด
- Check different exchanges for arbitrage opportunities | ตรวจสอบตลาดต่างๆ เพื่อหาโอกาส arbitrage
- Bookmark frequently used commands for quick access | บุ๊กมาร์กคำสั่งที่ใช้บ่อยเพื่อการเข้าถึงที่รวดเร็ว

### For General Use | สำหรับการใช้งานทั่วไป
- Keep the help page bookmarked for reference | เก็บหน้าความช่วยเหลือไว้เพื่ออ้างอิง
- Report any bugs or issues to the development team | รายงานบักหรือปัญหาให้ทีมพัฒนา
- Provide feedback for feature improvements | ให้ข้อเสนอแนะเพื่อปรับปรุงฟีเจอร์

---

## 📞 Support and Contact | การสนับสนุนและติดต่อ

### Web Interface | ส่วนต่อประสานเว็บ
- **Help Page**: Accessible via `/help` command | หน้าความช่วยเหลือ: เข้าถึงผ่านคำสั่ง `/help`
- **Attendance Reports**: Detailed web interface for historical data | รายงานการเข้างาน: ส่วนต่อประสานเว็บแบบละเอียดสำหรับข้อมูลย้อนหลัง

### Technical Information | ข้อมูลทางเทคนิค
- **Framework**: Next.js 15 with App Router | เฟรมเวิร์ก: Next.js 15 พร้อม App Router
- **Runtime**: Bun (not Node.js) | รันไทม์: Bun (ไม่ใช่ Node.js)
- **Database**: MongoDB with Prisma | ฐานข้อมูล: MongoDB พร้อม Prisma
- **Authentication**: NextAuth.js with LINE OAuth | การยืนยันตัวตน: NextAuth.js พร้อม LINE OAuth

### Feature Updates | การอัปเดตฟีเจอร์
This bot is actively maintained with regular feature additions and improvements. Check the help page periodically for new commands and capabilities.

บอทนี้ได้รับการดูแลอย่างต่อเนื่องพร้อมการเพิ่มฟีเจอร์และปรับปรุงเป็นประจำ ตรวจสอบหน้าความช่วยเหลือเป็นระยะๆ เพื่อดูคำสั่งและความสามารถใหม่ๆ

---

*Last Updated: July 2025 | อัปเดตล่าสุด: กรกฎาคม 2568*

*This user guide is generated based on the current codebase and may be updated as new features are added. | คู่มือนี้สร้างขึ้นจากโค้ดปัจจุบันและอาจมีการอัปเดตเมื่อมีฟีเจอร์ใหม่*