/**
 * 🧪 Integration Tests for URL Security System
 * การทดสอบรวมสำหรับระบบความปลอดภัย URL
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  validateNextAuthUrl,
  getSafeRedirectUrl,
} from "../../src/lib/security/url-validator";

// ✅ Set up test environment with example domains
beforeAll(() => {
  process.env.ALLOWED_DOMAINS = "your-app.example.com,example.com";
});

afterAll(() => {
  delete process.env.ALLOWED_DOMAINS;
});

describe("🔒 URL Security Integration Tests", () => {
  describe("🌐 LINE OAuth Debug API Integration", () => {
    test("✅ should return secure configuration", async () => {
      // Mock environment for testing
      const originalEnv = process.env.NEXTAUTH_URL;
      process.env.NEXTAUTH_URL = "https://your-app.example.com";

      try {
        // Test the URL validation logic similar to the API
        const nextAuthUrl = process.env.NEXTAUTH_URL;
        const validation = validateNextAuthUrl(nextAuthUrl);

        expect(validation.isValid).toBe(true);
        expect(validation.isProduction).toBe(true);
        expect(validation.hostname).toBe("your-app.example.com");

        // Test callback URL construction
        const callbackUrl = `${nextAuthUrl}/api/auth/callback/line`;
        const callbackValidation = validateNextAuthUrl(callbackUrl);

        expect(callbackValidation.isValid).toBe(true);
      } finally {
        // Restore original environment
        if (originalEnv) {
          process.env.NEXTAUTH_URL = originalEnv;
        } else {
          delete process.env.NEXTAUTH_URL;
        }
      }
    });

    test("🚨 should handle malicious environment configuration", () => {
      const originalEnv = process.env.NEXTAUTH_URL;
      process.env.NEXTAUTH_URL = "https://evil.com";

      try {
        const nextAuthUrl = process.env.NEXTAUTH_URL;
        const validation = validateNextAuthUrl(nextAuthUrl);

        expect(validation.isValid).toBe(false);
        expect(validation.error).toContain("not in the allowed list");

        // Test safe fallback
        const safeUrl = getSafeRedirectUrl(
          nextAuthUrl,
          "https://your-app.example.com",
        );
        expect(safeUrl).toBe("https://your-app.example.com");
      } finally {
        if (originalEnv) {
          process.env.NEXTAUTH_URL = originalEnv;
        } else {
          delete process.env.NEXTAUTH_URL;
        }
      }
    });
  });

  describe("🔐 NextAuth Configuration Integration", () => {
    test("✅ should validate development configuration", () => {
      const devConfig = {
        NEXTAUTH_URL: "http://localhost:3000",
        callbackUrl: "http://localhost:3000/api/auth/callback/line",
      };

      const urlValidation = validateNextAuthUrl(devConfig.NEXTAUTH_URL);
      const callbackValidation = validateNextAuthUrl(devConfig.callbackUrl);

      expect(urlValidation.isValid).toBe(true);
      expect(urlValidation.isDevelopment).toBe(true);
      expect(callbackValidation.isValid).toBe(true);
    });

    test("✅ should validate production configuration", () => {
      const prodConfig = {
        NEXTAUTH_URL: "https://your-app.example.com",
        callbackUrl: "https://your-app.example.com/api/auth/callback/line",
      };

      const urlValidation = validateNextAuthUrl(prodConfig.NEXTAUTH_URL);
      const callbackValidation = validateNextAuthUrl(prodConfig.callbackUrl);

      expect(urlValidation.isValid).toBe(true);
      expect(urlValidation.isProduction).toBe(true);
      expect(callbackValidation.isValid).toBe(true);
    });

    test("🚨 should reject malicious redirect attempts", () => {
      const maliciousUrls = [
        "https://evil.com/phish",
        'javascript:alert("XSS")',
        "data:text/html,<script>alert(1)</script>",
        "//evil.com/steal-tokens",
        "https://fake-example.com/login",
      ];

      maliciousUrls.forEach((url) => {
        const safeUrl = getSafeRedirectUrl(url, "/dashboard");
        expect(safeUrl).toBe("/dashboard");
        expect(safeUrl).not.toBe(url);
      });
    });
  });

  describe("🛡️ Real-world Attack Scenarios", () => {
    test("should prevent OAuth redirect hijacking", () => {
      // Simulate OAuth callback with malicious redirect
      const attackScenarios = [
        {
          name: "Open Redirect Attack",
          callbackUrl: "https://evil.com/steal-oauth-tokens",
          expected: "/dashboard",
        },
        {
          name: "Subdomain Hijacking",
          callbackUrl: "https://fake.your-app.example.com",
          expected: "/dashboard",
        },
        {
          name: "Protocol Injection",
          callbackUrl: 'javascript:document.location="https://evil.com"',
          expected: "/dashboard",
        },
        {
          name: "Host Header Injection",
          callbackUrl: "https://example.com.evil.com/callback",
          expected: "/dashboard",
        },
      ];

      attackScenarios.forEach((scenario) => {
        const safeUrl = getSafeRedirectUrl(
          scenario.callbackUrl,
          scenario.expected,
        );
        expect(safeUrl).toBe(scenario.expected);
        console.log(`✅ Blocked ${scenario.name}: ${scenario.callbackUrl}`);
      });
    });

    test("should prevent CSRF via malicious origins", () => {
      const maliciousOrigins = [
        "https://evil-phishing-site.com",
        "https://fake-line-login.com",
        "https://midseelee-com.hacker.com",
      ];

      maliciousOrigins.forEach((origin) => {
        const validation = validateNextAuthUrl(origin);
        expect(validation.isValid).toBe(false);
        console.log(`✅ Blocked malicious origin: ${origin}`);
      });
    });

    test("should handle edge cases gracefully", () => {
      const edgeCases = [
        "",
        null,
        undefined,
        "not-a-url",
        "ftp://invalid-protocol.com",
        "//protocol-relative-url.com",
      ];

      edgeCases.forEach((testCase) => {
        const safeUrl = getSafeRedirectUrl(testCase as string, "/safe");
        expect(safeUrl).toBe("/safe");
        console.log(`✅ Handled edge case: ${testCase}`);
      });
    });
  });

  describe("🔧 Performance and Reliability", () => {
    test("should validate URLs quickly", () => {
      const start = performance.now();

      // Test 1000 URL validations
      for (let i = 0; i < 1000; i++) {
        validateNextAuthUrl("https://your-app.example.com");
      }

      const end = performance.now();
      const duration = end - start;

      // Should complete within reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
      console.log(`✅ 1000 validations completed in ${duration.toFixed(2)}ms`);
    });

    test("should handle concurrent validations", async () => {
      const urls = [
        "https://your-app.example.com",
        "http://localhost:3000",
        "https://evil.com",
        "javascript:alert(1)",
        "https://example.com",
      ];

      const promises = urls.map((url) =>
        Promise.resolve(validateNextAuthUrl(url)),
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(results[0]?.isValid).toBe(true); // your-app.example.com
      expect(results[1]?.isValid).toBe(true); // localhost
      expect(results[2]?.isValid).toBe(false); // evil.com
      expect(results[3]?.isValid).toBe(false); // javascript:
      expect(results[4]?.isValid).toBe(true); // example.com

      console.log("✅ Concurrent validation completed successfully");
    });
  });

  describe("📊 Security Monitoring", () => {
    test("should log security events", () => {
      const securityEvents: string[] = [];

      // Mock console.warn to capture security logs
      const originalWarn = console.warn;
      console.warn = (message: string) => {
        securityEvents.push(message);
      };

      try {
        // Trigger security events
        getSafeRedirectUrl("https://evil.com", "/safe");
        getSafeRedirectUrl("javascript:alert(1)", "/safe");

        expect(securityEvents.length).toBeGreaterThan(0);
        expect(
          securityEvents.some((event) => event.includes("🚨 Security:")),
        ).toBe(true);
      } finally {
        console.warn = originalWarn;
      }
    });
  });
});

describe("🔍 Environment-Specific Behavior", () => {
  test("should behave correctly in development", () => {
    const devUrls = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:4325",
    ];

    devUrls.forEach((url) => {
      const validation = validateNextAuthUrl(url);
      expect(validation.isValid).toBe(true);
      expect(validation.isDevelopment).toBe(true);
      expect(validation.isProduction).toBe(false);
    });
  });

  test("should behave correctly in production", () => {
    const prodUrls = [
      "https://your-app.example.com",
      "https://example.com",
      "https://api.example.com",
    ];

    prodUrls.forEach((url) => {
      const validation = validateNextAuthUrl(url);
      expect(validation.isValid).toBe(true);
      expect(validation.isDevelopment).toBe(false);
      expect(validation.isProduction).toBe(true);
    });
  });
});
