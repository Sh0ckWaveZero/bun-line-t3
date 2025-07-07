import { NextRequest } from "next/server";
import { attendanceService } from "@/features/attendance/services/attendance";
import { RateLimiter } from "@/lib/utils/rate-limiter";
import { validateCronAuth } from "@/lib/utils/cron-auth";
import { validateReminderTime } from "@/lib/utils/cron-time-validation";
import { validateWorkingDay } from "@/lib/utils/cron-working-day";
import { sendCheckInReminders } from "@/lib/utils/cron-reminder-sender";
import {
  createErrorResponse,
  createSkippedResponse,
  createReminderSentResponse,
  createNoUsersResponse,
} from "@/lib/utils/cron-response";

/**
 * Morning Check-in Reminder Cron Job
 * This endpoint sends friendly reminders to all users at 8:00 AM on weekdays
 * to encourage them to check in for work
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResponse = await RateLimiter.checkCronRateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Authentication check for cron jobs
    const authResult = validateCronAuth(req);
    if (!authResult.success) {
      return createErrorResponse(authResult.error!, authResult.status!);
    }
    // Get current time and convert to Bangkok timezone
    const currentUTCTime = attendanceService.getCurrentUTCTime();
    const currentThaiTime = attendanceService.convertUTCToThaiTime(currentUTCTime);
    
    console.log(`🕐 Current time: ${currentUTCTime.toISOString()} UTC (${currentThaiTime.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} Bangkok)`);
    
    // Check if today is a working day
    const workingDayResult = await validateWorkingDay(currentThaiTime);
    if (!workingDayResult.isWorkingDay) {
      return createSkippedResponse(
        `Skipped - ${workingDayResult.reason}`,
        workingDayResult.holidayInfo
      );
    }

    // Validate reminder time
    const timeValidation = validateReminderTime(currentUTCTime);
    if (!timeValidation.isValid) {
      return createSkippedResponse(timeValidation.reason!);
    }

    // Send reminders to active users
    const todayString = currentThaiTime?.toISOString().split("T")[0] ?? "";
    const reminderResult = await sendCheckInReminders(todayString);
    
    if (!reminderResult.success && reminderResult.totalUsers === 0) {
      return createNoUsersResponse();
    }

    return createReminderSentResponse(
      reminderResult.messageText,
      reminderResult.sentCount,
      reminderResult.failedCount
    );
  } catch (error: any) {
    console.error("❌ Error in check-in reminder job:", error);
    return createErrorResponse(
      "Failed to send check-in reminder",
      500,
      error.message
    );
  }
}
