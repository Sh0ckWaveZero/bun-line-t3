import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getLeaveTypeLabel } from "@/features/calendar/helpers/calendar-events";
import type {
  CalendarHoliday as Holiday,
  CalendarLeave as Leave,
} from "@/features/calendar/hooks/useCalendarData";

// Pure display helpers — เก็บเงื่อนไข className/aria-label ของ day cell
// และ event card ไว้ที่เดียว เพื่อให้ component เองเรียบง่าย

export function getCalendarDayCellClassName(
  isToday: boolean,
  hasEvent: boolean,
  isWeekendDay: boolean,
) {
  return cn(
    "group relative flex min-h-28 cursor-pointer flex-col border-b p-1.5 text-left transition-colors lg:min-h-32 lg:p-2",
    "border-border/50 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
    isToday && "bg-primary/[0.04]",
    !isToday && !hasEvent && !isWeekendDay && "hover:bg-muted/30",
    !isToday && !hasEvent && isWeekendDay && "bg-muted/15 hover:bg-muted/30",
  );
}

export function getDayNumberClassName(
  isToday: boolean,
  isWeekendDay: boolean,
  hasHoliday: boolean,
) {
  return cn(
    "flex h-6 w-6 items-center justify-center rounded-md text-sm leading-none font-bold",
    "lg:h-7 lg:w-7 lg:text-base",
    isToday && "bg-primary text-primary-foreground font-black",
    !isToday && isWeekendDay && !hasHoliday && "text-destructive/70",
    !isToday && !isWeekendDay && !hasHoliday && "text-foreground",
    !isToday && hasHoliday && "text-foreground",
  );
}

export function getDayCellAriaLabel(
  date: Date,
  holiday: Holiday | undefined,
  leave: Leave | undefined,
) {
  return `${format(date, "d MMMM yyyy", { locale: th })}${holiday ? ` ${holiday.nameThai}` : ""}${leave ? ` วันลา${getLeaveTypeLabel(leave.type)}` : ""}`;
}

export function getMobileEventCardClassName(
  holiday: Holiday | undefined,
  leave: Leave | undefined,
  isToday: boolean,
) {
  const isMixed = Boolean(holiday && leave);
  return cn(
    "border-border bg-card overflow-hidden rounded-xl border transition-transform duration-150 active:scale-[0.99]",
    holiday && !leave && "border-destructive/30",
    leave && !holiday && "border-primary/30",
    isMixed && "border-accent/30",
    isToday && "ring-primary ring-offset-background ring-2 ring-offset-1",
  );
}

export function getMobileEventHeaderClassName(
  holiday: Holiday | undefined,
  leave: Leave | undefined,
) {
  const isMixed = Boolean(holiday && leave);
  return cn(
    "border-border flex items-center justify-between gap-3 border-b px-3.5 py-2.5",
    holiday && !leave && "bg-destructive/[0.04]",
    leave && !holiday && "bg-primary/[0.04]",
    isMixed && "bg-accent/[0.04]",
    !holiday && !leave && "bg-muted/30",
  );
}

export function getMobileEventCardAriaLabel(dayOfWeek: string, date: Date) {
  return `${dayOfWeek}ที่ ${format(date, "d")} ${format(date, "MMMM", { locale: th })}`;
}
