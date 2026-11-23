// ข้อความที่แสดงแถวรายวันในรายงานการเข้างาน — pure functions (ใช้ได้ทั้ง client/server)
// ตาราง (desktop) กับรายการแบบแถว (มือถือ) ใช้ค่าเดียวกันจากที่นี่
import { AttendanceStatusType } from "@/features/attendance/types/attendance-status";
import type { AttendanceRecord } from "@/lib/types/attendance";
import { dateFormatters, formatHoursSafe } from "@/lib/utils/date-formatting";

/** เวลามาตรฐานของวันลาที่ไม่มีการลงเวลา (Auto-stamp 08:00–17:00 = 9 ชม.) */
const LEAVE_DEFAULT_CHECK_IN = "08:00";
const LEAVE_DEFAULT_CHECK_OUT = "17:00";
const LEAVE_DEFAULT_HOURS = "9.00";

const isLeaveDay = (record: AttendanceRecord): boolean =>
  record.status === AttendanceStatusType.LEAVE;

export const getRecordCheckInText = (record: AttendanceRecord): string => {
  if (isLeaveDay(record) && !record.checkInTime) {
    return LEAVE_DEFAULT_CHECK_IN;
  }
  return dateFormatters.time24(record.checkInTime);
};

export const getRecordCheckOutText = (record: AttendanceRecord): string => {
  if (record.checkOutTime) {
    return dateFormatters.time24(record.checkOutTime);
  }
  return isLeaveDay(record) ? LEAVE_DEFAULT_CHECK_OUT : "-";
};

export const getRecordHoursText = (record: AttendanceRecord): string => {
  if (isLeaveDay(record) && !record.hoursWorked) {
    return LEAVE_DEFAULT_HOURS;
  }
  return formatHoursSafe(record.hoursWorked);
};
