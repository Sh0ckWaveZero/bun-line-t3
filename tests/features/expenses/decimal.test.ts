import { describe, expect, it } from "bun:test";
import { Prisma } from "@prisma/client";
import { toNum, assertAmountBound } from "@/features/expenses/services/decimal";
import { MAX_TRANSACTION_AMOUNT } from "@/features/expenses/constants";

describe("expenses decimal helpers", () => {
  describe("toNum — Decimal → number", () => {
    it("converts Prisma.Decimal to number", () => {
      const d = new Prisma.Decimal("123.45");
      expect(toNum(d)).toBe(123.45);
      expect(typeof toNum(d)).toBe("number");
    });

    it("returns 0 for null/undefined", () => {
      expect(toNum(null)).toBe(0);
      expect(toNum(undefined)).toBe(0);
    });

    it("handles large precision values exactly via toString", () => {
      // Decimal(14,2) max integer part is 12 digits; verify we don't lose precision
      const d = new Prisma.Decimal("123456789012.99");
      expect(toNum(d)).toBe(123456789012.99);
    });
  });

  describe("assertAmountBound — defense in depth at service layer", () => {
    it("accepts positive amount within bound", () => {
      expect(() => assertAmountBound(1)).not.toThrow();
      expect(() => assertAmountBound(100)).not.toThrow();
      expect(() => assertAmountBound(MAX_TRANSACTION_AMOUNT)).not.toThrow();
    });

    it("rejects zero", () => {
      expect(() => assertAmountBound(0)).toThrow(RangeError);
    });

    it("rejects negative", () => {
      expect(() => assertAmountBound(-1)).toThrow(RangeError);
      expect(() => assertAmountBound(-100.5)).toThrow(RangeError);
    });

    it("rejects NaN and Infinity", () => {
      expect(() => assertAmountBound(NaN)).toThrow(RangeError);
      expect(() => assertAmountBound(Infinity)).toThrow(RangeError);
      expect(() => assertAmountBound(-Infinity)).toThrow(RangeError);
    });

    it("rejects amount exceeding MAX_TRANSACTION_AMOUNT", () => {
      expect(() => assertAmountBound(MAX_TRANSACTION_AMOUNT + 1)).toThrow(
        RangeError,
      );
      // 1e308 — the float-overflow value this guard exists to prevent
      expect(() => assertAmountBound(1e308)).toThrow(RangeError);
    });

    it("uses custom field name in error message", () => {
      try {
        assertAmountBound(-5, "targetAmount");
        expect(true).toBe(false); // unreachable
      } catch (e) {
        expect(e).toBeInstanceOf(RangeError);
        expect((e as Error).message).toContain("targetAmount");
      }
    });
  });
});
