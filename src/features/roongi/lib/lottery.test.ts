import { describe, expect, test } from "bun:test";
import { checkTicket, lotterySchema } from "./lottery";

const prize = (value: string, price = "2000", count = 1) => ({
  price,
  number: Array.from({ length: count }, (_, index) => ({
    value: String((Number(value) + index) % 10 ** value.length).padStart(
      value.length,
      "0",
    ),
  })),
});
const lottery = lotterySchema.parse({
  date: "2026-11-01",
  data: {
    first: prize("001234", "6000000"),
    near1: prize("001233", "100000", 2),
    second: prize("123456", "2000", 5),
    third: prize("234567", "2000", 10),
    fourth: prize("345678", "2000", 50),
    fifth: prize("456789", "2000", 100),
    last3f: prize("777", "2000", 2),
    last3b: prize("888", "2000", 2),
    last2: prize("99"),
  },
});

describe("checkTicket", () => {
  test("preserves leading zeroes and identifies the first prize", () => {
    expect(checkTicket("001234", lottery).matches[0]?.label).toBe(
      "รางวัลที่ 1",
    );
  });
  test("reports adjacent prizes as wins, not near misses", () => {
    const result = checkTicket("001233", lottery);
    expect(result.matches[0]?.label).toBe("รางวัลข้างเคียงรางวัลที่ 1");
    expect(result.near.some((near) => near.label === "รางวัลที่ 1")).toBe(
      false,
    );
  });
  test("matches front and back prizes independently", () => {
    expect(
      checkTicket("777899", lottery).matches.map((match) => match.label),
    ).toEqual(["เลขหน้า 3 ตัว", "เลขท้าย 2 ตัว"]);
  });
  test("reports positional differences for losing tickets", () => {
    expect(checkTicket("001235", lottery).near).toContainEqual({
      label: "รางวัลที่ 1",
      winning: "001234",
      differences: 1,
      alternative: "001234",
    });
  });
  test("shows a nearby first prize even when another prize is won", () => {
    const result = checkTicket("001299", lottery);
    expect(
      result.matches.some((match) => match.label === "เลขท้าย 2 ตัว"),
    ).toBe(true);
    expect(result.near).toContainEqual({
      label: "รางวัลที่ 1",
      winning: "001234",
      differences: 2,
      alternative: "001234",
    });
  });
  test("constructs a six digit alternative for a front prize", () => {
    expect(checkTicket("776123", lottery).near).toContainEqual({
      label: "เลขหน้า 3 ตัว",
      winning: "777",
      differences: 1,
      alternative: "777123",
    });
  });
  test("rejects malformed prize amounts", () => {
    expect(
      lotterySchema.safeParse({
        ...lottery,
        data: {
          ...lottery.data,
          first: { ...lottery.data.first, price: "abc" },
        },
      }).success,
    ).toBe(false);
  });
});
