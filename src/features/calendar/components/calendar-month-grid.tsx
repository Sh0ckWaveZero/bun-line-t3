import { isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { WEEKDAYS } from "@/features/calendar/constants/calendar";
import { findEventByDate } from "@/features/calendar/lib/calendar-format";
import { CalendarDayCell } from "@/features/calendar/components/calendar-day-cell";
import type {
  CalendarHoliday as Holiday,
  CalendarLeave as Leave,
  CalendarWorkModeDay as WorkModeDay,
} from "@/features/calendar/hooks/useCalendarData";

function CalendarWeekdays() {
  return (
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
  );
}

interface CalendarMonthGridProps {
  days: Date[];
  today: Date | null;
  holidays: Holiday[];
  leaves: Leave[];
  workModeDays: WorkModeDay[];
  onDayClick: (date: Date) => void;
}

/** กริดวันของเดือน — คำนวณ leading/trailing cell จากจำนวนวันและวันแรกของเดือน */
export function CalendarMonthGrid({
  days,
  today,
  holidays,
  leaves,
  workModeDays,
  onDayClick,
}: CalendarMonthGridProps) {
  const firstDayOfWeek = days[0]?.getDay() ?? 0;
  const calendarRowCount = Math.ceil((firstDayOfWeek + days.length) / 7);
  const trailingCellCount = calendarRowCount * 7 - firstDayOfWeek - days.length;

  return (
    <div id="calendar-grid-wrapper" className="flex flex-col">
      <CalendarWeekdays />

      <div
        id="calendar-days-grid"
        className="grid grid-cols-7"
        style={{
          gridTemplateRows: `repeat(${calendarRowCount}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div
            key={`empty-${i}`}
            id={`calendar-empty-cell-${i}`}
            className="border-border/50 bg-muted/20 border-b"
          />
        ))}

        {days.map((date) => (
          <CalendarDayCell
            key={date.toISOString()}
            date={date}
            isToday={today ? isSameDay(date, today) : false}
            holiday={findEventByDate(holidays, date)}
            leave={findEventByDate(leaves, date)}
            workMode={findEventByDate(workModeDays, date)}
            onDayClick={onDayClick}
          />
        ))}

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
