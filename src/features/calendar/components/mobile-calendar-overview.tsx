import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

interface MobileCalendarOverviewProps {
  currentDate: Date;
  buddhistYear: number;
  holidayCount: number;
  leaveCount: number;
  todayEvent: Date | undefined;
}

export function MobileCalendarOverview({
  currentDate,
  buddhistYear,
  holidayCount,
  leaveCount,
  todayEvent,
}: MobileCalendarOverviewProps) {
  return (
    <section
      id="mobile-calendar-overview"
      className="border-border bg-card overflow-hidden rounded-xl border"
      aria-label="ภาพรวมเดือน"
    >
      <div
        id="mobile-calendar-overview-header"
        className="border-border bg-muted/50 border-b px-4 py-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              id="mobile-calendar-eyebrow"
              className="text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase"
            >
              ปฏิทินทีม
            </p>
            <h2
              id="mobile-calendar-month-name"
              className="text-foreground mt-1.5 text-xl leading-tight font-black"
            >
              {format(currentDate, "MMMM", { locale: th })}
            </h2>
            <p
              id="mobile-calendar-summary"
              className="text-muted-foreground mt-1 text-xs font-medium"
            >
              วันหยุด {holidayCount} วัน · วันลา {leaveCount} วัน
            </p>
          </div>
          <div
            id="mobile-calendar-year-badge"
            className="border-border bg-background rounded-md border px-2.5 py-2 text-center"
          >
            <CalendarIcon
              className="text-muted-foreground mx-auto h-4 w-4"
              aria-hidden="true"
            />
            <p className="text-muted-foreground mt-0.5 text-[10px] font-semibold">
              พ.ศ.
            </p>
            <p
              id="mobile-calendar-buddhist-year-badge"
              className="text-foreground text-base leading-none font-black"
            >
              {buddhistYear}
            </p>
          </div>
        </div>
      </div>

      <div
        id="mobile-calendar-stats"
        className="divide-border grid grid-cols-3 divide-x"
      >
        <div id="mobile-calendar-stat-today" className="px-3 py-2.5">
          <p className="text-muted-foreground text-[10px] font-medium">
            วันนี้
          </p>
          <p className="text-foreground mt-0.5 truncate text-sm font-bold">
            {todayEvent
              ? format(todayEvent, "d MMM", { locale: th })
              : "นอกเดือนนี้"}
          </p>
        </div>
        <div id="mobile-calendar-stat-holidays" className="px-3 py-2.5">
          <p className="text-muted-foreground text-[10px] font-medium">
            วันหยุด
          </p>
          <p className="text-destructive mt-0.5 text-sm font-bold">
            {holidayCount} รายการ
          </p>
        </div>
        <div id="mobile-calendar-stat-leaves" className="px-3 py-2.5">
          <p className="text-muted-foreground text-[10px] font-medium">วันลา</p>
          <p className="text-primary mt-0.5 text-sm font-bold">
            {leaveCount} รายการ
          </p>
        </div>
      </div>
    </section>
  );
}
