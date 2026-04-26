# 👩‍💻 Developer Guide

## Overview

This guide provides comprehensive information for developers working on the Bun LINE T3 application, covering development workflow, coding standards, testing practices, and contribution guidelines.

---

## 🏗️ Development Environment Setup

### Prerequisites Installation

```bash
# Install Bun (primary runtime)
curl -fsSL https://bun.sh/install | bash

# Install Node.js (for compatibility)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
bun --version  # Should be >= 1.0.0
node --version # Should be >= 18.0.0
```

### IDE Setup

**Recommended VS Code Extensions:**

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "prisma.prisma",
    "ms-vscode.vscode-json"
  ]
}
```

**VS Code Settings (`.vscode/settings.json`):**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "tailwindCSS.experimental.configFile": "tailwind.config.ts"
}
```

---

## 🔧 Project Architecture

### Directory Structure Deep Dive

```
src/
├── features/              # 🎯 Domain-driven feature modules
│   ├── attendance/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Attendance-specific components
│   │   ├── hooks/        # Attendance-related hooks
│   │   ├── services/     # Business logic
│   │   ├── types/        # TypeScript definitions
│   │   ├── helpers/      # Utility functions
│   │   └── constants/    # Feature-specific constants
│   ├── expenses/
│   │   ├── pages/        # Expense page components
│   │   ├── components/   # Expense components
│   │   ├── hooks/        # Expense hooks
│   │   └── lib/          # Expense utilities
│   ├── dca/
│   │   ├── pages/        # DCA page components
│   │   ├── components/   # DCA components
│   │   ├── hooks/        # DCA hooks
│   │   └── lib/          # DCA utilities
│   ├── subscriptions/
│   │   ├── pages/        # Subscription pages
│   │   ├── components/   # Subscription components
│   │   └── hooks/        # Subscription hooks
│   ├── monitoring/
│   │   ├── pages/        # Monitoring pages
│   │   └── components/   # Monitoring components
│   ├── line/
│   │   └── lib/          # LINE utilities
│   ├── auth/
│   │   └── lib/          # Auth utilities
│   └── tools/
│       └── components/   # Tool components (e.g., Thai ID generator)
├── lib/                  # 🔧 Shared utilities
│   ├── auth/            # Authentication utilities
│   │   ├── route-guard.ts # Route guard helpers
│   │   └── hooks/        # Shared auth hooks
│   ├── database/        # Database connection & helpers
│   ├── constants/       # Global constants
│   ├── utils/           # General utilities
│   ├── validation/      # Zod schemas
│   └── security/        # Security utilities
├── routes/              # 🌐 TanStack Start file-based routing
│   ├── *.tsx           # Route configuration files (thin, 6-10 lines)
│   └── api/            # API route handlers
└── components/          # 🎨 Shared UI Components
    └── ui/             # Base UI components (shadcn/ui)
```

### Feature Module Pattern

Each feature follows this structure:

```typescript
// features/[feature]/index.ts - Barrel export
export * from "./services";
export * from "./types";
export * from "./helpers";
export * from "./constants";

// features/[feature]/types/index.ts
export interface FeatureData {
  id: string;
  // ... type definitions
}

// features/[feature]/services/index.ts
export class FeatureService {
  async getData(): Promise<FeatureData> {
    // Implementation
  }
}

// ✅ Thin Route Pattern (TanStack Start)
// src/routes/feature-page.tsx
import { createFileRoute } from "@tanstack/react-router"
import { requireAuth } from "@/lib/auth/route-guard"
import { FeaturePage } from "@/features/feature/pages/FeaturePage"

export const Route = createFileRoute("/feature-page")({
  beforeLoad: requireAuth,
  component: FeaturePage,
})

// ✅ Page Component Pattern
// features/feature/pages/FeaturePage.tsx
"use client"

import { useFeatureData } from "@/features/feature/hooks/useFeatureData"
import { FeatureComponent } from "@/features/feature/components/FeatureComponent"

export function FeaturePage() {
  const { data, loading } = useFeatureData()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <FeatureComponent data={data} />
    </div>
  )
}
```

---

## 📝 Coding Standards

### TypeScript Guidelines

**1. Use strict type definitions:**

```typescript
// ✅ Good
interface UserData {
  id: string;
  name: string;
  email: string | null;
  createdAt: Date;
}

// ❌ Avoid
interface UserData {
  id: any;
  name?: string;
  [key: string]: any;
}
```

**2. Prefer interfaces over types for objects:**

```typescript
// ✅ Preferred
interface AttendanceRecord {
  checkInTime: Date;
  checkOutTime: Date | null;
}

// ✅ Acceptable for unions
type AttendanceStatus = "CHECKED_IN" | "CHECKED_OUT" | "ABSENT";
```

**3. Use utility types effectively:**

```typescript
// ✅ Good
type CreateUserRequest = Omit<User, "id" | "createdAt">;
type UpdateUserRequest = Partial<Pick<User, "name" | "email">>;
```

### React Component Guidelines

**1. Use functional components with hooks:**

