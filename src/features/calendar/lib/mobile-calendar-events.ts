import { isSameDay } from "date-fns";
import type {
  CalendarHoliday,
  CalendarLeave,
  CalendarWorkModeDay,
} from "@/features/calendar/hooks/useCalendarData";
import { formatDateKey } from "@/features/calendar/lib/calendar-format";

export type MobileCalendarFilter =
  | "all"
  | "holidays"
  | "leaves"
  | "wfh"
  | "onsite";

export interface CalendarEvent {
  date: Date;
  holiday: CalendarHoliday | undefined;
  leave: CalendarLeave | undefined;
  workMode: CalendarWorkModeDay | undefined;
  isToday: boolean;
}

type DayEvents = Omit<CalendarEvent, "date">;

/** รวม event ของวันหนึ่ง (holiday / leave / workMode) พร้อม flag ว่าเป็นวันนี้หรือไม่ */
export function getMobileEventsForDate(
  date: Date,
  holidays: CalendarHoliday[],
  leaves: CalendarLeave[],
  workModeDays: CalendarWorkModeDay[],
): DayEvents {
  const dateStr = formatDateKey(date);
  const holiday = holidays.find((h) => h.date === dateStr);
  const leave = leaves.find((l) => l.date === dateStr);
  const workMode = workModeDays.find((w) => w.date === dateStr);
  return { holiday, leave, workMode, isToday: isSameDay(date, new Date()) };
}

/** กรองรายการวันตามตัวกรองที่เลือก (all เก็บวันที่มี event หรือวันนี้ไว้ด้วย) */
export function getFilteredMobileEvents(
  days: Date[],
  filter: MobileCalendarFilter,
  holidays: CalendarHoliday[],
  leaves: CalendarLeave[],
  workModeDays: CalendarWorkModeDay[],
): CalendarEvent[] {
  const getEventsForDate = (date: Date) =>
    getMobileEventsForDate(date, holidays, leaves, workModeDays);

  return days
    .map((date) => {
      const events = getEventsForDate(date);
      const hasEvent = events.holiday || events.leave || events.workMode;

      if (filter === "holidays" && !events.holiday) return null;
      if (filter === "leaves" && !events.leave) return null;
      if (filter === "wfh" && events.workMode?.type !== "wfh") return null;
      if (filter === "onsite" && events.workMode?.type !== "onsite")
        return null;
      if (filter === "all" && !hasEvent && !events.isToday) return null;

      return { date, ...events };
    })
    .filter((event): event is CalendarEvent => Boolean(event));
}

/** สรุปจำนวนแต่ละประเภทของเดือน (ใช้แสดงใน filter chips และ overview) */
export function getMobileEventCounts(
  days: Date[],
  holidays: CalendarHoliday[],
  leaves: CalendarLeave[],
  workModeDays: CalendarWorkModeDay[],
): {
  holidayCount: number;
  leaveCount: number;
  wfhCount: number;
  onsiteCount: number;
  totalMarkedDays: number;
} {
  const getEventsForDate = (date: Date) =>
    getMobileEventsForDate(date, holidays, leaves, workModeDays);

  const holidayCount = days.filter(
    (date) => getEventsForDate(date).holiday,
  ).length;
  const leaveCount = days.filter((date) => getEventsForDate(date).leave).length;
  const wfhCount = days.filter(
    (date) => getEventsForDate(date).workMode?.type === "wfh",
  ).length;
  const onsiteCount = days.filter(
    (date) => getEventsForDate(date).workMode?.type === "onsite",
  ).length;
  const totalMarkedDays = days.filter((date) => {
    const events = getEventsForDate(date);
    return events.holiday || events.leave || events.workMode || events.isToday;
  }).length;

  return { holidayCount, leaveCount, wfhCount, onsiteCount, totalMarkedDays };
}

/** ข้อความ empty state ของแต่ละตัวกรอง */
export function getMobileCalendarEmptyTitle(filter: MobileCalendarFilter): string {
  if (filter === "all") return "ไม่มีวันหยุดหรือวันลาในเดือนนี้";
  if (filter === "holidays") return "ไม่มีวันหยุดในเดือนนี้";
  if (filter === "wfh") return "ไม่มีวัน WFH ในเดือนนี้";
  if (filter === "onsite") return "ไม่มีวัน On Site ในเดือนนี้";
  return "ไม่มีวันลาในเดือนนี้";
}
