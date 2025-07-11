# 🔌 Complete API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the Bun LINE T3 application. The API follows RESTful principles and uses JSON for data exchange.

**Base URL**: `https://localhost:4325/api`

## Authentication

Most endpoints require authentication via NextAuth.js session. Protected endpoints return:

- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)

## Content Type

All requests and responses use `application/json` content type unless specified otherwise.

---

## 📱 LINE Bot Integration

### POST /api/line

Main webhook endpoint for LINE Bot events.

**Headers Required:**

- `x-line-signature`: LINE webhook signature
- `Content-Type`: application/json

**Request Body:**

```json
{
  "events": [
    {
      "type": "message",
      "message": {
        "type": "text",
        "text": "เข้างาน"
      },
      "source": {
        "userId": "U1234567890",
        "type": "user"
      }
    }
  ]
}
```

**Responses:**

- `200` - Event processed successfully
- `401` - Invalid signature
- `500` - Internal server error

---

## 🏢 Attendance Management

### PUT /api/attendance/update

Update existing attendance record.

**Authentication:** Required  
**Method:** PUT

**Request Body:**

```json
{
  "attendanceId": "att_123456",
  "checkInTime": "2025-07-10T08:00:00.000Z",
  "checkOutTime": "2025-07-10T17:00:00.000Z"
}
```

**Validation Rules:**

- `attendanceId`: Required string (min 1 character)
- `checkInTime`: Required ISO datetime string
- `checkOutTime`: Optional ISO datetime string
- Check-in must be before check-out
- Times must be within acceptable range (security validation)

**Response (200):**

```json
{
  "success": true,
  "message": "Attendance record updated successfully",
  "data": {
    "id": "att_123456",
    "workDate": "2025-07-10",
    "checkInTime": "2025-07-10T08:00:00.000Z",
    "checkOutTime": "2025-07-10T17:00:00.000Z",
    "hoursWorked": 9.0,
    "status": "CHECKED_OUT",
    "updatedAt": "2025-07-10T09:00:00.000Z"
  }
}
```

**Error Responses:**

- `400` - Invalid input data (with Zod validation details)
- `403` - Can only edit own attendance records
- `404` - Attendance record not found
- `409` - Duplicate attendance record

### POST /api/attendance-push

Send attendance notifications via LINE push messages.

**Authentication:** Cron authentication required  
**Method:** POST

**Request Body:**

```json
{
  "authToken": "your-secure-cron-token",
  "data": {
    "userId": "U1234567890",
    "message": "Reminder: Please check out",
    "type": "checkout_reminder"
  }
}
```

### GET /api/attendance-report

Generate attendance reports for users.

**Authentication:** Required  
**Method:** GET

**Query Parameters:**

- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)
- `format`: 'json' | 'csv' (optional, default: 'json')

---

## 🏥 Leave Management

### POST /api/leave

Submit leave application.

**Authentication:** Required  
**Method:** POST

**Request Body:**

```json
{
  "startDate": "2025-07-15",
  "endDate": "2025-07-16",
  "reason": "Personal leave",
  "leaveType": "SICK" | "ANNUAL" | "PERSONAL" | "MATERNITY"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Leave application submitted successfully",
  "data": {
    "id": "leave_123456",
    "startDate": "2025-07-15",
    "endDate": "2025-07-16",
    "reason": "Personal leave",
    "status": "PENDING",
    "createdAt": "2025-07-10T09:00:00.000Z"
  }
}
```

---

## 🔐 Authentication

### POST /api/auth/[...nextauth]

NextAuth.js authentication endpoints.

**Endpoints:**

- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session
- `GET /api/auth/providers` - Get available providers

**LINE OAuth Flow:**

1. Redirect to `/api/auth/signin/line`
2. User authorizes on LINE platform
3. Callback to `/api/auth/callback/line`
4. Session established

---

## ⏰ Cron Job Endpoints

### POST /api/cron/check-in-reminder

Send morning check-in reminders.

**Authentication:** Cron token required  
**Schedule:** 07:30 Bangkok time (Mon-Fri)

### POST /api/cron/checkout-reminder

Send evening check-out reminders.

**Authentication:** Cron token required  
**Schedule:** 17:30 Bangkok time (Mon-Fri)

### POST /api/cron/enhanced-checkout-reminder

Send enhanced check-out reminders with multiple stages.

**Authentication:** Cron token required  
**Schedule:** 18:00, 18:30, 19:00 Bangkok time

### POST /api/cron/auto-checkout

Automatically check out users who forgot.

**Authentication:** Cron token required  
**Schedule:** 20:00 Bangkok time (Mon-Fri)

**Request Body (All Cron):**

```json
{
  "authToken": "your-secure-cron-token"
}
```

---

## 🩺 Health Monitoring

### GET /api/health

Basic health check endpoint.

**Authentication:** None  
**Method:** GET

**Response (200):**

```json
{
  "status": "healthy",
  "timestamp": "2025-07-10T09:00:00.000Z",
  "database": "connected",
  "environment": "production"
}
```

### GET /api/health/enhanced

Comprehensive health check with system information.

**Authentication:** None  
**Method:** GET

