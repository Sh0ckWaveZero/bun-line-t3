# 🔍 Process Management & Monitoring System

ระบบจัดการ process และการตรวจสอบที่ครอบคลุม สำหรับ bun-line-t3 project

## 📋 Overview | ภาพรวม

ระบบนี้ประกอบด้วยเครื่องมือ 4 ตัวหลัก ที่ทำงานร่วมกันเพื่อรับรองการทำงานของระบบที่เสถียรและปลอดภัย:

1. **🔒 Process Manager** - ป้องกันการรัน process ซ้ำ
2. **📊 Log Viewer** - ดูและวิเคราะห์ logs
3. **🔍 Process Monitor** - ติดตามและจัดการ processes
4. **🔔 Enhanced Checkout Reminder** - ระบบแจ้งเตือนที่ปรับปรุงแล้ว

## 🚀 Quick Start | เริ่มต้นใช้งาน

### 📦 Installation

```bash
# ติดตั้ง dependencies (หากยังไม่ได้ติดตั้ง)
bun install

# ทำให้ shell script สามารถรันได้
chmod +x scripts/manage-processes.sh
```

### 🎯 การใช้งานเบื้องต้น

```bash
# 🔍 ดูสถานะระบบปัจจุบัน
./scripts/manage-processes.sh status

# 🔔 รัน checkout reminder
./scripts/manage-processes.sh checkout

# 📊 ดู monitoring dashboard
./scripts/manage-processes.sh monitor

# 👀 ดู logs แบบ real-time
./scripts/manage-processes.sh log-watch checkout-reminder.log
```

## 🔒 Process Manager

### 🎯 วัตถุประสงค์

ป้องกันการรัน process เดียวกันพร้อมกันหลายตัว และจัดการ logging ระหว่างการทำงาน

### ✨ คุณสมบัติ

- **File-based locking** - ใช้ไฟล์ lock เพื่อป้องกัน race conditions
- **Process health monitoring** - ตรวจสอบสถานะ process และล้าง stale locks
- **Comprehensive logging** - บันทึกการทำงานอย่างละเอียด
- **Graceful shutdown** - จัดการการปิดระบบอย่างสะอาด
- **Error recovery** - กลไกการกู้คืนเมื่อเกิดข้อผิดพลาด

### 🎮 การใช้งาน

#### CLI Commands

```bash
# 📋 ดูรายการ processes ที่กำลังรัน
bun scripts/process-manager.ts list

# 🗑️ ล้าง lock files ที่ไม่ได้ใช้งาน
bun scripts/process-manager.ts clean

# ⏹️ หยุด process เฉพาะ
bun scripts/process-manager.ts kill <process-name>
```

#### Programmatic Usage

```typescript
import { runWithProcessManagement } from "./scripts/process-manager";

const result = await runWithProcessManagement(
  "my-process",
  async (manager) => {
    await manager.log("info", "Starting task...");

    // Your process logic here
    const result = await executeTask();

    await manager.log("success", "Task completed successfully");
    return result;
  },
  {
    healthMonitoring: true,
    healthInterval: 30000, // 30 seconds
  },
);
```

## 📊 Log Viewer

### 🎯 วัตถุประสงค์

เครื่องมือสำหรับดู วิเคราะห์ และจัดการ log files

### ✨ คุณสมบัติ

- **Real-time monitoring** - ดู logs แบบ tail -f
- **Log filtering** - กรอง logs ตาม level, process, เวลา
- **JSON formatting** - แสดง logs ในรูปแบบที่อ่านง่าย
- **Log analytics** - วิเคราะห์สถิติการทำงาน
- **Export functionality** - ส่งออก logs ในรูปแบบ JSON, CSV, TXT

### 🎮 การใช้งาน

```bash
# 📋 ดูรายการ log files ที่มีอยู่
bun scripts/log-viewer.ts list

# 📖 อ่าน log file
bun scripts/log-viewer.ts read <filename>

# 👀 ดู logs แบบ real-time
bun scripts/log-viewer.ts watch <filename>

# 📊 วิเคราะห์ logs (24 ชั่วโมงล่าสุด)
bun scripts/log-viewer.ts analyze <filename> [hours]

# 📤 ส่งออก logs
bun scripts/log-viewer.ts export <filename> [format] [output-path]

# 📊 ดู dashboard แบบ live
bun scripts/log-viewer.ts dashboard
```

## 🔍 Process Monitor

### 🎯 วัตถุประสงค์

ระบบติดตามและจัดการ processes อย่างครอบคลุม พร้อมการแจ้งเตือนและการกู้คืนอัตโนมัติ

### ✨ คุณสมบัติ

