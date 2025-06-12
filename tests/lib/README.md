# 🔧 Library Tests

ทดสอบ utility functions และ helper libraries

## 📁 โครงสร้าง

- `auth/` - ทดสอบ authentication utilities
- `constants/` - ทดสอบค่าคงที่ของแอปพลิเคชัน
- `database/` - ทดสอบ database utilities และ Prisma helpers
- `types/` - ทดสอบ TypeScript type definitions และ validators
- `utils/` - ทดสอบ general utility functions
- `validation/` - ทดสอบ input validation และ security functions

## 🧪 การรัน Test

```bash
# รัน lib tests ทั้งหมด
bun test tests/lib

# รัน test เฉพาะหมวด
bun test tests/lib/utils
bun test tests/lib/validation
```

## 🛡️ Security Focus

Library tests เน้นการทดสอบ:
- Input validation schemas (Zod)
- Cryptographic functions
- Security utilities
- Data sanitization
- Type safety
