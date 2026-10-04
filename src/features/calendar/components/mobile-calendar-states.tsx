import { Calendar as CalendarIcon } from "lucide-react";
import type { CalendarFilter } from "@/features/calendar/helpers/mobile-calendar-events";

export function MobileCalendarLoading() {
  return (
    <div
      id="mobile-calendar-loading"
      className="border-border bg-card rounded-xl border py-12 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        id="mobile-calendar-spinner"
        className="border-primary inline-block h-8 w-8 animate-spin rounded-full border-2 border-b-transparent"
        aria-hidden="true"
      />
      <p className="text-muted-foreground mt-3 text-sm font-medium">
        กำลังโหลด...
      </p>
    </div>
  );
}

interface MobileCalendarEmptyProps {
  filter: CalendarFilter;
}

export function MobileCalendarEmpty({ filter }: MobileCalendarEmptyProps) {
  return (
    <div
      id="mobile-calendar-empty"
      className="border-border bg-card rounded-xl border border-dashed p-8 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg">
        <CalendarIcon
          className="text-muted-foreground h-6 w-6"
          aria-hidden="true"
        />
      </div>
      <p
        id="mobile-calendar-empty-title"
        className="text-foreground text-sm font-bold"
      >
        {filter === "all"
          ? "ไม่มีวันหยุดหรือวันลาในเดือนนี้"
          : filter === "holidays"
            ? "ไม่มีวันหยุดในเดือนนี้"
            : "ไม่มีวันลาในเดือนนี้"}
      </p>
      <p
        id="mobile-calendar-empty-hint"
        className="text-muted-foreground mt-1.5 text-xs"
      >
        ลองเปลี่ยนตัวกรองหรือเพิ่มรายการใหม่
      </p>
    </div>
  );
}
