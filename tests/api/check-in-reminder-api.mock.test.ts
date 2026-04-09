import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GET } from "../../src/routes/api/cron/check-in-reminder";

// --- Mocks ---

// Mock RateLimiter as it also uses headers
mock.module("@/lib/utils/rate-limiter", () => ({
  RateLimiter: {
    checkCronRateLimit: async () => null,
  },
}));

let pushMessageCallCount = 0;
mock.module("@/lib/utils/cron-working-day", () => ({
  validateWorkingDay: async () => ({
    isWorkingDay: true,
  }),
}));

mock.module("@/lib/utils/cron-reminder-sender", () => ({
  sendCheckInReminders: async () => {
    pushMessageCallCount += 2;

    return {
      success: true,
      sentCount: 2,
      failedCount: 0,
      messageText: "ทดสอบข้อความแจ้งเตือน",
      totalUsers: 2,
    };
  },
}));

const mockAttendanceService = {
  getCurrentUTCTime: () => {
    const mockDate = new Date();
    mockDate.setUTCHours(1, 0, 0, 0); // 1 AM UTC = 8 AM Bangkok
    return mockDate;
  },
  convertUTCToThaiTime: (utcDate: Date) => {
    return new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
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
    // The actual request object needs authorization header
    const request = new Request("http://localhost/api/cron/check-in-reminder", {
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET || "test-secret"}`,
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("Check-in reminder push sent successfully");
    expect(data.sentUserCount).toBe(2);
    expect(data.failedUserCount).toBe(0);
    expect(pushMessageCallCount).toBe(2);
  });
});
