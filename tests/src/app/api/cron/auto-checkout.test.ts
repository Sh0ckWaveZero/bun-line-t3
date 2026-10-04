import { describe, it, expect } from "bun:test";
import {
  getBangkokDateString,
  resolveAutoCheckoutTarget,
} from "@/lib/utils/datetime";

describe("Auto-checkout target day", () => {
  // crontab: `0 0 * * *` Asia/Bangkok == 17:00:00Z the previous UTC day
  const midnightTick = new Date("2026-10-04T17:00:00.000Z"); // 00:00 BKK 2026-10-05

  it("closes out the Bangkok day that just ended, not the new day", () => {
    const { workDate } = resolveAutoCheckoutTarget(midnightTick);

    expect(getBangkokDateString(midnightTick)).toBe("2026-10-05");
    expect(workDate).toBe("2026-10-04");
  });

  it("sets checkout time to 23:59:59.999 Bangkok of that work date", () => {
    const { checkOutTime } = resolveAutoCheckoutTarget(midnightTick);

    expect(checkOutTime.toISOString()).toBe("2026-10-04T16:59:59.999Z");
  });

  it("tolerates a delayed or retried tick (curl --retry, slow crond)", () => {
    const delayed = new Date("2026-10-04T17:00:20.000Z");
    const { workDate, checkOutTime } = resolveAutoCheckoutTarget(delayed);

    expect(workDate).toBe("2026-10-04");
    expect(checkOutTime.toISOString()).toBe("2026-10-04T16:59:59.999Z");
  });

  it("crosses month and year boundaries", () => {
    const newYear = new Date("2026-12-31T17:00:00.000Z"); // 00:00 BKK 2027-01-01
    const { workDate, checkOutTime } = resolveAutoCheckoutTarget(newYear);

    expect(workDate).toBe("2026-12-31");
    expect(checkOutTime.toISOString()).toBe("2026-12-31T16:59:59.999Z");
  });
});
