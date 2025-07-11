# Shared Utilities Documentation

## Overview

This document covers the shared utility functions created to support cron jobs and other system components. These utilities promote code reusability, consistency, and maintainability across the application.

## Architecture

### Utility Categories

```
src/lib/utils/
├── cron-auth.ts              # Authentication validation
├── cron-response.ts          # Standardized API responses
├── cron-time-validation.ts   # Time window validation
├── cron-working-day.ts       # Working day validation
├── cron-reminder-sender.ts   # Check-in reminder logic
├── line-messaging.ts         # LINE messaging utilities
└── datetime.ts              # Date/time utilities (enhanced)
```

## Authentication Utilities

### `cron-auth.ts`

Provides authentication validation for cron job endpoints with two different styles.

#### Functions

##### `validateCronAuth(req: NextRequest): AuthResult`

**Purpose**: Comprehensive authentication validation with detailed error responses.

**Parameters**:

- `req: NextRequest` - The incoming request object

**Returns**: `AuthResult`

```typescript
interface AuthResult {
  success: boolean;
  error?: string;
  status?: number;
}
```

**Usage**:

```typescript
import { validateCronAuth } from "@/lib/utils/cron-auth";

export async function GET(req: NextRequest) {
  const authResult = validateCronAuth(req);
  if (!authResult.success) {
    return createErrorResponse(authResult.error!, authResult.status!);
  }
  // Proceed with authenticated logic
}
```

**Error Scenarios**:

- Missing `CRON_SECRET` environment variable → 500 Internal Server Error
- Missing/invalid authorization header → 401 Unauthorized
- Invalid token → 401 Unauthorized

##### `validateSimpleCronAuth(authHeader: string | null): boolean`

**Purpose**: Simple boolean authentication validation for basic use cases.

**Parameters**:

- `authHeader: string | null` - The authorization header value

**Returns**: `boolean` - `true` if authentication is valid, `false` otherwise

**Usage**:

```typescript
import { validateSimpleCronAuth } from "@/lib/utils/cron-auth";

export async function GET(_req: NextRequest) {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (!validateSimpleCronAuth(authHeader)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Proceed with authenticated logic
}
```

## LINE Messaging Utilities

### `line-messaging.ts`

Provides utilities for sending LINE messages and creating message templates.

#### Functions

##### `sendPushMessage(userId: string, messages: any[]): Promise<Response>`

**Purpose**: Sends push messages to LINE users via LINE Messaging API.

**Parameters**:

- `userId: string` - LINE user ID to send message to
- `messages: any[]` - Array of LINE message objects

**Returns**: `Promise<Response>` - HTTP response from LINE API

**Usage**:

```typescript
import { sendPushMessage } from "@/lib/utils/line-messaging";

const messages = [
  {
    type: "text",
    text: "Hello! This is a reminder message.",
  },
];

try {
  await sendPushMessage(lineUserId, messages);
  console.log("Message sent successfully");
} catch (error) {
  console.error("Failed to send message:", error);
}
```

**Error Handling**:

- Validates LINE channel access token
- Handles network failures and API errors
- Logs detailed error information

##### `createFlexCarousel(bubbleItems: any[]): any[]`

**Purpose**: Creates a flex message carousel for rich LINE message displays.

**Parameters**:

- `bubbleItems: any[]` - Array of bubble template objects

**Returns**: `any[]` - Formatted flex message array

**Usage**:

```typescript
import { createFlexCarousel } from "@/lib/utils/line-messaging";

const bubbleItems = [
  bubbleTemplate.workStatus({
    id: "123",
    userId: "user1",
    checkInTime: new Date(),
    status: "CHECKED_IN_ON_TIME",
  }),
];

const flexMessage = createFlexCarousel(bubbleItems);
await sendPushMessage(lineUserId, flexMessage);
```

## Date/Time Utilities

### `datetime.ts` (Enhanced)

Enhanced date/time utilities with proper UTC handling and timezone conversions.

#### Key Functions

##### `getCurrentUTCTime(): Date`

**Purpose**: Returns current UTC time (corrected implementation).

**Important**: This function was fixed to return actual UTC time instead of local time.

**Returns**: `Date` - Current UTC time

**Usage**:

