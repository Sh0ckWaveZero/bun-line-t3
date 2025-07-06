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
  isSecureProtocol,
  deepValidateUrl,
  validateUrlForCSP,
} from "@/lib/security/url-validator";

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

    test("ควรป้องกัน URL encoding bypass attempts", () => {
      const encodedJsUrls = [
        "https://example.com?callback=%6A%61%76%61%73%63%72%69%70%74%3A%61%6C%65%72%74%28%31%29", // javascript:alert(1)
        "https://example.com?callback=%6A%61%76%61%73%63%72%69%70%74%3Aalert%281%29", // partial encoding
        "data%3Atext%2Fhtml%3B%3Cscript%3Ealert%281%29%3C%2Fscript%3E", // data URL
      ];

      encodedJsUrls.forEach((url, index) => {
        const result = sanitizeUrl(url);
        if (index < 2) {
          // First two should have dangerous params removed but keep base URL
          expect(result).toContain("https://example.com");
          expect(result).not.toContain("callback=");
        } else {
          // Data URL should be completely rejected
          expect(result).toBe("/");
        }
      });
    });

    test("ควรป้องกัน comprehensive event handler injections", () => {
      const eventHandlerUrls = [
        "https://example.com?onmouseenter=alert(1)",
        "https://example.com?onformdata=malicious()",
        "https://example.com?ontoggle=evil&code=123",
        "https://example.com#onhashchange=badcode",
      ];

      eventHandlerUrls.forEach((url) => {
        const result = sanitizeUrl(url);
        expect(result).not.toMatch(/on[a-z]+=/i);
      });
    });

    test("ควรป้องกัน dangerous protocols", () => {
      const dangerousUrls = [
        "javascript:alert(1)",
        "data:text/html,<script>alert(1)</script>",
        "vbscript:msgbox(1)",
        "file:///etc/passwd",
        "chrome-extension://malicious",
        "blob:https://example.com/malicious",
      ];

      dangerousUrls.forEach((url) => {
        const result = sanitizeUrl(url);
        expect(result).toBe("/");
      });
    });

    test("ควรป้องกัน script injection ใน URL components", () => {
      const scriptUrls = [
        "https://example.com/<script>alert(1)</script>",
        "https://example.com/path?param=<script>evil()</script>",
        "https://example.com#<script>badcode()</script>",
        "https://example.com?eval=eval(malicious)",
        "https://example.com?setTimeout=setTimeout(bad,1000)",
      ];

      scriptUrls.forEach((url, index) => {
        const result = sanitizeUrl(url);
        if (index === 0) {
          // URLs with scripts in path should be completely rejected
          expect(result).toBe("/");
        } else if (index === 2) {
          // URLs with scripts in hash should have hash removed but keep base URL
          expect(result).toContain("https://example.com");
          expect(result).not.toContain("#");
        } else {
          // URLs with dangerous query params should have those params removed
          expect(result).toContain("https://example.com");
          expect(result).not.toMatch(/(param=|eval=|setTimeout=)/);
        }
      });
    });

    test("ควรป้องกัน CSS expression injections", () => {
      const cssUrls = [
        "https://example.com?style=expression(alert(1))",
        "https://example.com?css=behavior:url(malicious.htc)",
        "https://example.com?moz=-moz-binding:url(evil.xml)",
      ];

      cssUrls.forEach((url) => {
        const result = sanitizeUrl(url);
        // Dangerous CSS params should be removed, leaving clean base URL
        expect(result).toContain("https://example.com");
        expect(result).not.toMatch(/(style=|css=|moz=)/);
      });
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

  describe("isSecureProtocol", () => {
    test("ควรอนุญาต HTTP และ HTTPS protocols", () => {
      expect(isSecureProtocol("http://example.com")).toBe(true);
      expect(isSecureProtocol("https://example.com")).toBe(true);
    });

    test("ควรปฏิเสธ dangerous protocols", () => {
      const dangerousProtocols = [
        "javascript:alert(1)",
        "data:text/html,<script>",
        "file:///etc/passwd",
        "ftp://files.com",
        "chrome-extension://abc",
      ];

      dangerousProtocols.forEach((url) => {
        expect(isSecureProtocol(url)).toBe(false);
      });
    });

    test("ควร handle invalid URLs", () => {
      expect(isSecureProtocol("invalid-url")).toBe(false);
      expect(isSecureProtocol("")).toBe(false);
    });
  });

  describe("deepValidateUrl", () => {
    test("ควรผ่าน URL ที่ปลอดภัย", () => {
      const result = deepValidateUrl(
        "https://your-app.example.com/auth?code=123",
      );
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.sanitizedUrl).toBe(
        "https://your-app.example.com/auth?code=123",
      );
    });

    test("ควรตรวจพบ dangerous protocols", () => {
      const result = deepValidateUrl("javascript:alert(1)");
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain(
        "Dangerous or unsupported protocol detected",
      );
      expect(result.sanitizedUrl).toBe("/");
    });

    test("ควรตรวจพบ URL encoding bypass attempts", () => {
      const encodedJs =
        "https://example.com?callback=%6A%61%76%61%73%63%72%69%70%74%3A%61%6C%65%72%74%28%31%29";
      const result = deepValidateUrl(encodedJs);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("URL encoding bypass attempt detected");
    });

    test("ควรตรวจพบ sanitization rejections", () => {
      const maliciousUrl = "https://example.com/<script>alert(1)</script>";
      const result = deepValidateUrl(maliciousUrl);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("URL rejected by sanitization process");
    });

    test("ควรรายงาน multiple issues", () => {
      const terribleUrl = "javascript:alert(document.location)";
      const result = deepValidateUrl(terribleUrl);
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe("validateUrlForCSP", () => {
    test("ควรผ่าน URL ที่ปลอดภัยสำหรับ CSP", () => {
      expect(
        validateUrlForCSP("https://your-app.example.com", "default-src"),
      ).toBe(true);
      expect(validateUrlForCSP("https://api.example.com", "connect-src")).toBe(
        true,
      );
    });

    test("ควรปฏิเสธ dangerous URLs สำหรับ CSP", () => {
      expect(validateUrlForCSP("javascript:alert(1)", "script-src")).toBe(
        false,
      );
      expect(validateUrlForCSP("data:text/html,<script>", "default-src")).toBe(
        false,
      );
    });

    test("ควรบังคับ HTTPS ใน production สำหรับ sensitive directives", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      expect(validateUrlForCSP("http://localhost", "script-src")).toBe(false);
      expect(
        validateUrlForCSP("https://your-app.example.com", "script-src"),
      ).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    test("ควรอนุญาต HTTP ใน development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      expect(validateUrlForCSP("http://localhost:3000", "script-src")).toBe(
        true,
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe("Enhanced Security Attack Scenarios", () => {
  test("ควรป้องกัน advanced URL encoding attacks", () => {
    const advancedAttacks = [
      // Double URL encoding
      "%25%36%41%25%36%31%25%37%36%25%36%31%25%37%33%25%36%33%25%37%32%25%36%39%25%37%30%25%37%34%25%33%41",
      // Unicode encoding
      "\\u006A\\u0061\\u0076\\u0061\\u0073\\u0063\\u0072\\u0069\\u0070\\u0074\\u003A",
      // Mixed encoding
      "j%61vasc%72ipt:alert(1)",
      // HTML entity encoding attempts
      "&javascript:&alert(1)",
    ];

    advancedAttacks.forEach((attack) => {
      expect(isSafeUrl(attack)).toBe(false);
      expect(sanitizeUrl(attack)).toBe("/");
    });
  });

  test("ควรป้องกัน sophisticated event handler injections", () => {
    const sophisticatedAttacks = [
      // Case variations
      "https://example.com?OnLoad=evil()",
      "https://example.com?ONCLICK=malicious",
      // Spacing attacks
      "https://example.com?on load=evil()",
      "https://example.com?on\tclick=bad()",
      // Multiple event handlers
      "https://example.com?onmouseover=a()&onmouseout=b()&onclick=c()",
    ];

    sophisticatedAttacks.forEach((attack) => {
      const result = sanitizeUrl(attack);
      expect(result).not.toMatch(/on[a-z\s\t]+=/i);
    });
  });

  test("ควรป้องกัน protocol confusion attacks", () => {
    const confusionAttacks = [
      // Protocol with unusual formatting
      "JAVASCRIPT:alert(1)",
      "Java Script:alert(1)",
      "java\tscript:alert(1)",
      // Data URLs with script content
      "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      // Blob URLs
      "blob:https://example.com/malicious-script",
    ];

    confusionAttacks.forEach((attack) => {
      expect(isSafeUrl(attack)).toBe(false);
      expect(sanitizeUrl(attack)).toBe("/");
    });
  });

  test("ควรป้องกัน CSS-based attacks", () => {
    const cssAttacks = [
      "https://example.com?style=expression(alert(document.cookie))",
      "https://example.com?css=behavior:url(data:text/html,<script>alert(1)</script>)",
      "https://example.com?import=@import url(javascript:alert(1))",
    ];

    cssAttacks.forEach((attack) => {
      const result = sanitizeUrl(attack);
      // Dangerous CSS params should be removed, leaving clean base URL
      expect(result).toContain("https://example.com");
      expect(result).not.toMatch(/(style=|css=|import=)/);
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
