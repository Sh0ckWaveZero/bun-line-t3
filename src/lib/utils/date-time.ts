/**
 * 🕐 Date Time Utilities
 *
 * ชุดเครื่องมือสำหรับการจัดการวันที่และเวลาอย่างปลอดภัย
 * รองรับการแปลงระหว่าง datetime และ time formats
 *
 * Security Features:
 * ✅ Input validation for all date/time operations
 * ✅ Timezone-aware processing
 * ✅ Safe null/undefined handling
 * ✅ Immutable operations (functional approach)
 */

import { z } from "zod";

// 🔒 Input validation schemas
const TimeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)");
const DateSchema = z.date();
const DateStringSchema = z
  .string()
  .refine((date) => !isNaN(Date.parse(date)), "Invalid date string");

/**
 * 🎯 แปลง Date object เป็น time string (HH:MM)
 *
 * @param date - Date object to convert
 * @returns Time string in HH:MM format
 *
 * @example
 * const date = new Date('2025-06-15T08:30:00')
 * formatTimeOnly(date) // "08:30"
 */
export const formatTimeOnly = (
  date: Date | string | null | undefined,
): string => {
  if (!date) return "";

  try {
    const validatedDate =
      typeof date === "string"
        ? DateStringSchema.parse(date)
        : DateSchema.parse(date);

    const dateObj =
      typeof validatedDate === "string"
        ? new Date(validatedDate)
        : validatedDate;

    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date provided to formatTimeOnly:", date);
      return "";
    }

    const hours = dateObj.getHours().toString().padStart(2, "0");
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
  } catch (error) {
    console.warn("Error formatting time:", error);
    return "";
  }
};

/**
 * 🔄 รวมวันที่เดิมกับเวลาใหม่
 *
 * สร้าง Date object ใหม่โดยใช้วันที่จาก originalDate
 * แต่เปลี่ยนเฉพาะเวลาเป็น newTime
 *
 * @param originalDate - วันที่เดิมที่ต้องการรักษาไว้
 * @param newTime - เวลาใหม่ในรูปแบบ HH:MM
 * @returns Date object ใหม่ที่มีวันเดิมแต่เวลาใหม่
 *
 * @example
 * const original = new Date('2025-06-15T08:30:00')
 * const updated = combineOriginalDateWithNewTime(original, '17:00')
 * // Result: new Date('2025-06-15T17:00:00')
 */
export const combineOriginalDateWithNewTime = (
  originalDate: Date | string | null | undefined,
  newTime: string | null | undefined,
): Date | null => {
  if (!originalDate || !newTime) {
    console.warn(
      "Missing originalDate or newTime in combineOriginalDateWithNewTime",
    );
    return null;
  }

  try {
    // Validate inputs
    const validatedTime = TimeStringSchema.parse(newTime);
    const originalDateObj =
      typeof originalDate === "string"
        ? new Date(DateStringSchema.parse(originalDate))
        : DateSchema.parse(originalDate);

    if (isNaN(originalDateObj.getTime())) {
      console.warn("Invalid original date provided:", originalDate);
      return null;
    }

    // Parse time components safely with type assertion
    const timeParts = validatedTime.split(":");
    if (timeParts.length !== 2) {
      console.warn("Invalid time format after validation:", validatedTime);
      return null;
    }

    const hoursStr = timeParts[0]!;
    const minutesStr = timeParts[1]!;

    if (!hoursStr || !minutesStr) {
      console.warn("Missing time components:", { hoursStr, minutesStr });
      return null;
    }

    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    // Validate time ranges
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn("Invalid time values:", { hours, minutes });
      return null;
    }

    // Create new date with original date but new time
    const newDate = new Date(originalDateObj);
    newDate.setHours(hours, minutes, 0, 0); // Reset seconds and milliseconds

    return newDate;
  } catch (error) {
    console.warn("Error combining date and time:", error, {
      originalDate,
      newTime,
    });
    return null;
  }
};

/**
 * 📅 แปลง Date เป็น datetime-local string
 *
 * สำหรับใช้กับ HTML input type="datetime-local"
 *
 * @param date - Date object to convert
 * @returns String in YYYY-MM-DDTHH:MM format
 *
 * @example
 * const date = new Date('2025-06-15T08:30:00')
 * formatForDateTimeLocal(date) // "2025-06-15T08:30"
 */
export const formatForDateTimeLocal = (
  date: Date | string | null | undefined,
): string => {
  if (!date) return "";

  try {
    const validatedDate =
      typeof date === "string"
        ? DateStringSchema.parse(date)
        : DateSchema.parse(date);

    const dateObj =
      typeof validatedDate === "string"
        ? new Date(validatedDate)
        : validatedDate;

    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date provided to formatForDateTimeLocal:", date);
      return "";
    }

    // Format as YYYY-MM-DDTHH:MM
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const day = dateObj.getDate().toString().padStart(2, "0");
    const hours = dateObj.getHours().toString().padStart(2, "0");
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.warn("Error formatting for datetime-local:", error);
    return "";
  }
};

/**
 * ⏰ ตรวจสอบว่าเวลาถูกต้องหรือไม่
 *
 * @param timeString - เวลาในรูปแบบ HH:MM
 * @returns boolean - true ถ้าเวลาถูกต้อง
 *
 * @example
 * isValidTime('08:30') // true
 * isValidTime('25:30') // false
 * isValidTime('invalid') // false
 */
export const isValidTime = (timeString: string | null | undefined): boolean => {
  if (!timeString) return false;

  try {
    TimeStringSchema.parse(timeString);

    const timeParts = timeString.split(":");
    if (timeParts.length !== 2) return false;

    const hoursStr = timeParts[0]!;
    const minutesStr = timeParts[1]!;

    if (!hoursStr || !minutesStr) return false;

    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  } catch {
    return false;
  }
};

/**
 * 🔄 แปลง datetime-local string เป็น Date object
 *
 * @param datetimeLocal - String in YYYY-MM-DDTHH:MM format
 * @returns Date object or null if invalid
 *
 * @example
 * parseDateTimeLocal('2025-06-15T08:30') // Date object
 * parseDateTimeLocal('invalid') // null
 */
export const parseDateTimeLocal = (
  datetimeLocal: string | null | undefined,
): Date | null => {
  if (!datetimeLocal) return null;

  try {
    const date = new Date(datetimeLocal);

    if (isNaN(date.getTime())) {
      console.warn("Invalid datetime-local string:", datetimeLocal);
      return null;
    }

    return date;
  } catch (error) {
    console.warn("Error parsing datetime-local:", error);
    return null;
  }
};

/**
 * 📊 สร้าง summary ของการเปลี่ยนแปลงเวลา
 *
 * @param originalDate - วันที่และเวลาเดิม
 * @param newTime - เวลาใหม่
 * @returns Object ที่มีข้อมูลการเปลี่ยนแปลง
 */
export const createTimeChangeSummary = (
  originalDate: Date | string | null | undefined,
  newTime: string | null | undefined,
) => {
  const original =
    typeof originalDate === "string" ? new Date(originalDate) : originalDate;
  const originalTimeStr = formatTimeOnly(original);
  const newTimeStr = newTime || "";
  const combinedDate = combineOriginalDateWithNewTime(original, newTime);

  return {
    originalTime: originalTimeStr,
    newTime: newTimeStr,
    isChanged: originalTimeStr !== newTimeStr,
    combinedDate,
    isValid: isValidTime(newTimeStr) && combinedDate !== null,
  };
};
