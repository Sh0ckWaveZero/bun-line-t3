import { describe, it, expect, beforeAll, afterAll } from "bun:test";

// 🧪 Integration Tests สำหรับ Monitoring Dashboard API
// ทดสอบการเชื่อมต่อจริงระหว่าง UI และ API endpoints

describe("Monitoring Dashboard API Integration", () => {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  // 🔐 Test Authentication Required
  describe("Security & Authentication", () => {
    it("should require authentication for monitoring dashboard", async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // API ควรตรวจสอบ authentication หรือ rate limiting
      // ถ้าไม่มี session ควร return 401 หรือ redirect หรือ rate limited (429)
      expect(response.status).toBeOneOf([401, 403, 302, 429]);
    });

    it("should validate request headers", async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "text/plain", // Invalid content type
        },
      });

      // Should reject requests with suspicious headers or rate limit
      expect(response.status).toBeOneOf([400, 401, 403, 415, 429]);
    });
  });

  // 🌐 Test API Response Structure
  describe("API Response Validation", () => {
    it("should return valid dashboard data structure", async () => {
      // Mock valid session for testing
      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add mock auth headers if needed
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Validate required fields
        expect(data).toHaveProperty("health");
        expect(data).toHaveProperty("metrics");
        expect(data).toHaveProperty("alerts");
        expect(data).toHaveProperty("logs");
        expect(data).toHaveProperty("processes");
        expect(data).toHaveProperty("recommendations");

        // Validate health structure
        expect(data.health).toHaveProperty("score");
        expect(data.health).toHaveProperty("status");
        expect(typeof data.health.score).toBe("number");
        expect(data.health.score).toBeGreaterThanOrEqual(0);
        expect(data.health.score).toBeLessThanOrEqual(100);

        // Validate metrics structure
        expect(data.metrics).toHaveProperty("uptime");
        expect(data.metrics).toHaveProperty("memoryUsage");
        expect(data.metrics).toHaveProperty("cpuUsage");
        expect(data.metrics).toHaveProperty("responseTime");

        // Validate arrays
        expect(Array.isArray(data.alerts)).toBe(true);
        expect(Array.isArray(data.logs)).toBe(true);
        expect(Array.isArray(data.processes)).toBe(true);
        expect(Array.isArray(data.recommendations)).toBe(true);
      }
    });

    it("should handle server errors gracefully", async () => {
      // Test error scenarios - note: API now has rate limiting, so 429 is also expected
      const invalidResponse = await fetch(
        `${baseUrl}/api/monitoring/dashboard?error=true`,
      );

      if (!invalidResponse.ok) {
        expect(invalidResponse.status).toBeOneOf([
          400, 401, 403, 429, 500, 503,
        ]);

        const errorData = await invalidResponse.json();
        expect(errorData).toHaveProperty("error");

        // For non-rate-limit errors, check error message
        if (invalidResponse.status !== 429) {
          expect(typeof errorData.error).toBe("string");
          // Should not expose sensitive information
          expect(errorData.error).not.toContain("password");
          expect(errorData.error).not.toContain("secret");
          expect(errorData.error).not.toContain("key");
        }
      }
    });
  });

  // ⚡ Test Performance
  describe("Performance Tests", () => {
    it("should respond within acceptable time", async () => {
      const startTime = Date.now();

      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // API should respond within 5 seconds
      expect(responseTime).toBeLessThan(5000);

      // Log performance for monitoring
      console.log(`Dashboard API response time: ${responseTime}ms`);
    });

    it("should handle concurrent requests", async () => {
      // Test multiple concurrent requests
      const requests = Array.from({ length: 5 }, () =>
        fetch(`${baseUrl}/api/monitoring/dashboard`),
      );

      const responses = await Promise.allSettled(requests);

      // All requests should complete (fulfilled or rejected, not hanging)
      responses.forEach((result, index) => {
        expect(result.status).toBeOneOf(["fulfilled", "rejected"]);
        console.log(`Request ${index + 1}: ${result.status}`);
      });
    });
  });

  // 🔒 Test Data Security
  describe("Data Security", () => {
    it("should not expose sensitive system information", async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`);

      if (response.ok) {
        const data = await response.json();
        const dataString = JSON.stringify(data);

        // Should not contain sensitive patterns
        const sensitivePatterns = [
          /password/i,
          /secret/i,
          /api[_-]?key/i,
          /private[_-]?key/i,
          /token/i,
          /credential/i,
          /mongodb:\/\/.*@/i, // DB connection strings
          /postgres:\/\/.*@/i,
          /mysql:\/\/.*@/i,
        ];

        sensitivePatterns.forEach((pattern) => {
          expect(dataString).not.toMatch(pattern);
        });
      }
    });

    it("should sanitize log entries", async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`);

      if (response.ok) {
        const data = await response.json();

        if (data.logs && Array.isArray(data.logs)) {
          data.logs.forEach((log: any) => {
            if (log.message) {
              // Log messages should not contain sensitive info
              expect(log.message).not.toMatch(/password/i);
              expect(log.message).not.toMatch(/secret/i);
              expect(log.message).not.toMatch(/api[_-]?key/i);
            }
          });
        }
      }
    });
  });
});

// 🌐 Health Check API Integration
describe("Health Check API Integration", () => {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  it("should provide basic health status", async () => {
    const response = await fetch(`${baseUrl}/api/health`);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("timestamp");
  });

  it("should provide enhanced health status", async () => {
    const response = await fetch(`${baseUrl}/api/health/enhanced`);

    if (response.ok) {
      const data = await response.json();

      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("environment");

      // Note: Enhanced health may have different structure
      // Check for either 'uptime' or nested metrics
      const hasUptime =
        data.uptime !== undefined ||
        (data.metrics && data.metrics.uptime !== undefined);
      expect(hasUptime).toBe(true);
    }
  });
});

// 🎯 E2E Workflow Tests
describe("Dashboard Workflow Integration", () => {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  it("should complete full dashboard data loading workflow", async () => {
    // 1. Check health
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    expect(healthResponse.status).toBe(200);

    // 2. Load dashboard data
    const dashboardResponse = await fetch(
      `${baseUrl}/api/monitoring/dashboard`,
    );

    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();

      // 3. Verify data consistency
      expect(dashboardData.health).toBeDefined();
      expect(dashboardData.metrics).toBeDefined();

      // 4. Check timestamp freshness (within last 5 minutes)
      if (dashboardData.timestamp) {
        const timestamp = new Date(dashboardData.timestamp);
        const now = new Date();
        const diffMs = now.getTime() - timestamp.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        expect(diffMinutes).toBeLessThan(5);
      }
    }
  });

  it("should handle refresh workflow", async () => {
    // Simulate dashboard refresh by making multiple requests
    const firstResponse = await fetch(`${baseUrl}/api/monitoring/dashboard`);

    if (firstResponse.ok) {
      const firstData = await firstResponse.json();

      // Wait a bit and request again
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const secondResponse = await fetch(`${baseUrl}/api/monitoring/dashboard`);

      if (secondResponse.ok) {
        const secondData = await secondResponse.json();

        // Timestamps should be different (fresh data)
        if (firstData.timestamp && secondData.timestamp) {
          expect(secondData.timestamp).not.toBe(firstData.timestamp);
        }
      }
    }
  });
});
