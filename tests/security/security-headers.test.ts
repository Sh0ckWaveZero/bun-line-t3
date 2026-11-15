import { describe, it, expect } from "bun:test";
import {
  buildSecurityHeaders,
  buildCspReportOnly,
  buildReportingEndpoints,
} from "../../server";

describe("buildSecurityHeaders", () => {
  it("always sets clickjacking + baseline companion headers", () => {
    const headers = buildSecurityHeaders({});

    // เว็บนี้ฝัง PDF ของตัวเองผ่าน blob: iframe → ต้องยอมรับ same-origin framing
    expect(headers["Content-Security-Policy"]).toBe("frame-ancestors 'self'");
    expect(headers["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toBe(
      "camera=(), geolocation=(), microphone=()",
    );
    // OAuth popup flow (LINE Login) ต้องเปิด popup ได้โดยไม่เสีย opener
    expect(headers["Cross-Origin-Opener-Policy"]).toBe(
      "same-origin-allow-popups",
    );
    expect(headers["Cross-Origin-Resource-Policy"]).toBe("same-origin");
  });

  it("omits HSTS outside production (dev/preview รันบน plain HTTP)", () => {
    expect(buildSecurityHeaders({})["Strict-Transport-Security"]).toBe(
      undefined,
    );
    expect(
      buildSecurityHeaders({ APP_ENV: "dev" })["Strict-Transport-Security"],
    ).toBe(undefined);
  });

  it("sets HSTS with includeSubDomains in production", () => {
    const headers = buildSecurityHeaders({ APP_ENV: "production" });
    expect(headers["Strict-Transport-Security"]).toBe(
      "max-age=31536000; includeSubDomains",
    );
  });
});

describe("buildCspReportOnly", () => {
  it("ครอบ directive พื้นฐานครบ — script ยังต้อง unsafe-inline จนกว่าจะมี nonce", () => {
    const policy = buildCspReportOnly();
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("script-src 'self' 'unsafe-inline'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    // blob: PDF preview + Google Fonts ต้องยังผ่าน
    expect(policy).toContain("frame-src 'self' blob:");
    expect(policy).toContain("https://fonts.gstatic.com");
  });

  it("อ้าง report-to endpoint เมื่อกำหนดชื่อ", () => {
    expect(buildCspReportOnly()).toContain("report-to csp-report");
    expect(buildCspReportOnly(null)).not.toContain("report-to");
  });
});

describe("buildReportingEndpoints", () => {
  it("สร้าง Reporting-Endpoints จาก APP_URL (origin + path)", () => {
    expect(
      buildReportingEndpoints({ APP_URL: "https://app.example.com/path" }),
    ).toBe('csp-report="https://app.example.com/api/security/csp-report"');
  });

  it("ไม่มี APP_URL → null (ไม่ตั้ง CSP-Report-Only เพราะรายงานไปไม่ถึงไหน)", () => {
    expect(buildReportingEndpoints({})).toBeNull();
    expect(buildReportingEndpoints({ APP_URL: "  " })).toBeNull();
  });
});
