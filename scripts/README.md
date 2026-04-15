# 🔧 Scripts Directory

Simple และเฉพาะเจาะจง - ป้องกันการรัน `bun run dev` ซ้ำ

## 🎯 Core Tools

### `simple-dev-server.ts` - Dev Server with Process Lock

ป้องกันการรัน bun run dev ซ้ำ

```bash
bun run dev              # Start dev server with lock protection
bun run dev:force        # Force start dev server
```

### `simple-lock.ts` - Simple Process Lock

ระบบป้องกันการรัน process ซ้ำ (สำหรับ dev server)

```bash
bun scripts/simple-lock.ts list    # ดูรายการ dev processes ที่รัน

# ใช้ใน Code
import { withProcessLock } from './scripts/simple-lock'
await withProcessLock('dev-server', async () => {
  // Start development server
})
```

## 🛠️ Utility Scripts

| Script                       | Purpose                            | Usage                                        |
| ---------------------------- | ---------------------------------- | -------------------------------------------- |
| `generate-secrets.ts`        | 🔑 Generate secure secrets         | `bun scripts/generate-secrets.ts`            |
| `generate-github-secrets.ts` | 🔐 GitHub secrets management       | `bun scripts/generate-github-secrets.ts`     |
| `docker-entrypoint.sh`       | 🐳 Docker container startup        | Used in Dockerfile                           |
| `switch-env.sh`              | 🔀 Environment switcher            | `./scripts/switch-env.sh dev               | prod` |

## 🎯 Quick Start

```bash
# เริ่ม development server (จะป้องกันการรันซ้ำ)
bun run dev

# หยุด development server
# กด Ctrl+C ใน terminal ที่รัน dev server
```

## 🎭 พฤติกรรมเมื่อ Dev Server รันซ้ำ

เมื่อพยายามรัน `bun run dev` หรือ `npm run dev` ซ้ำ:

```
⚠️  Process 'dev-server' is already running (PID: 12345)
   Started at: 6/14/2025, 10:30:15 AM
   Please wait for it to finish or stop it with Ctrl+C.
🚫 Exiting because process is already running.
```

## 💡 Best Practices

- ✅ **ใช้ Ctrl+C เพื่อหยุด dev server**: Lock files จะถูกล้างอัตโนมัติ
- ✅ **รัน `npm run dev` ได้เลย**: ระบบจะตรวจสอบให้เองว่ารันอยู่หรือไม่

## � Legacy Scripts

Scripts อื่นๆ ที่ไม่เกี่ยวข้องกับ dev server ถูกย้ายไป `legacy/` directory แล้ว
