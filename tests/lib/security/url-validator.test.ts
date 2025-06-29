/**
 * ทดสอบระบบป้องกัน malicious redirections และ request forgeries
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  isAllowedHost,
  validateUrl,
  getSafeRedirectUrl,
  sanitizeUrl,
  validateNextAuthUrl,
  isSafeUrl,
} from "../../../src/lib/security/url-validator";

beforeAll(() => {
  process.env.ALLOWED_DOMAINS =
    "localhost,127.0.0.1,your-app.example.com,example.com,api.example.com,test.your-app.example.com";
  process.env.NODE_ENV = "production"; // บังคับให้ทดสอบ production logic จริง
});

afterAll(() => {
  delete process.env.ALLOWED_DOMAINS;
  delete process.env.NODE_ENV;
});

describe("URL Security Validation", () => {
  describe("isAllowedHost", () => {
    test("ควรอนุญาต development hosts", () => {
      expect(isAllowedHost("localhost", "development")).toBe(true);
      expect(isAllowedHost("127.0.0.1", "development")).toBe(true);
    });

    test("ควรอนุญาต production hosts", () => {
      expect(isAllowedHost("your-app.example.com", "production")).toBe(true);
      expect(isAllowedHost("example.com", "production")).toBe(true);
    });

    test("ควรอนุญาต production subdomains", () => {
      expect(isAllowedHost("api.example.com", "production")).toBe(true);
      expect(isAllowedHost("test.your-app.example.com", "production")).toBe(
        true,
      );
    });

    test("ควรปฏิเสธ malicious hosts", () => {
      expect(isAllowedHost("evil.com", "production")).toBe(false);
      expect(isAllowedHost("malicious.site", "development")).toBe(false);
      expect(isAllowedHost("fake-example.com", "production")).toBe(false);
    });

    test("ควรปฏิเสธ host injection attempts", () => {
      expect(isAllowedHost("example.com.evil.com", "production")).toBe(false);
      expect(isAllowedHost("localhost.evil.com", "development")).toBe(false);
    });
  });

  describe("validateUrl", () => {
    test("ควร validate URL ที่ถูกต้อง", () => {
      const result = validateUrl(
        "https://your-app.example.com/auth",
        "production",
      );
      expect(result.isValid).toBe(true);
      expect(result.hostname).toBe("your-app.example.com");
    });

    test("ควรปฏิเสธ protocol ที่ไม่ปลอดภัย", () => {
      const result = validateUrl("javascript:alert(1)", "production");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(
        "Only HTTP and HTTPS protocols are allowed",
      );
    });

    test("ควรปฏิเสธ URL ที่ malformed", () => {
      const result = validateUrl("not-a-url", "production");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Invalid URL format");
    });

    test("ควรปฏิเสธ host ที่ไม่ได้รับอนุญาต", () => {
      const result = validateUrl("https://evil.com/callback", "production");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("not in the allowed list");
    });
  });

  describe("getSafeRedirectUrl", () => {
    test("ควรคืนค่า URL ที่ถูกต้องโดยไม่เปลี่ยนแปลง", () => {
      const url = "https://your-app.example.com/dashboard";
      expect(getSafeRedirectUrl(url, "/", "production")).toBe(url);
    });

    test("ควรคืน fallback เมื่อ URL ไม่ปลอดภัย", () => {
      const maliciousUrl = "https://evil.com/steal-data";
      expect(getSafeRedirectUrl(maliciousUrl, "/safe", "production")).toBe(
        "/safe",
      );
    });

    test("ควรจัดการ JavaScript injection attempts", () => {
      const jsUrl = 'javascript:alert("XSS")';
      expect(getSafeRedirectUrl(jsUrl, "/", "production")).toBe("/");
    });
  });

  describe("sanitizeUrl", () => {
    test("ควรคงค่า URL ที่ปลอดภัยไว้เหมือนเดิม", () => {
      const cleanUrl = "https://your-app.example.com/auth?code=123";
      expect(sanitizeUrl(cleanUrl)).toBe(cleanUrl);
    });

    test("ควรลบ query ที่อันตรายออก", () => {
      const dirtyUrl =
        "https://your-app.example.com/auth?code=123&javascript:alert(1)=bad&onload=evil";
      const clean = sanitizeUrl(dirtyUrl);
      expect(clean).not.toContain("javascript:");
      expect(clean).not.toContain("onload");
      expect(clean).toContain("code=123");
    });

    test("ควร handle URL ที่ไม่ถูกต้องอย่างปลอดภัย", () => {
      expect(sanitizeUrl("invalid-url")).toBe("/");
      expect(sanitizeUrl("")).toBe("/");
    });
  });

  describe("validateNextAuthUrl", () => {
    test("ควรตรวจสอบ development URLs ได้ถูกต้อง", () => {
      const result = validateNextAuthUrl("http://localhost:3000");
      expect(result.isValid).toBe(true);
      expect(result.isDevelopment).toBe(true);
      expect(result.isProduction).toBe(false);
    });

    test("ควรตรวจสอบ production URLs ได้ถูกต้อง", () => {
      const result = validateNextAuthUrl("https://your-app.example.com");
      expect(result.isValid).toBe(true);
      expect(result.isDevelopment).toBe(false);
      expect(result.isProduction).toBe(true);
    });

    test("ควรปฏิเสธ NextAuth URLs ที่ไม่ปลอดภัย", () => {
      const result = validateNextAuthUrl("https://malicious.com");
      expect(result.isValid).toBe(false);
      expect(result.isDevelopment).toBe(false);
      expect(result.isProduction).toBe(false);
    });
  });

  describe("Security Attack Scenarios", () => {
    test("ควรป้องกัน open redirect attacks", () => {
      const attackUrls = [
        "https://evil.com/steal-tokens",
        "//evil.com/phish",
        "https://example.com.evil.com/fake",
        'javascript:alert("XSS")',
        "data:text/html,<script>alert(1)</script>",
      ];

      attackUrls.forEach((url) => {
        expect(isSafeUrl(url)).toBe(false);
        expect(getSafeRedirectUrl(url, "/")).toBe("/");
      });
    });

    test("ควรป้องกัน CSRF ผ่าน malicious origins", () => {
      const maliciousOrigins = [
        "https://evil.com",
        "https://fake-example.com",
        "http://localhost.evil.com",
      ];

      maliciousOrigins.forEach((origin) => {
        const validation = validateUrl(origin, "production");
        expect(validation.isValid).toBe(false);
      });
    });

    test("ควรป้องกัน subdomain hijacking attempts", () => {
      const hijackAttempts = [
        "https://evil.example.com.hacker.com",
        "https://example.com-evil.com",
        "https://xn--example-com.evil.com",
      ];

      hijackAttempts.forEach((url) => {
        expect(isSafeUrl(url)).toBe(false);
      });
    });
  });

  describe("Edge Cases", () => {
    test("ควร handle input ว่างและ null", () => {
      expect(() => validateUrl("", "production")).not.toThrow();
      expect(validateUrl("", "production").isValid).toBe(false);
    });

    test("ควร handle port ใน host ได้ถูกต้อง", () => {
      expect(isAllowedHost("localhost:3000", "development")).toBe(false);
      expect(validateUrl("http://localhost:3000", "development").isValid).toBe(
        true,
      );
    });

    test("ควรไม่สนใจ case ของ host ใน URL", () => {
      expect(isAllowedHost("LOCALHOST", "development")).toBe(false);
      expect(validateUrl("http://LOCALHOST", "development").hostname).toBe(
        "localhost",
      );
    });
  });
});

describe("Integration with NextAuth", () => {
  test("ควร validate NextAuth URLs ทั่วไปได้", () => {
    const nextAuthUrls = [
      "http://localhost:3000",
      "https://your-app.example.com",
      "https://example.com",
      "https://api.example.com",
      "https://test.your-app.example.com",
    ];

    nextAuthUrls.forEach((url) => {
      const validation = validateNextAuthUrl(url);
      expect(validation.isValid).toBe(true);
    });
  });

  test("ควรปฏิเสธ NextAuth configurations ที่ไม่ปลอดภัย", () => {
    const maliciousUrls = [
      "https://evil.com",
      "javascript:alert(1)",
      "https://fake-login.com",
    ];

    maliciousUrls.forEach((url) => {
      const validation = validateNextAuthUrl(url);
      expect(validation.isValid).toBe(false);
    });
  });
});
