# Feature Modules Documentation

This document provides comprehensive documentation for all feature modules in the bun-line-t3 application. The application follows a **Feature-Based Architecture** pattern where each feature is self-contained with its own services, types, helpers, and constants.

## Table of Contents

1. [Attendance Module](#attendance-module)
2. [Authentication Module](#authentication-module)
3. [Cryptocurrency Module](#cryptocurrency-module)
4. [LINE Bot Integration Module](#line-bot-integration-module)
5. [Air Quality Module](#air-quality-module)
6. [User Settings Module](#user-settings-module)
7. [Integration Patterns](#integration-patterns)
8. [Security Considerations](#security-considerations)

---

## Attendance Module

**Path**: `src/features/attendance/`

### Overview
A comprehensive work attendance management system designed for Thai workplace policies with timezone-aware calculations and automated leave integration.

### Core Components

#### Services (`services/`)

##### `attendance.ts`
Main attendance service with check-in/check-out functionality:

```typescript
interface CheckInResult {
  success: boolean;
  message: string;
  checkInTime?: Date;
  expectedCheckOutTime?: Date;
  alreadyCheckedIn?: boolean;
  isEarlyCheckIn?: boolean;
  isLateCheckIn?: boolean;
  actualCheckInTime?: Date;
}
```

**Key Functions**:
- `checkIn(userId: string)`: Handles work check-in with timezone validation
- `checkOut(userId: string)`: Manages checkout with working hours calculation
- `getTodayAttendance(userId: string)`: Retrieves current day attendance
- `getMonthlyAttendanceReport(userId: string, month: string)`: Generates comprehensive monthly reports

**Features**:
- Early check-in support (00:01-07:59 Thai time)
- Late check-in handling with custom messages
- Weekend and holiday detection
- Automatic expected checkout time calculation
- Thai timezone conversion (UTC+7)

##### `holidays.ts`
Public holiday management:

```typescript
interface PublicHolidayData {
  date: string; // YYYY-MM-DD format
  nameEnglish: string;
  nameThai: string;
  year: number;
  type?: "national" | "royal" | "religious" | "special";
  description?: string;
}
```

**Functions**:
- `isPublicHoliday(date: Date)`: Database-driven holiday checking
- `getHolidayInfo(date: Date)`: Retrieves holiday details

##### `leave.ts`
Leave management with auto-stamp functionality:

```typescript
// Auto-Stamp System for Leave Days:
// - Check-in: 01:00 UTC (08:00 Bangkok time)
// - Check-out: 10:00 UTC (17:00 Bangkok time)
// - Hours worked: 9.0 hours
// - Status: LEAVE
```

**Functions**:
- `isUserOnLeave(userId: string, date: Date)`: Leave status check
- `getUserLeavesInMonth(userId: string, month: string)`: Monthly leave retrieval
- `createLeave(input)`: Creates leave record with automatic attendance stamping

#### Types (`types/`)

##### `attendance.ts`
Core type definitions:

```typescript
interface MonthlyAttendanceReport {
  userId: string;
  month: string; // YYYY-MM format
  totalDaysWorked: number;
  totalHoursWorked: number;
  attendanceRecords: AttendanceRecord[];
  workingDaysInMonth: number;
  attendanceRate: number; // Percentage
  complianceRate: number; // Percentage of complete 9-hour days
  averageHoursPerDay: number;
  completeDays: number;
}
```

#### Helpers (`helpers/`)

##### `calculations.ts`
Working hours and time calculations:

```typescript
export const calculateExpectedCheckOutTime = (checkInTime: Date): Date => {
  return new Date(
    checkInTime.getTime() + 
    WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY * 60 * 60 * 1000
  );
};

export const getWorkingDaysInMonth = async (
  year: number, 
  month: number
): Promise<number> => {
  // Calculates working days excluding weekends and holidays
};
```

##### `validation.ts`
Time and working day validation:

```typescript
export const isValidCheckInTime = (date: Date): {
  valid: boolean;
  message?: string;
  isEarlyCheckIn?: boolean;
  isLateCheckIn?: boolean;
} => {
  // Validates check-in time against workplace policies
};
```

#### Constants (`constants/`)

##### `workplace-policies.ts`
Thai workplace standards:

```typescript
export const WORKPLACE_POLICIES = {
  WORKING_DAYS: [1, 2, 3, 4, 5], // Monday to Friday
  EARLIEST_CHECK_IN: { hour: 8, minute: 0 },
  LATEST_CHECK_IN: { hour: 11, minute: 0 },
  TOTAL_HOURS_PER_DAY: 9, // Including 1-hour lunch break
  ACTUAL_WORKING_HOURS: 8,
  LUNCH_BREAK_HOURS: 1,
  TIMEZONE: "Asia/Bangkok",
};
```

### Usage Examples

```typescript
import { attendanceService } from "@/features/attendance";

// Check in user
const result = await attendanceService.checkIn(userId);
if (result.success) {
  console.log(`Checked in at: ${result.checkInTime}`);
  console.log(`Expected checkout: ${result.expectedCheckOutTime}`);
}

// Generate monthly report
const report = await attendanceService.getMonthlyAttendanceReport(
  userId, 
  "2024-12"
);
console.log(`Attendance rate: ${report.attendanceRate}%`);
console.log(`Compliance rate: ${report.complianceRate}%`);
```

---

## Authentication Module

**Path**: `src/features/auth/`

### Overview
Handles user authentication via LINE OAuth with NextAuth.js integration.

### Core Components

#### Services (`services/`)

##### `users.repository.ts`
User data access layer:

```typescript
export class UsersRepository {
  async findById(userId: string) {
    // Finds user by LINE provider account ID
  }
  
  async add(user: any) {
    // Creates new user with expiration handling
  }
  
  async update(user: any) {
    // Updates user with renewed expiration
  }
}
```

#### Custom LINE Provider (`line-provider.ts`)

```typescript
export function LineOAuthProvider(options: LineOAuthProviderOptions) {
  return LineProvider({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorization: {
      url: "https://access.line.me/oauth2/v2.1/authorize",
      params: {
        response_type: "code",
        scope: "openid profile",
        redirect_uri: `${PRODUCTION_URL}/api/auth/callback/line`,
      },
    },
    // Additional configuration...
  });
}
```

**Features**:
- Production callback URL enforcement
- LINE profile integration
- Token handling with secure requests

### Integration Example

```typescript
import { LineOAuthProvider } from "@/features/auth";

// NextAuth configuration
export default NextAuth({
  providers: [
    LineOAuthProvider({
      clientId: process.env.LINE_CLIENT_ID,
      clientSecret: process.env.LINE_CLIENT_SECRET,
    }),
  ],
});
```

---

## Cryptocurrency Module

**Path**: `src/features/crypto/`

### Overview
Multi-exchange cryptocurrency price tracking with secure API integrations.

### Core Components

#### Services (`services/`)

##### `crypto-currency.ts`
Currency symbol mapping and logo fetching:

```typescript
export const cryptoCurrencyService = {
  mapSymbolsThai(symbols: string): string {
    // Maps Thai symbols to English equivalents
  },
  
  async getCurrencyLogo(currencyName: string): Promise<string> {
    // Secure logo fetching with SSRF protection
  },
};
```

**Security Features**:
- Input sanitization and validation
- Host allowlist for external requests
- URL pattern validation
- Request timeout controls
- Redirect protection

##### `exchange.ts`
Multi-exchange price aggregation:

```typescript
export const exchangeService = {
  // Thai exchanges
  getBitkub(currency: string): Promise<CryptoInfo | null>,
  getSatangCorp(currency: string): Promise<CryptoInfo | null>,
  getBitazza(currency: string): Promise<CryptoInfo | null>,
  
  // International exchanges
  getBinance(currency: string, pairCurrency: string): Promise<CryptoInfo | null>,
  getGeteio(currency: string): Promise<CryptoInfo | null>,
  getMexc(currency: string): Promise<CryptoInfo | null>,
  
  // Market data
  getCoinMarketCap(currency: string): Promise<CryptoInfo | null>,
  
  // Additional services
  getGoldPrice(): Promise<any>,
  getGasPrice(provider: string): Promise<any>,
  getLotto(lottoNo: string[]): Promise<any>,
};
```

##### `cmc.ts` & `cmc.repository.ts`
CoinMarketCap integration:

```typescript
export const cmcService = {
  async findOne(symbol: string) {
    return await cmcRepository.findBySymbol(symbol);
  },
  
  async addCoinsList(items: any[]): Promise<any> {
    // Bulk insert cryptocurrency data
  },
};
```

#### Types (`types/`)

##### `crypto.interface.ts`
Core crypto data structures:

```typescript
interface CryptoInfo {
  exchange?: string;
  exchangeLogoUrl?: string;
  textColor?: string;
  currencyName?: string;
  lastPrice?: string;
  highPrice?: string;
  lowPrice?: string;
  changePrice?: string;
  changePriceOriginal?: number;
  urlLogo: string;
  volume_24h?: string;
  volume_change_24h?: string;
  market_cap?: string;
  last_updated?: string;
  priceChangeColor?: string;
  cmc_rank?: string;
}
```

### Usage Examples

```typescript
import { exchangeService, cryptoCurrencyService } from "@/features/crypto";

// Get price from specific exchange
const bitkubPrice = await exchangeService.getBitkub("BTC");
console.log(`BTC price: ${bitkubPrice?.lastPrice}`);

// Get cryptocurrency logo
const logoUrl = await cryptoCurrencyService.getCurrencyLogo("bitcoin");
console.log(`Logo URL: ${logoUrl}`);

// Compare prices across exchanges
const exchanges = [
  await exchangeService.getBitkub("ETH"),
  await exchangeService.getBinance("ETH", "USDT"),
  await exchangeService.getCoinMarketCap("ETH"),
];
```

---

## LINE Bot Integration Module

**Path**: `src/features/line/`

### Overview
Comprehensive LINE Bot integration with command handling, rich menus, and webhook processing.

### Core Components

#### Services (`services/`)

##### `line.ts`
Main LINE Bot event handler:

```typescript
const handleEvent = (req: NextApiRequest, res: NextApiResponse): any => {
  const events = req.body.events;
  events.forEach((event: any) => {
    switch (event.type) {
      case "message":
        switch (event.message.type) {
          case "text":
            handleLogin(req, event.message.text);
            break;
          case "sticker":
            handleSticker(req, event);
            break;
          case "location":
            handleLocation(req, event);
            break;
        }
        break;
      case "postback":
        handlePostback(req, event);
        break;
    }
  });
};
```

#### Commands (`commands/`)
Extensive command system for various features:

##### Core Commands
- `handleCheckInCommand.ts`: Attendance check-in with authentication
- `handleCheckOutCommand.ts`: Attendance checkout functionality
- `handleLeaveCommand.ts`: Leave request processing
- `handleReportCommand.ts`: Attendance report generation

##### Information Commands
- `handleExchangeCommand.ts`: Cryptocurrency price queries
- `handleGasCommand.ts`: Gas price information
- `handleGoldCommand.ts`: Gold price tracking
- `handleLottoCommand.ts`: Lottery number checking

##### Utility Commands
- `handleHelpCommand.ts`: Help and documentation
- `handleStatusCommand.ts`: Current status queries
- `handleWorkStatus.ts`: Work status information

##### Interactive Elements
- `handlePostback.ts`: Rich menu postback handling
- `handleLocation.ts`: Location-based services
- `handleSticker.ts`: Sticker response handling

#### Command Processing Flow

```typescript
// Text command processing
export const handleText = async (req: any, message: string): Promise<void> => {
  const commandList: any[] = message.split(" ");
  const command = commandList[0]?.slice(1).toLowerCase(); // Remove '/' prefix
  const currency = commandList.slice(1).filter((c) => c !== "");
  
  handleCommand(command, currency, req);
};

// Check-in command with authentication
export const handleCheckInCommand = async (req: any) => {
  const userId = req.body.events[0].source.userId;
  const userAccount = await db.account.findFirst({
    where: { providerAccountId: userId },
  });
  
  // Verify authentication and permissions
  const isExpired = !userAccount || 
    !userAccount.expires_at || 
    !utils.compareDate(
      userAccount.expires_at.toString(),
      new Date().toISOString()
    );
    
  if (isExpired) {
    // Redirect to sign-in
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }
  
  // Process check-in
  if (userAccount?.userId) {
    const { handleCheckIn } = await import("./handleCheckIn");
    await handleCheckIn(req, userAccount.userId);
  }
};
```

#### Types (`types/`)

##### `liff.interface.ts`
LINE Frontend Framework integration types.

### Integration Examples

```typescript
// Process LINE webhook
import { lineService } from "@/features/line";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    return lineService.handleEvent(req, res);
  }
  res.status(405).json({ message: "Method not allowed" });
}

// Send custom message
import { sendMessage, flexMessage } from "@/lib/utils/line-utils";

const customBubble = {
  type: "bubble",
  body: {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "text",
        text: "Custom Message",
        weight: "bold",
        size: "xl"
      }
    ]
  }
};

await sendMessage(req, flexMessage([customBubble]));
```

---

## Air Quality Module

**Path**: `src/features/air-quality/`

### Overview
Air quality monitoring integration with AirVisual API for location-based environmental data.

### Core Components

#### Services (`services/`)

##### `airvisual.ts`
AirVisual API integration:

```typescript
export const airVisualService = {
  async getNearestCity(latitude: number, longitude: number): Promise<any> {
    const url = `http://api.airvisual.com/v2/nearest_city?lat=${latitude}&lon=${longitude}&key=${env.AIRVISUAL_API_KEY}`;
    // Fetches nearest city air quality data
  },
  
  getNearestCityBubble(location: any) {
    // Generates LINE Flex Message bubble for air quality display
  },
};
```

#### Rich Message Generation

The service creates comprehensive air quality displays with:
- AQI (Air Quality Index) with color-coded levels
- Weather information (temperature, humidity, wind speed)
- Location details (city, state, country)
- Visual indicators and icons

```typescript
// AQI Level Classification
switch (true) {
  case aqi <= 50:
    level = "green";    // Good
    break;
  case aqi >= 51 && aqi <= 100:
    level = "yellow";   // Moderate
    break;
  case aqi >= 101 && aqi <= 150:
    level = "orange";   // Unhealthy for Sensitive Groups
    break;
  case aqi >= 151 && aqi <= 200:
    level = "red";      // Unhealthy
    break;
  case aqi >= 201 && aqi <= 300:
    level = "purple";   // Very Unhealthy
    break;
  default:
    level = "unknown";  // Hazardous
    break;
}
```

#### Types (`types/`)

##### `air-visual.ts`
Data structure definitions:

```typescript
export interface AQIData {
  level: string;
  backgroundColor: string;
  boxImageColor: string;
  imageUrl: string;
  textColor: string;
  description: string;
  pm25: string;
}

export interface WeatherIcon {
  icon: string;
  imageUrl: string;
}
```

#### Static Data (`aqi_data.ts`)
Pre-configured AQI level data and weather icons for consistent display.

### Usage Examples

```typescript
import { airVisualService } from "@/features/air-quality";

// Get air quality for coordinates
const airQuality = await airVisualService.getNearestCity(
  13.7563, // Bangkok latitude
  100.5018 // Bangkok longitude
);

// Generate LINE message bubble
const bubble = airVisualService.getNearestCityBubble(airQuality);

// Send via LINE Bot
await sendMessage(req, flexMessage(bubble));
```

---

## User Settings Module

**Path**: `src/features/user-settings/`

### Overview
User preferences and configuration management (currently in development).

### Structure
```
user-settings/
├── services/     # User preference services
├── types/        # Settings type definitions
└── validation/   # Settings validation schemas
```

### Planned Features
- User notification preferences
- Timezone customization
- Language settings
- Feature toggles
- Privacy controls

---

## Integration Patterns

### Cross-Feature Communication

#### Database Integration
All features use a centralized database service:

```typescript
import { db } from "@/lib/database";

// Attendance creates records
await db.workAttendance.create({
  data: {
    userId,
    checkInTime,
    workDate,
    status: AttendanceStatusType.CHECKED_IN_ON_TIME,
  },
});

// Auth queries user accounts
const userAccount = await db.account.findFirst({
  where: { providerAccountId: userId },
});
```

#### Service Composition
Features compose together for complex functionality:

```typescript
// LINE Bot uses Attendance service
import { attendanceService } from "@/features/attendance";

export const handleCheckIn = async (req: any, userId: string) => {
  const result = await attendanceService.checkIn(userId);
  
  if (result.success) {
    // Send success message via LINE
    await sendMessage(req, result.message);
  }
};
```

#### Event-Driven Architecture
Features communicate through events and webhooks:

```typescript
// LINE webhook triggers attendance actions
// Cron jobs trigger reminder notifications
// Database changes trigger audit logs
```

### Shared Utilities

#### Common Patterns
- **Error Handling**: Graceful error handling with user-friendly messages
- **Validation**: Zod schemas for input validation
- **Timezone Handling**: Consistent UTC to Thai time conversion
- **Security**: Input sanitization and SSRF protection
- **Caching**: Database query optimization

#### Utility Libraries
```typescript
import { formatUTCTimeAsThaiTime } from "@/lib/utils/datetime";
import { selectRandomElement } from "@/lib/crypto-random";
import { validateAndSanitizeUrl } from "@/lib/security/url-validator";
```

---

## Security Considerations

### Input Validation
- All user inputs are validated using Zod schemas
- SQL injection prevention through Prisma ORM
- XSS protection via input sanitization

### API Security
- Rate limiting on API endpoints
- Authentication middleware
- CORS configuration
- Webhook signature verification

### External Integrations
- SSRF protection for external API calls
- Host allowlisting for image requests
- Timeout controls for external requests
- Secure header handling

### Data Protection
- Sensitive data encryption
- Secure session management
- Audit logging for critical actions
- Data retention policies

### Example Security Implementation

```typescript
// From crypto-currency.ts - SSRF protection
const ALLOWED_HOSTS = new Set([
  "s2.coinmarketcap.com",
  "lcw.nyc3.cdn.digitaloceanspaces.com",
  "cryptoicon-api.vercel.app",
]);

// URL validation
const url = new URL(safeUrl);
if (!ALLOWED_HOSTS.has(url.hostname)) {
  console.warn("Generated URL hostname not in allowlist");
  return FALLBACK_ICON_URL;
}

// Request with security controls
const response = await fetch(safeUrl, {
  signal: controller.signal,
  method: "GET",
  headers: {
    "User-Agent": "CryptoApp/1.0",
    Accept: "image/webp,image/*,*/*;q=0.8",
  },
  redirect: "error", // Prevent redirect attacks
  referrerPolicy: "no-referrer",
});
```

---

## Conclusion

The feature module architecture provides:

1. **Modularity**: Each feature is self-contained and independently testable
2. **Scalability**: New features can be added without affecting existing ones
3. **Maintainability**: Clear separation of concerns and consistent patterns
4. **Security**: Built-in security practices across all features
5. **Integration**: Seamless communication between features through well-defined interfaces

This architecture supports the application's core functionality of attendance management, LINE Bot integration, and real-time information services while maintaining high standards for security, performance, and user experience.