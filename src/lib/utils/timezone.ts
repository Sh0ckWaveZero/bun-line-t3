/**
 * 🌏 Centralized Timezone Utility
 * Single source of truth for all Bangkok timezone operations
 * Consolidates repeated timezone logic from multiple files
 */

const THAILAND_TIMEZONE = "Asia/Bangkok";
const BUDDHIST_ERA_OFFSET = 543;
const THAILAND_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: THAILAND_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Get current UTC time (for database storage)
 * Returns a Date object representing the current UTC time
 */
export const getCurrentUTCTime = (): Date => {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000);
};

/**
 * Get current Bangkok time (for validation and display)
 * Converts UTC to Bangkok timezone
 */
export const getCurrentBangkokTime = (): Date => {
  const now = new Date();
  const bangkokTimeString = now.toLocaleString("en-US", {
    timeZone: THAILAND_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return new Date(bangkokTimeString);
};

/**
 * Convert UTC time to Bangkok time for display
 * Handles timezone conversion without manual offset calculation
 */
export const convertUTCToBangkok = (utcDate: Date): Date => {
  const bangkokTimeString = utcDate.toLocaleString("en-US", {
    timeZone: THAILAND_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return new Date(bangkokTimeString);
};

/**
 * Get today's date in YYYY-MM-DD format based on Bangkok timezone
 */
export const getTodayDateString = (): string => {
  const today = new Date();
  const bangkokDate = THAILAND_DATE_FORMATTER.format(today);
  return bangkokDate; // Already in YYYY-MM-DD format
};

/**
 * Format date to Thai format with Buddhist Era (วันที่ เดือน ปี พุทธศักราช)
 * Example: "14/06/2568" (2568 = 2025 + 543)
 */
export const formatThaiDate = (date: Date): string => {
  const year = date.getUTCFullYear() + BUDDHIST_ERA_OFFSET;
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");

  return `${day}/${month}/${year}`;
};

/**
 * Format date and time to Thai format (DD/MM/YYYY HH:MM:SS พศ.)
 */
export const formatThaiDateTime = (date: Date): string => {
  const year = date.getUTCFullYear() + BUDDHIST_ERA_OFFSET;
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Format time only (HH:MM)
 */
export const formatThaiTimeOnly = (date: Date): string => {
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
};

/**
 * Format UTC time as Thai time display (HH:MM) - useful for cron jobs
 */
export const formatUTCTimeAsThaiTime = (utcDate: Date): string => {
  const thaiTime = convertUTCToBangkok(utcDate);
  const hours = thaiTime.getUTCHours().toString().padStart(2, "0");
  const minutes = thaiTime.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * Safe date formatting using Intl API with Bangkok timezone
 * Handles invalid dates gracefully
 */
export const formatDateSafe = (
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {},
  locale = "th-TH",
): string => {
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return "วันที่ไม่ถูกต้อง";
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: THAILAND_TIMEZONE,
      ...options,
    };

    return date.toLocaleDateString(locale, defaultOptions);
  } catch (error) {
    console.error("Date formatting error:", error);
    return "วันที่ไม่ถูกต้อง";
  }
};

/**
 * Safe time formatting using Intl API with Bangkok timezone
 */
export const formatTimeSafe = (
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {},
  locale = "th-TH",
): string => {
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return "เวลาไม่ถูกต้อง";
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: THAILAND_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    };

    return date.toLocaleTimeString(locale, defaultOptions);
  } catch (error) {
    console.error("Time formatting error:", error);
    return "เวลาไม่ถูกต้อง";
  }
};

/**
 * Safe date and time formatting
 */
export const formatDateTimeSafe = (
  dateString: string | Date,
  locale = "th-TH",
): string => {
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return "วันที่และเวลาไม่ถูกต้อง";
    }

    return date.toLocaleString(locale, {
      timeZone: THAILAND_TIMEZONE,
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("DateTime formatting error:", error);
    return "วันที่และเวลาไม่ถูกต้อง";
  }
};

/**
 * Create safe datetime for logging (date only, no time)
 */
export const toSafeLogString = (date: Date): string => {
  try {
    const dateOnly = date.toISOString().split("T")[0];
    return dateOnly || "invalid-date";
  } catch (error) {
    console.error("Error creating safe log string:", error);
    return "invalid-date";
  }
};

/**
 * Parse local datetime input (from datetime-local HTML input)
 * Handles YYYY-MM-DDTHH:MM format and converts to Date
 */
export const parseLocalDateTime = (dateString: string): Date => {
  // Handle datetime-local format (YYYY-MM-DDTHH:MM)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateString)) {
    return new Date(`${dateString}:00+07:00`);
  }

  // Already ISO format
  return new Date(dateString);
};

/**
 * Predefined formatting functions for common use cases
 */
export const dateFormatters = {
  // Full date: "วันจันทร์ที่ 14 มิถุนายน 2025"
  fullDate: (dateString: string) =>
    formatDateSafe(dateString, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }),

  // Short date: "14/06/2025"
  shortDate: (dateString: string) =>
    formatDateSafe(dateString, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),

  // 24-hour time: "14:30"
  time24: (dateString: string) =>
    formatTimeSafe(dateString, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),

  // 12-hour time: "2:30 PM"
  time12: (dateString: string) =>
    formatTimeSafe(dateString, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),

  // Month and year: "มิถุนายน 2025"
  monthYear: (dateString: string) =>
    formatDateSafe(dateString, {
      year: "numeric",
      month: "long",
    }),

  // Weekday only: "วันจันทร์"
  weekday: (dateString: string) =>
    formatDateSafe(dateString, {
      weekday: "long",
    }),
} as const;

/**
 * Namespace export for convenience
 */
export const timezoneUtils = {
  getCurrentUTCTime,
  getCurrentBangkokTime,
  convertUTCToBangkok,
  getTodayDateString,
  formatThaiDate,
  formatThaiDateTime,
  formatThaiTimeOnly,
  formatUTCTimeAsThaiTime,
  formatDateSafe,
  formatTimeSafe,
  formatDateTimeSafe,
  toSafeLogString,
  parseLocalDateTime,
  dateFormatters,
};
