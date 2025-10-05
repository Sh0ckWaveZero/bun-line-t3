# Health Activity Feature

A comprehensive health and fitness activity tracking feature integrated with LINE Bot.

## Overview

This feature allows users to track their health activities, fitness metrics, and health data through the LINE Bot interface and REST API endpoints.

## Features

### 1. Activity Tracking
- Track various activity types: Walking, Running, Cycling, Swimming, Workout, Yoga, and more
- Record duration, distance, calories burned, steps, and heart rate
- View activity history and summaries

### 2. Health Metrics
- Track weight, height, BMI, and body fat percentage
- Monitor blood pressure and resting heart rate
- Record sleep hours and water intake

### 3. Activity Summaries
- Daily activity summary
- Weekly activity summary
- Monthly activity summary
- Aggregate statistics (total duration, distance, calories, steps)

## LINE Bot Commands

### Available Commands

- `สุขภาพ` or `health` - Show health menu
- `วันนี้` - Show today's activity summary
- `สัปดาห์นี้` - Show this week's activity summary
- `เดือนนี้` - Show this month's activity summary
- `กิจกรรม` - Show recent activities list

### Usage Examples

```
# Show health menu
สุขภาพ

# View today's activities
วันนี้

# View weekly summary
สัปดาห์นี้

# View activities list
กิจกรรม
```

## API Endpoints

### Activities API

#### GET `/api/health-activity/activities`
Get user's activities with optional filters.

**Query Parameters:**
- `startDate` (optional) - Filter by start date (ISO 8601)
- `endDate` (optional) - Filter by end date (ISO 8601)
- `activityType` (optional) - Filter by activity type
- `limit` (optional) - Limit number of results (default: 50)
- `offset` (optional) - Offset for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "userId": "...",
      "activityType": "RUNNING",
      "date": "2025-10-05T10:00:00.000Z",
      "duration": 30,
      "distance": 5.2,
      "calories": 350,
      "steps": 6500,
      "heartRate": {
        "average": 145,
        "max": 165,
        "min": 120
      },
      "createdAt": "2025-10-05T10:35:00.000Z",
      "updatedAt": "2025-10-05T10:35:00.000Z"
    }
  ],
  "count": 1
}
```

#### POST `/api/health-activity/activities`
Create a new activity record.

**Request Body:**
```json
{
  "activityType": "running",
  "date": "2025-10-05T10:00:00.000Z",
  "duration": 30,
  "distance": 5.2,
  "calories": 350,
  "steps": 6500,
  "heartRate": {
    "average": 145,
    "max": 165,
    "min": 120
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Activity created successfully"
}
```

#### DELETE `/api/health-activity/activities?id={activityId}`
Delete an activity.

**Response:**
```json
{
  "success": true,
  "message": "Activity deleted successfully"
}
```

### Summary API

#### GET `/api/health-activity/summary`
Get activity summary for a specific period.

**Query Parameters:**
- `period` (required) - Period type: `daily`, `weekly`, or `monthly`
- `date` (optional) - Reference date (ISO 8601, default: today)

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "period": "weekly",
    "startDate": "2025-09-29T00:00:00.000Z",
    "endDate": "2025-10-05T23:59:59.999Z",
    "totalActivities": 5,
    "totalDuration": 180,
    "totalDistance": 25.5,
    "totalCalories": 1500,
    "totalSteps": 32000,
    "averageHeartRate": 142,
    "activities": [ ... ]
  }
}
```

### Health Metrics API

#### GET `/api/health-activity/metrics`
Get health metrics for a specific date.

**Query Parameters:**
- `date` (optional) - Date to get metrics for (ISO 8601, default: today)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "userId": "...",
    "date": "2025-10-05T00:00:00.000Z",
    "weight": 70.5,
    "height": 175,
    "bmi": 23.0,
    "bodyFat": 18.5,
    "bloodPressure": {
      "systolic": 120,
      "diastolic": 80
    },
    "restingHeartRate": 65,
    "sleepHours": 7.5,
    "waterIntake": 2.5
  }
}
```

#### POST `/api/health-activity/metrics`
Save health metrics.

**Request Body:**
```json
{
  "date": "2025-10-05T00:00:00.000Z",
  "weight": 70.5,
  "height": 175,
  "bloodPressure": {
    "systolic": 120,
    "diastolic": 80
  },
  "restingHeartRate": 65,
  "sleepHours": 7.5,
  "waterIntake": 2.5
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Health metrics saved successfully"
}
```

## Database Schema

### HealthActivity Model
```prisma
model HealthActivity {
  id           String       @id @default(auto()) @map("_id") @db.ObjectId
  userId       String       @map("user_id") @db.ObjectId
  activityType ActivityType @map("activity_type")
  date         DateTime     @map("date")
  duration     Float        @map("duration") // in minutes
  distance     Float?       @map("distance") // in kilometers
  calories     Float?       @map("calories")
  steps        Int?         @map("steps")
  heartRate    Json?        @map("heart_rate")
  metadata     Json?        @map("metadata")
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  @@index([userId, date])
  @@index([userId, activityType])
  @@map("health_activities")
}
```

### HealthMetrics Model
```prisma
model HealthMetrics {
  id               String   @id @default(auto()) @map("_id") @db.ObjectId
  userId           String   @map("user_id") @db.ObjectId
  date             DateTime @map("date")
  weight           Float?   @map("weight")
  height           Float?   @map("height")
  bmi              Float?   @map("bmi")
  bodyFat          Float?   @map("body_fat")
  bloodPressure    Json?    @map("blood_pressure")
  restingHeartRate Int?     @map("resting_heart_rate")
  sleepHours       Float?   @map("sleep_hours")
  waterIntake      Float?   @map("water_intake")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@unique([userId, date])
  @@map("health_metrics")
}
```

## Activity Types

- `WALKING` - เดิน
- `RUNNING` - วิ่ง
- `CYCLING` - ปั่นจักรยาน
- `SWIMMING` - ว่ายน้ำ
- `WORKOUT` - ออกกำลังกาย
- `YOGA` - โยคะ
- `OTHER` - อื่นๆ

## File Structure

```
src/features/health-activity/
├── README.md                           # This file
├── types/
│   └── index.ts                        # TypeScript type definitions
├── services/
│   └── health-activity.service.ts      # Business logic service
└── helpers/
    └── activity-formatter.ts           # LINE message formatters

