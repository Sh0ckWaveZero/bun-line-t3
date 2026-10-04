import type {
  CalendarHoliday,
  CalendarLeave,
} from "@/features/calendar/hooks/useCalendarData";
import { toDateKey } from "@/features/calendar/helpers/calendar-grid";

const LEAVE_TYPE_LABELS = {
  personal: "ลากิจ",
  sick: "ลาป่วย",
  vacation: "ลาพักผ่อน",
} as const;

const HOLIDAY_TYPE_LABELS = {
  national: "วันหยุดราชการ",
  royal: "วันหยุดเกี่ยวกับราชวงศ์",
  religious: "วันหยุดศาสนาจาร",
  special: "วันหยุดพิเศษ",
} as const;

export function getLeaveTypeLabel(type: string): string {
  return LEAVE_TYPE_LABELS[type as keyof typeof LEAVE_TYPE_LABELS] ?? type;
}

export function getHolidayTypeLabel(type: string): string {
  return HOLIDAY_TYPE_LABELS[type as keyof typeof HOLIDAY_TYPE_LABELS] ?? type;
}

export function findHolidayForDate(
  holidays: CalendarHoliday[],
  date: Date,
): CalendarHoliday | undefined {
  const dateKey = toDateKey(date);
  return holidays.find((holiday) => holiday.date === dateKey);
}

export function findLeaveForDate(
  leaves: CalendarLeave[],
  date: Date,
): CalendarLeave | undefined {
  const dateKey = toDateKey(date);
  return leaves.find((leave) => leave.date === dateKey);
}

export interface MonthEventCounts {
  holidayCount: number;
  leaveCount: number;
  workingDayCount: number;
}

export function getMonthEventCounts(
  days: Date[],
  holidays: CalendarHoliday[],
  leaves: CalendarLeave[],
): MonthEventCounts {
  const holidayCount = days.filter(
    (date) => findHolidayForDate(holidays, date) !== undefined,
  ).length;
  const leaveCount = days.filter(
    (date) => findLeaveForDate(leaves, date) !== undefined,
  ).length;

  return {
    holidayCount,
    leaveCount,
    workingDayCount: days.length - holidayCount - leaveCount,
  };
}