```typescript
import { getCurrentUTCTime } from "@/lib/utils/datetime";

const utcNow = getCurrentUTCTime();
console.log(`Current UTC: ${utcNow.toISOString()}`);
```

**Before vs After**:

```typescript
// ❌ Before (incorrect)
export const getCurrentUTCTime = (): Date => {
  return new Date(); // This was local time!
};

// ✅ After (correct)
export const getCurrentUTCTime = (): Date => {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000);
};
```

##### `convertUTCToBangkok(utcDate: Date): Date`

**Purpose**: Converts UTC time to Bangkok timezone using proper timezone APIs.

**Parameters**:

- `utcDate: Date` - UTC date to convert

**Returns**: `Date` - Date object representing Bangkok time

**Usage**:

```typescript
import { getCurrentUTCTime, convertUTCToBangkok } from "@/lib/utils/datetime";

const utcTime = getCurrentUTCTime();
const bangkokTime = convertUTCToBangkok(utcTime);
console.log(`Bangkok: ${bangkokTime.toLocaleString()}`);
```

##### `formatUTCTimeAsThaiTime(utcDate: Date): string`

**Purpose**: Formats UTC time as Bangkok time string (HH:MM format).

**Parameters**:

- `utcDate: Date` - UTC date to format

**Returns**: `string` - Time in HH:MM format (Bangkok timezone)

**Usage**:

```typescript
import { formatUTCTimeAsThaiTime } from "@/lib/utils/datetime";

const reminderTime = new Date("2025-01-07T10:30:00Z");
const displayTime = formatUTCTimeAsThaiTime(reminderTime);
console.log(`Reminder at: ${displayTime}`); // "17:30"
```

## Response Utilities

### `cron-response.ts`

Provides standardized response formatting for cron job endpoints.

#### Functions

##### `createErrorResponse(error: string, status: number, details?: string): Response`

**Purpose**: Creates standardized error responses.

**Parameters**:

- `error: string` - Error message
- `status: number` - HTTP status code
- `details?: string` - Optional error details

**Usage**:

```typescript
import { createErrorResponse } from "@/lib/utils/cron-response";

try {
  // Some operation
} catch (error: any) {
  return createErrorResponse("Failed to process request", 500, error.message);
}
```

##### `createSkippedResponse(message: string, holidayInfo?: any): Response`

**Purpose**: Creates standardized responses for skipped operations.

**Usage**:

```typescript
if (!isWorkingDay) {
  return createSkippedResponse("Skipped - not a working day", holidayInfo);
}
```

## Time Validation Utilities

### `cron-time-validation.ts`

Validates time windows for cron job execution.

#### Functions

##### `validateReminderTime(currentUTCTime: Date): TimeValidationResult`

**Purpose**: Validates if current time is within acceptable range for check-in reminders.

**Logic**:

- **Production**: Only allow 01:00-02:59 UTC (08:00-09:59 Bangkok)
- **Development**: Allow all times for testing

**Returns**:

```typescript
interface TimeValidationResult {
  isValid: boolean;
  reason?: string;
  currentHour?: number;
}
```

**Usage**:

```typescript
import { validateReminderTime } from "@/lib/utils/cron-time-validation";

const timeValidation = validateReminderTime(currentUTCTime);
if (!timeValidation.isValid) {
  return createSkippedResponse(timeValidation.reason!);
}
```

## Working Day Utilities

### `cron-working-day.ts`

Validates working days including weekend and holiday checks.

#### Functions

##### `validateWorkingDay(currentThaiTime: Date): Promise<WorkingDayResult>`

**Purpose**: Checks if current date is a working day (excludes weekends and Thai holidays).

**Returns**:

```typescript
interface WorkingDayResult {
  isWorkingDay: boolean;
  reason?: string;
  holidayInfo?: {
    nameThai: string;
    nameEnglish: string;
    type: string;
  } | null;
}
```

**Usage**:

```typescript
import { validateWorkingDay } from "@/lib/utils/cron-working-day";

const workingDayResult = await validateWorkingDay(currentThaiTime);
if (!workingDayResult.isWorkingDay) {
  return createSkippedResponse(
    `Skipped - ${workingDayResult.reason}`,
    workingDayResult.holidayInfo,
  );
}
```

## Reminder Sender Utilities

