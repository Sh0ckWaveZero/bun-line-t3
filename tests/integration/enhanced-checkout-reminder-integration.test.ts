import { describe, expect, test, beforeEach, mock } from "bun:test";
import { GET, POST } from "@/app/api/cron/enhanced-checkout-reminder/route";
import { NextRequest } from "next/server";

const CRON_SECRET =
  "9475cea14c54b7d6d7ee6e43b907dcaec7c0dd445cef72ada756310cf9d3c494";

// Mock environment
process.env.CRON_SECRET = CRON_SECRET;

// Mock headers function that returns a proper Headers-like object
const mockHeaders = mock(() => ({
  get: mock((key: string) => {
    const mockRequest = (global as any).__mockRequest;
    if (mockRequest?.headers) {
      return mockRequest.headers[key.toLowerCase()] || null;
    }
    return null;
  }),
}));

// Mock Next.js headers
mock.module("next/headers", () => ({
  headers: mockHeaders,
}));

describe("Enhanced Checkout Reminder Integration Tests", () => {
  beforeEach(() => {
    // Reset environment for each test
    process.env.CRON_SECRET = CRON_SECRET;
    // Clear mock request
    (global as any).__mockRequest = null;
  });

  describe("API Authorization", () => {
    test("should return 401 for missing authorization header", async () => {
      (global as any).__mockRequest = { headers: {} };
      const request = new NextRequest(
        "http://localhost/api/cron/enhanced-checkout-reminder",
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    test("should return 401 for invalid authorization token", async () => {
      (global as any).__mockRequest = {
        headers: { authorization: "Bearer invalid-token" },
      };
      const request = new NextRequest(
        "http://localhost/api/cron/enhanced-checkout-reminder",
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    test("should accept valid authorization token", async () => {
      (global as any).__mockRequest = {
        headers: { authorization: `Bearer ${CRON_SECRET}` },
      };
      const request = new NextRequest(
        "http://localhost/api/cron/enhanced-checkout-reminder",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe("Response Structure", () => {
    test("should return proper response structure", async () => {
      (global as any).__mockRequest = {
        headers: { authorization: `Bearer ${CRON_SECRET}` },
      };
      const request = new NextRequest(
        "http://localhost/api/cron/enhanced-checkout-reminder",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      // Basic structure validation - just ensure the response has the expected properties
      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("message");
      expect(data).toHaveProperty("timestamp");
    });

    test("should include UTC time in response", async () => {
      (global as any).__mockRequest = {
        headers: { authorization: `Bearer ${CRON_SECRET}` },
      };
      const request = new NextRequest(
        "http://localhost/api/cron/enhanced-checkout-reminder",
      );
      const response = await GET(request);

      const data = await response.json();

      // Check if response includes UTC time
      if (data.currentUTCTime) {
        const currentUTCTime = new Date(data.currentUTCTime);
        const responseTimestamp = new Date(data.timestamp);

        // Both should be UTC times and within reasonable time difference (few seconds)
        const timeDiff = Math.abs(
          currentUTCTime.getTime() - responseTimestamp.getTime(),
        );
        const secondsDiff = timeDiff / 1000;

        // Should be within 60 seconds of each other (allowing for processing time)
        expect(secondsDiff).toBeLessThan(60);
      } else {
        // If early response or no users case, just check it has a timestamp
        expect(data.timestamp).toBeDefined();
        expect(data.currentTime || data.timestamp).toBeDefined();
      }
    });
  });

  describe("Time-based Logic", () => {
    test("should handle early time detection (before 09:40 UTC)", async () => {
      (global as any).__mockRequest = {
        headers: { authorization: `Bearer ${CRON_SECRET}` },
      };
      const request = new NextRequest(
        "http://localhost/api/cron/enhanced-checkout-reminder",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toEqual(expect.any(String));
      expect(data.timestamp).toEqual(expect.any(String));

      // The response should either be "too early" message or have statistics
      if (
        data.message &&
        typeof data.message === "string" &&
        data.message.includes("Too early")
      ) {
        expect(data.message).toContain("before 09:40 UTC");
        expect(data.currentTime).toBeDefined();
      } else if (
        data.message &&
        data.message.includes("No users need checkout reminders")
      ) {
        // No users case is also valid
        expect(data.message).toContain("No users need checkout reminders");
        expect(data.timestamp).toBeDefined();
      } else {
        // User processing case
        expect(data.statistics).toBeDefined();
        expect(data.currentUTCTime).toBeDefined();
      }
    });
  });

  describe("User Processing", () => {
    test("should process users correctly", async () => {
      (global as any).__mockRequest = {
        headers: { authorization: `Bearer ${CRON_SECRET}` },
      };
      const request = new NextRequest(
        "http://localhost/api/cron/enhanced-checkout-reminder",
      );
      const response = await GET(request);

      const data = await response.json();

      if (data && data.statistics && data.statistics.total > 0) {
        // If there are users to process
        expect(data.results).toHaveLength(data.statistics.total);

        // Each result should have proper structure
        data.results.forEach((result: any) => {
          expect(result).toMatchObject({
            userId: expect.any(String),
            status: expect.stringMatching(/^(sent|scheduled|failed|skipped)$/),
          });

          if (result.status === "sent") {
            expect(result.reminderType).toMatch(/^(10min|final)$/);
            expect(result.remindersSent).toMatch(/^[12]\/2$/);
          }

          if (result.status === "scheduled") {
            expect(result.nextReminderTime).toBeDefined();
            expect(result.remindersSent).toMatch(/^[01]\/2$/);
          }

          if (result.status === "skipped") {
            expect(result.reason).toBeDefined();
          }

          if (result.status === "failed") {
            expect(result.error).toBeDefined();
          }
        });
      }
    });
  });

  describe("Performance", () => {
    test("should respond within reasonable time", async () => {
      const startTime = Date.now();

      (global as any).__mockRequest = {
        headers: { authorization: `Bearer ${CRON_SECRET}` },
      };
      const request = new NextRequest(
        "http://localhost/api/cron/enhanced-checkout-reminder",
      );
      const response = await GET(request);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(10000); // Should respond within 10 seconds
    });
  });

  describe("Error Resilience", () => {
    test("should handle malformed requests gracefully", async () => {
      const response = await POST();

      expect(response.status).toBe(405); // Method Not Allowed
      const data = await response.json();
      expect(data.error).toBe("Method not allowed");
    });

    test("should provide helpful error messages", async () => {
      (global as any).__mockRequest = { headers: {} };
      const request = new NextRequest(
        "http://localhost/api/cron/enhanced-checkout-reminder",
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeTruthy();
      expect(typeof data.error).toBe("string");
    });
  });
});
