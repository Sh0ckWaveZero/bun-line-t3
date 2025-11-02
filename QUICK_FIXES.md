# Quick Fixes - High Impact, Low Effort

This document contains quick wins that can be implemented in 1-2 hours each.

## 1. Fix CORS Wildcard (1 hour)

**File:** `/src/app/api/attendance/update/route.ts`

**Current (INSECURE):**
```typescript
"Access-Control-Allow-Origin": "*",
```

**Fix:**
```typescript
import { env } from "@/env.mjs";

export async function OPTIONS() {
  const allowedOrigin = new URL(env.FRONTEND_URL).origin;
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
```

**Why:** Prevents CSRF attacks, restricts requests to your frontend only

---

## 2. Fix JSON.parse Error Handling (1 hour)

**File:** `/src/features/line/commands/ai-command-router.ts:268-277`

**Current:**
```typescript
for (const line of lines) {
  if (line.startsWith("parameters:")) {
    try {
      const paramStr = line.replace("parameters:", "").trim();
      Object.assign(parameters, JSON.parse(paramStr)); // ⚠️ No inner catch
    } catch {
      // Ignore parsing errors
    }
  }
}
```

**Fix:**
```typescript
for (const line of lines) {
  if (line.startsWith("parameters:")) {
    const paramStr = line.replace("parameters:", "").trim();
    try {
      const parsed = JSON.parse(paramStr);
      if (parsed && typeof parsed === 'object') {
        Object.assign(parameters, parsed);
      }
    } catch (e) {
      console.warn(`Failed to parse parameters: ${paramStr}`);
      // Continue with empty parameters
    }
  }
}
```

**Why:** Prevents silent failures when AI returns malformed JSON

---

## 3. Add Security Headers Middleware (1-2 hours)

**Create:** `/src/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'"
  );

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**Why:** Protects against XSS, clickjacking, and MIME type sniffing attacks

---

## 4. Consolidate Timezone Functions (2 hours)

**Create:** `/src/lib/utils/timezone.ts`

```typescript
import { parse, format } from 'date-fns-tz';

const THAILAND_TZ = 'Asia/Bangkok';
const THAILAND_OFFSET = 7 * 60 * 60 * 1000;

export const timezoneUtils = {
  // Convert UTC Date to Thailand time
  toThaiTime: (utcDate: Date): Date => {
    return new Date(utcDate.getTime() + THAILAND_OFFSET);
  },

  // Convert Thailand local time to UTC
  fromThaiTime: (thaiDate: Date): Date => {
    return new Date(thaiDate.getTime() - THAILAND_OFFSET);
  },

  // Format for display
  formatThaiTime: (date: Date, formatStr = 'dd/MM/yyyy HH:mm:ss'): string => {
    return format(date, formatStr, { timeZone: THAILAND_TZ });
  },

  // Parse datetime-local input
  parseLocalDateTime: (dateString: string): Date => {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateString)) {
      return parse(dateString, "yyyy-MM-dd'T'HH:mm", new Date(), {
        timeZone: THAILAND_TZ,
      });
    }
    return new Date(dateString);
  },

  // Safe log string (date only, no time)
  toSafeLogString: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },
};
```

**Then update:** `/src/lib/validation/datetime.ts`
```typescript
import { timezoneUtils } from './timezone';

// Use timezoneUtils.parseLocalDateTime instead of manual parsing
export const parseDateTime = (dateString: string): Date => {
  return timezoneUtils.parseLocalDateTime(dateString);
};
```

**Why:** Single source of truth, reduces code duplication, uses battle-tested date library

---

## 5. Consistent Zod Error Formatting (1 hour)

**Create:** `/src/lib/validation/zod-error.ts`

```typescript
import { z } from 'zod';

export function formatZodErrors(errors: z.ZodError) {
  return errors.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

export function zodErrorResponse(error: z.ZodError, status = 400) {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: formatZodErrors(error),
    },
    { status }
  );
}
```

**Use in all API routes:**
```typescript
import { zodErrorResponse } from '@/lib/validation/zod-error';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = MySchema.parse(body);
    // ...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return zodErrorResponse(error);
    }
    // ...
  }
}
```

**Why:** Consistent error responses, better DX for API consumers

---

## 6. Create Logger Utility (2 hours)

**Create:** `/src/lib/logging/logger.ts`

```typescript
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

const currentLevel =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

