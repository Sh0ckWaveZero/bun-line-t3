# Architecture Evolution

This document outlines the evolution of the project's architecture from its initial state to the current modern implementation.

## 1. Feature-Based Architecture Migration

### Completed Tasks

#### ✅ Architecture Migration
- [x] Migrated from monolithic services to feature-based architecture
- [x] Created feature modules: `attendance`, `auth`, `crypto`, `line`, `air-quality`
- [x] Established shared library structure in `src/lib/`
- [x] Implemented barrel exports for clean imports

#### ✅ File Organization
- [x] Moved services to respective feature folders
- [x] Organized types/interfaces by feature
- [x] Centralized shared utilities in `lib/`
- [x] Updated all import paths throughout the project

#### ✅ Configuration Updates
- [x] Added TypeScript path aliases (`@/features/*`, `@/lib/*`, `@/components/*`)
- [x] Updated tsconfig.json with new path mappings
- [x] Fixed all import/export declarations

#### ✅ Database & Auth
- [x] Unified database access through `~/lib/database/db`
- [x] Updated all Prisma usage to use new `db` export
- [x] Fixed auth configuration and exports

### Benefits Achieved

#### 1. Better Organization
```
Before: ~/services/attendance.ts
After:  ~/features/attendance/services/attendance.ts
```

#### 2. Cleaner Imports
```typescript
// Before
import { attendanceService } from '~/services/attendance';
import { lineService } from '~/services/line';
import { db } from '~/server/db';

// After  
import { attendanceService } from '~/features/attendance';
import { lineService } from '~/features/line';
import { db } from '~/lib/database';
```

#### 3. Scalability
- Easy to add new features without cluttering
- Clear boundaries between different domains
- Reusable shared utilities

#### 4. Developer Experience
- Intuitive folder structure
- Clear import paths with aliases
- Self-documenting architecture

## 2. App Router Migration (Next.js 15)

### Changes Made

#### 1. Configuration Updates
- **`next.config.mjs`**: Commented out `i18n` configuration to enable App Router
- App Router is now the default routing system

#### 2. New App Router Structure
```
src/app/
├── layout.tsx              # Root layout with metadata and providers
├── page.tsx               # Home page (migrated from pages/index.tsx)
├── providers.tsx          # Client-side providers wrapper
├── api/                   # API routes
│   ├── line/route.ts      # LINE webhook API
│   ├── attendance-push/route.ts    # Attendance push notifications
│   ├── attendance-report/route.ts  # Monthly attendance reports
│   └── auth/[...nextauth]/route.ts # NextAuth configuration
└── attendance-report/
    └── page.tsx           # Attendance report page
```

#### 3. Key Files Created/Modified

**Root Layout (`src/app/layout.tsx`)**
- Includes global metadata
- Wraps app with SessionProvider via Providers component
- Sets up global styles and theme colors

**Providers Component (`src/app/providers.tsx`)**
- Client component that wraps NextAuth SessionProvider
- Necessary because SessionProvider needs to be client-side

**Home Page (`src/app/page.tsx`)**
- Migrated from `pages/index.tsx`
- Now uses `useRouter` from `next/navigation` instead of `next/router`
- Converted to client component due to session usage

**Attendance Report Page (`src/app/attendance-report/page.tsx`)**
- Migrated from `pages/attendance-report.tsx`
- Updated router imports for App Router
- Enhanced with better authentication handling

#### 4. API Routes Migration

All API routes have been successfully migrated to the new App Router format:

**LINE Webhook (`src/app/api/line/route.ts`)**
- Converted from Pages API to App Router API
- Uses `NextRequest` and `Response.json()`
- Maintains compatibility with existing line service

**Attendance APIs**
- `attendance-report/route.ts`: GET endpoint for monthly reports
- `attendance-push/route.ts`: POST endpoint for push notifications

**NextAuth (`src/app/api/auth/[...nextauth]/route.ts`)**
- Simple migration exporting GET and POST handlers

#### 5. Component Updates

**Rings Component**
- Moved from `src/pages/components/Rings.tsx` to `src/components/common/Rings.tsx`
- Updated import paths in consuming components

#### 6. Removed Files
- Completely removed `src/pages/` directory
- Removed `src/pages/_app.tsx` (functionality moved to layout.tsx and providers.tsx)

### Benefits of App Router Migration

1. **Better Performance**: Server Components by default, reduced JavaScript bundle size
2. **Improved SEO**: Better metadata handling and static generation
3. **Enhanced Developer Experience**: 
   - Co-located layouts
   - Nested routing
   - Improved error handling
4. **Future-Proof**: Aligned with Next.js 15 best practices

### API Endpoints (No Change in URLs)

- `POST /api/line` - LINE webhook
- `GET /api/attendance-report` - Monthly attendance reports
- `POST /api/attendance-push` - Push notifications
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

## Current Architecture

The application follows a **Feature-Based Architecture** with clear separation of concerns:

```
🏢 Business Features
├── Attendance Management    # Core workforce tracking
├── LINE Bot Integration     # Messaging and interaction
├── Cryptocurrency Tracking  # Market data and alerts
└── Air Quality Monitoring   # Environmental awareness

🔧 Technical Foundation
├── Next.js 15 App Router    # Modern React framework
├── TypeScript               # Type-safe development
├── Prisma + MySQL           # Database layer
├── NextAuth.js              # Authentication
└── Bun Runtime              # Fast JavaScript runtime
```

## Evolution Timeline

1. **Initial Structure** - Monolithic architecture with flat file organization
2. **Feature Restructuring** - Migration to feature-based architecture
3. **App Router Migration** - Upgrade to Next.js 15 App Router
4. **Current State** - Modern, modular architecture with clean separations
