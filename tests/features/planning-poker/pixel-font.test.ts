import { describe, expect, test } from "bun:test";
import {
  buildPixelGrid,
  pixelGridWidth,
} from "@/features/planning-poker/helpers/pixel-font";

describe("buildPixelGrid", () => {
  test("ตัวเลขและสัญลักษณ์พิเศษมี glyph", () => {
    for (const value of [
      "0",
      "8",
      "13",
      "21",
      "34",
      "?",
      "☕",
      "½",
      "S",
      "XL",
      "XXL",
      "100",
      "✓",
      "—",
      "17.3",
    ]) {
      const grid = buildPixelGrid(value);
      expect(grid).not.toBeNull();
      expect(grid?.length).toBe(7);
      for (const row of grid ?? []) {
        expect(row.length).toBe(pixelGridWidth(grid ?? []));
      }
    }
  });

  test("2-4 ตัวอักษรกว้างขึ้นตามจำนวน (มีช่องว่างคั่น)", () => {
    expect(pixelGridWidth(buildPixelGrid("8") ?? [])).toBe(5);
    expect(pixelGridWidth(buildPixelGrid("13") ?? [])).toBe(11);
    expect(pixelGridWidth(buildPixelGrid("17.3") ?? [])).toBe(23);
  });

  test("ค่าที่ไม่มี glyph หรือยาวเกิน คืน null ให้ fallback เป็นข้อความ", () => {
    expect(buildPixelGrid("HELLO")).toBeNull();
    expect(buildPixelGrid("AB")).toBeNull();
    expect(buildPixelGrid("")).toBeNull();
  });
});
