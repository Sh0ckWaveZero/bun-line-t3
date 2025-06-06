# Backend Architecture

โครงสร้าง backend ใหม่ที่ได้รับการจัดระเบียบตาม Feature-Based Architecture

## 📁 Structure Overview

```
src/
├── features/              # Feature-based modules
│   ├── attendance/        # Attendance management
│   │   ├── api/          # API routes
│   │   ├── services/     # Business logic
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Feature-specific utilities
│   ├── auth/             # Authentication
│   ├── crypto/           # Cryptocurrency features
│   ├── line/             # LINE Bot integration
│   └── air-quality/      # Air quality monitoring
├── lib/                  # Shared utilities
│   ├── auth/            # Authentication utilities
│   ├── database/        # Database connection
│   ├── constants/       # Application constants
│   ├── types/           # Shared types
│   └── validation/      # Validation utilities
└── app/api/             # Next.js API routes (proxies to features)
```

## 🏗️ Architecture Principles

### 1. Feature-Based Organization
- แต่ละ feature มีโฟลเดอร์แยกจากกัน
- ภายในแต่ละ feature มี api, services, types, utils
- การแยกความรับผิดชอบชัดเจน (Separation of Concerns)

### 2. Shared Libraries
- `lib/` ประกอบด้วย utilities ที่ใช้ร่วมกัน
- Database connection, authentication, validation
- Constants และ shared types

### 3. API Layer
- API routes ใน `app/api/` เป็น proxy ไปยัง feature services
- ใช้ Next.js 15 App Router
- Support สำหรับ Server Actions

## 📦 Import Patterns

### Feature Imports
```typescript
// Feature-specific imports
import { attendanceService } from '~/features/attendance/services/attendance';
import { lineService } from '~/features/line/services/line';

// Or using barrel exports
import { attendanceService } from '~/features/attendance';
```

### Shared Library Imports
```typescript
// Database
import { db } from '~/lib/database';

// Auth
import { auth } from '~/lib/auth';

// Constants
import { API_ENDPOINTS } from '~/lib/constants';
```

### TypeScript Path Aliases
```typescript
// Available aliases
import { ... } from '@/features/attendance';
import { ... } from '@/lib/database';
import { ... } from '@/components/common';
```

## 🔧 Development Guidelines

### 1. Adding New Features
1. สร้างโฟลเดอร์ใหม่ใน `src/features/`
2. เพิ่ม `services/`, `types/`, `utils/` ตามต้องการ
3. สร้าง `index.ts` สำหรับ barrel exports
4. เพิ่ม API routes ใน `api/` ของ feature

### 2. Shared Utilities
- ใส่ใน `src/lib/` หากใช้ในหลาย features
- แยก types, constants, validation logic
- ใช้ barrel exports เพื่อความสะดวก

### 3. Database Operations
- ใช้ `db` จาก `~/lib/database`
- Repository pattern สำหรับ complex queries
- Transaction handling ใน service layer

## 🚀 Benefits

1. **Scalability**: ง่ายในการเพิ่ม features ใหม่
2. **Maintainability**: โค้ดแยกตามหน้าที่ชัดเจน
3. **Testability**: แต่ละ module ทดสอบได้อิสระ
4. **Developer Experience**: Import paths ชัดเจน
5. **Performance**: Tree-shaking ทำงานได้ดีขึ้น

## 📋 Migration Checklist

- [✅] ย้าย services ไปยัง features
- [✅] ย้าย types/interfaces ไปยัง features
- [✅] ย้าย API routes ไปยัง features
- [✅] สร้าง shared lib structure
- [✅] อัปเดต import paths
- [✅] เพิ่ม TypeScript path aliases
- [✅] ลบโฟลเดอร์เก่า
- [✅] ทดสอบการทำงาน
