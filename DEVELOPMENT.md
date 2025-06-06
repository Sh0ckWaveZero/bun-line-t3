# Development Guide

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Fill in your environment variables

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

### Feature Organization
Each feature follows this structure:
```
src/features/{feature-name}/
├── services/     # Business logic
├── types/        # TypeScript interfaces
├── utils/        # Feature-specific utilities
└── index.ts      # Barrel exports
```

### Import Patterns

```typescript
// Feature imports
import { attendanceService } from '~/features/attendance';
import { lineService } from '~/features/line';

// Shared library imports
import { db } from '~/lib/database';
import { authOptions } from '~/lib/auth';

// Using path aliases
import { Button } from '@/components/ui/button';
import { cryptoService } from '@/features/crypto';
```

## 🔧 Adding New Features

1. **Create feature folder**:
   ```bash
   mkdir -p src/features/new-feature/{services,types,utils}
   ```

2. **Add barrel export**:
   ```typescript
   // src/features/new-feature/index.ts
   export * from './services/new-feature-service';
   export * from './types';
   ```

3. **Create API routes** (if needed):
   ```typescript
   // src/app/api/new-feature/route.ts
   import { newFeatureService } from '~/features/new-feature';
   ```

## 🧪 Testing

```bash
# Run tests
npm test

# Test specific service
npx ts-node scripts/test-attendance.ts
```

## 📚 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema

## 🔗 Useful Links

- [Backend Architecture](./docs/BACKEND_ARCHITECTURE.md)
- [Attendance System](./docs/ATTENDANCE_SYSTEM.md)
- [Security Guide](./docs/SECURITY.md)
- [App Router Migration](./docs/APP_ROUTER_MIGRATION.md)
