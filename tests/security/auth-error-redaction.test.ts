import { describe, expect, test } from "bun:test";
import { getPublicAuthErrorCode } from "@/features/auth/lib/auth-error";

describe("Auth error redaction", () => {
  test("คง error code ที่ UI รองรับ", () => {
    expect(getPublicAuthErrorCode("state_mismatch")).toBe("state_mismatch");
    expect(getPublicAuthErrorCode("invalid_code")).toBe("invalid_code");
  });

  test("ไม่ส่ง internal error หรือค่าที่ไม่รู้จักไปใน redirect URL", () => {
    expect(getPublicAuthErrorCode("database connection failed: secret")).toBe(
      "line_oauth",
    );
    expect(getPublicAuthErrorCode(undefined)).toBe("line_oauth");
  });
});
