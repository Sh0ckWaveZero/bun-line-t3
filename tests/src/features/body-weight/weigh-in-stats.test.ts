import { describe, expect, test } from "bun:test";
import { METRIC_TREND } from "@/features/body-weight/constants/metrics";
import {
  buildDailySeries,
  compareMetric,
  filterHistory,
  findReferenceMeasurement,
  movingAverage,
} from "@/features/body-weight/helpers/weigh-in-stats";
import type { ScaleMeasurementDto } from "@/features/body-weight/types";

const measurement = (
  id: string,
  measuredAt: string,
  weightKg: number,
  profileId: string | null = "alex",
): ScaleMeasurementDto => ({
  id,
  profileId,
  profileName: profileId,
  weightKg,
  impedance: null,
  measuredAt,
  metrics: { bmi: 25, age: 30, bmr: 1600, visceralFat: 10 },
});

describe("findReferenceMeasurement", () => {
  // เรียงใหม่ → เก่า เหมือน snapshot จาก API
  const list = [
    measurement("m4", "2026-10-20T00:00:00.000Z", 80.0),
    measurement("m3", "2026-10-19T23:58:00.000Z", 80.1), // การชั่งเดียวกัน (ห่าง 2 นาที)
    measurement("sam", "2026-10-19T00:00:00.000Z", 60.0, "sam"),
    measurement("m2", "2026-10-19T00:00:00.000Z", 81.0),
    measurement("m1", "2026-10-10T00:00:00.000Z", 82.0),
  ];
  const current = list[0]!;

  test("ครั้งก่อน — ข้ามการชั่งที่ห่างไม่ถึง 3 นาที และโปรไฟล์อื่น", () => {
    expect(findReferenceMeasurement(list, current, 0)?.id).toBe("m2");
  });

  test("7 วัน — ใหม่สุดที่เก่ากว่า 7 วัน", () => {
    expect(findReferenceMeasurement(list, current, 7)?.id).toBe("m1");
  });

  test("ไม่มีการชั่งเก่าพอ — null", () => {
    expect(findReferenceMeasurement(list, current, 30)).toBeNull();
  });
});

describe("compareMetric", () => {
  test("น้ำหนักลด — ดี", () => {
    expect(compareMetric(80, 81, 2, METRIC_TREND.lowerIsBetter)).toEqual({
      direction: "down",
      amount: 1,
      tone: "good",
    });
  });

  test("กล้ามเนื้อลด — แย่", () => {
    expect(
      compareMetric(57.9, 58.1, 1, METRIC_TREND.higherIsBetter)?.tone,
    ).toBe("bad");
  });

  test("impedance — สีกลางทั้งขึ้นและลง", () => {
    expect(compareMetric(478, 455, 0, METRIC_TREND.neutral)?.tone).toBe(
      "neutral",
    );
  });

  test("ต่างไม่ถึงครึ่งหลักที่แสดง — เท่าเดิม ไม่ขึ้น ▲ 0.0", () => {
    expect(
      compareMetric(25.04, 25.0, 1, METRIC_TREND.lowerIsBetter)?.direction,
    ).toBe("same");
  });

  test("ไม่มีค่าฝั่งใดฝั่งหนึ่ง — null", () => {
    expect(compareMetric(null, 25, 1, METRIC_TREND.lowerIsBetter)).toBeNull();
  });
});

describe("filterHistory", () => {
  const list = [
    measurement("a", "2026-10-20T00:00:00.000Z", 80),
    measurement("s", "2026-10-20T00:00:00.000Z", 60, "sam"),
    measurement("u", "2026-10-20T00:00:00.000Z", 70, null),
  ];

  test("โปรไฟล์ที่เลือก + การชั่งที่ยังไม่มีเจ้าของ", () => {
    expect(filterHistory(list, "alex", false).map((m) => m.id)).toEqual([
      "a",
      "u",
    ]);
  });

  test("ทุกคน", () => {
    expect(filterHistory(list, "alex", true)).toHaveLength(3);
  });
});

describe("buildDailySeries", () => {
  test("แบ่งวันตามเวลากรุงเทพ — 23:30 UTC เป็นวันถัดไป", () => {
    const points = buildDailySeries(
      [measurement("a", "2026-10-19T23:30:00.000Z", 80)],
      (m) => m.weightKg,
      null,
    );
    expect(points[0]?.date.toISOString()).toBe("2026-10-20T00:00:00.000Z");
  });

  test("วันเดียวกันใช้ผลชั่งท้ายวัน และตัดตามช่วง", () => {
    const now = new Date("2026-10-22T00:00:00.000Z");
    const points = buildDailySeries(
      [
        measurement("late", "2026-10-20T10:00:00.000Z", 79.5),
        measurement("early", "2026-10-20T01:00:00.000Z", 80),
        measurement("old", "2026-08-01T01:00:00.000Z", 85),
      ],
      (m) => m.weightKg,
      30,
      now,
    );
    expect(points).toEqual([
      { date: new Date("2026-10-20T00:00:00.000Z"), value: 79.5 },
    ]);
  });
});

describe("movingAverage", () => {
  test("เฉลี่ยย้อนหลัง 7 วันตามเวลา", () => {
    const day = (d: number) => new Date(Date.UTC(2026, 9, d));
    const average = movingAverage([
      { date: day(1), value: 80 },
      { date: day(2), value: 82 },
      { date: day(9), value: 90 },
    ]);
    expect(average.map((p) => p.value)).toEqual([80, 81, 90]);
  });
});