### `cron-reminder-sender.ts`

Handles the logic for sending check-in reminders to users.

#### Functions

##### `sendCheckInReminders(todayString: string): Promise<ReminderResult>`

**Purpose**: Sends check-in reminder messages to active LINE users.

**Parameters**:

- `todayString: string` - Date string in YYYY-MM-DD format (Bangkok timezone)

**Returns**:

```typescript
interface ReminderResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  messageText: string;
  totalUsers: number;
}
```

**Features**:

- Gets active LINE user IDs for the day
- Excludes users on leave
- Selects random reminder messages
- Creates interactive LINE buttons
- Tracks success/failure statistics

**Usage**:

```typescript
import { sendCheckInReminders } from "@/lib/utils/cron-reminder-sender";

const todayString = currentThaiTime?.toISOString().split("T")[0] ?? "";
const reminderResult = await sendCheckInReminders(todayString);

if (!reminderResult.success && reminderResult.totalUsers === 0) {
  return createNoUsersResponse();
}

return createReminderSentResponse(
  reminderResult.messageText,
  reminderResult.sentCount,
  reminderResult.failedCount,
);
```

## Best Practices

### Usage Guidelines

1. **Always use shared utilities** instead of duplicating code
2. **Handle errors gracefully** with proper logging
3. **Use TypeScript interfaces** for type safety
4. **Follow naming conventions** (camelCase for functions, PascalCase for interfaces)
5. **Add JSDoc comments** for public functions

### Error Handling Pattern

```typescript
import { createErrorResponse } from "@/lib/utils/cron-response";

export async function GET(req: NextRequest) {
  try {
    // Main logic here
    return createSuccessResponse(data);
  } catch (error: any) {
    console.error("❌ Error in endpoint:", error);
    return createErrorResponse("Operation failed", 500, error.message);
  }
}
```

### Authentication Pattern

```typescript
import { validateCronAuth } from "@/lib/utils/cron-auth";
import { createErrorResponse } from "@/lib/utils/cron-response";

export async function GET(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await RateLimiter.checkCronRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  // Authentication
  const authResult = validateCronAuth(req);
  if (!authResult.success) {
    return createErrorResponse(authResult.error!, authResult.status!);
  }

  // Main logic
}
```

## Testing

### Unit Tests

```typescript
// Example test for time validation
import { validateReminderTime } from "@/lib/utils/cron-time-validation";

describe("validateReminderTime", () => {
  it("should allow time within valid range in production", () => {
    process.env.APP_ENV = "production";
    const validTime = new Date("2025-01-07T01:30:00Z");

    const result = validateReminderTime(validTime);

    expect(result.isValid).toBe(true);
    expect(result.currentHour).toBe(1);
  });

  it("should reject time outside valid range in production", () => {
    process.env.APP_ENV = "production";
    const invalidTime = new Date("2025-01-07T05:00:00Z");

    const result = validateReminderTime(invalidTime);

    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("not the right time");
  });
});
```

### Integration Tests

```bash
# Test complete cron flow
bun test tests/api/check-in-reminder-api.mock.test.ts

# Test timezone functionality
bun test timezone

# Test shared utilities
bun test src/lib/utils/
```

## Migration Guide

### From Direct Implementation

**Before** (direct implementation):

```typescript
// Duplicate code in each endpoint
const authHeader = req.headers.get("authorization");
if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

const sendPushMessage = async (userId: string, messages: any[]) => {
  // Implementation here
};
```

**After** (using shared utilities):

```typescript
import { validateSimpleCronAuth } from "@/lib/utils/cron-auth";
import { sendPushMessage } from "@/lib/utils/line-messaging";

const authHeader = headersList.get("authorization");
if (!validateSimpleCronAuth(authHeader)) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

await sendPushMessage(userId, messages);
```

### Benefits of Migration

- ✅ **Reduced Code Duplication**: ~40 lines removed per endpoint
- ✅ **Improved Consistency**: Same behavior across all cron jobs
- ✅ **Better Testing**: Shared utilities can be unit tested independently
- ✅ **Easier Maintenance**: Changes in one place affect all users
- ✅ **Type Safety**: Better TypeScript support and interfaces

---

_Last updated: January 7, 2025_  
_Version: 2.0.1_
