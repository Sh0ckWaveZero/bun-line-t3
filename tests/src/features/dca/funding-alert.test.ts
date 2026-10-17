import { describe, expect, it } from "bun:test";
import {
  DCA_FUNDING_THRESHOLD_THB,
  buildDcaFundingAlertMessage,
  isDcaFundingLow,
} from "@/features/dca/constants/funding-alert";

describe("isDcaFundingLow", () => {
  it("เกณฑ์ต่ำกว่า 108 บาท", () => {
    expect(DCA_FUNDING_THRESHOLD_THB).toBe(108);
    expect(isDcaFundingLow(107.99)).toBe(true);
    expect(isDcaFundingLow(0)).toBe(true);
  });

  it("พอดีเกณฑ์หรือมากกว่าถือว่าไม่ต่ำ", () => {
    expect(isDcaFundingLow(108)).toBe(false);
    expect(isDcaFundingLow(108.01)).toBe(false);
    expect(isDcaFundingLow(1_000)).toBe(false);
  });
});

describe("buildDcaFundingAlertMessage", () => {
  it("ระบุเกณฑ์และยอดคงเหลือเป็นภาษาไทย", () => {
    const message = buildDcaFundingAlertMessage(12.5);
    expect(message).toContain("แจ้งเตือนเงินทุน DCA");
    expect(message).toContain("108.00");
    expect(message).toContain("12.50");
  });

  it("จัดรูปเลขทศนิยมสองตำแหน่งเสมอ", () => {
    const message = buildDcaFundingAlertMessage(90);
    expect(message).toContain("90.00");
  });
});
