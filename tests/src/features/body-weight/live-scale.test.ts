import { describe, expect, test } from "bun:test";
import {
  CLOSED_WEIGH_IN_OVERLAY,
  getLiveStatus,
  LIVE_READING_MAX_AGE_MS,
  nextWeighInOverlay,
  shouldOpenWeighInResult,
} from "@/features/body-weight/helpers/live-scale";

const reading = (overrides: Partial<Parameters<typeof getLiveStatus>[0] & object> = {}) => ({
  weightKg: 65.2,
  impedance: null,
  stabilized: false,
  removed: false,
  ageMs: 500,
  ...overrides,
});

describe("getLiveStatus", () => {
  test("ไม่มี packet หรือเก่าเกิน — idle", () => {
    expect(getLiveStatus(null)).toBe("idle");
    expect(
      getLiveStatus(reading({ ageMs: LIVE_READING_MAX_AGE_MS + 1 })),
    ).toBe("idle");
  });

  test("ยังไม่นิ่ง — measuring", () => {
    expect(getLiveStatus(reading())).toBe("measuring");
  });

  test("นิ่งแล้วแต่ยังไม่มี impedance — waitingImpedance", () => {
    expect(getLiveStatus(reading({ stabilized: true }))).toBe(
      "waitingImpedance",
    );
  });

  test("นิ่ง + impedance — complete", () => {
    expect(getLiveStatus(reading({ stabilized: true, impedance: 490 }))).toBe(
      "complete",
    );
  });

  test("ลงจากตาชั่ง — steppedOff", () => {
    expect(getLiveStatus(reading({ stabilized: true, removed: true }))).toBe(
      "steppedOff",
    );
  });
});

describe("shouldOpenWeighInResult", () => {
  const saved = {
    version: 3,
    lastMeasurement: { id: "m-1", status: "saved" as const },
  };

  test("poll แรกหลังเปิดหน้า — ไม่เด้งผลเก่า", () => {
    expect(shouldOpenWeighInResult(null, saved)).toBe(false);
  });

  test("การชั่งใหม่หลังเปิดหน้า — เปิด", () => {
    expect(shouldOpenWeighInResult(2, saved)).toBe(true);
  });

  test("version เดิม — ไม่เปิดซ้ำ", () => {
    expect(shouldOpenWeighInResult(3, saved)).toBe(false);
  });

  test("updated (impedance ตามมา) — ไม่เปิดใหม่", () => {
    expect(
      shouldOpenWeighInResult(3, {
        version: 4,
        lastMeasurement: { id: "m-1", status: "updated" },
      }),
    ).toBe(false);
  });
});

describe("nextWeighInOverlay", () => {
  const live = { isOpen: true, measurementId: null };

  test("เริ่มเหยียบหลังเปิดหน้า — เปิดเต็มจอทันที", () => {
    expect(
      nextWeighInOverlay(CLOSED_WEIGH_IN_OVERLAY, {
        previousStatus: "idle",
        status: "measuring",
        savedMeasurementId: null,
      }),
    ).toEqual(live);
  });

  test("ขึ้นชั่งซ้ำหลังเพิ่งลง (steppedOff → measuring) — เปิด", () => {
    expect(
      nextWeighInOverlay(CLOSED_WEIGH_IN_OVERLAY, {
        previousStatus: "steppedOff",
        status: "measuring",
        savedMeasurementId: null,
      }),
    ).toEqual(live);
  });

  test("ปิดไปแล้วแต่ยังยืนอยู่ (complete) — ไม่เปิดซ้ำ", () => {
    expect(
      nextWeighInOverlay(CLOSED_WEIGH_IN_OVERLAY, {
        previousStatus: "complete",
        status: "complete",
        savedMeasurementId: null,
      }),
    ).toEqual(CLOSED_WEIGH_IN_OVERLAY);
  });

  test("poll แรกมีคนยืนอยู่แล้ว — ไม่เปิด", () => {
    expect(
      nextWeighInOverlay(CLOSED_WEIGH_IN_OVERLAY, {
        previousStatus: null,
        status: "measuring",
        savedMeasurementId: null,
      }),
    ).toEqual(CLOSED_WEIGH_IN_OVERLAY);
  });

  test("packet ลงจากตาชั่ง (ผลเก่าส่งซ้ำ) — ไม่เปิด", () => {
    expect(
      nextWeighInOverlay(CLOSED_WEIGH_IN_OVERLAY, {
        previousStatus: "idle",
        status: "steppedOff",
        savedMeasurementId: null,
      }),
    ).toEqual(CLOSED_WEIGH_IN_OVERLAY);
  });

  test("บันทึกแล้ว — ผูก measurement id", () => {
    expect(
      nextWeighInOverlay(live, {
        previousStatus: "measuring",
        status: "waitingImpedance",
        savedMeasurementId: "m-9",
      }),
    ).toEqual({ isOpen: true, measurementId: "m-9" });
  });

  test("ลงก่อนนิ่ง (ไม่มีการบันทึก) — ปิดเมื่อกลับเป็น idle", () => {
    expect(
      nextWeighInOverlay(live, {
        previousStatus: "measuring",
        status: "idle",
        savedMeasurementId: null,
      }),
    ).toEqual(CLOSED_WEIGH_IN_OVERLAY);
  });

  test("บันทึกแล้ว + ลงจากตาชั่ง — ค้างไว้ให้ดูผล (ปิดด้วย timer)", () => {
    const saved = { isOpen: true, measurementId: "m-9" };
    expect(
      nextWeighInOverlay(saved, {
        previousStatus: "complete",
        status: "idle",
        savedMeasurementId: null,
      }),
    ).toEqual(saved);
  });
});
