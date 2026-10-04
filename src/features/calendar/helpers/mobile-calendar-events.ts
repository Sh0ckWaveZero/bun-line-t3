import { isSameDay } from "date-fns";
import type {
  CalendarHoliday,
  CalendarLeave,
} from "@/features/calendar/hooks/useCalendarData";
import { toDateKey } from "@/features/calendar/helpers/calendar-grid";

export type CalendarFilter = "all" | "holidays" | "leaves";

export interface CalendarDayEvents {
  holiday: CalendarHoliday | undefined;
  leave: CalendarLeave | undefined;
  isToday: boolean;
}

export interface CalendarEvent extends CalendarDayEvents {
  date: Date;
}

export function getCalendarEventsForDate(
  date: Date,
  holidays: CalendarHoliday[],
  leaves: CalendarLeave[],
  now: Date,
): CalendarDayEvents {
  const dateKey = toDateKey(date);
  const holiday = holidays.find((item) => item.date === dateKey);
  const leave = leaves.find((item) => item.date === dateKey);

  return { holiday, leave, isToday: isSameDay(date, now) };
}

export function filterMonthEvents(
  days: Date[],
  holidays: CalendarHoliday[],
  leaves: CalendarLeave[],
  filter: CalendarFilter,
  now: Date,
): CalendarEvent[] {
  return days
    .map((date) => {
      const events = getCalendarEventsForDate(date, holidays, leaves, now);
      const hasEvent = events.holiday || events.leave;

      if (filter === "holidays" && !events.holiday) return null;
      if (filter === "leaves" && !events.leave) return null;
      if (filter === "all" && !hasEvent && !events.isToday) return null;

      return { date, ...events };
    })
    .filter((event): event is CalendarEvent => Boolean(event));
}
