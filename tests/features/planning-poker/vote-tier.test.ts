import { describe, expect, test } from "bun:test";
import { getVoteTier } from "@/features/planning-poker/helpers/vote-tier";

describe("getVoteTier", () => {
  test("จัดระดับตามขนาดตัวเลข (Fibonacci deck)", () => {
    expect(getVoteTier("0")).toBe("common");
    expect(getVoteTier("1")).toBe("common");
    expect(getVoteTier("2")).toBe("common");
    expect(getVoteTier("3")).toBe("uncommon");
    expect(getVoteTier("5")).toBe("uncommon");
    expect(getVoteTier("8")).toBe("rare");
    expect(getVoteTier("13")).toBe("epic");
    expect(getVoteTier("21")).toBe("legendary");
    expect(getVoteTier("34")).toBe("mythic");
  });

  test("จัดระดับ deck อื่น (Modified / Powers)", () => {
    expect(getVoteTier("½")).toBe("common");
    expect(getVoteTier("20")).toBe("legendary");
    expect(getVoteTier("40")).toBe("mythic");
    expect(getVoteTier("100")).toBe("mythic");
    expect(getVoteTier("16")).toBe("legendary");
    expect(getVoteTier("64")).toBe("mythic");
  });

  test("ค่าไม่ใช่ตัวเลขเป็น neutral (ไม่เรืองแสง)", () => {
    expect(getVoteTier("?")).toBe("neutral");
    expect(getVoteTier("☕")).toBe("neutral");
    expect(getVoteTier("XL")).toBe("neutral");
    expect(getVoteTier("M")).toBe("neutral");
  });
});