```typescript
// ✅ Good
interface AttendanceTableProps {
  data: AttendanceRecord[]
  onUpdate: (id: string, data: UpdateData) => void
}

export function AttendanceTable({ data, onUpdate }: AttendanceTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div>
      {data.map(record => (
        <div key={record.id}>
          {/* Component content */}
        </div>
      ))}
    </div>
  )
}
```

**2. Custom hooks for shared logic:**

```typescript
// ✅ Good - Feature-specific hook in features/feature/hooks/
// features/attendance/hooks/useAttendanceData.ts
export function useAttendanceData(userId: string) {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch logic
  }, [userId]);

  return { data, loading, refetch: () => {} };
}

// ✅ Import from feature directory
import { useAttendanceData } from "@/features/attendance/hooks/useAttendanceData"
import { AttendanceTable } from "@/features/attendance/components/AttendanceTable"
```

### API Route Guidelines

**1. Consistent error handling:**

```typescript
// ✅ Good - TanStack Start server function
import { createRouteHandler } from "@tanstack/start/server"

export const POST = createRouteHandler(async (req) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json(
        { error: "Unauthorized - Please login first" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validatedData = schema.parse(body);

    // Business logic

    return Response.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }

    console.error("API Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
})
```

---

## 🧪 Testing Strategy

### Test Structure

```
tests/
├── src/                    # Unit tests mirroring src structure
│   ├── features/          # Feature module tests
│   ├── lib/               # Utility tests
│   └── components/        # Component tests
├── integration/           # Integration tests
├── e2e/                   # End-to-end tests
├── api/                   # API endpoint tests
└── helpers/               # Test utilities
```

### Unit Testing

**Testing utilities:**

```typescript
// tests/helpers/test-matchers.ts
export const testMatchers = {
  toBeValidDate: (received: any) => {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      pass,
      message: () => `Expected ${received} to be a valid Date`,
    };
  },
};
```

**Component testing:**

```typescript
// tests/src/features/attendance/components/AttendanceTable.test.tsx
import { render, screen } from '@testing-library/react'
import { AttendanceTable } from '@/features/attendance/components/AttendanceTable'

describe('AttendanceTable', () => {
  const mockData = [
    {
      id: '1',
      workDate: '2025-07-10',
      checkInTime: new Date('2025-07-10T08:00:00Z'),
      checkOutTime: new Date('2025-07-10T17:00:00Z'),
      status: 'CHECKED_OUT'
    }
  ]

  it('renders attendance records correctly', () => {
    render(<AttendanceTable data={mockData} onUpdate={jest.fn()} />)

    expect(screen.getByText('2025-07-10')).toBeInTheDocument()
    expect(screen.getByText('08:00')).toBeInTheDocument()
    expect(screen.getByText('17:00')).toBeInTheDocument()
  })
})
```

### API Testing

```typescript
// tests/api/attendance.test.ts
import { testApiHandler } from "next-test-api-route-handler";
import handler from "@/routes/api/attendance/update";

describe("/api/attendance/update", () => {
  it("updates attendance record successfully", async () => {
    await testApiHandler({
      handler,
      requestPatcher: (req) => {
        req.headers = {
          "content-type": "application/json",
          authorization: "Bearer valid-token",
        };
      },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PUT",
          body: JSON.stringify({
            attendanceId: "test-id",
            checkInTime: "2025-07-10T08:00:00Z",
            checkOutTime: "2025-07-10T17:00:00Z",
          }),
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
      },
    });
  });
});
```

---

## 🔄 Development Workflow

### Git Workflow

**Branch Naming Convention:**

```bash
# Feature branches
feature/attendance-reports
feature/crypto-tracking

# Bug fixes
fix/timezone-calculation
fix/login-redirect

# Hotfixes
hotfix/critical-security-patch

# Release branches
release/v1.2.0
```

**Commit Message Format:**

```bash
# Format: type(scope): description
feat(attendance): add monthly report generation
fix(auth): resolve LINE OAuth redirect issue
docs(api): update endpoint documentation
test(crypto): add unit tests for price fetching
refactor(utils): extract date formatting functions
```

### Development Process

**1. Create Feature Branch:**

```bash
git checkout -b feature/your-feature-name
```

**2. Development Commands:**

```bash
# Start development server
bun run dev

# Run tests in watch mode
bun test --watch

# Type checking
bun run lint

# Format code
bun run format
```

**3. Pre-commit Checklist:**

- [ ] Tests pass: `bun test`
- [ ] Linting passes: `bun run lint`
- [ ] Code formatted: `bun run format:check`
- [ ] Types valid: `tsc --noEmit`
- [ ] Documentation updated if needed

**4. Create Pull Request:**

```bash
git push origin feature/your-feature-name
# Create PR via GitHub UI
```

---

## 🚀 Build & Deployment

### Local Build Testing

```bash
# Test production build locally
bun run build

# Start production server
bun run start

# Test with production environment
NODE_ENV=production bun run start
```

### Environment Management

**Environment files:**

```bash
.env.development     # Local development
.env.test           # Test environment
.env.production     # Production deployment
```

**Environment switching:**

