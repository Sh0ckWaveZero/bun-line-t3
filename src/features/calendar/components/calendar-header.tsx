import { format, getYear } from "date-fns";
import { th } from "date-fns/locale";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarHeaderProps {
  currentDate: Date;
  workingDayCount: number;
  holidayCount: number;
  leaveCount: number;
  wfhCount: number;
  onsiteCount: number;
  onOpenImport: () => void;
  onOpenAddEvent: () => void;
}

export function CalendarHeader({
  currentDate,
  workingDayCount,
  holidayCount,
  leaveCount,
  wfhCount,
  onsiteCount,
  onOpenImport,
  onOpenAddEvent,
}: CalendarHeaderProps) {
  const buddhistYear = getYear(currentDate) + 543;

  return (
    <header
      id="calendar-hero"
      className="mb-6 flex items-end justify-between gap-6"
    >
      <div id="calendar-heading">
        <p
          id="calendar-eyebrow"
          className="text-muted-foreground mb-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase"
        >
          ปฏิทินทีม
        </p>
        <h1
          id="calendar-title"
          className="text-foreground text-4xl leading-none font-black tracking-tight sm:text-5xl lg:text-6xl"
        >
          {format(currentDate, "MMMM", { locale: th })}
        </h1>
        <div
          id="calendar-subtitle"
          className="text-muted-foreground mt-2 flex items-center gap-3 text-sm font-medium"
        >
          <span id="calendar-year-info">
            {format(currentDate, "yyyy")} · พ.ศ. {buddhistYear}
          </span>
          <span className="text-border">|</span>
          <span id="calendar-summary-text">
            วันทำงาน {workingDayCount} · วันหยุด {holidayCount} · วันลา{" "}
            {leaveCount} · WFH {wfhCount} · On Site {onsiteCount}
          </span>
        </div>
      </div>

      <div
        id="calendar-header-actions"
        className="hidden items-center gap-2 sm:flex"
      >
        <Button
          id="calendar-import-btn"
          variant="outline"
          size="sm"
          onClick={onOpenImport}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          นำเข้า
        </Button>
        <Button
          id="calendar-add-event-btn"
          size="sm"
          onClick={onOpenAddEvent}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          เพิ่มกิจกรรม
        </Button>
      </div>
    </header>
  );
}
