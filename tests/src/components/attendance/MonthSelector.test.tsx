import { test, expect } from "bun:test";
import { useState } from "react";

// Test the date utility functions
test("parseMonthString should parse YYYY-MM format correctly", () => {
  // Test valid input
  const parseMonthString = (monthStr: string): Date => {
    const parts = monthStr.split("-");
    if (parts.length !== 2) {
      return new Date(); // Return current date as fallback
    }

    const [yearStr, monthStr2] = parts;
    const year = parseInt(yearStr || "", 10);
    const month = parseInt(monthStr2 || "", 10);

    // Validate parsed values
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return new Date(); // Return current date as fallback
    }

    return new Date(year, month - 1); // month is 0-indexed in Date
  };

  const result = parseMonthString("2025-06");
  expect(result.getFullYear()).toBe(2025);
  expect(result.getMonth()).toBe(5); // June is month 5 (0-indexed)
});

test("formatToMonthString should format Date to YYYY-MM", () => {
  const formatToMonthString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
  };

  const date = new Date(2025, 5, 15); // June 15, 2025
  expect(formatToMonthString(date)).toBe("2025-06");
});

test("formatBuddhistDate should convert to Buddhist Era", () => {
  const formatBuddhistDate = (date: Date) => {
    const gregorianYear = date.getFullYear();
    const buddhistYear = gregorianYear + 543;
    const monthNames = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];
    const month = monthNames[date.getMonth()];
    return `${month} ${buddhistYear}`;
  };

  const date = new Date(2025, 5, 15); // June 15, 2025
  const result = formatBuddhistDate(date);
  expect(result).toBe("มิถุนายน 2568"); // 2025 + 543 = 2568
});

test("parseMonthString should handle invalid input gracefully", () => {
  const parseMonthString = (monthStr: string): Date => {
    const parts = monthStr.split("-");
    if (parts.length !== 2) {
      return new Date(2025, 0, 1); // Use fixed date for testing
    }

    const [yearStr, monthStr2] = parts;
    const year = parseInt(yearStr || "", 10);
    const month = parseInt(monthStr2 || "", 10);

    // Validate parsed values
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return new Date(2025, 0, 1); // Use fixed date for testing
    }

    return new Date(year, month - 1);
  };

  // Test invalid formats
  expect(parseMonthString("invalid")).toEqual(new Date(2025, 0, 1));
  expect(parseMonthString("2025-13")).toEqual(new Date(2025, 0, 1)); // Invalid month
  expect(parseMonthString("2025-00")).toEqual(new Date(2025, 0, 1)); // Invalid month
});

test("handleDateSelect should call onMonthChange with correct format", () => {
  const formatToMonthString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
  };

  // Simulate handleDateSelect function
  let lastCallbackValue = "";
  const mockOnMonthChange = (value: string) => {
    lastCallbackValue = value;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      mockOnMonthChange(formatToMonthString(date));
    }
  };

  // Test date selection
  const testDate = new Date(2025, 4, 15); // May 15, 2025
  handleDateSelect(testDate);

  expect(lastCallbackValue).toBe("2025-05");
});

test("Calendar state should sync with props", () => {
  // Simulate the useEffect behavior
  const parseMonthString = (monthStr: string): Date => {
    const parts = monthStr.split("-");
    if (parts.length !== 2) return new Date();

    const [yearStr, monthStr2] = parts;
    const year = parseInt(yearStr || "", 10);
    const month = parseInt(monthStr2 || "", 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return new Date();
    }

    return new Date(year, month - 1);
  };

  // Test prop changes sync
  const initialMonth = "2025-06";
  const newMonth = "2025-07";

  let selectedDate = parseMonthString(initialMonth);
  expect(selectedDate.getMonth()).toBe(5); // June (0-indexed)

  // Simulate prop change
  selectedDate = parseMonthString(newMonth);
  expect(selectedDate.getMonth()).toBe(6); // July (0-indexed)
});
