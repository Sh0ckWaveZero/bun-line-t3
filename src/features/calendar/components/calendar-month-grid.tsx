import { isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { WEEKDAYS } from "@/features/calendar/constants/calendar";
import { CalendarDayCell } from "@/features/calendar/components/calendar-day-cell";
import {
  findHolidayForDate,
  findLeaveForDate,
} from "@/features/calendar/helpers/calendar-events";
import type {
  CalendarHoliday as Holiday,
  CalendarLeave as Leave,
} from "@/features/calendar/hooks/useCalendarData";

interface CalendarMonthGridProps {
  days: Date[];
  firstDayOfWeek: number;
  rowCount: number;
  trailingCellCount: number;
  holidays: Holiday[];
  leaves: Leave[];
  today: Date | null;
  onDayClick: (date: Date) => void;
}

export function CalendarMonthGrid({
  days,
  firstDayOfWeek,
  rowCount,
  trailingCellCount,
  holidays,
  leaves,
  today,
  onDayClick,
}: CalendarMonthGridProps) {
  return (
    <div id="calendar-grid-wrapper" className="flex flex-col">
      <div
        id="calendar-weekdays"
        className="border-border grid shrink-0 grid-cols-7 border-b"
      >
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            id={`calendar-weekday-${day}`}
            className={cn(
              "text-muted-foreground px-3 py-2.5 text-center text-[11px] font-bold tracking-[0.12em] uppercase",
              (day === "อา" || day === "ส") && "text-destructive/60",
            )}
          >
            {day}
          </div>
        ))}
      </div>

      <div
        id="calendar-days-grid"
        className="grid grid-cols-7"
        style={{
          gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div
            key={`empty-${i}`}
            id={`calendar-empty-cell-${i}`}
            className="border-border/50 bg-muted/20 border-b"
          />
        ))}

        {days.map((date) => {
          const holiday = findHolidayForDate(holidays, date);
          const leave = findLeaveForDate(leaves, date);
          const isToday = today ? isSameDay(date, today) : false;

          return (
            <CalendarDayCell
              key={date.toISOString()}
              date={date}
              holiday={holiday}
              leave={leave}
              isToday={isToday}
              onDayClick={onDayClick}
            />
          );
        })}

        {Array.from({ length: trailingCellCount }).map((_, i) => (
          <div
            key={`trailing-${i}`}
            id={`calendar-trailing-cell-${i}`}
            className="border-border/50 bg-muted/20 border-b"
          />
        ))}
      </div>
    </div>
  );
}
