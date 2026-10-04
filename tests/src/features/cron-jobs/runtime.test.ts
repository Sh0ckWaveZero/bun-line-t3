import { describe, expect, test } from "bun:test";
import { CRON_JOB_DEFINITIONS } from "../../../../src/features/cron-jobs/constants/registry";
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
});