src/app/api/health-activity/
├── activities/
│   └── route.ts                        # Activities CRUD API
├── summary/
│   └── route.ts                        # Summary API
└── metrics/
    └── route.ts                        # Health metrics API

src/features/line/commands/
└── handleHealthCommand.ts              # LINE bot command handler
```

## Integration with External Health Apps

This feature is designed to be extensible and can integrate with external health apps:

### Supported Integration Patterns

1. **Direct API Integration**
   - POST activities directly to `/api/health-activity/activities`
   - Authenticate using NextAuth session or API tokens

2. **Webhook Integration**
   - Configure external apps to send activity data to your webhook endpoint
   - Transform and store data using the service layer

3. **Manual Entry**
   - Users can log activities through a web interface
   - LINE bot can be extended to support activity creation via chat

### Example: Google Fit Integration

```typescript
// Example webhook handler for Google Fit
async function handleGoogleFitWebhook(data: GoogleFitActivity) {
  const activity = await healthActivityService.createActivity({
    userId: data.userId,
    activityType: mapActivityType(data.activityType),
    date: new Date(data.startTime),
    duration: data.duration / 60, // convert seconds to minutes
    distance: data.distance / 1000, // convert meters to kilometers
    calories: data.calories,
    steps: data.steps,
  });
  
  return activity;
}
```

## Future Enhancements

- [ ] Activity goal setting and tracking
- [ ] Achievement badges and rewards
- [ ] Social features (share activities, challenges)
- [ ] Data visualization and charts
- [ ] Export activity data (CSV, PDF)
- [ ] Integration with popular fitness apps (Strava, Garmin, Fitbit)
- [ ] Workout recommendations based on activity history
- [ ] Nutrition tracking integration

## Development

### Running Tests

```bash
# Run all tests
bun test

# Run health activity tests
bun test tests/health-activity
```

### Database Migrations

```bash
# Generate Prisma client
bun run db:generate

# Push schema to MongoDB (no migrations needed)
bun run db:push
```

## Security Considerations

- All API endpoints require authentication via NextAuth
- User can only access their own activity data
- Input validation using Zod schemas
- Sensitive health data is stored securely in MongoDB
- HTTPS required for all API communications

## Support

For issues or questions about this feature, please refer to the main project documentation or contact the development team.
