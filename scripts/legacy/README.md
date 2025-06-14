# 📚 Legacy Scripts

Scripts เหล่านี้ถูกย้ายมาจาก `/scripts` หลักเพราะถูกแทนที่ด้วย unified tool ใหม่แล้ว

## 🔄 Migration Guide

### ✅ Scripts ที่ถูกแทนที่

| Legacy Script | Replaced By | New Command |
|---------------|-------------|-------------|
| `enhanced-dev-server.ts` | `pm.ts` | `bun scripts/pm.ts dev start` |
| `process-manager.ts` | `pm.ts` | `bun scripts/pm.ts process <command>` |
| `log-viewer.ts` | `pm.ts` | `bun scripts/pm.ts logs <command>` |
| `process-monitor.ts` | `pm.ts` | `bun scripts/pm.ts status` |
| `enhanced-checkout-reminder.ts` | `pm.ts` | `bun scripts/pm.ts checkout` |
| `checkout-reminder.ts` | `pm.ts` | `bun scripts/pm.ts checkout` |
| `manage-processes.sh` | `pm.sh` | `./scripts/pm.sh <command>` |
| `dev-help.sh` | `pm.sh` | `./scripts/pm.sh help` |
| `dev-start.sh` | `pm.ts` | `bun scripts/pm.ts dev start` |

### 🎯 สำหรับผู้ใช้งาน

หากคุณยังใช้ legacy scripts อยู่ กรุณาใช้ commands ใหม่แทน:

```bash
# แทนที่ ./scripts/enhanced-dev-server.ts
bun scripts/pm.ts dev start

# แทนที่ ./scripts/manage-processes.sh status  
./scripts/pm.sh status

# แทนที่ ./scripts/enhanced-checkout-reminder.ts
bun scripts/pm.ts checkout
```

### 🗑️ Safe to Delete

Scripts เหล่านี้สามารถลบได้อย่างปลอดภัยแล้ว เพราะฟังก์ชันถูก migrate ไป `pm.ts` หมดแล้ว

หากต้องการกู้คืน สามารถ checkout จาก git history ได้เสมอ

## 📖 References

- [Process Management Guide](../../docs/PROCESS_MANAGEMENT.md)
- [Main Scripts Directory](../)
- [PM Tool Documentation](../pm.ts)
