import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLeaveTypeLabel } from "@/features/calendar/helpers/calendar-events";
import {
  getMobileEventCardAriaLabel,
  getMobileEventCardClassName,
  getMobileEventHeaderClassName,
} from "@/features/calendar/helpers/calendar-display";
import type { CalendarEvent } from "@/features/calendar/helpers/mobile-calendar-events";

interface MobileEventCardProps {
  event: CalendarEvent;
  onRequestLeave: (dateKey: string) => void;
}

export function MobileEventCard({
  event,
  onRequestLeave,
}: MobileEventCardProps) {
  const { date, holiday, leave, isToday } = event;
  const dayOfWeek = format(date, "EEEE", { locale: th });
  const dateStr = format(date, "yyyy-MM-dd");

  return (
    <li
      id={`mobile-event-${dateStr}`}
      className={getMobileEventCardClassName(holiday, leave, isToday)}
      aria-label={getMobileEventCardAriaLabel(dayOfWeek, date)}
    >
      <div
        id={`mobile-event-header-${dateStr}`}
        className={getMobileEventHeaderClassName(holiday, leave)}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            id={`mobile-event-date-${dateStr}`}
            className="min-w-11 text-center"
            aria-hidden="true"
          >
            <p className="text-foreground text-2xl leading-none font-black">
              {format(date, "d")}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[10px] font-bold uppercase">
              {format(date, "MMM", { locale: th })}
            </p>
          </div>
          <div className="min-w-0">
            <p
              id={`mobile-event-day-name-${dateStr}`}
              className="text-foreground truncate text-sm font-bold"
            >
              {dayOfWeek}
            </p>
            <p
              id={`mobile-event-full-date-${dateStr}`}
              className="text-muted-foreground text-xs font-medium"
            >
              {format(date, "MMMM yyyy", { locale: th })}
            </p>
          </div>
        </div>

        {isToday && (
          <span
            id={`mobile-event-today-${dateStr}`}
            className="bg-primary/10 text-primary shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold"
            aria-label="วันนี้"
          >
            วันนี้
          </span>
        )}
      </div>

      <div
        id={`mobile-event-content-${dateStr}`}
        className="space-y-2.5 p-3.5"
        role="group"
        aria-label="ข้อมูลเหตุการณ์"
      >
        {holiday && (
          <div
            id={`mobile-event-holiday-${dateStr}`}
            className="flex items-start gap-2.5"
            role="group"
            aria-label={`วันหยุด: ${holiday.nameThai}`}
          >
            <div
              className="bg-destructive/10 text-destructive flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              aria-hidden="true"
            >
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div
                id={`mobile-event-holiday-name-th-${dateStr}`}
                className="text-foreground text-sm font-bold"
              >
                {holiday.nameThai}
              </div>
              <div
                id={`mobile-event-holiday-name-en-${dateStr}`}
                className="text-muted-foreground mt-0.5 line-clamp-2 text-xs"
              >
                {holiday.nameEnglish}
              </div>
            </div>
          </div>
        )}

        {leave && (
          <div
            id={`mobile-event-leave-${dateStr}`}
            className="flex items-start gap-2.5"
            role="group"
            aria-label={`วันลา: ${getLeaveTypeLabel(leave.type)}`}
          >
            <div
              className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              aria-hidden="true"
            >
              <Plus className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div
                id={`mobile-event-leave-type-${dateStr}`}
                className="text-foreground text-sm font-bold"
              >
                {getLeaveTypeLabel(leave.type)}
              </div>
              {leave.reason && (
                <div
                  id={`mobile-event-leave-reason-${dateStr}`}
                  className="text-muted-foreground mt-0.5 line-clamp-2 text-xs"
                >
                  {leave.reason}
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          id={`mobile-event-request-leave-${dateStr}`}
          type="button"
          variant="outline"
          className="mt-0.5 h-9 w-full rounded-lg text-xs font-bold"
          onClick={() => onRequestLeave(dateStr)}
        >
          แจ้งลาวันนี้
        </Button>
      </div>
    </li>
  );
}
