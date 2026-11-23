import { describe, expect, test } from "bun:test";
import {
  getRecordCheckInText,
  getRecordCheckOutText,
  getRecordHoursText,
} from "@/features/attendance/helpers/record-display";
import type { AttendanceRecord } from "@/lib/types/attendance";

const makeRecord = (
  overrides: Partial<AttendanceRecord>,
): AttendanceRecord => ({
  id: "rec_1",
  workDate: "2026-11-02",
  checkInTime: "2026-11-02T01:00:00.000Z", // 08:00 ไทย
  checkOutTime: "2026-11-02T10:00:00.000Z", // 17:00 ไทย
  status: "CHECKED_OUT",
  hoursWorked: 9,
  ...overrides,
});

describe("record display (ตาราง + รายการมือถือ ใช้ค่าเดียวกัน)", () => {
  test("วันทำงานปกติ แสดงเวลาเข้า-ออกและชั่วโมง", () => {
    const record = makeRecord({});
    expect(getRecordCheckInText(record)).toBe("08:00");
    expect(getRecordCheckOutText(record)).toBe("17:00");
    expect(getRecordHoursText(record)).toBe("9 ชั่วโมง");
  });

  test("ยังไม่ออกงาน (ไม่มี checkOutTime) แสดง -", () => {
    const record = makeRecord({ checkOutTime: null, hoursWorked: null });
    expect(getRecordCheckOutText(record)).toBe("-");
    expect(getRecordHoursText(record)).toBe("-");
  });

  test("วันลาที่ไม่มีการลงเวลา ใช้เวลามาตรฐาน 08:00–17:00 = 9.00", () => {
    const record = makeRecord({
      status: "LEAVE",
      checkInTime: "",
      checkOutTime: null,
      hoursWorked: null,
    });
    expect(getRecordCheckInText(record)).toBe("08:00");
    expect(getRecordCheckOutText(record)).toBe("17:00");
    expect(getRecordHoursText(record)).toBe("9.00");
  });

  test("วันลาที่มี auto-stamp แสดงเวลาตามข้อมูลจริง", () => {
    const record = makeRecord({ status: "LEAVE" });
    expect(getRecordCheckInText(record)).toBe("08:00");
    expect(getRecordCheckOutText(record)).toBe("17:00");
    expect(getRecordHoursText(record)).toBe("9 ชั่วโมง");
  });

  test("ชั่วโมงทศนิยมปัดเป็น 1 ตำแหน่ง", () => {
    expect(getRecordHoursText(makeRecord({ hoursWorked: 7.83 }))).toBe(
      "7.8 ชั่วโมง",
    );
  });
});
