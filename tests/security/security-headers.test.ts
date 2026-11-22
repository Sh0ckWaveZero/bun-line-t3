import { describe, it, expect } from "bun:test";
import { buildSecurityHeaders } from "../../server";

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
