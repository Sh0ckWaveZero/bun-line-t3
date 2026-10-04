import { format, isWeekend } from "date-fns";
import { getLeaveTypeLabel } from "@/features/calendar/helpers/calendar-events";
import {
  getCalendarDayCellClassName,
  getDayCellAriaLabel,
  getDayNumberClassName,
} from "@/features/calendar/helpers/calendar-display";
import type {
  CalendarHoliday as Holiday,
  CalendarLeave as Leave,
} from "@/features/calendar/hooks/useCalendarData";

interface CalendarDayCellProps {
  date: Date;
  holiday: Holiday | undefined;
  leave: Leave | undefined;
  isToday: boolean;
  onDayClick: (date: Date) => void;
}

export function CalendarDayCell({
  date,
  holiday,
  leave,
  isToday,
  onDayClick,
}: CalendarDayCellProps) {
  const isWeekendDay = isWeekend(date);
  const hasEvent = Boolean(holiday || leave);
  const dateStr = format(date, "yyyy-MM-dd");

  return (
    <button
      id={`calendar-day-${dateStr}`}
      type="button"
      className={getCalendarDayCellClassName(isToday, hasEvent, isWeekendDay)}
      onClick={() => onDayClick(date)}
      aria-label={getDayCellAriaLabel(date, holiday, leave)}
    >
      <span
        id={`calendar-day-number-${dateStr}`}
        className={getDayNumberClassName(isToday, isWeekendDay, !!holiday)}
      >
        {format(date, "d")}
      </span>

      <div className="mt-0.5 min-h-0 flex-1 space-y-0.5 overflow-hidden lg:mt-1 lg:space-y-1">
        {holiday && (
          <div
            id={`calendar-holiday-${dateStr}`}
            className="bg-destructive/10 text-destructive flex items-center gap-1 rounded px-1 py-px text-[10px] leading-tight font-semibold lg:px-1.5 lg:py-0.5 lg:text-[11px]"
            title={holiday.nameThai}
          >
            <span className="bg-destructive text-destructive-foreground flex h-3 w-3 shrink-0 items-center justify-center rounded-full text-[8px] lg:h-3.5 lg:w-3.5">
              ★
            </span>
            <span className="min-w-0 truncate">{holiday.nameThai}</span>
          </div>
        )}

        {leave && (
          <div
            id={`calendar-leave-${dateStr}`}
            className="bg-primary/10 text-primary flex items-center gap-1 rounded px-1 py-px text-[10px] leading-tight font-semibold lg:px-1.5 lg:py-0.5 lg:text-[11px]"
            title={`วันลา${getLeaveTypeLabel(leave.type)}`}
          >
            <span className="border-primary h-3 w-3 shrink-0 rounded-full border-[1.5px] lg:h-3.5 lg:w-3.5" />
            <span className="min-w-0 truncate">
              {getLeaveTypeLabel(leave.type)}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