- **Real-time monitoring** - ติดตามการทำงานแบบ real-time
- **Auto-restart** - รีสตาร์ท process ที่ล้มเหลวอัตโนมัติ
- **Health checks** - ตรวจสอบสุขภาพ process
- **Performance monitoring** - ติดตาม memory และ CPU usage
- **Alert system** - แจ้งเตือนเมื่อเกิดปัญหา
- **Interactive dashboard** - ส่วนต่อประสานแบบ interactive

### 🎮 การใช้งาน

```bash
# 📊 ดู status แบบครั้งเดียว
bun scripts/process-monitor.ts status

# 🔍 เริ่ม interactive monitoring dashboard
bun scripts/process-monitor.ts monitor

# ▶️ เริ่ม process
bun scripts/process-monitor.ts start <process-name>

# 🔄 รีสตาร์ท process
bun scripts/process-monitor.ts restart <process-name>

# ⏹️ หยุด process
bun scripts/process-monitor.ts stop <process-name>
```

## 🔔 Enhanced Checkout Reminder

### 🎯 วัตถุประสงค์

ระบบแจ้งเตือนการ checkout ที่ปรับปรุงแล้ว พร้อมระบบป้องกันการรันซ้ำและ logging ครอบคลุม

### ✨ คุณสมบัติใหม่

- **Process locking** - ป้องกันการรันพร้อมกันหลายตัว
- **Detailed logging** - บันทึกการทำงานอย่างละเอียด
- **Retry logic** - ลองใหม่อัตโนมัติเมื่อเกิดข้อผิดพลาด
- **Statistics tracking** - ติดตามสถิติการทำงาง
- **Health monitoring** - ตรวจสอบสุขภาพระบบ

### 🎮 การใช้งาน

```bash
# 🔔 รัน enhanced checkout reminder
bun scripts/enhanced-checkout-reminder.ts

# หรือใช้ npm script
npm run checkout:reminder

# หรือใช้ shell script
./scripts/manage-processes.sh checkout
```

## 🎛️ Easy Management Shell Script

### 🎯 วัตถุประสงค์

Shell script สำหรับจัดการระบบทั้งหมดในที่เดียว

### 🎮 การใช้งาน

```bash
# 📊 ดูสถานะระบบ
./scripts/manage-processes.sh status

# 🔍 เริ่ม monitoring dashboard
./scripts/manage-processes.sh monitor

# 📊 ดู logs dashboard
./scripts/manage-processes.sh logs

# ▶️ เริ่ม process
./scripts/manage-processes.sh start <process-name>

# ⏹️ หยุด process
./scripts/manage-processes.sh stop <process-name>

# 🔄 รีสตาร์ท process
./scripts/manage-processes.sh restart <process-name>

# 📋 ดูรายการ processes
./scripts/manage-processes.sh list

# 🧹 ล้าง stale locks
./scripts/manage-processes.sh clean

# 📖 อ่าน log file
./scripts/manage-processes.sh log-read <filename>

# 👀 ดู logs แบบ real-time
./scripts/manage-processes.sh log-watch <filename>

# 📊 วิเคราะห์ logs
./scripts/manage-processes.sh log-analyze <filename> [hours]

# 🔔 รัน checkout reminder
./scripts/manage-processes.sh checkout

# 🔔 รัน checkout reminder (legacy)
./scripts/manage-processes.sh checkout-old
```

## 📋 NPM Scripts

### 🔄 Process Management

```bash
npm run checkout:reminder         # Enhanced checkout reminder
npm run checkout:reminder:old     # Legacy checkout reminder
npm run process:list              # List active processes
npm run process:kill              # Kill specific process
npm run process:clean             # Clean stale locks
```

### 📊 Logging

```bash
npm run logs:list                 # List log files
npm run logs:read                 # Read log file
npm run logs:watch                # Watch log file
npm run logs:analyze              # Analyze logs
npm run logs:export               # Export logs
npm run logs:dashboard            # Live logs dashboard
```

### 🔍 Monitoring

```bash
npm run monitor:start             # Start process
npm run monitor:stop              # Stop process
npm run monitor:restart           # Restart process
npm run monitor:dashboard         # Monitoring dashboard
npm run monitor:status            # Show status
```

## 📁 File Structure | โครงสร้างไฟล์

```
scripts/
├── process-manager.ts            # 🔒 Process lock management
├── enhanced-checkout-reminder.ts # 🔔 Enhanced checkout reminder
├── log-viewer.ts                 # 📊 Log viewing and analysis
├── process-monitor.ts            # 🔍 Process monitoring system
└── manage-processes.sh           # 🎛️ Easy management script

.locks/                           # 🔒 Process lock files
└── *.lock                        # Lock files for active processes

logs/                             # 📊 Application logs
└── *.log                         # Log files for each process
```

