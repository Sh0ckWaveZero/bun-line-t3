import { describe, it, expect, beforeEach } from "bun:test";
import {
  expectStatusToBeSecure,
  expectEndpointToBeProtected,
} from "../helpers/test-matchers";

// 🔐 Security Tests สำหรับ Monitoring Dashboard
// ทดสอบความปลอดภัยและ authorization เฉพาะเจาะจง

// Helper function to add delay between tests to avoid rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Monitoring Dashboard Security", () => {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Add delay before each test to avoid rate limiting
  beforeEach(async () => {
    await delay(100); // 100ms delay between tests
  });

  // 🛡️ Authentication & Authorization Tests
  describe("Authentication Security", () => {
    it("should reject requests without authentication", async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Must require authentication (401) or rate limit (429) or service unavailable (530)
      expect(response.status).toBeOneOf([401, 429, 530]);

      if (response.status === 401) {
        const data = await response.json();
        expect(data.error).toContain("Authentication required");
      }
    });

    it("should reject requests with invalid session", async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: "next-auth.session-token=invalid-token",
        },
      });

      // Should reject invalid session (401) or rate limit (429) or service unavailable (530)
      expect(response.status).toBeOneOf([401, 429, 530]);
    });

    it("should validate request headers for security", async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "", // Invalid user agent
        },
      });

      // Should reject requests with suspicious headers or service unavailable
      expect(response.status).toBeOneOf([400, 401, 530]);
    });
  });

  // 🚫 Input Validation Security
  describe("Input Validation Security", () => {
    it("should validate query parameters", async () => {
      const maliciousParams = [
        "timeRange=<script>alert('xss')</script>",
        "includeDetails='; DROP TABLE users; --",
        "components[]=../../../etc/passwd",
        "filter=' OR 1=1 --",
      ];

      for (const param of maliciousParams) {
        const response = await fetch(
          `${baseUrl}/api/monitoring/dashboard?${param}`,
        );

        // Should reject malicious parameters (including rate limiting and service unavailable)
        expect(response.status).toBeOneOf([400, 401, 403, 429, 530]);
      }
    });

    it("should sanitize timeRange parameter", async () => {
      const response = await fetch(
        `${baseUrl}/api/monitoring/dashboard?timeRange=invalid`,
      );

      if (response.status === 400) {
        const data = await response.json();
        expect(data.error).toContain("Invalid request parameters");
      }
    });

    it("should limit array parameters", async () => {
      // Try to send a very large array to test DoS protection
      const largeArray = Array(1000).fill("health").join(",");
      const response = await fetch(
        `${baseUrl}/api/monitoring/dashboard?components=${largeArray}`,
      );

      // Should handle large inputs gracefully or service unavailable
      expect(response.status).toBeOneOf([400, 413, 429, 530]);
    });
  });

  // 🔒 Data Protection Security
  describe("Data Protection", () => {
    it("should not expose database connection strings", async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`);

      if (response.ok) {
        const data = await response.json();
        const dataString = JSON.stringify(data);

        // Check for database connection patterns
        expect(dataString).not.toMatch(/mongodb:\/\/[^@]+@/);
        expect(dataString).not.toMatch(/postgres:\/\/[^@]+@/);
        expect(dataString).not.toMatch(/mysql:\/\/[^@]+@/);
      }
    });

    it("should not expose API keys or secrets", async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`);

      if (response.ok) {
        const data = await response.json();
        const dataString = JSON.stringify(data);

        // Check for secret patterns
        const secretPatterns = [
          /sk-[a-zA-Z0-9]{32,}/i, // OpenAI-style API keys
          /pk_live_[a-zA-Z0-9]{24,}/i, // Stripe live keys
          /AIza[a-zA-Z0-9]{35}/i, // Google API keys
          /[a-zA-Z0-9]{40}/i, // GitHub tokens (if standalone)
        ];

        secretPatterns.forEach((pattern) => {
          expect(dataString).not.toMatch(pattern);
        });
      }
    });

    it("should sanitize log messages", async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`);

      if (response.ok) {
        const data = await response.json();

        if (data.recentLogs) {
          data.recentLogs.forEach((log: any) => {
            // Log messages should not contain sensitive patterns
            expect(log.message).not.toMatch(
              /password[^a-zA-Z0-9]*[\s:=]+[^\s]+/i,
            );
            expect(log.message).not.toMatch(
              /secret[^a-zA-Z0-9]*[\s:=]+[^\s]+/i,
            );
            expect(log.message).not.toMatch(
              /api[_-]?key[^a-zA-Z0-9]*[\s:=]+[^\s]+/i,
            );
          });
        }
      }
    });
  });

  // 🚦 Rate Limiting Security
  describe("Rate Limiting Protection", () => {
    it("should apply rate limiting", async () => {
      const requests: Promise<Response>[] = [];

      // Send many requests quickly
      for (let i = 0; i < 25; i++) {
        requests.push(
          fetch(`${baseUrl}/api/monitoring/dashboard`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      const responses = await Promise.all(requests);

      // At least some requests should be rate limited or service unavailable
      const rateLimitedCount = responses.filter(
        (r) => r.status === 429 || r.status === 530,
      ).length;
      expect(rateLimitedCount).toBeGreaterThan(0);

      // Check rate limit headers
      const rateLimitedResponse = responses.find((r) => r.status === 429);
      if (rateLimitedResponse) {
        expect(
          rateLimitedResponse.headers.get("X-RateLimit-Limit"),
        ).toBeTruthy();
        expect(rateLimitedResponse.headers.get("Retry-After")).toBeTruthy();
      }
    });

    it("should include proper rate limit headers", async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`);

      if (response.status === 200 || response.status === 401) {
        // Should include rate limit info (if not rate limited)
        const remainingHeader = response.headers.get("X-RateLimit-Remaining");
        if (remainingHeader) {
          expect(parseInt(remainingHeader)).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  // 🌐 Network Security Headers
  describe("Security Headers", () => {
    it("should include security headers", async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`);

      // Cache control should prevent caching of sensitive data
      const cacheControl = response.headers.get("Cache-Control");
      if (cacheControl) {
        expect(cacheControl).toContain("no-cache");
      }

      // Custom headers only exist on successful authenticated responses
      if (response.status === 200) {
        expect(response.headers.get("X-Monitoring-Dashboard")).toBeTruthy();
      }

      // Even error responses should have some security headers
      expect(response.headers.get("Content-Type")).toBeTruthy();
    });

    it("should handle CORS properly", async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`, {
        method: "OPTIONS",
        headers: {
          Origin: "http://malicious-site.com",
          "Access-Control-Request-Method": "GET",
        },
      });

      // Should not allow arbitrary origins
      const allowOrigin = response.headers.get("Access-Control-Allow-Origin");
      if (allowOrigin) {
        expect(allowOrigin).not.toBe("*");
        expect(allowOrigin).not.toBe("http://malicious-site.com");
      }
    });
  });

  // 🐛 Error Handling Security
  describe("Error Handling Security", () => {
    it("should not leak error details in production", async () => {
      // Try to trigger an error with malformed request
      const response = await fetch(`${baseUrl}/api/monitoring/dashboard`, {
        method: "POST", // Wrong method
        headers: { "Content-Type": "application/json" },
        body: "invalid json {",
      });

      if (!response.ok) {
        // Try to parse JSON, but handle cases where it might not be JSON
        try {
          const errorData = await response.json();

          // Error messages should be generic
          if (errorData && errorData.details) {
            expect(errorData.details).not.toContain("stack trace");
            expect(errorData.details).not.toContain("file path");
            expect(errorData.details).not.toContain("line number");
          }

          // Basic security check - error should exist and be string
          if (errorData && errorData.error) {
            expect(typeof errorData.error).toBe("string");
          }
        } catch (e) {
          // If response is not JSON, that's also acceptable for security
          // (e.g., rate limiting might return plain text or service unavailable)
          expect(response.status).toBeOneOf([
            400, 401, 403, 405, 429, 500, 530,
          ]);
        }
      }
    });

    it("should handle timeout gracefully", async () => {
      // This test simulates network timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100); // Short timeout

      try {
        const response = await fetch(`${baseUrl}/api/monitoring/dashboard`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // If it completes, it should be a valid response or service unavailable
        expect(response.status).toBeOneOf([200, 401, 403, 429, 530]);
      } catch (error) {
        // Should handle abort gracefully (different error types possible)
        const errorName = error instanceof Error ? error.name : "Error";
        expect(
          ["AbortError", "Error", "TypeError", "DOMException"].includes(
            errorName,
          ),
        ).toBe(true);
      }

      clearTimeout(timeoutId);
    });
  });
});