export const logger = {
  error: (message: string, context?: Record<string, any>) => {
    console.error(JSON.stringify({ level: 'error', message, context, timestamp: new Date().toISOString() }));
  },

  warn: (message: string, context?: Record<string, any>) => {
    if (logLevels[currentLevel as keyof typeof logLevels] >= logLevels.warn) {
      console.warn(JSON.stringify({ level: 'warn', message, context, timestamp: new Date().toISOString() }));
    }
  },

  info: (message: string, context?: Record<string, any>) => {
    if (logLevels[currentLevel as keyof typeof logLevels] >= logLevels.info) {
      console.info(JSON.stringify({ level: 'info', message, context, timestamp: new Date().toISOString() }));
    }
  },

  debug: (message: string, context?: Record<string, any>) => {
    if (logLevels[currentLevel as keyof typeof logLevels] >= logLevels.debug) {
      console.debug(JSON.stringify({ level: 'debug', message, context, timestamp: new Date().toISOString() }));
    }
  },

  /**
   * Structured logging for sensitive operations
   * Never logs sensitive data directly
   */
  audit: (action: string, userId: string, context?: Record<string, any>) => {
    console.info(
      JSON.stringify({
        level: 'audit',
        action,
        userId,
        context,
        timestamp: new Date().toISOString(),
      })
    );
  },
};
```

**Usage:**
```typescript
import { logger } from '@/lib/logging/logger';

try {
  await updateAttendance(data);
  logger.info('Attendance updated', { attendanceId: data.id, userId });
} catch (error) {
  logger.error('Failed to update attendance', {
    attendanceId: data.id,
    error: error instanceof Error ? error.message : 'Unknown error',
  });
}
```

**Why:** Structured logging, environment-aware, easier debugging and monitoring

---

## 7. Reduce Datetime Range Validation (30 minutes)

**File:** `/src/lib/validation/datetime.ts:118-130`

**Current (365 days past allowed):**
```typescript
isWithinAcceptableRange: (
  date: Date,
  maxPastDays = 365,    // ⚠️ Too wide!
  maxFutureDays = 30,
)
```

**Fix (14 days past, 7 days future):**
```typescript
isWithinAcceptableRange: (
  date: Date,
  maxPastDays = 14,     // ✅ Smaller window
  maxFutureDays = 7,
): boolean => {
  const now = new Date();
  const maxPast = new Date(now.getTime() - maxPastDays * 24 * 60 * 60 * 1000);
  const maxFuture = new Date(now.getTime() + maxFutureDays * 24 * 60 * 60 * 1000);
  
  if (date < maxPast || date > maxFuture) {
    throw new Error(
      `Attendance date must be within ${maxPastDays} days past and ${maxFutureDays} days future`
    );
  }

  return true;
};
```

**Why:** Prevents payroll fraud, limits manual backdating exploits

---

## 8. Extract Simple Custom Hooks (2 hours)

**Create:** `/src/hooks/useLocalDateTime.ts`

```typescript
import { useState, useCallback } from 'react';
import { timezoneUtils } from '@/lib/utils/timezone';

export function useLocalDateTime(initialDate?: Date) {
  const [date, setDate] = useState<Date>(initialDate || new Date());

  const setFromLocalInput = useCallback((localDateTimeString: string) => {
    const parsed = timezoneUtils.parseLocalDateTime(localDateTimeString);
    setDate(parsed);
  }, []);

  const getLocalInputValue = useCallback((): string => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  }, [date]);

  return { date, setDate, setFromLocalInput, getLocalInputValue };
}
```

**Use in components:**
```typescript
const { date, getLocalInputValue, setFromLocalInput } = useLocalDateTime();

return (
  <input
    type="datetime-local"
    value={getLocalInputValue()}
    onChange={(e) => setFromLocalInput(e.target.value)}
  />
);
```

**Why:** Reduces boilerplate, encapsulates timezone logic in components

---

## Quick Summary

| Fix | File | Time | Impact | Difficulty |
|-----|------|------|--------|------------|
| Fix CORS | `/src/app/api/attendance/update/route.ts` | 1h | HIGH | Easy |
| JSON.parse Error | `/src/features/line/commands/ai-command-router.ts` | 1h | MEDIUM | Easy |
| Security Headers | Create `middleware.ts` | 1-2h | HIGH | Easy |
| Timezone Utils | Create `/src/lib/utils/timezone.ts` | 2h | MEDIUM | Medium |
| Zod Errors | Create `/src/lib/validation/zod-error.ts` | 1h | MEDIUM | Easy |
| Logger | Create `/src/lib/logging/logger.ts` | 2h | MEDIUM | Medium |
| DateTime Range | `/src/lib/validation/datetime.ts` | 30m | HIGH | Easy |
| Custom Hooks | Create `/src/hooks/useLocalDateTime.ts` | 2h | LOW | Medium |

**Total Time:** ~11 hours for all fixes
**Expected Impact:** Significant improvement in security, code quality, and maintainability

---

## Next Steps

1. Start with Quick Fixes (11 hours)
2. Then tackle HIGH priority items from CODE_QUALITY_ANALYSIS.md
3. Build test suite (60+ hours)
4. Optimize performance (20+ hours)

