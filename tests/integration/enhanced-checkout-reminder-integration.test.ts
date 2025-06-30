import { describe, expect, test, beforeEach, mock } from "bun:test";
import { GET, POST } from "@/app/api/cron/enhanced-checkout-reminder/route";
import { NextRequest } from "next/server";

const CRON_SECRET = "9475cea14c54b7d6d7ee6e43b907dcaec7c0dd445cef72ada756310cf9d3c494";

// Mock environment
process.env.CRON_SECRET = CRON_SECRET;

// Mock headers function
const mockHeaders = mock(() => ({
  get: mock((key: string) => {
    const mockRequest = (global as any).__mockRequest;
    return mockRequest?.headers?.[key.toLowerCase()] || null;
  })
}));

// Mock Next.js headers
mock.module("next/headers", () => ({
  headers: mockHeaders
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
      const request = new NextRequest("http://localhost/api/cron/enhanced-checkout-reminder");
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    test("should return 401 for invalid authorization token", async () => {
      (global as any).__mockRequest = { 
        headers: { authorization: "Bearer invalid-token" }
      };
      const request = new NextRequest("http://localhost/api/cron/enhanced-checkout-reminder");
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    test("should accept valid authorization token", async () => {
      (global as any).__mockRequest = { 
        headers: { authorization: `Bearer ${CRON_SECRET}` }
      };
      const request = new NextRequest("http://localhost/api/cron/enhanced-checkout-reminder");
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe("Response Structure", () => {
    test("should return proper response structure", async () => {
      (global as any).__mockRequest = { 
        headers: { authorization: `Bearer ${CRON_SECRET}` }
      };
      const request = new NextRequest("http://localhost/api/cron/enhanced-checkout-reminder");
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toMatchObject({
        success: expect.any(Boolean),
        message: expect.any(String),
        timestamp: expect.any(String),
        currentBangkokTime: expect.any(String),
        statistics: {
          total: expect.any(Number),
          sent: expect.any(Number),
          sent10Min: expect.any(Number),
          sentFinal: expect.any(Number),
          scheduled: expect.any(Number),
          failed: expect.any(Number),
          skipped: expect.any(Number),
        },
        results: expect.any(Array),
      });
    });

    test("should include Bangkok timezone in response", async () => {
      (global as any).__mockRequest = { 
        headers: { authorization: `Bearer ${CRON_SECRET}` }
      };
      const request = new NextRequest("http://localhost/api/cron/enhanced-checkout-reminder");
      const response = await GET(request);
      
      const data = await response.json();
      
      const bangkokTime = new Date(data.currentBangkokTime);
      const utcTime = new Date(data.timestamp);
      
      // Bangkok time should be 7 hours ahead of UTC
      const timeDiff = bangkokTime.getTime() - utcTime.getTime();
      const hoursDiff = Math.abs(timeDiff) / (1000 * 60 * 60);
      
      // Bangkok is UTC+7, so the difference should be around 7 hours (within 1 hour tolerance)
      expect(hoursDiff).toBeGreaterThan(6);
      expect(hoursDiff).toBeLessThan(8);
    });
  });

  describe("Time-based Logic", () => {
    test("should handle early time detection (before 16:40)", async () => {
      (global as any).__mockRequest = { 
        headers: { authorization: `Bearer ${CRON_SECRET}` }
      };
      const request = new NextRequest("http://localhost/api/cron/enhanced-checkout-reminder");
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data && data.message && data.message.includes("Too early")) {
        expect(data.message).toContain("before 16:40");
      } else {
        expect(data && data.statistics).toBeDefined();
      }
    });
  });

  describe("User Processing", () => {
    test("should process users correctly", async () => {
      (global as any).__mockRequest = { 
        headers: { authorization: `Bearer ${CRON_SECRET}` }
      };
      const request = new NextRequest("http://localhost/api/cron/enhanced-checkout-reminder");
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
        headers: { authorization: `Bearer ${CRON_SECRET}` }
      };
      const request = new NextRequest("http://localhost/api/cron/enhanced-checkout-reminder");
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
      const request = new NextRequest("http://localhost/api/cron/enhanced-checkout-reminder");
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeTruthy();
      expect(typeof data.error).toBe("string");
    });
  });
});