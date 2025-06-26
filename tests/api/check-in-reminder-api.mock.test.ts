import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GET } from "../../src/app/api/cron/check-in-reminder/route";
import type { NextRequest } from "next/server";

// --- Mocks ---

// Mock next/headers to prevent error during unit test
const cronSecret = process.env.CRON_SECRET || "test-secret";
const mockHeaders = new Headers();
mockHeaders.set("Authorization", `Bearer ${cronSecret}`);
mock.module("next/headers", () => ({
  headers: () => mockHeaders,
}));

// Mock RateLimiter as it also uses headers
mock.module("@/lib/utils/rate-limiter", () => ({
  RateLimiter: {
    checkCronRateLimit: async () => null,
  },
}));

let pushMessageCallCount = 0;
const sendPushMessageSpy = async (lineId: string, messages: any[]) => {
  pushMessageCallCount++;
  return Promise.resolve();
};

mock.module("@/lib/utils/line-push", () => ({
  sendPushMessage: sendPushMessageSpy,
}));

mock.module("@/features/attendance/services/holidays", () => ({
  holidayService: {
    isPublicHoliday: async () => false,
    getHolidayInfo: async () => null,
  },
}));

const mockAttendanceService = {
  getCurrentBangkokTime: () => {
    const mockDate = new Date();
    mockDate.setUTCHours(1, 0, 0, 0); // 8 AM Bangkok
    return mockDate;
  },
  isWorkingDay: async () => true,
  getActiveLineUserIdsForCheckinReminder: async () => ["test-user-1", "test-user-2"],
};

mock.module("@/features/attendance/services/attendance", () => ({
  attendanceService: mockAttendanceService,
}));

// --- Test ---

describe("Unit Test: API Route /api/cron/check-in-reminder", () => {
  beforeEach(() => {
    pushMessageCallCount = 0;
  });

  it("should send reminders to active users on a working day", async () => {
    // The actual request object can be simple, as we mock the header logic
    const request = new Request("http://localhost/api/cron/check-in-reminder");

    const response = await GET(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("Check-in reminder push sent successfully");
    expect(data.sentUserCount).toBe(2);
    expect(data.failedUserCount).toBe(0);
    expect(pushMessageCallCount).toBe(2);
  });
});