# 🛠️ Development Guide

Comprehensive guide for developing and maintaining the Bun LINE T3 application.

## 📋 Table of Contents

- [🔧 Prerequisites](#-prerequisites)
- [🚀 Setup](#-setup)
- [🏗️ Project Structure](#️-project-structure)
- [💻 Development Workflow](#-development-workflow)
- [🎨 Code Style Guide](#-code-style-guide)
- [🧪 Testing](#-testing)
- [🔍 Debugging](#-debugging)
- [📦 Package Management](#-package-management)
- [🌐 Environment Management](#-environment-management)
- [🚀 Deployment](#-deployment)

## 🔧 Prerequisites

### Required Software

- **Bun** >= 1.0.0 - [Install Bun](https://bun.sh/docs/installation)
- **Node.js** >= 18.0.0 - [Install Node.js](https://nodejs.org/)
- **MySQL** >= 8.0 - [Install MySQL](https://dev.mysql.com/downloads/)
- **Git** - Version control

### Development Tools

- **VS Code** (Recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - Prettier - Code Formatter
  - ESLint
  - Tailwind CSS IntelliSense
  - Prisma
  - Auto Import - ES6, TS, JSX, TSX

### LINE Developer Account

- LINE Official Account Manager access
- LINE Developers Console access
- Basic understanding of LINE Bot API

## 🚀 Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd bun-line-t3

# Install dependencies
bun install

# Generate Prisma client
bunx prisma generate
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Configure your environment variables
vim .env  # or your preferred editor
```

Required environment variables:
```env
DATABASE_URL="mysql://user:password@localhost:3306/bun_line_t3"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://localhost:4325"
LINE_CLIENT_ID="your-line-client-id"
LINE_CLIENT_SECRET="your-line-client-secret"
LINE_CHANNEL_SECRET="your-line-channel-secret"
LINE_CHANNEL_ACCESS="your-line-channel-access-token"
```

### 3. Database Setup

```bash
# Push database schema
bun run db:push

# Seed Thai holidays data
bun run seed:holidays

# Optional: Open Prisma Studio
bunx prisma studio
```

### 4. SSL Certificates (Development)

```bash
# Install mkcert for local SSL
brew install mkcert  # macOS

# Create certificates
mkcert -install
mkcert localhost

# Move certificates to project
mkdir -p certificates
mv localhost.pem certificates/
mv localhost-key.pem certificates/
```

### 5. Start Development Server

```bash
bun run dev
```

Application will be available at: `https://localhost:4325`

## 🏗️ Project Structure

### Feature-Based Architecture

```
src/
├── features/              # Domain-driven modules
│   ├── attendance/        # Work attendance system
│   │   ├── services/      # Business logic
│   │   ├── types/         # TypeScript definitions
│   │   └── utils/         # Helper functions
│   ├── auth/             # Authentication
│   ├── crypto/           # Cryptocurrency tracking
│   ├── line/             # LINE Bot integration
│   └── air-quality/      # Air quality monitoring
├── lib/                  # Shared utilities
│   ├── auth/            # Auth configuration
│   ├── database/        # DB connection
│   ├── constants/       # App constants
│   └── validation/      # Schema validation
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
└── components/          # Reusable UI components
```

### Key Directories

- **`src/features/`** - Domain-specific modules with clear boundaries
- **`src/lib/`** - Shared utilities and configurations
- **`src/app/api/`** - Next.js API routes (thin layer over features)
- **`docs/`** - Comprehensive documentation
- **`prisma/`** - Database schema and migrations

### Import Patterns

```typescript
// Feature imports
import { attendanceService } from '@/features/attendance'
import { lineService } from '@/features/line'

// Shared library imports
import { db } from '@/lib/database'
import { authOptions } from '@/lib/auth'

// Component imports
import { Button } from '@/components/ui/button'

// Type imports
import type { AttendanceRecord } from '@/features/attendance/types'
```

## 💻 Development Workflow

### 1. Branch Strategy

```bash
# Feature development
git checkout -b feature/new-feature-name

# Bug fixes
git checkout -b fix/bug-description

# Documentation
git checkout -b docs/update-readme
```

### 2. Development Process

1. **Create feature branch** from `main`
2. **Implement changes** following code style guide
3. **Add/update tests** if applicable
4. **Update documentation** for significant changes
5. **Run linting and formatting**
6. **Test thoroughly** in development environment
7. **Create pull request** with detailed description

### 3. Commit Convention

Follow conventional commits:

```bash
# Feature
git commit -m "feat(attendance): add early check-in support"

# Bug fix
git commit -m "fix(line): resolve webhook validation issue"

# Documentation
git commit -m "docs: update API documentation"

# Refactor
git commit -m "refactor(crypto): optimize price fetching logic"
```

### 4. Adding New Features

1. **Create feature directory**:
   ```bash
   mkdir -p src/features/new-feature/{services,types,utils}
   ```

2. **Add barrel export**:
   ```typescript
   // src/features/new-feature/index.ts
   export * from './services/new-feature-service'
   export * from './types'
   export * from './utils'
   ```

3. **Create service layer**:
   ```typescript
   // src/features/new-feature/services/new-feature-service.ts
   import { db } from '@/lib/database'
   import type { NewFeatureData } from '../types'

   export const newFeatureService = {
     async create(data: NewFeatureData) {
       // Implementation
     },
     
     async findById(id: string) {
       // Implementation
     }
   }
   ```

4. **Add API routes** (if needed):
   ```typescript
   // src/app/api/new-feature/route.ts
   import { newFeatureService } from '@/features/new-feature'

   export async function POST(request: Request) {
     // Implementation
   }
   ```

## 🎨 Code Style Guide

### TypeScript Standards

```typescript
// ✅ Good: Use interfaces for object shapes
interface UserAttendance {
  userId: string
  checkInTime: Date
  checkOutTime?: Date
  workHours: number
}

// ✅ Good: Use const assertions for immutable data
const WORK_HOURS = {
  STANDARD: 9,
  OVERTIME_THRESHOLD: 8,
} as const

// ✅ Good: Use descriptive function names with auxiliary verbs
const calculateWorkHours = (checkIn: Date, checkOut: Date): number => {
  const diffInMs = checkOut.getTime() - checkIn.getTime()
  return diffInMs / (1000 * 60 * 60) // Convert to hours
}

// ✅ Good: Use early returns for better readability
const validateAttendance = (data: AttendanceData) => {
  if (!data.userId) return { error: 'User ID required' }
  if (!data.checkInTime) return { error: 'Check-in time required' }
  
  return { success: true }
}
```

### React 19 Components

```tsx
// ✅ Good: Server Component (default)
const AttendanceReport = async ({ userId }: { userId: string }) => {
  const attendance = await getAttendanceData(userId)
  
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Attendance Report</h1>
      {/* Component content */}
    </div>
  )
}

// ✅ Good: Client Component when needed
'use client'

import { useActionState } from 'react'

const InteractiveChart = ({ data }: { data: ChartData[] }) => {
  const [state, formAction] = useActionState(chartAction, initialState)
  
  return (
    <form action={formAction}>
      {/* Interactive content */}
    </form>
  )
}
```

### File Organization

```typescript
// features/attendance/services/attendance.ts

// 1. External imports
import { PrismaClient } from '@prisma/client'
import { format } from 'date-fns'

// 2. Internal imports
import { db } from '@/lib/database'
import type { AttendanceRecord } from '../types'

// 3. Constants
const WORK_HOURS_PER_DAY = 9

// 4. Main implementation
export const attendanceService = {
  async checkIn(userId: string): Promise<AttendanceRecord> {
    const now = new Date()
    const expectedCheckOut = new Date(now)
    expectedCheckOut.setHours(now.getHours() + WORK_HOURS_PER_DAY)
    
    return await db.attendance.create({
      data: {
        userId,
        checkInTime: now,
        expectedCheckOutTime: expectedCheckOut,
      }
    })
  },
  
  async checkOut(userId: string): Promise<AttendanceRecord> {
    const now = new Date()
    
    return await db.attendance.update({
      where: { userId },
      data: { checkOutTime: now }
    })
  }
}

// 5. Helper functions (if small and related)
const formatWorkTime = (hours: number): string => {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  return `${wholeHours}h ${minutes}m`
}
```

### Naming Conventions

- **Files**: `kebab-case.ts` or `PascalCase.tsx` for components
- **Directories**: `kebab-case/`
- **Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Components**: `PascalCase`
- **Functions**: `camelCase` with descriptive verbs
- **Event Handlers**: `handle` prefix (handleClick, handleSubmit)

## 🧪 Testing

### Manual Testing

```bash
# Test attendance functionality
bun run scripts/test-attendance.ts

# Test database connection
bunx prisma db pull

# Check schema sync
bunx prisma format
```

### Testing Areas

- **Attendance System**: Check-in/out, reports, holidays
- **LINE Integration**: Webhook responses, message formatting
- **Authentication**: LINE OAuth flow, session management
- **Database**: Schema changes, data integrity
- **API Endpoints**: Request/response validation

### Testing Checklist

- [ ] All API endpoints respond correctly
- [ ] Database operations work as expected  
- [ ] LINE webhook processes messages properly
- [ ] Authentication flow works end-to-end
- [ ] Error handling works for edge cases
- [ ] Environment variables are properly validated

## 🔍 Debugging

### Development Tools

```bash
# Enable debug logging
export DEBUG=*

# Check database queries
bunx prisma studio

# Monitor application logs
tail -f logs/application.log
```

### Common Issues & Solutions

1. **Database Connection Issues**
   ```bash
   # Check MySQL status
   brew services list | grep mysql
   
   # Restart MySQL
   brew services restart mysql
   
   # Check connection
   mysql -u root -p
   ```

2. **SSL Certificate Problems**
   ```bash
   # Regenerate certificates
   mkcert localhost
   
   # Verify certificate location
   ls -la certificates/
   ```

3. **LINE Webhook Issues**
   - Check ngrok tunnel for local development
   - Verify webhook URL in LINE Console
   - Check LINE channel configuration
   - Validate request signatures

4. **Build Errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   
   # Regenerate Prisma client
   bunx prisma generate
   
   # Check TypeScript errors
   bunx tsc --noEmit
   ```

### Debugging LINE Bot

```bash
# Test webhook locally with ngrok
ngrok http 4325

# Check LINE webhook logs in Developer Console
# Verify signature validation in webhook handler
```

## 📦 Package Management

### Adding Dependencies

```bash
# Production dependency
bun add package-name

# Development dependency
bun add -d package-name

# Update all dependencies
bun update

# Check for outdated packages
bun outdated
```

### Important Dependencies

- **Framework**: Next.js 15, React 19, Bun
- **Database**: Prisma, MySQL
- **Authentication**: NextAuth.js
- **Validation**: Zod
- **Styling**: Tailwind CSS
- **Development**: TypeScript, ESLint, Prettier

### Dependency Guidelines

- Keep dependencies up to date for security
- Use exact versions for critical packages
- Document any dependency-specific configurations
- Test thoroughly after major version updates

## 🌐 Environment Management

### Environment Files

- **`.env`** - Local development (git-ignored)
- **`.env.example`** - Template for required variables
- **`.env.production`** - Production overrides

### Environment Validation

The application uses `@t3-oss/env-nextjs` for type-safe environment validation:

```typescript
// src/env.mjs
import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(1),
    LINE_CHANNEL_ACCESS: z.string(),
    // ... other server variables
  },
  client: {
    // Client-side variables prefixed with NEXT_PUBLIC_
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    // ... map all variables
  }
})
```

### Best Practices

- Never commit `.env` files to version control
- Use descriptive variable names
- Group related variables together
- Document all required variables in `.env.example`
- Validate all environment variables at startup

## 🚀 Deployment

### Production Build

```bash
# Build application
bun run build

# Start production server
bun run start

# Check build output
ls -la .next/
```

### Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrated and seeded
- [ ] SSL certificates valid
- [ ] LINE webhook URL updated
- [ ] Build successful without errors
- [ ] Health checks implemented and passing
- [ ] Error monitoring configured

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add
```

#### Railway
```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Deploy
railway login
railway link
railway up
```

#### Digital Ocean App Platform
- Configure app spec with build commands
- Set environment variables in dashboard
- Configure domain and SSL

### Performance Optimization

- Enable Next.js static optimization
- Configure CDN for static assets
- Implement proper caching strategies
- Monitor Core Web Vitals
- Use React Server Components where possible

## 📊 Monitoring & Maintenance

### Health Checks

```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return Response.json({ status: 'healthy', timestamp: new Date() })
  } catch (error) {
    return Response.json({ status: 'unhealthy', error }, { status: 500 })
  }
}
```

### Log Management

```typescript
// Use structured logging
console.log(JSON.stringify({
  level: 'info',
  message: 'User checked in',
  userId,
  timestamp: new Date()
}))
```

### Database Maintenance

```bash
# Regular maintenance tasks
bunx prisma db pull          # Sync schema
bunx prisma format          # Format schema
bunx prisma validate        # Validate schema
```

---

## 📚 Additional Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev/blog/2024/12/05/react-19)
- [LINE Bot API Reference](https://developers.line.biz/en/reference/messaging-api/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Bun Documentation](https://bun.sh/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)

## 🤝 Getting Help

- Check existing [documentation](../docs/)
- Review [GitHub Issues](https://github.com/your-repo/issues)
- Search Stack Overflow with relevant tags
- Contact the development team
- Join the community Discord/Slack

## 🔄 Continuous Improvement

- Regularly review and update dependencies
- Monitor performance metrics
- Collect user feedback
- Update documentation as the project evolves
- Conduct code reviews for all changes
- Keep security practices up to date
