/**
 * 🧪 Tests for Date Time Utilities
 *
 * ทดสอบ date-time utils ที่สร้างใหม่เพื่อให้แน่ใจว่าทำงานถูกต้อง
 */

import { describe, test, expect } from "bun:test";
import * as dateTimeUtils from "@/lib/utils/date-time";

const {
  formatTimeOnly,
  combineOriginalDateWithNewTime,
  formatForDateTimeLocal,
  parseDateTimeLocal,
  createTimeChangeSummary,
  isValidTime,
} = dateTimeUtils;

describe("Date Time Utilities", () => {
  describe("formatTimeOnly", () => {
    test("should format Date object to time string", () => {
      const date = new Date("2025-06-15T08:30:00");
      const result = formatTimeOnly(date);
      expect(result).toBe("08:30");
    });

    test("should format date string to time string", () => {
      const dateString = "2025-06-15T17:45:00";
      const result = formatTimeOnly(dateString);
      expect(result).toBe("17:45");
    });

    test("should return empty string for null/undefined", () => {
      expect(formatTimeOnly(null)).toBe("");
      expect(formatTimeOnly(undefined)).toBe("");
    });

    test("should handle invalid dates gracefully", () => {
      const result = formatTimeOnly("invalid-date");
      expect(result).toBe("");
    });
  });

  describe("combineOriginalDateWithNewTime", () => {
    test("should combine date with new time", () => {
      const originalDate = new Date("2025-06-15T08:30:00");
      const newTime = "17:00";
      const result = combineOriginalDateWithNewTime(originalDate, newTime);

      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(15);
      expect(result?.getMonth()).toBe(5); // June = 5 (0-indexed)
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getHours()).toBe(17);
      expect(result?.getMinutes()).toBe(0);
    });

    test("should handle string date input", () => {
      const originalDate = "2025-06-15T08:30:00";
      const newTime = "09:15";
      const result = combineOriginalDateWithNewTime(originalDate, newTime);

      expect(result).not.toBeNull();
      expect(result?.getHours()).toBe(9);
      expect(result?.getMinutes()).toBe(15);
    });

    test("should return null for invalid inputs", () => {
      expect(combineOriginalDateWithNewTime(null, "08:30")).toBeNull();
      expect(combineOriginalDateWithNewTime(new Date(), null)).toBeNull();
      expect(
        combineOriginalDateWithNewTime(new Date(), "invalid-time"),
      ).toBeNull();
    });

    test("should validate time ranges", () => {
      const date = new Date("2025-06-15T08:30:00");

      expect(combineOriginalDateWithNewTime(date, "25:00")).toBeNull(); // Invalid hour
      expect(combineOriginalDateWithNewTime(date, "12:60")).toBeNull(); // Invalid minute
      expect(combineOriginalDateWithNewTime(date, "-1:30")).toBeNull(); // Negative hour
    });
  });

  describe("isValidTime", () => {
    test("should validate correct time formats", () => {
      expect(isValidTime("08:30")).toBe(true);
      expect(isValidTime("00:00")).toBe(true);
      expect(isValidTime("23:59")).toBe(true);
    });

    test("should reject invalid time formats", () => {
      expect(isValidTime("25:30")).toBe(false);
      expect(isValidTime("12:60")).toBe(false);
      expect(isValidTime("invalid")).toBe(false);
      expect(isValidTime(null)).toBe(false);
      expect(isValidTime(undefined)).toBe(false);
      expect(isValidTime("8:30")).toBe(false); // Missing leading zero
    });
  });

  describe("formatForDateTimeLocal", () => {
    test("should format Date for datetime-local input", () => {
      const date = new Date("2025-06-15T08:30:00");
      const result = formatForDateTimeLocal(date);
      expect(result).toBe("2025-06-15T08:30");
    });

    test("should handle string input", () => {
      const dateString = "2025-12-25T17:45:00";
      const result = formatForDateTimeLocal(dateString);
      expect(result).toBe("2025-12-25T17:45");
    });

    test("should return empty string for invalid inputs", () => {
      expect(formatForDateTimeLocal(null)).toBe("");
      expect(formatForDateTimeLocal("invalid")).toBe("");
    });
  });

  describe("parseDateTimeLocal", () => {
    test("should parse datetime-local string to Date", () => {
      const result = parseDateTimeLocal("2025-06-15T08:30");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(5); // June = 5
      expect(result?.getDate()).toBe(15);
      expect(result?.getHours()).toBe(8);
      expect(result?.getMinutes()).toBe(30);
    });

    test("should return null for invalid inputs", () => {
      expect(parseDateTimeLocal(null)).toBeNull();
      expect(parseDateTimeLocal("invalid")).toBeNull();
      expect(parseDateTimeLocal("")).toBeNull();
    });
  });

  describe("createTimeChangeSummary", () => {
    test("should create summary of time changes", () => {
      const originalDate = new Date("2025-06-15T08:30:00");
      const newTime = "17:00";
      const summary = createTimeChangeSummary(originalDate, newTime);

      expect(summary.originalTime).toBe("08:30");
      expect(summary.newTime).toBe("17:00");
      expect(summary.isChanged).toBe(true);
      expect(summary.isValid).toBe(true);
      expect(summary.combinedDate).not.toBeNull();
    });

    test("should detect no changes", () => {
      const originalDate = new Date("2025-06-15T08:30:00");
      const newTime = "08:30";
      const summary = createTimeChangeSummary(originalDate, newTime);

      expect(summary.isChanged).toBe(false);
      expect(summary.isValid).toBe(true);
    });

    test("should handle invalid inputs", () => {
      const summary = createTimeChangeSummary(null, "invalid-time");
      expect(summary.isValid).toBe(false);
    });
  });
});
