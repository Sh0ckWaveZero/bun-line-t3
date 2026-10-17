import { describe, expect, it } from "bun:test";
import {
  DCA_FUNDING_THRESHOLD_THB,
  isDcaFundingLow,
} from "@/features/dca/constants/funding-alert";
import { createDcaBalanceAlertFlexMessage } from "@/features/line/line-utils/flex-messages";

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

describe("createDcaBalanceAlertFlexMessage", () => {
  const appUrl = "https://example.com";

  it("เป็น flex bubble พร้อม altText บอกยอดและเกณฑ์", () => {
    const message = createDcaBalanceAlertFlexMessage(
      { thbAvailable: 96.5, threshold: 108 },
      appUrl,
    );

    expect(message.type).toBe("flex");
    expect(message.contents.type).toBe("bubble");
    expect(message.altText).toContain("96.50");
    expect(message.altText).toContain("108.00");
  });

  it("แสดงยอดคงเหลือเป็นสีแดง และมีปุ่มไป dca-history เมื่อมี appUrl", () => {
    const message = createDcaBalanceAlertFlexMessage(
      { thbAvailable: 96.5, threshold: 108 },
      appUrl,
    );
    const bodyContents = message.contents.body.contents;

    expect(bodyContents[1].contents[1].text).toContain("96.50");
    expect(bodyContents[1].contents[1].color).toBe("#DC2626");

    const button = message.contents.footer.contents[0];
    expect(button.action.type).toBe("uri");
    expect(button.action.uri).toBe("https://example.com/dca-history");
  });

  it("ใช้ข้อความแนะนำเติมเงินแทนปุ่มเมื่อไม่มี appUrl", () => {
    const message = createDcaBalanceAlertFlexMessage(
      { thbAvailable: 12.5, threshold: 108 },
      "",
    );

    expect(message.contents.footer.contents[0].type).toBe("text");
    expect(message.contents.footer.contents[0].text).toContain("เติมเงิน");
  });
});