```bash
# Switch to development
bun run env:dev

# Switch to production
bun run env:prod

# Check current environment
bun run env:status
```

---

## 🔧 Debugging & Profiling

### Debug Configuration

**VS Code Debug (`.vscode/launch.json`):**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug TanStack Start",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/bun",
      "args": ["run", "dev"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "serverReadyAction": {
        "pattern": "Local:.*https://localhost:([0-9]+)",
        "uriFormat": "https://localhost:%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

### Performance Monitoring

**Performance utilities:**

```typescript
// lib/utils/performance.ts
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  const start = performance.now();
  const result = fn();

  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start;
      console.log(`${name}: ${duration}ms`);
    });
  }

  const duration = performance.now() - start;
  console.log(`${name}: ${duration}ms`);
  return result;
}
```

---

## 🛡️ Security Guidelines

### Input Validation

**Always use Zod schemas:**

```typescript
// ✅ Good
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(["USER", "ADMIN"]),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validatedData = CreateUserSchema.parse(body);
  // Use validatedData
}
```

### Authentication Patterns

**Route guard pattern:**

```typescript
// ✅ Good - Declarative route guard with TanStack Start
// src/lib/auth/route-guard.ts
import { redirect } from "@tanstack/react-router"

interface GuardArgs {
  context: { session: AppSession | null }
  location: { pathname: string }
}

export function requireAuth({ context, location }: GuardArgs) {
  if (!context.session?.user?.id) {
    throw redirect({
      to: "/login",
      search: { callbackUrl: location.pathname }
    })
  }
}

export function requireAdmin({ context, location }: GuardArgs) {
  requireAuth({ context, location })
  if (!context.session!.isAdmin) {
    throw redirect({ to: "/dashboard" })
  }
}

// ✅ Usage in route
// src/routes/protected.tsx
import { createFileRoute } from "@tanstack/react-router"
import { requireAuth } from "@/lib/auth/route-guard"
import { ProtectedPage } from "@/features/protected/pages/ProtectedPage"

export const Route = createFileRoute("/protected")({
  beforeLoad: requireAuth,
  component: ProtectedPage,
})

// ✅ Admin-only route
import { requireAdmin } from "@/lib/auth/route-guard"

export const Route = createFileRoute("/admin/settings")({
  beforeLoad: requireAdmin,
  component: AdminSettingsPage,
})
```

### SSRF Protection

**URL validation:**

```typescript
// ✅ Good
import { validateUrl } from "@/lib/security/url-validator";

export async function fetchExternalData(url: string) {
  if (!validateUrl(url)) {
    throw new Error("Invalid or disallowed URL");
  }

  const response = await fetch(url);
  return response.json();
}
```

---

## 📚 Best Practices

### Database Operations

**Use transactions for multiple operations:**

```typescript
// ✅ Good
export async function createAttendanceWithLeave(data: CreateData) {
  return await db.$transaction(async (tx) => {
    const attendance = await tx.workAttendance.create({ data: attendanceData });
    const leave = await tx.leave.create({ data: leaveData });
    return { attendance, leave };
  });
}
```

### Error Handling

**Consistent error response format:**

```typescript
// ✅ Good
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    );
  }

  console.error("Unexpected error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

### State Management

**Use React Context for shared state:**

```typescript
// ✅ Good
interface AppContextType {
  user: User | null;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
```

---

## 🔍 Code Review Guidelines

### Review Checklist

**Security:**

- [ ] Input validation implemented
- [ ] Authentication/authorization checked
- [ ] No secrets in code
- [ ] SQL injection protection
- [ ] XSS prevention measures

**Performance:**

- [ ] No unnecessary re-renders
- [ ] Database queries optimized
- [ ] Large data sets paginated
- [ ] Images optimized
- [ ] Bundle size impact considered

**Code Quality:**

- [ ] TypeScript types comprehensive
- [ ] Error handling implemented
- [ ] Tests written/updated
- [ ] Documentation updated
- [ ] Code follows conventions

**Functionality:**

- [ ] Requirements met
- [ ] Edge cases handled
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness
- [ ] Accessibility considerations

### Review Comments Format

```markdown
**Security**: This endpoint needs authentication validation

**Performance**: Consider caching this API response

**Bug**: Race condition possible here - use proper state management

**Suggestion**: Extract this logic into a reusable hook

**Question**: Why was this approach chosen over [alternative]?
```

---

## 📈 Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
ANALYZE=true bun run build

# Check for duplicate dependencies
npx bundle-analyzer
```

### Database Optimization

**Prisma query optimization:**

```typescript
// ✅ Good - Select only needed fields
const users = await db.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
  where: { active: true },
});

// ✅ Good - Use pagination
const users = await db.user.findMany({
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: "desc" },
});
```

### React Optimization

```typescript
// ✅ Good - Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateComplexValue(data)
}, [data])

// ✅ Good - Memoize components
const MemoizedComponent = memo(({ data }: Props) => {
  return <div>{data.name}</div>
})
```

---

This developer guide provides the foundation for contributing to the Bun LINE T3 project. Follow these guidelines to maintain code quality, security, and performance standards.
