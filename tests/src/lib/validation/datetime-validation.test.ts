/**
 * 🧪 Unit Tests สำหรับ Datetime Validation Utilities
 * ทดสอบการทำงานของ datetime transformer และ security features
 */

import { describe, expect, test } from "bun:test";
import { z } from "zod";
import {
  datetimeTransformer,
  parseDateTime,
  validateAndParseDateTime,
  DateTimeSecurity,
  DateTimeSchemas,
  datetimeRequired,
  datetimeOptional,
} from "@/lib/validation/datetime";

/**
 * สร้าง datetime-local string สำหรับ "วันนี้" ในเวลาไทย (เพื่อให้ผ่าน
 * isWithinAcceptableRange ที่อ้างอิงจาก now) คืนค่า YYYY-MM-DDTHH:MM
 * ปลอดภัยเพราะใช้วันที่ปัจจุบันเสมอ -> ไม่เก่าเกิน maxPastDays
 */
const todayThaiDateTimeLocal = (
  hours = 8,
  minutes = 30,
): string => {
  const now = new Date();
  const thai = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${thai.getFullYear()}-${pad(thai.getMonth() + 1)}-${pad(
    thai.getDate(),
  )}T${pad(hours)}:${pad(minutes)}`;
};

describe("🔐 Datetime Validation Security Tests", () => {
  describe("datetimeTransformer", () => {
    test("✅ should accept datetime-local format", () => {
      const schema = z.object({ time: datetimeTransformer });
      const result = schema.parse({ time: "2025-06-11T08:30" });
      expect(result.time).toBe("2025-06-11T08:30:00.000Z");
    });

    test("✅ should accept ISO 8601 format", () => {
      const schema = z.object({ time: datetimeTransformer });
      const result = schema.parse({ time: "2025-06-11T08:30:00.000Z" });
      expect(result.time).toBe("2025-06-11T08:30:00.000Z");
    });

    test("❌ should reject invalid datetime", () => {
      const schema = z.object({ time: datetimeTransformer });
      expect(() => schema.parse({ time: "invalid-date" })).toThrow();
    });

    test("❌ should reject malformed datetime-local", () => {
      const schema = z.object({ time: datetimeTransformer });
      expect(() => schema.parse({ time: "2025-13-45T25:70" })).toThrow();
    });
  });

  describe("parseDateTime", () => {
    test("✅ should parse datetime-local as Thailand time", () => {
      const result = parseDateTime("2025-06-11T08:30");
      // 08:30 Thailand time = 01:30 UTC
      expect(result.toISOString()).toBe("2025-06-11T01:30:00.000Z");
    });

    test("✅ should parse ISO format correctly", () => {
      const result = parseDateTime("2025-06-11T08:30:00+07:00");
      expect(result.toISOString()).toBe("2025-06-11T01:30:00.000Z");
    });

    test("✅ should handle UTC time", () => {
      const result = parseDateTime("2025-06-11T01:30:00.000Z");
      expect(result.toISOString()).toBe("2025-06-11T01:30:00.000Z");
    });
  });

  describe("validateAndParseDateTime", () => {
    test("✅ should validate and parse correct datetime", () => {
      const result = validateAndParseDateTime("2025-06-11T08:30");
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe("2025-06-11T01:30:00.000Z");
    });

    test("❌ should throw error for invalid datetime", () => {
      expect(() => validateAndParseDateTime("invalid-date")).toThrow(
        "Invalid datetime format: invalid-date",
      );
    });
  });

  describe("🛡️ DateTimeSecurity", () => {
    describe("isWithinAcceptableRange", () => {
      test("✅ should accept recent dates", () => {
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 30); // 30 days ago

        expect(DateTimeSecurity.isWithinAcceptableRange(recentDate)).toBe(true);
      });

      test("❌ should reject dates too far in the past", () => {
        const oldDate = new Date();
        oldDate.setFullYear(oldDate.getFullYear() - 2); // 2 years ago

        expect(DateTimeSecurity.isWithinAcceptableRange(oldDate)).toBe(false);
      });

      test("❌ should reject dates too far in the future", () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 60); // 60 days in future

        expect(DateTimeSecurity.isWithinAcceptableRange(futureDate)).toBe(
          false,
        );
      });

      test("✅ should accept custom range limits", () => {
        const testDate = new Date();
        testDate.setDate(testDate.getDate() - 10); // 10 days ago

        expect(DateTimeSecurity.isWithinAcceptableRange(testDate, 30, 30)).toBe(
          true,
        );
        expect(DateTimeSecurity.isWithinAcceptableRange(testDate, 5, 30)).toBe(
          false,
        );
      });
    });

    describe("isWorkingHours", () => {
      test("✅ should accept working hours on weekdays", () => {
        // Monday 2025-06-09 at 09:00 Thailand time
        const workingDay = new Date("2025-06-09T02:00:00.000Z"); // 09:00 Thailand
        expect(DateTimeSecurity.isWorkingHours(workingDay)).toBe(true);
      });

      test("❌ should reject weekend days", () => {
        // Sunday 2025-06-08 at 09:00 Thailand time
        const weekend = new Date("2025-06-08T02:00:00.000Z"); // 09:00 Thailand
        expect(DateTimeSecurity.isWorkingHours(weekend)).toBe(false);
      });

      test("❌ should reject outside working hours", () => {
        // Monday 2025-06-09 at 05:00 Thailand time (too early)
        const tooEarly = new Date("2025-06-08T22:00:00.000Z"); // 05:00 Thailand next day
        expect(DateTimeSecurity.isWorkingHours(tooEarly)).toBe(false);
      });
    });

    describe("toSafeLogString", () => {
      test("✅ should return only date part", () => {
        const testDate = new Date("2025-06-11T08:30:45.123Z");
        const result = DateTimeSecurity.toSafeLogString(testDate);
        expect(result).toBe("2025-06-11");
      });

      test("✅ should handle edge cases", () => {
        const newYear = new Date("2025-01-01T00:00:00.000Z");
        const result = DateTimeSecurity.toSafeLogString(newYear);
        expect(result).toBe("2025-01-01");
      });
    });
  });

  describe("📋 DateTimeSchemas", () => {
    describe("attendance schema", () => {
      test("✅ should validate attendance data", () => {
        const validData = {
          checkInTime: "2025-06-11T08:30",
          checkOutTime: "2025-06-11T17:30",
        };

        const result = DateTimeSchemas.attendance.parse(validData);
        expect(result.checkInTime).toBe("2025-06-11T08:30:00.000Z");
        expect(result.checkOutTime).toBe("2025-06-11T17:30:00.000Z");
      });

      test("✅ should handle null checkOutTime", () => {
        const validData = {
          checkInTime: "2025-06-11T08:30",
          checkOutTime: null,
        };

        const result = DateTimeSchemas.attendance.parse(validData);
        expect(result.checkInTime).toBe("2025-06-11T08:30:00.000Z");
        expect(result.checkOutTime).toBe(null);
      });
    });

    describe("dateRange schema", () => {
      test("✅ should validate correct date range", () => {
        const validRange = {
          startDate: "2025-06-01T00:00",
          endDate: "2025-06-30T23:59",
        };

        const result = DateTimeSchemas.dateRange.parse(validRange);
        expect(result.startDate).toBe("2025-06-01T00:00:00.000Z");
        expect(result.endDate).toBe("2025-06-30T23:59:00.000Z");
      });

      test("❌ should reject invalid date range", () => {
        const invalidRange = {
          startDate: "2025-06-30T00:00",
          endDate: "2025-06-01T23:59",
        };

        expect(() => DateTimeSchemas.dateRange.parse(invalidRange)).toThrow();
      });
    });
  });

  describe("🔄 Integration Tests", () => {
    test("✅ should handle real-world attendance update payload", () => {
      // ใช้วันที่ปัจจุบัน (เวลาไทย) เพื่อให้ผ่าน isWithinAcceptableRange
      const checkIn = todayThaiDateTimeLocal(8, 30);
      const checkOut = todayThaiDateTimeLocal(17, 30);
      const attendancePayload = {
        attendanceId: "att_123456789",
        checkInTime: checkIn,
        checkOutTime: checkOut,
      };

      const schema = z.object({
        attendanceId: z.string().min(1),
        checkInTime: datetimeRequired,
        checkOutTime: datetimeOptional,
      });

      const result = schema.parse(attendancePayload);

      expect(result.attendanceId).toBe("att_123456789");
      expect(result.checkInTime).toBe(`${checkIn}:00.000Z`);
      expect(result.checkOutTime).toBe(`${checkOut}:00.000Z`);

      // Test parsing to Date objects
      const checkInDate = parseDateTime(result.checkInTime);

      // 🔐 Type-safe parsing สำหรับ optional checkOutTime
      expect(result.checkOutTime).not.toBeNull(); // ตรวจสอบว่าไม่เป็น null
      const checkOutDate = parseDateTime(result.checkOutTime!); // Non-null assertion หลังจากตรวจสอบแล้ว

      expect(checkInDate.toISOString()).toBe(`${checkIn}:00.000Z`);
      expect(checkOutDate.toISOString()).toBe(`${checkOut}:00.000Z`);

      // Test security validations
      expect(DateTimeSecurity.isWithinAcceptableRange(checkInDate)).toBe(true);
      expect(DateTimeSecurity.isWithinAcceptableRange(checkOutDate)).toBe(true);
    });

    test("✅ should handle attendance payload with null checkOutTime safely", () => {
      // ใช้วันที่ปัจจุบัน (เวลาไทย) เพื่อให้ผ่าน isWithinAcceptableRange
      const checkIn = todayThaiDateTimeLocal(8, 30);
      const attendancePayload = {
        attendanceId: "att_987654321",
        checkInTime: checkIn,
        checkOutTime: null,
      };

      const schema = z.object({
        attendanceId: z.string().min(1),
        checkInTime: datetimeRequired,
        checkOutTime: datetimeOptional,
      });

      const result = schema.parse(attendancePayload);

      expect(result.attendanceId).toBe("att_987654321");
      expect(result.checkInTime).toBe(`${checkIn}:00.000Z`);
      expect(result.checkOutTime).toBe(null);

      // Test parsing to Date objects
      const checkInDate = parseDateTime(result.checkInTime);
      expect(checkInDate.toISOString()).toBe(`${checkIn}:00.000Z`);

      // 🔐 Safe handling of null checkOutTime
      const checkOutDate = result.checkOutTime
        ? parseDateTime(result.checkOutTime)
        : null;
      expect(checkOutDate).toBe(null);

      // Test security validations
      expect(DateTimeSecurity.isWithinAcceptableRange(checkInDate)).toBe(true);
    });

    test("🛡️ should prevent security vulnerabilities", () => {
      // Test SQL injection attempt
      expect(() =>
        validateAndParseDateTime("'; DROP TABLE users; --"),
      ).toThrow();

      // Test XSS attempt
      expect(() =>
        validateAndParseDateTime('<script>alert("xss")</script>'),
      ).toThrow();

      // Test extremely old date
      const veryOldDate = new Date("1900-01-01T00:00:00.000Z");
      expect(DateTimeSecurity.isWithinAcceptableRange(veryOldDate)).toBe(false);

      // Test extremely future date
      const veryFutureDate = new Date("2030-01-01T00:00:00.000Z");
      expect(DateTimeSecurity.isWithinAcceptableRange(veryFutureDate)).toBe(
        false,
      );
    });
  });
});
