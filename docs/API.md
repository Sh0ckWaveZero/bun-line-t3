# 🔌 API Documentation

Complete API reference for the Bun LINE T3 application.

## 📋 Table of Contents

- [🌐 Overview](#-overview)
- [🔐 Authentication](#-authentication)
- [🏢 Attendance API](#-attendance-api)
- [📱 LINE Bot API](#-line-bot-api)
- [💰 Cryptocurrency API](#-cryptocurrency-api)
- [🌍 Air Quality API](#-air-quality-api)
- [📊 Reports API](#-reports-api)
- [❌ Error Handling](#-error-handling)
- [🔧 Webhooks](#-webhooks)

## 🌐 Overview

Base URL: `https://your-domain.com/api`

All API endpoints follow RESTful conventions and return JSON responses.

### Response Format

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2025-06-07T10:30:00Z"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { /* error details */ }
  },
  "timestamp": "2025-06-07T10:30:00Z"
}
```

## 🔐 Authentication

### NextAuth Session

Most endpoints require authentication via NextAuth.js session cookies.

```typescript
// Check authentication in API routes
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Continue with authenticated logic
}
```

### LINE User Verification

LINE Bot endpoints verify requests using LINE's signature validation:

```typescript
// Verify LINE webhook signature
import crypto from 'crypto'
import { env } from '@/env.mjs'

function verifySignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('SHA256', env.LINE_CHANNEL_SECRET)
    .update(body)
    .digest('base64')
  
  return `sha256=${hash}` === signature
}
```

## 🏢 Attendance API

### Check In

Create a new attendance record for the current day.

**Endpoint:** `POST /api/attendance/checkin`

**Request Body:**
```json
{
  "userId": "U1234567890abcdef",
  "timestamp": "2025-06-07T09:00:00Z" // optional, defaults to now
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "att_123456",
    "userId": "U1234567890abcdef",
    "checkInTime": "2025-06-07T09:00:00Z",
    "expectedCheckOutTime": "2025-06-07T18:00:00Z",
    "workHours": 9,
    "status": "checked_in"
  }
}
```

**Error Cases:**
- `409 Conflict` - Already checked in today
- `400 Bad Request` - Invalid user ID or timestamp

### Check Out

Update attendance record with check-out time.

**Endpoint:** `POST /api/attendance/checkout`

**Request Body:**
```json
{
  "userId": "U1234567890abcdef",
  "timestamp": "2025-06-07T18:30:00Z" // optional, defaults to now
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "att_123456",
    "userId": "U1234567890abcdef",
    "checkInTime": "2025-06-07T09:00:00Z",
    "checkOutTime": "2025-06-07T18:30:00Z",
    "actualWorkHours": 9.5,
    "overtimeHours": 0.5,
    "status": "completed"
  }
}
```

### Get Attendance Status

Get current attendance status for a user.

**Endpoint:** `GET /api/attendance/status?userId=U1234567890abcdef`

**Response:**
```json
{
  "success": true,
  "data": {
    "hasCheckedInToday": true,
    "hasCheckedOutToday": false,
    "currentAttendance": {
      "checkInTime": "2025-06-07T09:00:00Z",
      "expectedCheckOutTime": "2025-06-07T18:00:00Z",
      "workHours": 9
    }
  }
}
```

### Monthly Attendance

Get attendance records for a specific month.

**Endpoint:** `GET /api/attendance/monthly?userId=U123&year=2025&month=6`

**Query Parameters:**
- `userId` (required) - LINE user ID
- `year` (required) - Year (YYYY)
- `month` (required) - Month (1-12)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalWorkDays": 22,
      "attendedDays": 20,
      "totalHours": 180,
      "overtimeHours": 5,
      "attendanceRate": 90.9
    },
    "records": [
      {
        "date": "2025-06-01",
        "checkInTime": "2025-06-01T09:00:00Z",
        "checkOutTime": "2025-06-01T18:00:00Z",
        "workHours": 9,
        "isHoliday": false,
        "status": "completed"
      }
    ],
    "holidays": [
      {
        "date": "2025-06-03",
        "name": "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสุทิดา",
        "type": "national"
      }
    ]
  }
}
```

## 📱 LINE Bot API

### Webhook Endpoint

Receives webhooks from LINE Platform.

**Endpoint:** `POST /api/line`

**Headers:**
- `x-line-signature` - LINE signature for verification
- `content-type: application/json`

**Request Body:**
```json
{
  "destination": "U1234567890abcdef",
  "events": [
    {
      "type": "message",
      "mode": "active",
      "timestamp": 1654567890123,
      "source": {
        "type": "user",
        "userId": "U1234567890abcdef"
      },
      "message": {
        "id": "msg123",
        "type": "text",
        "text": "/work"
      },
      "replyToken": "reply123"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Events processed successfully"
}
```

### Send Push Message

Send a push message to LINE user (internal API).

**Endpoint:** `POST /api/line/push`

**Request Body:**
```json
{
  "userId": "U1234567890abcdef",
  "message": {
    "type": "text",
    "text": "Hello! Your attendance has been recorded."
  }
}
```

## 💰 Cryptocurrency API

### Get Crypto Prices

Get current cryptocurrency prices.

**Endpoint:** `GET /api/crypto/prices?symbols=BTC,ETH,ADA`

**Query Parameters:**
- `symbols` - Comma-separated list of crypto symbols

**Response:**
```json
{
  "success": true,
  "data": {
    "BTC": {
      "symbol": "BTC",
      "name": "Bitcoin",
      "price": 45000.25,
      "change24h": 2.5,
      "changePercent24h": 5.88,
      "marketCap": 850000000000,
      "lastUpdated": "2025-06-07T10:30:00Z"
    },
    "ETH": {
      "symbol": "ETH",
      "name": "Ethereum",
      "price": 3200.75,
      "change24h": -100.50,
      "changePercent24h": -3.04,
      "marketCap": 380000000000,
      "lastUpdated": "2025-06-07T10:30:00Z"
    }
  }
}
```

## 🌍 Air Quality API

### Get Air Quality Data

Get current air quality information for a location.

**Endpoint:** `GET /api/air-quality?city=Bangkok&country=Thailand`

**Query Parameters:**
- `city` (required) - City name
- `country` (required) - Country name

**Response:**
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
      "level": "Moderate",
      "pollutants": {
        "pm25": 35.2,
        "pm10": 65.8,
        "o3": 45.3,
        "no2": 28.1,
        "so2": 12.5,
        "co": 1.2
      },
      "timestamp": "2025-06-07T10:30:00Z"
    },
    "forecast": [
      {
        "date": "2025-06-08",
        "aqi": 78,
        "level": "Moderate"
      }
    ],
    "recommendations": [
      "Sensitive individuals should limit outdoor activities",
      "Close windows and use air purifiers indoors"
    ]
  }
}
```

## 📊 Reports API

### Attendance Report

Generate comprehensive attendance report.

**Endpoint:** `GET /api/attendance-report`

**Query Parameters:**
- `userId` (required) - LINE user ID
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)
- `format` - Response format (`json` | `pdf` | `csv`)

**Response (JSON):**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-06-01",
      "endDate": "2025-06-30"
    },
    "summary": {
      "totalWorkDays": 22,
      "attendedDays": 20,
      "totalHours": 180,
      "averageWorkHours": 9,
      "overtimeHours": 5,
      "attendanceRate": 90.9
    },
    "dailyRecords": [
      {
        "date": "2025-06-01",
        "checkIn": "09:00:00",
        "checkOut": "18:00:00",
        "hours": 9,
        "status": "completed"
      }
    ],
    "charts": {
      "dailyHours": [9, 8.5, 9, 9.5, 8],
      "weeklyAverage": [8.8, 9.2, 8.9, 9.1]
    }
  }
}
```

