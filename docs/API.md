# 🔌 API Documentation | เอกสาร API

> **🎯 คู่มือ API สำหรับระบบ Bun LINE T3 Attendance**
> 
> **⚡ RESTful API**: Type-safe + Security-First + Performance-Optimized

## 📋 สารบัญ | Table of Contents

- [🌟 API Overview](#-api-overview)
- [🔐 Authentication](#-authentication)
- [📊 Response Format](#-response-format)
- [🏢 Attendance APIs](#-attendance-apis)
- [💬 LINE Bot APIs](#-line-bot-apis)
- [🔐 Auth APIs](#-auth-apis)
- [💰 Crypto APIs](#-crypto-apis)
- [🌍 Air Quality APIs](#-air-quality-apis)
- [🛠️ System APIs](#️-system-apis)
- [❌ Error Handling](#-error-handling)
- [🧪 Testing APIs](#-testing-apis)

## 🌟 API Overview

### 🌐 Base Information

| Property | Value |
|----------|-------|
| **Base URL** | `https://your-domain.com/api` |
| **Protocol** | HTTPS only |
| **Format** | JSON |
| **Authentication** | Bearer Token / Session |
| **Rate Limiting** | 100 requests/minute |

### 📡 API Endpoints Summary

```
📊 API Endpoints Overview
├── 🏢 Attendance        # Work time tracking
│   ├── POST /attendance         # Check in/out
│   ├── GET  /attendance/today   # Today's record
│   └── GET  /attendance/report  # Monthly reports
│
├── 💬 LINE Integration   # Messaging platform
│   ├── POST /line              # Webhook handler
│   └── GET  /line/verify       # Verification
│
├── 🔐 Authentication    # User management
│   ├── GET  /auth/session      # Current session
│   └── POST /auth/logout       # Sign out
│
├── 💰 Cryptocurrency    # Market tracking
│   ├── GET  /crypto/prices     # Current prices
│   └── POST /crypto/alerts     # Price alerts
│
├── 🌍 Air Quality       # Environmental data
│   ├── GET  /air-quality/current   # Current AQI
│   └── GET  /air-quality/forecast  # Predictions
│
└── 🛠️ System           # Health & monitoring
    ├── GET  /health            # Health check
    └── GET  /status            # System status
```

## 🔐 Authentication

### 🎫 Authentication Methods

#### 1. Session-based Authentication (Recommended)

```typescript
// ✅ Using NextAuth.js session
const session = await getServerSession(authOptions)
if (!session) {
  return { error: 'Unauthorized' }
}
```

#### 2. Bearer Token Authentication

```bash
# Header format
Authorization: Bearer <token>

# Example
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     https://api.example.com/attendance
```

#### 3. LINE User Authentication

```typescript
// ✅ LINE User ID from webhook
interface LineWebhookRequest {
  events: Array<{
    source: {
      userId: string
      type: 'user'
    }
  }>
}
```

### 🛡️ Authorization Levels

| Level | Description | Access |
|-------|-------------|--------|
| **Public** | No authentication required | Health checks, documentation |
| **Authenticated** | Valid session required | Personal data, attendance |
| **Admin** | Admin role required | User management, system config |
| **System** | Service-to-service | Webhooks, internal APIs |

## 📊 Response Format

### ✅ Standard Response Structure

```typescript
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    timestamp: string
    requestId: string
    version: string
  }
}
```

### 🎯 Success Response Example

```json
{
  "success": true,
  "data": {
    "id": "66123abc789def012345678",
    "checkInTime": "2025-06-14T09:00:00.000Z",
    "status": "checked-in"
  },
  "meta": {
    "timestamp": "2025-06-14T09:00:01.234Z",
    "requestId": "req_abc123def456",
    "version": "1.0.0"
  }
}
```

### ❌ Error Response Example

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "userId",
      "reason": "Required field missing"
    }
  },
  "meta": {
    "timestamp": "2025-06-14T09:00:01.234Z",
    "requestId": "req_error123",
    "version": "1.0.0"
  }
}
```

## 🏢 Attendance APIs

### POST /api/attendance
**Create attendance record (Check in/out)**

#### Request

```typescript
interface AttendanceRequest {
  action: 'check-in' | 'check-out'
  timestamp?: string // ISO 8601 format
  location?: string  // Optional location
  notes?: string     // Optional notes
}
```

```bash
curl -X POST https://api.example.com/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "check-in",
    "timestamp": "2025-06-14T09:00:00.000Z",
    "location": "Office Bangkok",
    "notes": "Started early today"
  }'
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "66123abc789def012345678",
    "userId": "user_123",
    "checkInTime": "2025-06-14T09:00:00.000Z",
    "checkOutTime": null,
    "workHours": null,
    "status": "checked-in",
    "location": "Office Bangkok",
    "notes": "Started early today",
    "expectedCheckOutTime": "2025-06-14T18:00:00.000Z"
  }
}
```

### GET /api/attendance/today
**Get today's attendance record**

```bash
curl -H "Authorization: Bearer <token>" \
     https://api.example.com/attendance/today
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "66123abc789def012345678",
    "checkInTime": "2025-06-14T09:00:00.000Z",
    "checkOutTime": "2025-06-14T18:30:00.000Z",
    "workHours": 9.5,
    "status": "checked-out",
    "overtimeHours": 0.5
  }
}
```

### GET /api/attendance/report
**Get monthly attendance report**

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `month` | string | No | YYYY-MM format (default: current month) |
| `year` | number | No | Year (default: current year) |
| `format` | string | No | `json` or `csv` (default: json) |

```bash
curl -H "Authorization: Bearer <token>" \
     "https://api.example.com/attendance/report?month=2025-06&format=json"
```

#### Response

```json
{
  "success": true,
  "data": {
    "period": {
      "month": 6,
      "year": 2025,
      "startDate": "2025-06-01",
      "endDate": "2025-06-30"
    },
    "summary": {
      "totalWorkDays": 22,
      "attendedDays": 20,
      "totalWorkHours": 180,
      "averageWorkHours": 9,
      "overtimeHours": 10,
      "attendanceRate": 90.91
    },
    "records": [
      {
        "date": "2025-06-01",
        "checkIn": "09:00:00",
        "checkOut": "18:30:00",
        "workHours": 9.5,
        "status": "checked-out"
      }
    ]
  }
}
```

### POST /api/attendance/export
**Export attendance data**

#### Request

```typescript
interface ExportRequest {
  format: 'csv' | 'excel' | 'pdf'
  period: {
    startDate: string // YYYY-MM-DD
    endDate: string   // YYYY-MM-DD
  }
  includeDetails?: boolean
}
```

## 💬 LINE Bot APIs

### POST /api/line
**LINE webhook handler**

This endpoint receives webhooks from LINE platform. It's automatically called by LINE servers.

#### Request (from LINE)

```json
{
  "destination": "your_channel_id",
  "events": [
    {
      "type": "message",
      "message": {
        "type": "text",
        "id": "message_id",
        "text": "เข้างาน"
      },
      "timestamp": 1623456789000,
      "source": {
        "type": "user",
        "userId": "line_user_id"
      },
      "replyToken": "reply_token_123"
    }
  ]
}
```

#### Supported Commands

| Command (Thai) | Command (English) | Description |
|----------------|-------------------|-------------|
| `งาน` | `work` | Show attendance menu/status |
| `เข้างาน` | `checkin` | **Direct check in** (immediate action) |
| `/checkin` | `/checkin` | **Direct check in** (immediate action) |
| `ออกงาน` | `checkout` | Check out from work |
| `สถานะ` | `status` | View current status |
| `รายงาน` | `report` | Monthly report |
| `ราคาเหรียญ` | `crypto` | Crypto prices |
| `อากาศ` | `weather` | Air quality |

### GET /api/line/verify
**Verify LINE webhook setup**

```bash
curl https://api.example.com/line/verify
```

## 🔐 Auth APIs

### GET /api/auth/session
**Get current session information**

```bash
curl -H "Authorization: Bearer <token>" \
     https://api.example.com/auth/session
```

#### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "lineUserId": "line_user_123",
      "role": "user"
    },
    "session": {
      "id": "session_abc123",
      "expiresAt": "2025-06-15T09:00:00.000Z",
      "createdAt": "2025-06-14T09:00:00.000Z"
    }
  }
}
```

### POST /api/auth/logout
**Sign out user**

```bash
curl -X POST https://api.example.com/auth/logout \
  -H "Authorization: Bearer <token>"
```

## 💰 Crypto APIs

### GET /api/crypto/prices
**Get current cryptocurrency prices**

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | No | Comma-separated crypto symbols (default: BTC,ETH) |
| `currency` | string | No | Fiat currency (default: USD) |

```bash
curl "https://api.example.com/crypto/prices?symbols=BTC,ETH,BNB&currency=USD"
```

#### Response

```json
{
  "success": true,
  "data": {
    "timestamp": "2025-06-14T09:00:00.000Z",
    "prices": {
      "BTC": {
        "symbol": "BTC",
        "name": "Bitcoin",
        "price": 45000.50,
        "change24h": 2.5,
        "changePercent24h": 5.88
      },
      "ETH": {
        "symbol": "ETH",
        "name": "Ethereum",
        "price": 3200.75,
        "change24h": -50.25,
        "changePercent24h": -1.55
      }
    }
  }
}
```

### POST /api/crypto/alerts
**Create price alert**

#### Request

```typescript
interface PriceAlertRequest {
  symbol: string        // e.g., "BTC"
  type: 'above' | 'below'
  targetPrice: number
  enabled: boolean
}
```

## 🌍 Air Quality APIs

### GET /api/air-quality/current
**Get current air quality index**

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `city` | string | No | City name (default: Bangkok) |
| `country` | string | No | Country code (default: TH) |

```bash
curl "https://api.example.com/air-quality/current?city=Bangkok&country=TH"
```

#### Response

```json
{
  "success": true,
  "data": {
    "location": {
      "city": "Bangkok",
      "country": "Thailand",
      "coordinates": {
        "latitude": 13.7563,
        "longitude": 100.5018
      }
    },
    "current": {
      "aqi": 85,
      "quality": "Moderate",
      "pm25": 35.2,
      "pm10": 68.5,
      "o3": 45.3,
      "no2": 28.1,
      "so2": 12.7,
      "co": 890
    },
    "recommendation": {
      "level": "moderate",
      "message": "อากาศปานกลาง ผู้ที่มีความไวต่อมลพิษควรระวัง",
      "activities": ["ควรสวมหน้ากากเมื่อออกไปข้างนอก"]
    },
    "timestamp": "2025-06-14T09:00:00.000Z"
  }
}
```

## 🛠️ System APIs

### GET /api/health
**System health check**

```bash
curl https://api.example.com/health
```

#### Response

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-06-14T09:00:00.000Z",
    "version": "1.0.0",
    "uptime": 86400,
    "services": {
      "database": "connected",
      "line": "connected",
      "external_apis": "connected"
    },
    "environment": "production"
  }
}
```

### GET /api/status
**Detailed system status**

```bash
curl -H "Authorization: Bearer <admin_token>" \
     https://api.example.com/status
```

## ❌ Error Handling

### 🚨 HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid request data |
| `401` | Unauthorized | Authentication required |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Resource conflict (e.g., duplicate check-in) |
| `422` | Unprocessable Entity | Validation error |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |

### 🔍 Error Codes

```typescript
enum ErrorCodes {
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Authorization Errors
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Business Logic Errors
  ALREADY_CHECKED_IN = 'ALREADY_CHECKED_IN',
  NOT_CHECKED_IN = 'NOT_CHECKED_IN',
  INVALID_TIME_RANGE = 'INVALID_TIME_RANGE',
  
  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // External API Errors
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}
```

### 📝 Error Response Examples

#### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "errors": [
        {
          "field": "action",
          "message": "Must be either 'check-in' or 'check-out'"
        },
        {
          "field": "timestamp",
          "message": "Must be a valid ISO 8601 date string"
        }
      ]
    }
  }
}
```

#### Business Logic Error

```json
{
  "success": false,
  "error": {
    "code": "ALREADY_CHECKED_IN",
    "message": "User has already checked in today",
    "details": {
      "existingRecord": {
        "id": "66123abc789def012345678",
        "checkInTime": "2025-06-14T08:30:00.000Z"
      }
    }
  }
}
```

## 🧪 Testing APIs

### 🔧 Testing with cURL

#### Basic GET Request

```bash
curl -H "Authorization: Bearer <token>" \
     -H "Accept: application/json" \
     https://api.example.com/attendance/today
```

#### POST Request with JSON Data

```bash
curl -X POST https://api.example.com/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "check-in",
    "timestamp": "2025-06-14T09:00:00.000Z"
  }'
```

### 🧪 Testing with JavaScript

```javascript
// ✅ Fetch API Example
const response = await fetch('/api/attendance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    action: 'check-in',
    timestamp: new Date().toISOString()
  })
})

const data = await response.json()

if (data.success) {
  console.log('Check-in successful:', data.data)
} else {
  console.error('Error:', data.error)
}
```

### 🔍 API Testing Tools

| Tool | Purpose | Best For |
|------|---------|----------|
| **Postman** | API testing and documentation | Interactive testing |
| **Insomnia** | REST client | Simple API testing |
| **curl** | Command line HTTP client | Automation scripts |
| **Vitest** | JavaScript testing framework | Unit/integration tests |

---

## 📚 Additional Resources

### 🔗 Related Documentation

- **[Setup Guide](./SETUP.md)** - การติดตั้งและการกำหนดค่า
- **[Security Guide](./SECURITY.md)** - แนวทางความปลอดภัย
- **[Development Guide](./DEVELOPMENT.md)** - คู่มือการพัฒนา

### 🔧 Development Tools

```bash
# API development scripts
bun run dev:api          # Start API server only
bun run test:api         # Run API tests
bun run docs:api         # Generate API documentation
```

### 📊 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/attendance/*` | 30 requests | 1 minute |
| `/api/crypto/*` | 60 requests | 1 minute |
| `/api/air-quality/*` | 60 requests | 1 minute |
| `/api/line` | 1000 requests | 1 minute |

---

**📝 อัปเดตล่าสุด**: 14 มิถุนายน 2025
**🔗 API Version**: 1.0.0
**👨‍💻 ผู้ดูแล**: Development Team
