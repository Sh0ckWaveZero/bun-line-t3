import { env } from "@/env.mjs";

interface TimeValidationResult {
  isValid: boolean;
  reason?: string;
  currentHour?: number;
}

/**
 * Validates if current time is within acceptable range for check-in reminders
 * In production: 01:00-02:59 UTC (08:00-09:59 Bangkok)
 * In development: Always valid for testing
 * 
 * @param currentUTCTime Current UTC time
 * @returns TimeValidationResult indicating if time is valid
 */
export function validateReminderTime(currentUTCTime: Date): TimeValidationResult {
  const currentHour = currentUTCTime.getHours();
  
  console.log('🚀 ~ validateReminderTime ~ currentHour:', currentHour);
  console.log(`🕐 Current time: ${currentUTCTime.toISOString()} UTC`);

  // In development mode, allow all times for testing
  if (env.APP_ENV !== "production") {
    return { 
      isValid: true,
      currentHour,
    };
  }

  // Production: Only allow 01:00-02:59 UTC (08:00-09:59 Bangkok)
  if (currentHour < 1 || currentHour > 2) {
    return {
      isValid: false,
      reason: `Skipped - not the right time (${currentHour}:00 UTC, expected 01:00-02:59)`,
      currentHour,
    };
  }

  return { 
    isValid: true,
    currentHour,
  };
}