### Push Notification Test

Test push notification delivery.

**Endpoint:** `POST /api/attendance-push`

**Request Body:**
```json
{
  "userId": "U1234567890abcdef",
  "type": "checkin_reminder",
  "message": "Don't forget to check in!"
}
```

## ❌ Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_ERROR` | Authentication required or failed |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_ENTRY` | Resource already exists |
| `EXTERNAL_API_ERROR` | Third-party service error |
| `DATABASE_ERROR` | Database operation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid user ID format",
    "details": {
      "field": "userId",
      "expected": "LINE user ID format (U + 32 hex characters)",
      "received": "invalid_id"
    }
  },
  "timestamp": "2025-06-07T10:30:00Z"
}
```

## 🔧 Webhooks

### LINE Webhook Events

The system handles various LINE webhook events:

#### Text Message Events
- Command processing (`/work`, `/เข้างาน`, etc.)
- Natural language responses
- Menu navigation

#### Postback Events
- Button interactions
- Quick reply selections
- Rich menu actions

#### Follow/Unfollow Events
- User registration
- User deactivation

### Webhook Security

All webhooks are secured with:
- Signature verification
- Request timestamp validation
- Rate limiting
- IP allowlisting (production)

### Webhook Response Format

LINE webhooks expect a `200 OK` status code:

```json
{
  "success": true,
  "processed_events": 1,
  "timestamp": "2025-06-07T10:30:00Z"
}
```

## 🚀 Rate Limiting

### Default Limits

- Authentication: 10 requests/minute per IP
- Attendance API: 60 requests/minute per user
- Reports API: 10 requests/minute per user
- LINE Webhook: 1000 requests/minute (per LINE channel)

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1654567890
```

## 📝 Request/Response Examples

### cURL Examples

```bash
# Check attendance status
curl -X GET "https://your-domain.com/api/attendance/status?userId=U1234567890abcdef" \
  -H "Cookie: next-auth.session-token=your-session-token"

# Check in
curl -X POST "https://your-domain.com/api/attendance/checkin" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{"userId": "U1234567890abcdef"}'

# Get crypto prices
curl -X GET "https://your-domain.com/api/crypto/prices?symbols=BTC,ETH"
```

### JavaScript Examples

```javascript
// Check in user
const checkin = async (userId) => {
  const response = await fetch('/api/attendance/checkin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  })
  
  const data = await response.json()
  return data
}

// Get monthly report
const getMonthlyReport = async (userId, year, month) => {
  const params = new URLSearchParams({ userId, year, month })
  const response = await fetch(`/api/attendance/monthly?${params}`)
  const data = await response.json()
  return data
}
```

---

## 📚 Additional Resources

- [LINE Messaging API Reference](https://developers.line.biz/en/reference/messaging-api/)
- [NextAuth.js API Reference](https://next-auth.js.org/getting-started/rest-api)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

## 🔄 API Versioning

Currently using v1 (implicit). Future versions will be explicitly versioned:
- `GET /api/v1/attendance/status`
- `GET /api/v2/attendance/status`

## 📊 Monitoring

API performance and usage metrics are tracked:
- Response times
- Error rates
- Request volumes
- User patterns

Access monitoring dashboard at `/api/metrics` (admin only).