## 🛡️ Security Considerations | ข้อพิจารณาด้านความปลอดภัย

### 🔐 Process Security

- **Lock file permissions** - จำกัดสิทธิ์การเข้าถึง lock files
- **PID validation** - ตรวจสอบ PID ก่อนส่ง signals
- **Graceful shutdown** - จัดการการปิดระบบอย่างปลอดภัย
- **Resource limits** - จำกัด resource usage ของ processes

### 📝 Logging Security

- **Sensitive data filtering** - กรองข้อมูลสำคัญออกจาก logs
- **Log rotation** - หมุนเวียน log files เพื่อป้องกันการใช้พื้นที่มากเกินไป
- **Access control** - จำกัดการเข้าถึง log files
- **Audit trail** - สร้าง audit trail สำหรับการเข้าถึง logs

## 🔧 Configuration | การกำหนดค่า

### Environment Variables

```bash
# Required for checkout reminder
INTERNAL_API_KEY=your-secure-api-key
FRONTEND_URL=https://your-domain.com

# Optional configuration
LOG_LEVEL=info                    # debug, info, warn, error
MONITOR_INTERVAL=30000            # Monitoring interval in ms
HEALTH_CHECK_INTERVAL=60000       # Health check interval in ms
```

### Process Configuration

กำหนดค่า processes ที่ต้องการ monitor ใน `scripts/process-monitor.ts`:

```typescript
const defaultProcesses: MonitoredProcess[] = [
  {
    name: "checkout-reminder",
    command: "bun scripts/enhanced-checkout-reminder.ts",
    enabled: true,
    autoRestart: true,
    maxRestarts: 3,
    restartWindow: 300000,
    healthCheck: async () => {
      // Custom health check logic
      return true;
    },
  },
];
```

## 🚨 Troubleshooting | การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

#### 🔒 Process ติดค้าง

```bash
# ดูรายการ processes
./scripts/manage-processes.sh list

# ล้าง stale locks
./scripts/manage-processes.sh clean

# หยุด process เฉพาะ
./scripts/manage-processes.sh stop <process-name>
```

#### 📊 Logs ไม่แสดง

```bash
# ตรวจสอบ log files
./scripts/manage-processes.sh log-list

# ตรวจสอบ permissions
ls -la logs/

# สร้าง logs directory หากไม่มี
mkdir -p logs
```

#### 🔍 Process ไม่เริ่มต้น

```bash
# ตรวจสอบ environment variables
./scripts/manage-processes.sh status

# ตรวจสอบ logs สำหรับ errors
./scripts/manage-processes.sh log-read <process-name>.log
```

## 🎯 Best Practices | แนวทางปฏิบัติที่ดี

1. **ใช้ shell script สำหรับการจัดการทั่วไป** - `./scripts/manage-processes.sh`
2. **ตรวจสอบ logs เป็นประจำ** - ใช้ `log-watch` หรือ `dashboard`
3. **ล้าง stale locks เป็นประจำ** - รัน `clean` command
4. **ตั้งค่า cron jobs สำหรับ monitoring** - ใช้ `monitor:status` เป็นประจำ
5. **ตรวจสอบ environment variables** - ก่อนรัน production processes

## 📈 Performance Tips | เคล็ดลับประสิทธิภาพ

1. **กำหนด log rotation** - ป้องกัน log files ใหญ่เกินไป
2. **ปรับ monitoring intervals** - ตาม workload ของระบบ
3. **ใช้ health checks อย่างมีประสิทธิภาพ** - หลีกเลี่ยง expensive operations
4. **Monitor resource usage** - ใช้ dashboard เพื่อติดตาม memory และ CPU

## 🤝 Contributing | การมีส่วนร่วม

หากต้องการปรับปรุงระบบ Process Management:

1. **เพิ่ม health checks** - ใน `process-monitor.ts`
2. **ปรับปรุง log formatting** - ใน `log-viewer.ts`
3. **เพิ่ม alerting mechanisms** - ใน `process-monitor.ts`
4. **ปรับปรุง shell script** - ใน `manage-processes.sh`

## 📞 Support | การสนับสนุน

หากมีปัญหาหรือข้อสงสัย:

1. ตรวจสอบ logs ก่อน: `./scripts/manage-processes.sh log-read <process>.log`
2. ดูสถานะระบบ: `./scripts/manage-processes.sh status`
3. ล้าง stale locks: `./scripts/manage-processes.sh clean`
4. อ่าน documentation นี้อีกครั้ง

---

**หมายเหตุ**: ระบบนี้ออกแบบมาเพื่อความปลอดภัยและความเสถียร ใช้งานอย่างระมัดระวังในสภาพแวดล้อม production
