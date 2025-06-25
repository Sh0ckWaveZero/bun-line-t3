/**
 * 🛡️ Safe Date Formatting Utilities
 * ป้องกัน hydration mismatch จากการ format dates ที่ต่างกันระหว่าง server/client
 */

/**
 * 🎯 Safe date formatting for server-side rendering
 * ใช้ ISO strings และ timezone-aware formatting
 */
export const formatDateSafe = (
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {},
  locale = "th-TH",
): string => {
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    // ตรวจสอบว่า date ถูกต้อง
    if (isNaN(date.getTime())) {
      return "วันที่ไม่ถูกต้อง";
    }

    // ใช้ Bangkok timezone เป็นค่าเริ่มต้น
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Bangkok",
      ...options,
    };

    return date.toLocaleDateString(locale, defaultOptions);
  } catch (error) {
    console.error("Date formatting error:", error);
    return "วันที่ไม่ถูกต้อง";
  }
};

/**
 * 🕐 Safe time formatting for server-side rendering
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
      timeZone: "Asia/Bangkok",
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
 * 📅 Safe date and time formatting
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
      timeZone: "Asia/Bangkok",
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
 * 🗓️ Predefined formatting functions
 */
export const dateFormatters = {
  // วันที่แบบเต็ม เช่น "วันจันทร์ที่ 14 มิถุนายน 2025"
  fullDate: (dateString: string) =>
    formatDateSafe(dateString, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }),

  // วันที่แบบสั้น เช่น "14/06/2025"
  shortDate: (dateString: string) =>
    formatDateSafe(dateString, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),

  // เวลาแบบ 24 ชั่วโมง เช่น "14:30"
  time24: (dateString: string) =>
    formatTimeSafe(dateString, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),

  // เวลาแบบ 12 ชั่วโมง เช่น "2:30 PM"
  time12: (dateString: string) =>
    formatTimeSafe(dateString, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),

  // เดือนและปี เช่น "มิถุนายน 2025"
  monthYear: (dateString: string) =>
    formatDateSafe(dateString, {
      year: "numeric",
      month: "long",
    }),

  // วันในสัปดาห์ เช่น "วันจันทร์"
  weekday: (dateString: string) =>
    formatDateSafe(dateString, {
      weekday: "long",
    }),
} as const;

/**
 * 🔢 Safe number formatting for hours
 */
export const formatHoursSafe = (hours: number | null): string => {
  if (hours === null || hours === undefined) return "-";

  // Round to 1 decimal place
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} ชั่วโมง`;
};

/**
 * 🎨 Get status color class safely
 */
export const getStatusColorSafe = (status: string): string => {
  const colorMap: Record<string, string> = {
    เข้างานปกติ: "text-green-600",
    มาสาย: "text-yellow-600",
    ลางาน: "text-red-600",
    ไม่ได้เข้างาน: "text-gray-600",
  };

  return colorMap[status] ?? "text-gray-500";
};
