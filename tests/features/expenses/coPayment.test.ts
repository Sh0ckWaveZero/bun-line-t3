import { describe, expect, it } from "bun:test";
import {
  isCoPaymentTrigger,
  hasCoPaymentTag,
  shouldApplyCoPayment,
  calculateCoPaymentSplit,
  formatCoPaymentDetails,
  parseTransactionSubsidy,
  IS_CO_PAYMENT_ACTIVE,
} from "@/features/expenses/helpers/coPayment";

describe("Co-payment helper tests (ไทยช่วยไทย พลัส 60/40)", () => {
  describe("Trigger Word & Abbreviation Matching", () => {
    it("should match standard keywords", () => {
      expect(isCoPaymentTrigger("ไทยช่วยไทย")).toBe(true);
      expect(isCoPaymentTrigger("60/40")).toBe(true);
      expect(isCoPaymentTrigger("คนละครึ่ง")).toBe(true);
    });

    it("should match standard abbreviations (case-insensitive)", () => {
      expect(isCoPaymentTrigger("ทชท")).toBe(true);
      expect(isCoPaymentTrigger("TCT")).toBe(true);
      expect(isCoPaymentTrigger("tct")).toBe(true);
      expect(isCoPaymentTrigger("6040")).toBe(true);
      expect(isCoPaymentTrigger("คละคร")).toBe(true);
      expect(isCoPaymentTrigger("KLK")).toBe(true);
      expect(isCoPaymentTrigger("klk")).toBe(true);
    });

    it("should match triggers inside strings", () => {
      expect(isCoPaymentTrigger("กินข้าวเที่ยง #ทชท")).toBe(true);
      expect(isCoPaymentTrigger("สแกนคนละครึ่ง")).toBe(true);
      expect(isCoPaymentTrigger("tct ค่ากาแฟ")).toBe(true);
    });

    it("should not match unrelated words", () => {
      expect(isCoPaymentTrigger("กินข้าวเที่ยง")).toBe(false);
      expect(isCoPaymentTrigger("dca บิตคอยน์")).toBe(false);
      expect(isCoPaymentTrigger("")).toBe(false);
      expect(isCoPaymentTrigger(null)).toBe(false);
    });

    it("should match from tag lists", () => {
      expect(hasCoPaymentTag(["อาหาร", "ทชท"])).toBe(true);
      expect(hasCoPaymentTag(["tct", "กาแฟ"])).toBe(true);
      expect(hasCoPaymentTag(["อาหาร", "มื้อเที่ยง"])).toBe(false);
    });
  });

  describe("Co-payment Split Calculations (60/40)", () => {
    it("should calculate standard 60/40 splits correctly under the daily limit", () => {
      // Total 100 THB: State = 60 THB, User = 40 THB
      const result = calculateCoPaymentSplit(100);
      expect(result.isCoPay).toBe(true);
      expect(result.subsidyAmount).toBe(60);
      expect(result.userAmount).toBe(40);
    });

    it("should calculate correct co-payment split at the threshold (333.33 THB)", () => {
      // Total 333.33 THB: State = 200 THB, User = 133.33 THB
      const result = calculateCoPaymentSplit(333.33);
      expect(result.subsidyAmount).toBe(200);
      expect(result.userAmount).toBe(133.33);
    });

    it("should cap the government co-payment subsidy at 200 THB daily limit", () => {
      // Total 500 THB: State = 200 THB (capped), User = 300 THB
      const result1 = calculateCoPaymentSplit(500);
      expect(result1.subsidyAmount).toBe(200);
      expect(result1.userAmount).toBe(300);

      // Total 1000 THB: State = 200 THB (capped), User = 800 THB
      const result2 = calculateCoPaymentSplit(1000);
      expect(result2.subsidyAmount).toBe(200);
      expect(result2.userAmount).toBe(800);
    });

    it("should return zero split for invalid amounts", () => {
      const result = calculateCoPaymentSplit(0);
      expect(result.subsidyAmount).toBe(0);
      expect(result.userAmount).toBe(0);
    });
  });

  describe("Formatting Co-payment Details", () => {
    it("should format co-payment notes and append tags correctly", () => {
      const { note, tags } = formatCoPaymentDetails(300, 180, "กินข้าวเที่ยง", [
        "อาหาร",
      ]);
      expect(note).toBe(
        "ไทยช่วยไทย 60/40 (ยอดเต็ม: 300.00 บ., รัฐช่วย: 180.00 บ.) - กินข้าวเที่ยง",
      );
      expect(tags).toContain("ไทยช่วยไทย");
      expect(tags).toContain("60-40");
      expect(tags).toContain("อาหาร");
    });

    it("should not append redundant trigger words if note only contains trigger", () => {
      const { note } = formatCoPaymentDetails(100, 60, "ทชท", []);
      expect(note).toBe(
        "ไทยช่วยไทย 60/40 (ยอดเต็ม: 100.00 บ., รัฐช่วย: 60.00 บ.)",
      );
    });
  });

  describe("Parsing Subsidy from Transaction History", () => {
    it("should parse standard subsidy amount directly from notes", () => {
      const note =
        "ไทยช่วยไทย 60/40 (ยอดเต็ม: 300.00 บ., รัฐช่วย: 180.00 บ.) - มื้อกลางวัน";
      const parsed = parseTransactionSubsidy(120, note, "ไทยช่วยไทย,60-40");
      expect(parsed).toBe(180);
    });

    it("should fallback to estimation (userPaid * 1.5) if not in note but has co-pay tag", () => {
      // User paid 40 THB (40%), estimated state subsidy (60%) = 40 * 1.5 = 60 THB
      const parsed = parseTransactionSubsidy(
        40,
        "กินส้มตำคนละครึ่ง",
        "คนละครึ่ง",
      );
      expect(parsed).toBe(60);
    });

    it("should cap estimated fallback subsidy at 200 THB daily max limit", () => {
      // User paid 300 THB, estimated co-pay subsidy would be 300 * 1.5 = 450, but capped at 200
      const parsed = parseTransactionSubsidy(300, "จัดเลี้ยง ทชท", "ทชท");
      expect(parsed).toBe(200);
    });

    it("should return 0 subsidy if transaction is not a co-payment campaign", () => {
      const parsed = parseTransactionSubsidy(
        250,
        "ซื้อของใช้ทั่วไป",
        "ช้อปปิ้ง",
      );
      expect(parsed).toBe(0);
    });
  });

  describe("Feature Toggle Global Integrity", () => {
    it("should check shouldApplyCoPayment behaves correctly based on state", () => {
      // If active, expense with co-payment tag should trigger
      const activeCheck = shouldApplyCoPayment("EXPENSE", "ส้มตำ ทชท", []);
      expect(activeCheck).toBe(IS_CO_PAYMENT_ACTIVE);
    });
  });
});
