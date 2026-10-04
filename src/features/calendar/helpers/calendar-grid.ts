import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getYear,
  startOfMonth,
} from "date-fns";
import { th } from "date-fns/locale";

export interface CalendarGridMeta {
  days: Date[];
  firstDayOfWeek: number;
  rowCount: number;
  trailingCellCount: number;
}

export interface CalendarMonthOption {
  value: number;
  label: string;
}

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getBuddhistYear(date: Date): number {
  return getYear(date) + 543;
}

export function getMonthDays(currentDate: Date): Date[] {
  return eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });
}

export function getCalendarGridMeta(currentDate: Date): CalendarGridMeta {
  const days = getMonthDays(currentDate);
  const firstDayOfWeek = days[0]?.getDay() ?? 0;
  const rowCount = Math.ceil((firstDayOfWeek + days.length) / 7);
  const trailingCellCount = rowCount * 7 - firstDayOfWeek - days.length;

  return { days, firstDayOfWeek, rowCount, trailingCellCount };
}

export function getMonthOptions(selectedYear: number): CalendarMonthOption[] {
  return Array.from({ length: 12 }, (_, month) => ({
    value: month,
    label: format(new Date(selectedYear, month, 1), "MMMM", { locale: th }),
  }));
}

export function getYearOptions(selectedYear: number): number[] {
  return Array.from({ length: 11 }, (_, index) => selectedYear - 5 + index);
}
