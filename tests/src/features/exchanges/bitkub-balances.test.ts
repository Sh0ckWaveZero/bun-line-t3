import { describe, expect, it } from "bun:test";
import {
  bitkubBalancesSchema,
  findThbAvailable,
} from "@/features/exchanges/lib/bitkub-balances";

const validPayload = {
  code: "0",
  message: "success",
  data: [
    { currency: "BTC", available: "0.001", reserved: "0", total: "0.001" },
    { currency: "THB", available: "96.50", reserved: "10", total: "106.50" },
  ],
};

describe("bitkubBalancesSchema", () => {
  it("ยอมรับ response แบบ v4 (code เป็น string, ยอดเป็น string)", () => {
    const parsed = bitkubBalancesSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it("ยอมรับ code เป็น number 0 (docs ไม่สม่ำเสมอ)", () => {
    const parsed = bitkubBalancesSchema.safeParse({
      ...validPayload,
      code: 0,
    });
    expect(parsed.success).toBe(true);
  });

  it("ปฏิเสธ response ที่ error (code ไม่ใช่ 0)", () => {
    const parsed = bitkubBalancesSchema.safeParse({
      code: "V1003-CW",
      message: "Invalid signature",
      data: {},
    });
    expect(parsed.success).toBe(false);
  });
});

describe("findThbAvailable", () => {
  it("ดึงยอด THB available จากรายการ wallet", () => {
    const parsed = bitkubBalancesSchema.parse(validPayload);
    expect(findThbAvailable(parsed)).toBe(96.5);
  });

  it("แปลงยอดรูปแบบ number ได้", () => {
    const parsed = bitkubBalancesSchema.parse({
      ...validPayload,
      data: [
        { currency: "THB", available: 107.99, reserved: 0, total: 107.99 },
      ],
    });
    expect(findThbAvailable(parsed)).toBe(107.99);
  });

  it("คืน null เมื่อไม่มี THB", () => {
    const parsed = bitkubBalancesSchema.parse({
      ...validPayload,
      data: [
        { currency: "BTC", available: "0.001", reserved: "0", total: "0.001" },
      ],
    });
    expect(findThbAvailable(parsed)).toBeNull();
  });

  it("คืน null เมื่อยอดไม่ใช่ตัวเลขที่ใช้ได้", () => {
    const parsed = bitkubBalancesSchema.parse({
      ...validPayload,
      data: [{ currency: "THB", available: "N/A", reserved: "0", total: "0" }],
    });
    expect(findThbAvailable(parsed)).toBeNull();
  });
});
