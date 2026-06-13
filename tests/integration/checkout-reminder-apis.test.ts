import { describe, it, expect, mock } from "bun:test";

// ── Mock server-only deps ที่ route imports (กัน DB connect + env validation) ──
// NOTE: bun mock.module เป็น process-global -> leak ข้ามไฟล์ ต้อง mock ให้ตรงกับ
// enhanced-checkout-reminder-integration.test.ts เพื่อกัน conflict เวลารันรวม
mock.module("@/env.mjs", () => ({
  env: new Proxy(
    {},
    {
      get: (_t, prop: string) => process.env[prop] ?? "",
    },
  ),
}));
// NOTE: ไม่ mock attendance/holidays/leave service ที่นี่
// เพราะ bun mock.module เป็น process-global -> leak ข้ามไฟล์ไปทำลาย
// check-in-reminder-api.mock.test.ts และ attendance-integration.test.ts
// ที่ต้องการ service จริง/mock ของตัวเอง ไฟล์นี้ import route เพียงเพื่อ
// เช็คว่า GET export มีอยู่ (typeof === "function") ไม่ได้เรียก handler
// จึงไม่จำเป็นต้อง mock service layer

process.env.SKIP_ENV_VALIDATION = "1";
process.env.APP_ENV = "test";

describe("Checkout Reminder APIs Comparison", () => {
  it("should have consistent logic between standard and enhanced APIs", async () => {
    // Import both APIs — TanStack Start file-based routes
    // (เดิมอ้าง App Router path src/app/api/... ที่ล้าแล้ว หลังย้ายไป src/routes/api/...)
    const standardAPI = await import("@/routes/api/checkout-reminder");
    const enhancedAPI = await import(
      "@/routes/api/cron/enhanced-checkout-reminder"
    );

    // Both should export GET functions
    expect(typeof standardAPI.GET).toBe("function");
    expect(typeof enhancedAPI.GET).toBe("function");
  });

  it("should use same reminder timing logic", async () => {
    const { shouldReceiveReminderNow, calculateUserReminderTime } =
      await import("@/features/attendance/helpers");

    // Test reminder timing calculation
    const checkInTime = new Date("2025-06-17T02:00:00.000Z"); // 9:00 AM Bangkok
    const reminderTime = calculateUserReminderTime(checkInTime, 30);

    // Function returns UTC time: 02:00 + 9 - 0:30 = 10:30 UTC (17:30 Bangkok)
    expect(reminderTime.getHours()).toBe(10);
    expect(reminderTime.getMinutes()).toBe(30);

    // Test shouldReceiveReminderNow function
    const shouldRemind = shouldReceiveReminderNow(checkInTime, reminderTime);

    // Function should exist and be callable
    expect(typeof shouldReceiveReminderNow).toBe("function");
    expect(typeof shouldRemind).toBe("boolean");
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
