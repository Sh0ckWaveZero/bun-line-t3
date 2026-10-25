import { describe, expect, test } from "bun:test";
import {
  resolveFxRarity,
  hashValue,
  countGoodStreak,
  FX_RARITIES,
} from "@/features/planning-poker/helpers/fx-rarity";

describe("resolveFxRarity", () => {
  test("โซนชั้นจากค่าเฉลี่ย — ค่าที่ใช้กันจริง (3-5) อยู่โซน epic ค่าสูงถอยลง", () => {
    expect(resolveFxRarity("1")).toBe("mythic");
    expect(resolveFxRarity("½")).toBe("mythic");
    expect(resolveFxRarity("2")).toBe("legendary");
    expect(resolveFxRarity("3")).toBe("epic");
    expect(resolveFxRarity("5")).toBe("epic");
    expect(resolveFxRarity("8")).toBe("rare");
    expect(resolveFxRarity("13")).toBe("uncommon");
    expect(resolveFxRarity("20")).toBe("common");
    expect(resolveFxRarity("100")).toBe("common");
  });

  test("ครบ 6 ชั้นรวม mythic — ลำดับตรงกับ demo signature shows", () => {
    expect(FX_RARITIES).toEqual([
      "common",
      "uncommon",
      "rare",
      "epic",
      "legendary",
      "mythic",
    ]);
  });

  test("ค่าไม่ใช่ตัวเลข (?, ☕, fallback โหวตมากสุด) ได้ชั้นต่ำสุด", () => {
    expect(resolveFxRarity("?")).toBe("common");
    expect(resolveFxRarity("☕")).toBe("common");
    expect(resolveFxRarity("XL")).toBe("common");
  });

  test("ทุกคนโหวตเลขเดียวกัน (consensus) = mythic ไม่ว่าค่าจะสูงแค่ไหน", () => {
    expect(resolveFxRarity("20", true)).toBe("mythic");
    expect(resolveFxRarity("100", true)).toBe("mythic");
    expect(resolveFxRarity("8", true)).toBe("mythic");
    expect(resolveFxRarity("1", true)).toBe("mythic");
  });

  test("consensus บนค่าที่ไม่ใช่ตัวเลข (ทุกคนกด ☕/?) ไม่ได้โบนัส", () => {
    expect(resolveFxRarity("☕", true)).toBe("common");
    expect(resolveFxRarity("?", true)).toBe("common");
  });

  test("สตรีค: ทีมประเมินดีต่อเนื่อง ชั้นไต่ขึ้นรอบละชั้นจน mythic", () => {
    // ประมาณ 3 ซ้ำ: รอบแรก epic → legendary → mythic → mythic (cap)
    expect(resolveFxRarity("3", false, 0)).toBe("epic");
    expect(resolveFxRarity("3", false, 1)).toBe("legendary");
    expect(resolveFxRarity("3", false, 2)).toBe("mythic");
    expect(resolveFxRarity("3", false, 5)).toBe("mythic");
    // ประมาณ 8 ซ้ำ: rare → epic → legendary → mythic
    expect(resolveFxRarity("8", false, 0)).toBe("rare");
    expect(resolveFxRarity("8", false, 1)).toBe("epic");
    expect(resolveFxRarity("8", false, 2)).toBe("legendary");
    expect(resolveFxRarity("8", false, 3)).toBe("mythic");
  });

  test("สตรีคไม่โบนัสรอบค่าสูง — ค่า > 8 คงโซนตัวเอง", () => {
    expect(resolveFxRarity("20", false, 3)).toBe("common");
    expect(resolveFxRarity("13", false, 2)).toBe("uncommon");
  });

  test("countGoodStreak: นับรอบดี (≤8) ติดกันจากล่าสุด ข้ามรอบปัจจุบัน (แถวท้าย)", () => {
    const record = (average: number | null) => ({ summary: { average } });
    expect(countGoodStreak([])).toBe(0);
    // history [3, 13, 3] — รอบปัจจุบันคือ 3 (ท้ายสุด): รอบก่อนคือ 13 → ตัดสตรีคทันที = 0
    expect(countGoodStreak([record(3), record(13), record(3)])).toBe(0);
    // [5, 8, 5] ปัจจุบัน 5: ก่อนหน้า [5, 8] ดีทั้งคู่ = 2
    expect(countGoodStreak([record(5), record(8), record(5)])).toBe(2);
    // รอบก่อนหน้าค่าสูงหมด สตรีค = 0
    expect(countGoodStreak([record(20), record(5)])).toBe(0);
    // ไม่มีค่าเฉลี่ย (null) ตัดสตรีค
    expect(countGoodStreak([record(3), record(null), record(3)])).toBe(0);
  });

  test("โซน deterministic — ค่าเดิมได้ชั้นเดิมเสมอ", () => {
    for (const value of ["1", "3", "5", "8", "13", "20", "☕"]) {
      const first = resolveFxRarity(value);
      for (let i = 0; i < 10; i += 1) {
        expect(resolveFxRarity(value)).toBe(first);
      }
    }
  });
});

describe("hashValue", () => {
  test("deterministic — input เดิมได้ hash เดิม", () => {
    expect(hashValue("5:3")).toBe(hashValue("5:3"));
    expect(hashValue("2.5")).toBe(hashValue("2.5"));
  });

  test("ค่าเดิมคนละรอบ → hash ต่างกัน (โชว์ในโซนหมุนเวียนได้)", () => {
    const rounds = [1, 2, 3, 4, 5, 6];
    const hashes = new Set(rounds.map((round) => hashValue(`3:${round}`)));
    // 6 รอบควรได้ seed หลากหลายพอสำหรับหมุนโชว์ 3 แบบในโซน
    expect(hashes.size).toBeGreaterThanOrEqual(2);
  });
});
