import { afterEach, describe, expect, mock, test } from "bun:test";
import { getLotteryArchive, getLotteryByDate } from "./lottery.server";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("historical lottery results", () => {
  test("returns the actual archive dates", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        Response.json({
          status: true,
          response: {
            total: 2,
            lottery: [{ date: "2026-01-17" }, { date: "2025-12-30" }],
          },
        }),
      ),
    );
    expect(await getLotteryArchive(1)).toEqual({
      total: 2,
      dates: ["2026-01-17", "2025-12-30"],
    });
  });

  test("rejects incomplete result data rather than reporting a false loss", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        Response.json({
          status: true,
          response: { result: { date: "2026-10-16", data: {} } },
        }),
      ),
    );
    await expect(getLotteryByDate("2026-10-16")).rejects.toThrow();
  });
});
