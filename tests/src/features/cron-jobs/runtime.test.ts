import { describe, expect, test } from "bun:test";
import { CRON_JOB_DEFINITIONS } from "../../../../src/features/cron-jobs/constants/registry";
import {
  extractCronResponseMessage,
  summarizeAutoCheckoutResults,
} from "../../../../src/features/cron-jobs/helpers/cron-execution";
import {
  formatRelativeUntil,
  getNextCronOccurrence,
  isValidCronExpression,
  matchesCronOccurrence,
} from "../../../../src/features/cron-jobs/helpers/cron-schedule";

describe("runtime cron registry", () => {
  test("keeps the seed registry complete", () => {
    expect(CRON_JOB_DEFINITIONS).toHaveLength(4);
    expect(CRON_JOB_DEFINITIONS.map((job) => job.id)).toEqual([
      "check-in-reminder",
      "enhanced-checkout-reminder",
      "auto-checkout",
      "image-cleanup",
    ]);
    expect(
      CRON_JOB_DEFINITIONS.every((job) =>
        job.endpoint.startsWith("/api/cron/"),
      ),
    ).toBe(true);
  });

  test("keeps the container crontab as a dispatcher-only trigger", async () => {
    const crontab = await Bun.file("crontab").text();

    expect(crontab).toContain(
      "* * * * * /usr/local/bin/cron-request.sh POST /api/cron/dispatch",
    );
    expect(crontab).not.toContain("/api/cron/check-in-reminder");
    expect(crontab).not.toContain("/api/cron/auto-checkout");
  });

  test("keeps automatic checkout independent of an interactive session", async () => {
    const source = await Bun.file(
      "src/routes/api/cron/auto-checkout.tsx",
    ).text();

    expect(source).toContain("validateSimpleCronAuth");
    expect(source).not.toContain("checkCronLineApproval");
  });

  test("calculates the next Bangkok schedule for the active expressions", () => {
    const now = new Date("2026-10-04T00:00:00.000Z");
    const nextRun = getNextCronOccurrence("0 */2 * * *", now);

    expect(nextRun?.toISOString()).toBe("2026-10-04T01:00:00.000Z");
    expect(formatRelativeUntil(nextRun!, now)).toBe("อีก 1 ชม.");
  });

  test("validates and matches Bangkok cron occurrences", () => {
    expect(isValidCronExpression("*/5 16-20 * * 1-5")).toBe(true);
    expect(isValidCronExpression("not a cron expression")).toBe(false);
    expect(
      matchesCronOccurrence(
        "0 */2 * * *",
        new Date("2026-10-04T01:00:00.000Z"),
      ),
    ).toBe(true);
    expect(
      matchesCronOccurrence(
        "0 */2 * * *",
        new Date("2026-10-04T01:01:00.000Z"),
      ),
    ).toBe(false);
  });

  test("surfaces auto-checkout failure reasons in the execution summary", () => {
    const summary = summarizeAutoCheckoutResults([
      { status: "success" },
      { status: "failed", reason: "ไม่พบ attendance record" },
      { status: "failed", reason: "ไม่พบ attendance record" },
      { status: "skipped", reason: "ลงชื่อออกแล้ว" },
    ]);

    expect(summary.success).toBe(false);
    expect(summary.summary).toEqual({
      processed: 4,
      successful: 1,
      failed: 2,
      skipped: 1,
      warnings: 0,
    });
    expect(summary.failureReasons).toEqual([
      { reason: "ไม่พบ attendance record", count: 2 },
    ]);
    expect(summary.message).toContain("ไม่พบ attendance record (2 คน)");
  });

  test("reads a failure message from a cron response payload", () => {
    expect(
      extractCronResponseMessage({ error: "LINE approval required" }),
    ).toBe("LINE approval required");
    expect(extractCronResponseMessage({ message: "ลงชื่อออกงานล้มเหลว" })).toBe(
      "ลงชื่อออกงานล้มเหลว",
    );
    expect(extractCronResponseMessage({ status: "failed" })).toBeNull();
  });
});
