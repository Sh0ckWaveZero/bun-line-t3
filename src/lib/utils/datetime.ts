// Date and Time Utility Functions
// Helper functions for time conversion and formatting

// Get current UTC time (for database storage)
export const getCurrentUTCTime = (): Date => {
  // Return a Date object representing the current UTC time
  // Note: new Date() creates a Date object based on local time,
  // but we need true UTC time for consistent database storage
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000);
};

// Get current Bangkok time (for validation and display)
export const getCurrentBangkokTime = (): Date => {
  const now = new Date();
  // Get current time in Bangkok timezone
  const bangkokTimeString = now.toLocaleString("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Parse the Bangkok time string back to a Date object
  const bangkokTime = new Date(bangkokTimeString);
  return bangkokTime;
};

// Convert UTC time to Bangkok time for display
export const convertUTCToBangkok = (utcDate: Date): Date => {
  // Use proper timezone API instead of manual offset calculation
  // This handles daylight saving time changes automatically (though Bangkok doesn't use DST)
  const bangkokTimeString = utcDate.toLocaleString("en-US", {
    timeZone: "Asia/Bangkok",
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

// Get today's date in YYYY-MM-DD format based on Bangkok timezone
export const getTodayDateString = (): string => {
  const today = new Date();
  // Convert to Bangkok timezone and format as YYYY-MM-DD
  const bangkokDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(today);
  return bangkokDate; // Already in YYYY-MM-DD format
};

// Format date to Thai format with Buddhist Era
export const formatThaiTime = (date: Date): string => {
  // Date object already converted to Bangkok time, use UTC methods to avoid double conversion
  const year = date.getUTCFullYear() + 543; // Convert to Buddhist Era
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

// Format time only (HH:MM)
export const formatThaiTimeOnly = (date: Date): string => {
  // Date object already converted to Bangkok time, use UTC methods to avoid double conversion
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
};

// Format UTC time as Thai time display (HH:MM) - for cron jobs
export const formatUTCTimeAsThaiTime = (utcDate: Date): string => {
  const thaiTime = convertUTCToBangkok(utcDate);
  const hours = thaiTime.getUTCHours().toString().padStart(2, "0");
  const minutes = thaiTime.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};
