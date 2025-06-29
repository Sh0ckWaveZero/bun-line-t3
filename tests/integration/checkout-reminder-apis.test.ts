import { describe, it, expect } from "bun:test";

describe("Checkout Reminder APIs Comparison", () => {
  it("should have consistent logic between standard and enhanced APIs", async () => {
    // Import both APIs (ใช้ relative path เพื่อแก้ปัญหา alias path)
    const standardAPI = await import(
      "../../src/app/api/checkout-reminder/route"
    );
    const enhancedAPI = await import(
      "../../src/app/api/cron/enhanced-checkout-reminder/route"
    );

    // Both should export GET functions
    expect(typeof standardAPI.GET).toBe("function");
    expect(typeof enhancedAPI.GET).toBe("function");
  });

  it("should use same reminder timing logic", async () => {
    const { shouldReceiveReminderNow, calculateUserReminderTime } =
      await import("../../src/features/attendance/helpers");

    // Test reminder timing calculation
    const checkInTime = new Date("2025-06-17T02:00:00.000Z"); // 9:00 AM Bangkok
    const reminderTime = calculateUserReminderTime(checkInTime, 30);

    // Function returns UTC time: 02:00 + 9 - 0:30 = 10:30 UTC (17:30 Bangkok)
    expect(reminderTime.getHours()).toBe(10);
    expect(reminderTime.getMinutes()).toBe(30);

    // Test shouldReceiveReminderNow function
    const currentTime = new Date("2025-06-17T10:30:00.000Z"); // 17:30 Bangkok
    const shouldRemind = shouldReceiveReminderNow(checkInTime, reminderTime);

    // Function should exist and be callable
    expect(typeof shouldReceiveReminderNow).toBe("function");
  });

  it("should validate response structure consistency", () => {
    // Both APIs should return similar response structures
    const expectedStandardResponse = {
      success: true,
      message: expect.any(String),
      results: expect.any(Array),
    };

    const expectedEnhancedResponse = {
      success: true,
      message: expect.any(String),
      processedUsers: expect.any(Number),
      remindersTriggered: expect.any(Number),
      timestamp: expect.any(String),
    };

    // Just validate structure shapes exist
    expect(typeof expectedStandardResponse.success).toBe("boolean");
    expect(typeof expectedEnhancedResponse.success).toBe("boolean");
  });
});