**Response (200):**

```json
{
  "status": "healthy",
  "timestamp": "2025-07-10T09:00:00.000Z",
  "database": "connected",
  "environment": "production",
  "version": "0.1.0",
  "uptime": 86400,
  "system": {
    "platform": "linux",
    "architecture": "x64",
    "nodeVersion": "v18.17.0",
    "memory": {
      "used": 256,
      "total": 512,
      "percentage": 50
    }
  },
  "checks": {
    "database": true,
    "prisma": true,
    "env": true
  },
  "responseTime": "15ms"
}
```

**Status Levels:**

- `healthy` (200) - All systems operational
- `degraded` (200) - Some non-critical issues
- `unhealthy` (503) - Critical systems down

---

## 📊 Monitoring

### GET /api/monitoring/dashboard

System monitoring dashboard data.

**Authentication:** Required (Admin role recommended)  
**Method:** GET

**Response (200):**

```json
{
  "system": {
    "uptime": 86400,
    "memory": {
      "used": 256,
      "total": 512,
      "percentage": 50
    },
    "cpu": {
      "usage": 25.5
    }
  },
  "database": {
    "connections": 5,
    "status": "connected",
    "responseTime": "2ms"
  },
  "application": {
    "activeUsers": 150,
    "totalRequests": 10000,
    "errorRate": 0.5
  }
}
```

---

## 🔧 Development & Debug

### GET /api/debug/line-oauth

Debug LINE OAuth configuration.

**Environment:** Development only  
**Authentication:** None

**Response (200):**

```json
{
  "lineClientId": "1234567890",
  "redirectUri": "https://localhost:4325/api/auth/callback/line",
  "state": "random-state-string",
  "scope": "profile openid",
  "authUrl": "https://access.line.me/oauth2/v2.1/authorize?..."
}
```

---

## 📝 Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    /* response data */
  }
}
```

### Error Response

```json
{
  "error": "Error description",
  "details": [
    /* optional validation details */
  ],
  "code": "ERROR_CODE" // optional
}
```

### Validation Error (400)

```json
{
  "error": "Invalid input data",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_string"
    }
  ]
}
```

---

## 🛡️ Security Features

### Request Validation

- All inputs validated using Zod schemas
- SQL injection protection via Prisma ORM
- XSS protection through input sanitization
- CSRF protection via NextAuth.js

### Authentication Security

- Secure session management
- JWT token expiration
- LINE webhook signature verification
- Cron job authentication tokens

### Data Protection

- Sensitive data logging protection
- Timezone security validation
- Date/time range validation
- User ownership verification

### Rate Limiting

- Built-in rate limiting for API endpoints
- Webhook replay attack protection
- Request timeout handling

---

## 🌏 Timezone Handling

All datetime fields use UTC internally and are converted to `Asia/Bangkok` timezone for LINE Bot responses and user display.

**Input Format:** ISO 8601 UTC strings
**Storage:** UTC timestamps in database
**Output:** ISO 8601 strings (UTC) or localized for LINE Bot

---

## 📊 Status Codes Reference

| Code | Meaning               | Usage                         |
| ---- | --------------------- | ----------------------------- |
| 200  | OK                    | Successful request            |
| 201  | Created               | Resource created successfully |
| 400  | Bad Request           | Invalid input data            |
| 401  | Unauthorized          | Authentication required       |
| 403  | Forbidden             | Insufficient permissions      |
| 404  | Not Found             | Resource not found            |
| 409  | Conflict              | Duplicate resource            |
| 500  | Internal Server Error | Server error                  |
| 503  | Service Unavailable   | System unhealthy              |

---

## 🔗 External API Dependencies

### LINE Platform APIs

- **Messaging API**: Send push notifications
- **OAuth API**: User authentication
- **Profile API**: Retrieve user information

### Third-party Services

- **CoinMarketCap API**: Cryptocurrency data
- **AirVisual API**: Air quality information

---

## 📋 Request/Response Examples

### Complete Attendance Flow

1. **Check In via LINE Bot**

   ```
   LINE Message: "เข้างาน"
   → POST /api/line (webhook)
   → Creates attendance record
   → Responds with confirmation
   ```

2. **Update Attendance via Web**

   ```
   PUT /api/attendance/update
   → Updates existing record
   → Recalculates hours worked
   → Returns updated data
   ```

3. **Check Out via LINE Bot**
   ```
   LINE Message: "ออกงาน"
   → POST /api/line (webhook)
   → Updates checkout time
   → Calculates final hours
   ```

### Error Handling Flow

1. **Invalid Input**

   ```json
   // Request
   { "checkInTime": "invalid-date" }

   // Response (400)
   {
     "error": "Invalid input data",
     "details": [
       {
         "field": "checkInTime",
         "message": "Invalid date string",
         "code": "invalid_date"
       }
     ]
   }
   ```

2. **Unauthorized Access**
   ```json
   // Response (401)
   {
     "error": "Unauthorized - Please login first"
   }
   ```

---

This documentation covers all major API endpoints and their usage patterns. For specific implementation details, refer to the source code in `/src/app/api/` directories.
