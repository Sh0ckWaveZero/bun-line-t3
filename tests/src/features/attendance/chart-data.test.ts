import { describe, expect, test } from "bun:test";
import {
  buildDailyAverageHoursData,
  buildHoursChartData,
} from "@/features/attendance/helpers/chart-data";
import type { AttendanceRecord } from "@/lib/types/attendance";

const makeRecord = (
  overrides: Partial<AttendanceRecord>,
): AttendanceRecord => ({
  id: "rec_1",
  workDate: "2026-11-02",
  checkInTime: "2026-11-02T01:00:00.000Z",
  checkOutTime: "2026-11-02T10:00:00.000Z",
  status: "CHECKED_OUT",
  hoursWorked: 9,
  ...overrides,
});

describe("buildHoursChartData", () => {
  test("เรียง record ตามวันที่และจับคู่ label เต็มกับ label ย่อ", () => {
    const { points, compactLabels } = buildHoursChartData([
      makeRecord({ id: "a", workDate: "2026-11-05", hoursWorked: 8 }),
      makeRecord({ id: "b", workDate: "2026-11-02", hoursWorked: 9 }),
      makeRecord({ id: "c", workDate: "2026-11-09", hoursWorked: 7.8 }),
    ]);

    expect(points.map((point) => point.label)).toEqual([
      "2 พ.ย.",
      "5 พ.ย.",
      "9 พ.ย.",
    ]);
    expect(compactLabels).toEqual(["2", "5", "9"]);
    expect(points.map((point) => point.value)).toEqual([9, 8, 7.8]);
  });

  test("ชั่วโมงที่เป็น null นับเป็น 0", () => {
    const { points } = buildHoursChartData([makeRecord({ hoursWorked: null })]);
    expect(points[0]?.value).toBe(0);
  });

  test("วันที่ invalid ให้ label เป็น Invalid และไม่ทำให้ทั้งชุดพัง", () => {
    const { points, compactLabels } = buildHoursChartData([
      makeRecord({ workDate: "not-a-date" }),
      makeRecord({ id: "ok", workDate: "2026-11-02" }),
    ]);
    expect(points[0]?.label).toBe("Invalid");
    expect(compactLabels).toContain("Invalid");
    expect(points[1]?.label).toBe("2 พ.ย.");
  });
});

describe("buildDailyAverageHoursData", () => {
  test("เรียงเป็น จันทร์ → อาทิตย์ พร้อมชื่อวันย่อ", () => {
    const { labels, compactLabels } = buildDailyAverageHoursData([]);
    expect(labels).toEqual([
      "จันทร์",
      "อังคาร",
      "พุธ",
      "พฤหัสบดี",
      "ศุกร์",
      "เสาร์",
      "อาทิตย์",
    ]);
    expect(compactLabels).toEqual(["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."]);
  });

  test("เฉลี่ยชั่วโมงรายวันของสัปดาห์ถูกต้อง และวันที่ไม่มีข้อมูลเป็น 0", () => {
    // เลือกวันที่ที่ getDay() === 1 (วันจันทร์) แบบไม่ผูกกับ timezone ของเครื่อง
    const monday = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(2026, 10, 2 + i);
      return { date, iso: date.toISOString().slice(0, 10) };
    }).find(({ date }) => date.getDay() === 1)!.iso;

    const { values, labels } = buildDailyAverageHoursData([
      makeRecord({ id: "a", workDate: monday, hoursWorked: 8 }),
      makeRecord({ id: "b", workDate: monday, hoursWorked: 10 }),
    ]);

    const mondayIndex = labels.indexOf("จันทร์");
    expect(values[mondayIndex]).toBe(9);
    expect(values.filter((value, index) => index !== mondayIndex)).toEqual([
      0, 0, 0, 0, 0, 0,
    ]);
  });

  test("ข้าม record ที่ไม่มีชั่วโมงหรือวันที่ invalid", () => {
    const { values } = buildDailyAverageHoursData([
      makeRecord({ hoursWorked: null }),
      makeRecord({ workDate: "not-a-date", hoursWorked: 5 }),
    ]);
    expect(values.every((value) => value === 0)).toBe(true);
  });
});
