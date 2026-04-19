import { describe, expect, test } from "bun:test";

import {
  shiftMonth,
  toTransDate,
  toTransMonth,
} from "@/features/expenses/helpers";

describe("expense date helpers", () => {
  test("shiftMonth changes one month at a time", () => {
    expect(shiftMonth("2026-04", -1)).toBe("2026-03");
    expect(shiftMonth("2026-04", 1)).toBe("2026-05");
  });

  test("shiftMonth handles year boundaries", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  test("Date formatting uses local date parts instead of UTC ISO slicing", () => {
    const localFirstDay = new Date(2026, 2, 1, 0, 0, 0);

    expect(toTransMonth(localFirstDay)).toBe("2026-03");
    expect(toTransDate(localFirstDay)).toBe("2026-03-01");
  });
});
