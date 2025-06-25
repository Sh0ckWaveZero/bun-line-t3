import { z } from "zod";

/**
 * 🔐 Secure Datetime Validation Utilities
 * รองรับการตรวจสอบ datetime format หลายรูปแบบอย่างปลอดภัย
 */

/**
 * Custom datetime transformer ที่รองรับทั้ง datetime-local และ ISO 8601
 * @description แปลง datetime-local format (YYYY-MM-DDTHH:MM) ให้เป็น ISO 8601
 * และตรวจสอบความถูกต้องของ datetime
 */
export const datetimeTransformer = z.string().transform((val, ctx) => {
  // รองรับ datetime-local format (YYYY-MM-DDTHH:MM)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) {
    val = `${val}:00.000Z`; // แปลงเป็น ISO 8601 พร้อม timezone
  }

  // ตรวจสอบว่าเป็น valid date หรือไม่
  const date = new Date(val);
  if (isNaN(date.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_date,
      message: "Invalid datetime format",
    });
    return z.NEVER;
  }

  return val;
});

/**
 * Datetime schema สำหรับ required field
 */
export const datetimeRequired = datetimeTransformer;

/**
 * Datetime schema สำหรับ optional field
 */
export const datetimeOptional = datetimeTransformer.optional().nullable();

/**
 * 🌏 Timezone-aware datetime parser
 * @description แปลง datetime string ให้เป็น Date object พร้อมจัดการ timezone
 * @param dateString - datetime string ในรูปแบบใดก็ได้
 * @returns Date object ที่ถูกต้อง
 */
export const parseDateTime = (dateString: string): Date => {
  // ถ้าเป็น datetime-local format (ไม่มี timezone) ให้ถือว่าเป็นเวลาไทย
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateString)) {
    // เพิ่ม timezone offset สำหรับประเทศไทย (+07:00)
    return new Date(`${dateString}:00+07:00`);
  }

  // ถ้าเป็น ISO format แล้ว ใช้โดยตรง
  return new Date(dateString);
};

/**
 * ✅ Validate และแปลง datetime string
 * @description ฟังก์ชันที่ปลอดภัยสำหรับ validate และแปลง datetime
 * @param dateString - datetime string
 * @throws Error ถ้า datetime ไม่ถูกต้อง
 * @returns Date object ที่ validated แล้ว
 */
export const validateAndParseDateTime = (dateString: string): Date => {
  const parsed = parseDateTime(dateString);

  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid datetime format: ${dateString}`);
  }

  return parsed;
};

/**
 * 📋 Common datetime validation schemas
 */
export const DateTimeSchemas = {
  // สำหรับ attendance records
  attendance: z.object({
    checkInTime: datetimeRequired,
    checkOutTime: datetimeOptional,
  }),

  // สำหรับ date range queries
  dateRange: z
    .object({
      startDate: datetimeRequired,
      endDate: datetimeRequired,
    })
    .refine(
      (data) => {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return start <= end;
      },
      {
        message: "Start date must be before or equal to end date",
        path: ["endDate"],
      },
    ),

  // สำหรับ scheduled tasks
  schedule: z.object({
    scheduledAt: datetimeRequired,
    expiresAt: datetimeOptional,
  }),
} as const;

/**
 * 🛡️ Security validation helpers
 */
export const DateTimeSecurity = {
  /**
   * ตรวจสอบว่า datetime อยู่ในช่วงที่ยอมรับได้หรือไม่
   */
  isWithinAcceptableRange: (
    date: Date,
    maxPastDays = 365,
    maxFutureDays = 30,
  ): boolean => {
    const now = new Date();
    const maxPast = new Date(now.getTime() - maxPastDays * 24 * 60 * 60 * 1000);
    const maxFuture = new Date(
      now.getTime() + maxFutureDays * 24 * 60 * 60 * 1000,
    );

    return date >= maxPast && date <= maxFuture;
  },

  /**
   * ตรวจสอบว่า datetime เป็นเวลาทำงานหรือไม่ (ตาม timezone ไทย)
   */
  isWorkingHours: (date: Date): boolean => {
    // แปลงเป็นเวลาไทย (UTC+7)
    const thailandTime = new Date(
      date.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
    );
    const hours = thailandTime.getHours();
    const day = thailandTime.getDay(); // 0 = Sunday, 6 = Saturday

    // จันทร์-ศุกร์ เวลา 06:00-22:00 (เวลาไทย)
    return day >= 1 && day <= 5 && hours >= 6 && hours <= 22;
  },

  /**
   * สร้าง safe datetime string สำหรับ logging
   */
  toSafeLogString: (date: Date): string => {
    const dateOnly = date.toISOString().split("T")[0];
    return dateOnly || date.toDateString(); // fallback ถ้า split ไม่สำเร็จ
  },
} as const;
