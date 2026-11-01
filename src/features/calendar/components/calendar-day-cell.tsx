import { format, isWeekend } from "date-fns";
import { th } from "date-fns/locale";
import { Home, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDateKey,
  renderLeaveType,
} from "@/features/calendar/lib/calendar-format";
import type {
  CalendarHoliday as Holiday,
  CalendarLeave as Leave,
  CalendarWorkModeDay as WorkModeDay,
} from "@/features/calendar/hooks/useCalendarData";

/* ---------- helpers (นอก component) — class/aria-label ของช่องวัน ---------- */

function getDayCellClasses(
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

function getDayNumberClasses(
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

function buildDayCellAriaLabel({
  date,
  holiday,
  leave,
  workMode,
}: {
  date: Date;
  holiday: Holiday | undefined;
  leave: Leave | undefined;
  workMode: WorkModeDay | undefined;
}) {
  return `${format(date, "d MMMM yyyy", { locale: th })}${holiday ? ` ${holiday.nameThai}` : ""}${leave ? ` วันลา${renderLeaveType(leave.type)}` : ""}${workMode ? (workMode.type === "wfh" ? " ทำ WFH" : " ทำ On Site") : ""}`;
}

/* ---------- event chips ในช่องวัน ---------- */

function DayCellHolidayChip({
  dateStr,
  holiday,
}: {
  dateStr: string;
  holiday: Holiday;
}) {
  return (
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
  );
}

function DayCellLeaveChip({
  dateStr,
  leave,
}: {
  dateStr: string;
  leave: Leave;
}) {
  return (
    <div
      id={`calendar-leave-${dateStr}`}
      className="bg-primary/10 text-primary flex items-center gap-1 rounded px-1 py-px text-[10px] leading-tight font-semibold lg:px-1.5 lg:py-0.5 lg:text-[11px]"
      title={`วันลา${renderLeaveType(leave.type)}`}
    >
      <span className="border-primary h-3 w-3 shrink-0 rounded-full border-[1.5px] lg:h-3.5 lg:w-3.5" />
      <span className="min-w-0 truncate">{renderLeaveType(leave.type)}</span>
    </div>
  );
}

function DayCellWfhChip({ dateStr }: { dateStr: string }) {
  return (
    <div
      id={`calendar-wfh-${dateStr}`}
      className="flex items-center gap-1 rounded border-emerald-400/25 bg-emerald-500/10 px-1 py-px text-[10px] leading-tight font-semibold text-emerald-700 lg:px-1.5 lg:py-0.5 lg:text-[11px] dark:text-emerald-300"
      title="ทำงานจากที่บ้าน (WFH)"
    >
      <Home className="h-3 w-3 shrink-0 lg:h-3.5 lg:w-3.5" />
      <span className="min-w-0 truncate">WFH</span>
    </div>
  );
}

function DayCellOnsiteChip({ dateStr }: { dateStr: string }) {
  return (
    <div
      id={`calendar-onsite-${dateStr}`}
      className="flex items-center gap-1 rounded border-amber-400/25 bg-amber-500/10 px-1 py-px text-[10px] leading-tight font-semibold text-amber-700 lg:px-1.5 lg:py-0.5 lg:text-[11px] dark:text-amber-300"
      title="ทำงานที่ไซต์ (On Site)"
    >
      <MapPin className="h-3 w-3 shrink-0 lg:h-3.5 lg:w-3.5" />
      <span className="min-w-0 truncate">On Site</span>
    </div>
  );
}

/* ---------- ช่องวันหนึ่งช่องของปฏิทิน ---------- */

interface CalendarDayCellProps {
  date: Date;
  isToday: boolean;
  holiday: Holiday | undefined;
  leave: Leave | undefined;
  workMode: WorkModeDay | undefined;
  onDayClick: (date: Date) => void;
}

export function CalendarDayCell({
  date,
  isToday,
  holiday,
  leave,
  workMode,
  onDayClick,
}: CalendarDayCellProps) {
  const isWeekendDay = isWeekend(date);
  const hasEvent = holiday || leave || workMode;
  const dateStr = formatDateKey(date);

  return (
    <button
      id={`calendar-day-${dateStr}`}
      type="button"
      className={getDayCellClasses(isToday, Boolean(hasEvent), isWeekendDay)}
      onClick={() => onDayClick(date)}
      aria-label={buildDayCellAriaLabel({ date, holiday, leave, workMode })}
    >
      <span
        id={`calendar-day-number-${dateStr}`}
        className={getDayNumberClasses(isToday, isWeekendDay, Boolean(holiday))}
      >
        {format(date, "d")}
      </span>

      <div className="mt-0.5 min-h-0 flex-1 space-y-0.5 overflow-hidden lg:mt-1 lg:space-y-1">
        {holiday && <DayCellHolidayChip dateStr={dateStr} holiday={holiday} />}

        {leave && <DayCellLeaveChip dateStr={dateStr} leave={leave} />}

        {workMode?.type === "wfh" && <DayCellWfhChip dateStr={dateStr} />}

        {workMode?.type === "onsite" && <DayCellOnsiteChip dateStr={dateStr} />}
      </div>
    </button>
  );
}
