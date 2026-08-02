import { beforeEach, describe, expect, mock, test } from "bun:test";

mock.module("@/env.mjs", () => ({
  env: { CRON_SECRET: "test-cron-secret" },
}));

const { validateCronAuth, validateSimpleCronAuth } =
  await import("@/lib/utils/cron-auth");

describe("Cron authentication", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
  });

  test("accepts only the exact bearer secret", () => {
    const request = new Request("http://localhost/api/cron", {
      headers: { authorization: "Bearer test-cron-secret" },
    });

    expect(validateCronAuth(request)).toEqual({ success: true });
    expect(validateSimpleCronAuth("Bearer test-cron-secret")).toBe(true);
  });

  test("rejects missing, malformed, and invalid credentials", () => {
    expect(validateCronAuth(new Request("http://localhost/api/cron"))).toEqual({
      success: false,
      error: "Missing or invalid authorization header",
      status: 401,
    });
    expect(validateSimpleCronAuth(null)).toBe(false);
    expect(validateSimpleCronAuth("Bearer wrong-secret")).toBe(false);
    expect(
      validateCronAuth(
        new Request("http://localhost/api/cron", {
          headers: { authorization: "Bearer wrong-secret" },
        }),
      ),
    ).toEqual({
      success: false,
      error: "Invalid authorization token",
      status: 401,
    });
  });
});
