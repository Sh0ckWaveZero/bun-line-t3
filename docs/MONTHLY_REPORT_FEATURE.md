# Monthly Attendance Report Feature

This document describes the newly implemented monthly attendance report functionality for the LINE bot attendance system.

## Features Implemented

### 1. Monthly Attendance Report Service
- **File**: `src/services/attendance.ts`
- **Function**: `getMonthlyAttendanceReport(userId: string, month: string)`
- **Purpose**: Generates comprehensive monthly attendance reports with statistics

**Report Data Includes**:
- Total days worked
- Total hours worked
- Working days in month (excluding weekends)
- Attendance rate percentage
- Detailed attendance records with check-in/check-out times
- Hours worked per day

### 2. API Endpoint
- **File**: `src/pages/api/attendance-report.ts`
- **Method**: GET
- **Parameters**: 
  - `userId`: User ID (required)
  - `month`: Month in YYYY-MM format (required)
- **Response**: JSON with success status and report data

**Example Usage**:
```
GET /api/attendance-report?userId=12345&month=2025-06
```

### 3. Frontend Report Page
- **File**: `src/pages/attendance-report.tsx`
- **Route**: `/attendance-report`
- **Features**:
  - Month selector dropdown
  - User ID input field
  - Summary cards showing:
    - Days worked
    - Total hours
    - Attendance percentage
    - Average hours per day
  - Detailed table with all attendance records
  - Responsive design with Tailwind CSS

### 4. LINE Bot Integration
- **Command**: `/รายงาน` or `/report`
- **Postback Actions**: 
  - `action=report_menu` - Shows monthly report menu
  - `action=monthly_report&month=current` - Current month report
  - `action=monthly_report&month=previous` - Previous month report

**LINE Bot Bubble Templates**:
- `monthlyReportMenu()` - Interactive menu for report selection
- `monthlyReportSummary(report)` - Summary card with key statistics

## Usage

### Via LINE Bot
1. Send `/รายงาน` or `/report` command
2. Select desired month from the menu
3. View summary in LINE chat
4. Click "ดูรายละเอียดทั้งหมด" for detailed web view

### Via Web Interface
1. Navigate to `/attendance-report`
2. Enter User ID
3. Select month using date picker
4. View comprehensive report with charts and tables

### Via API
```javascript
fetch('/api/attendance-report?userId=USER_ID&month=2025-06')
  .then(response => response.json())
  .then(data => console.log(data.data));
```

## Report Statistics

The system calculates:
- **Working Days**: Excludes weekends (Saturday and Sunday)
- **Hours Worked**: Time difference between check-in and check-out
- **Attendance Rate**: (Days worked / Working days in month) × 100
- **Average Hours**: Total hours / Days worked

## Data Structure

```typescript
interface MonthlyAttendanceReport {
  userId: string;
  month: string; // YYYY-MM format
  totalDaysWorked: number;
  totalHoursWorked: number;
  attendanceRecords: AttendanceRecord[];
  workingDaysInMonth: number;
  attendanceRate: number; // percentage
}
```

## Security

- User authentication is required for all endpoints
- LINE bot verifies user permissions before generating reports
- API validates input parameters and formats

## Error Handling

- Graceful error messages for invalid inputs
- Fallback handling for missing data
- User-friendly error displays in LINE bot and web interface