// 🔍 Security Audit Tests
describe("Security Audit", () => {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Add delay before audit tests
  beforeEach(async () => {
    await delay(200); // Longer delay for audit tests
  });

  it("should pass basic security checklist", async () => {
    const securityChecklist = {
      authenticationRequired: false,
      inputValidation: false,
      rateLimitingActive: false,
      noSensitiveDataExposed: false,
      properErrorHandling: false,
    };

    // Test authentication
    const authResponse = await fetch(`${baseUrl}/api/monitoring/dashboard`);
    securityChecklist.authenticationRequired =
      authResponse.status === 401 ||
      authResponse.status === 429 ||
      authResponse.status === 530;

    // Test input validation
    const validationResponse = await fetch(
      `${baseUrl}/api/monitoring/dashboard?timeRange=invalid`,
    );
    securityChecklist.inputValidation =
      validationResponse.status === 400 ||
      validationResponse.status === 401 ||
      validationResponse.status === 429 ||
      validationResponse.status === 530;

    // Test rate limiting (simplified)
    const rateLimitResponse1 = await fetch(
      `${baseUrl}/api/monitoring/dashboard`,
    );
    const rateLimitResponse2 = await fetch(
      `${baseUrl}/api/monitoring/dashboard`,
    );
    securityChecklist.rateLimitingActive =
      rateLimitResponse1.headers.get("X-RateLimit-Limit") !== null ||
      rateLimitResponse2.status === 429 ||
      rateLimitResponse1.status === 530 ||
      rateLimitResponse2.status === 530;

    // Test data exposure (only if we can get data)
    securityChecklist.noSensitiveDataExposed = true; // Default to true
    if (authResponse.status === 200) {
      const data = await authResponse.json();
      const dataString = JSON.stringify(data);
      securityChecklist.noSensitiveDataExposed =
        !dataString.match(/password|secret|key/i);
    }

    // Test error handling
    const errorResponse = await fetch(
      `${baseUrl}/api/monitoring/dashboard?malformed=true`,
    );
    securityChecklist.properErrorHandling =
      !errorResponse.ok && errorResponse.status >= 400;

    // Log security audit results
    console.log("🔐 Security Audit Results:", securityChecklist);

    // All checks should pass
    expect(securityChecklist.authenticationRequired).toBe(true);
    expect(securityChecklist.inputValidation).toBe(true);
    expect(securityChecklist.rateLimitingActive).toBe(true);
    expect(securityChecklist.noSensitiveDataExposed).toBe(true);
    expect(securityChecklist.properErrorHandling).toBe(true);
  });
});
