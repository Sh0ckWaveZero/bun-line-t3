import { describe, expect, test } from "bun:test";
import {
  calculateUserReminderTime,
  calculateUserCompletionTime,
  shouldReceive10MinReminder,
  shouldReceiveFinalReminder,
} from "@/features/attendance/helpers/utils";

describe("Enhanced Checkout Reminder Helpers", () => {
  describe("calculateUserReminderTime", () => {
    test("should calculate 10-minute reminder time before 9-hour completion", () => {
      const checkInTime = new Date("2025-06-30T01:00:00.000Z"); // 08:00 Bangkok
      const reminderTime = calculateUserReminderTime(checkInTime);

      // 9 hours after 01:00 UTC = 10:00 UTC
      // 10 minutes before = 09:50 UTC
      expect(reminderTime.getUTCHours()).toBe(9);
      expect(reminderTime.getUTCMinutes()).toBe(50);
    });

    test("should handle custom offset minutes", () => {
      const checkInTime = new Date("2025-06-30T01:00:00.000Z"); // 08:00 Bangkok
      const reminderTime = calculateUserReminderTime(checkInTime, 15); // 15 minutes before

      // 9 hours after 01:00 UTC = 10:00 UTC
      // 15 minutes before = 09:45 UTC
      expect(reminderTime.getUTCHours()).toBe(9);
      expect(reminderTime.getUTCMinutes()).toBe(45);
    });

    test("should handle early check-in times", () => {
      const checkInTime = new Date("2025-06-30T00:30:00.000Z"); // 07:30 Bangkok
      const reminderTime = calculateUserReminderTime(checkInTime);

      // 9 hours after 00:30 UTC = 09:30 UTC
      // 10 minutes before = 09:20 UTC
      expect(reminderTime.getUTCHours()).toBe(9);
      expect(reminderTime.getUTCMinutes()).toBe(20);
    });

    test("should handle late check-in times", () => {
      const checkInTime = new Date("2025-06-30T03:30:00.000Z"); // 10:30 Bangkok
      const reminderTime = calculateUserReminderTime(checkInTime);

      // 9 hours after 03:30 UTC = 12:30 UTC
      // 10 minutes before = 12:20 UTC
      expect(reminderTime.getUTCHours()).toBe(12);
      expect(reminderTime.getUTCMinutes()).toBe(20);
    });
  });

  describe("calculateUserCompletionTime", () => {
    test("should calculate exact 9-hour completion time", () => {
      const checkInTime = new Date("2025-06-30T01:00:00.000Z"); // 08:00 Bangkok
      const completionTime = calculateUserCompletionTime(checkInTime);

      // 9 hours after 01:00 UTC = 10:00 UTC
      expect(completionTime.getUTCHours()).toBe(10);
      expect(completionTime.getUTCMinutes()).toBe(0);
    });

    test("should handle fractional check-in times", () => {
      const checkInTime = new Date("2025-06-30T01:15:30.500Z"); // 08:15:30.500 Bangkok
      const completionTime = calculateUserCompletionTime(checkInTime);

      // 9 hours after 01:15:30.500 UTC = 10:15:30.500 UTC
      expect(completionTime.getUTCHours()).toBe(10);
      expect(completionTime.getUTCMinutes()).toBe(15);
      expect(completionTime.getUTCSeconds()).toBe(30);
      expect(completionTime.getUTCMilliseconds()).toBe(500);
    });
  });

  describe("shouldReceive10MinReminder", () => {
    test("should return true when current time is within tolerance of reminder time", () => {
      const checkInTime = new Date("2025-06-30T01:00:00.000Z"); // 08:00 Bangkok
      const reminderTime = calculateUserReminderTime(checkInTime); // 09:50 UTC
      const currentTime = new Date(reminderTime.getTime() + 60 * 1000); // +1 minute

      const shouldRemind = shouldReceive10MinReminder(
        checkInTime,
        currentTime,
        2,
      );
      expect(shouldRemind).toBe(true);
    });

    test("should return false when current time is too early", () => {
      const checkInTime = new Date("2025-06-30T01:00:00.000Z"); // 08:00 Bangkok
      const reminderTime = calculateUserReminderTime(checkInTime); // 09:50 UTC
      const currentTime = new Date(reminderTime.getTime() - 5 * 60 * 1000); // -5 minutes

      const shouldRemind = shouldReceive10MinReminder(
        checkInTime,
        currentTime,
        2,
      );
      expect(shouldRemind).toBe(false);
    });

    test("should return false when current time is too late", () => {
      const checkInTime = new Date("2025-06-30T01:00:00.000Z"); // 08:00 Bangkok
      const reminderTime = calculateUserReminderTime(checkInTime); // 09:50 UTC
      const currentTime = new Date(reminderTime.getTime() + 5 * 60 * 1000); // +5 minutes

      const shouldRemind = shouldReceive10MinReminder(
        checkInTime,
        currentTime,
        2,
      );
      expect(shouldRemind).toBe(false);
    });

    test("should handle custom tolerance", () => {
      const checkInTime = new Date("2025-06-30T01:00:00.000Z"); // 08:00 Bangkok
      const reminderTime = calculateUserReminderTime(checkInTime); // 09:50 UTC
      const currentTime = new Date(reminderTime.getTime() + 4 * 60 * 1000); // +4 minutes

      // With tolerance of 2 minutes, should be false
      expect(shouldReceive10MinReminder(checkInTime, currentTime, 2)).toBe(
        false,
      );

      // With tolerance of 5 minutes, should be true
      expect(shouldReceive10MinReminder(checkInTime, currentTime, 5)).toBe(
        true,
      );
    });
  });

  describe("shouldReceiveFinalReminder", () => {
    test("should return true when current time is within tolerance of completion time", () => {
      const checkInTime = new Date("2025-06-30T01:00:00.000Z"); // 08:00 Bangkok
      const completionTime = calculateUserCompletionTime(checkInTime); // 10:00 UTC
      const currentTime = new Date(completionTime.getTime() + 60 * 1000); // +1 minute

      const shouldRemind = shouldReceiveFinalReminder(
        checkInTime,
        currentTime,
        2,
      );
      expect(shouldRemind).toBe(true);
    });

    test("should return false when current time is too early", () => {
      const checkInTime = new Date("2025-06-30T01:00:00.000Z"); // 08:00 Bangkok
      const completionTime = calculateUserCompletionTime(checkInTime); // 10:00 UTC
      const currentTime = new Date(completionTime.getTime() - 5 * 60 * 1000); // -5 minutes

      const shouldRemind = shouldReceiveFinalReminder(
        checkInTime,
        currentTime,
        2,
      );
      expect(shouldRemind).toBe(false);
    });

    test("should return false when current time is too late", () => {
      const checkInTime = new Date("2025-06-30T01:00:00.000Z"); // 08:00 Bangkok
      const completionTime = calculateUserCompletionTime(checkInTime); // 10:00 UTC
      const currentTime = new Date(completionTime.getTime() + 5 * 60 * 1000); // +5 minutes

      const shouldRemind = shouldReceiveFinalReminder(
        checkInTime,
        currentTime,
        2,
      );
      expect(shouldRemind).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    test("should handle midnight crossing", () => {
      const checkInTime = new Date("2025-06-15T16:00:00.000Z"); // Use mid-month to avoid month boundary
      const reminderTime = calculateUserReminderTime(checkInTime);
      const completionTime = calculateUserCompletionTime(checkInTime);

      // 9 hours after 16:00 UTC = 01:00 UTC next day
      // Reminder: 00:50 UTC next day
      expect(reminderTime.getUTCDate()).toBe(checkInTime.getUTCDate() + 1);
      expect(reminderTime.getUTCHours()).toBe(0);
      expect(reminderTime.getUTCMinutes()).toBe(50);

      expect(completionTime.getUTCDate()).toBe(checkInTime.getUTCDate() + 1);
      expect(completionTime.getUTCHours()).toBe(1);
      expect(completionTime.getUTCMinutes()).toBe(0);
    });

    test("should handle year crossing", () => {
      const checkInTime = new Date("2025-12-31T16:00:00.000Z"); // New Year's Eve
      const completionTime = calculateUserCompletionTime(checkInTime);

      // Should cross into next year
      expect(completionTime.getUTCFullYear()).toBe(2026);
      expect(completionTime.getUTCMonth()).toBe(0); // January
      expect(completionTime.getUTCDate()).toBe(1);
      expect(completionTime.getUTCHours()).toBe(1);
    });

    test("should handle precise timing calculations", () => {
      const checkInTime = new Date("2025-06-30T01:00:00.000Z");
      const exactReminderTime = calculateUserReminderTime(checkInTime);

      // Test exact match
      expect(
        shouldReceive10MinReminder(checkInTime, exactReminderTime, 0),
      ).toBe(true);

      // Test 1 millisecond off
      const offByOne = new Date(exactReminderTime.getTime() + 1);
      expect(shouldReceive10MinReminder(checkInTime, offByOne, 0)).toBe(false);
    });
  });

  describe("Real-world Scenarios", () => {
    test("should handle typical office hours", () => {
      // Standard 9 AM check-in
      const checkInTime = new Date("2025-06-30T02:00:00.000Z"); // 09:00 Bangkok
      const reminderTime = calculateUserReminderTime(checkInTime);
      const completionTime = calculateUserCompletionTime(checkInTime);

      // Reminder at 17:50 Bangkok (10:50 UTC)
      expect(reminderTime.getUTCHours()).toBe(10);
      expect(reminderTime.getUTCMinutes()).toBe(50);

      // Completion at 18:00 Bangkok (11:00 UTC)
      expect(completionTime.getUTCHours()).toBe(11);
      expect(completionTime.getUTCMinutes()).toBe(0);
    });

    test("should handle flexible work hours", () => {
      // Late start at 10:30 AM
      const checkInTime = new Date("2025-06-30T03:30:00.000Z"); // 10:30 Bangkok
      const reminderTime = calculateUserReminderTime(checkInTime);
      const completionTime = calculateUserCompletionTime(checkInTime);

      // Reminder at 19:20 Bangkok (12:20 UTC)
      expect(reminderTime.getUTCHours()).toBe(12);
      expect(reminderTime.getUTCMinutes()).toBe(20);

      // Completion at 19:30 Bangkok (12:30 UTC)
      expect(completionTime.getUTCHours()).toBe(12);
      expect(completionTime.getUTCMinutes()).toBe(30);
    });

    test("should handle early bird schedule", () => {
      // Early start at 7:00 AM
      const checkInTime = new Date("2025-06-30T00:00:00.000Z"); // 07:00 Bangkok
      const reminderTime = calculateUserReminderTime(checkInTime);
      const completionTime = calculateUserCompletionTime(checkInTime);

      // Reminder at 15:50 Bangkok (08:50 UTC)
      expect(reminderTime.getUTCHours()).toBe(8);
      expect(reminderTime.getUTCMinutes()).toBe(50);

      // Completion at 16:00 Bangkok (09:00 UTC)
      expect(completionTime.getUTCHours()).toBe(9);
      expect(completionTime.getUTCMinutes()).toBe(0);
    });
  });
});
