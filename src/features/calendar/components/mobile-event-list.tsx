import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon, Home, MapPin, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateKey, renderLeaveType } from "@/features/calendar/lib/calendar-format";
import {
  getMobileCalendarEmptyTitle,
  type CalendarEvent,
  type MobileCalendarFilter,
} from "@/features/calendar/lib/mobile-calendar-events";

/* ---------- helpers (นอก component) — class/สถานะของการ์ดแต่ละวัน ---------- */

function hasMixedEvents(
  holiday: CalendarEvent["holiday"],
  leave: CalendarEvent["leave"],
  workMode: CalendarEvent["workMode"],
) {
  return Boolean(
    (holiday && leave) || (holiday && workMode) || (leave && workMode),
  );
}

function getMobileEventCardClasses(
  holiday: CalendarEvent["holiday"],
  leave: CalendarEvent["leave"],
  isMixed: boolean,
  isToday: boolean,
) {
  return cn(
    "border-border bg-card overflow-hidden rounded-xl border transition-transform duration-150 active:scale-[0.99]",
    holiday && !leave && "border-destructive/30",
    leave && !holiday && "border-primary/30",
    isMixed && "border-accent/30",
    isToday && "ring-primary ring-offset-background ring-2 ring-offset-1",
  );
}

function getMobileEventHeaderClasses(
  holiday: CalendarEvent["holiday"],
  leave: CalendarEvent["leave"],
  isMixed: boolean,
) {
  return cn(
    "border-border flex items-center justify-between gap-3 border-b px-3.5 py-2.5",
    holiday && !leave && "bg-destructive/[0.04]",
    leave && !holiday && "bg-primary/[0.04]",
    isMixed && "bg-accent/[0.04]",
    !holiday && !leave && "bg-muted/30",
  );
}

/* ---------- loading / empty state ของรายการ ---------- */

export function MobileCalendarLoadingState() {
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

export function MobileCalendarEmptyState({
  filter,
}: {
  filter: MobileCalendarFilter;
}) {
  return (
    <div
      id="mobile-calendar-empty"
      className="border-border bg-card rounded-xl border border-dashed p-8 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg">
        <CalendarIcon className="text-muted-foreground h-6 w-6" aria-hidden="true" />
      </div>
      <p
        id="mobile-calendar-empty-title"
        className="text-foreground text-sm font-bold"
      >
        {getMobileCalendarEmptyTitle(filter)}
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

/* ---------- การ์ด event หนึ่งวัน ---------- */

interface MobileEventCardHeaderProps {
  date: Date;
  dayOfWeek: string;
  dateStr: string;
  holiday: CalendarEvent["holiday"];
  leave: CalendarEvent["leave"];
  isMixed: boolean;
  isToday: boolean;
}

function MobileEventCardHeader({
  date,
  dayOfWeek,
  dateStr,
  holiday,
  leave,
  isMixed,
  isToday,
}: MobileEventCardHeaderProps) {
  return (
    <div
      id={`mobile-event-header-${dateStr}`}
      className={getMobileEventHeaderClasses(holiday, leave, isMixed)}
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
  );
}

function MobileEventHolidayRow({
  dateStr,
  holiday,
}: {
  dateStr: string;
  holiday: NonNullable<CalendarEvent["holiday"]>;
}) {
  return (
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
  );
}

function MobileEventLeaveRow({
  dateStr,
  leave,
}: {
  dateStr: string;
  leave: NonNullable<CalendarEvent["leave"]>;
}) {
  return (
    <div
      id={`mobile-event-leave-${dateStr}`}
      className="flex items-start gap-2.5"
      role="group"
      aria-label={`วันลา: ${renderLeaveType(leave.type)}`}
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
          {renderLeaveType(leave.type)}
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
  );
}

function MobileEventWfhRow({
  dateStr,
  workMode,
}: {
  dateStr: string;
  workMode: NonNullable<CalendarEvent["workMode"]>;
}) {
  return (
    <div
      id={`mobile-event-wfh-${dateStr}`}
      className="flex items-start gap-2.5"
      role="group"
      aria-label="ทำงานจากที่บ้าน (WFH)"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-emerald-400/25 bg-emerald-500/10">
        <Home
          className="h-4 w-4 text-emerald-700 dark:text-emerald-300"
          aria-hidden="true"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div
          id={`mobile-event-wfh-type-${dateStr}`}
          className="text-foreground text-sm font-bold"
        >
          ทำ WFH
        </div>
        {workMode.note && (
          <div
            id={`mobile-event-wfh-note-${dateStr}`}
            className="text-muted-foreground mt-0.5 line-clamp-2 text-xs"
          >
            {workMode.note}
          </div>
        )}
      </div>
    </div>
  );
}

function MobileEventOnsiteRow({
  dateStr,
  workMode,
}: {
  dateStr: string;
  workMode: NonNullable<CalendarEvent["workMode"]>;
}) {
  return (
    <div
      id={`mobile-event-onsite-${dateStr}`}
      className="flex items-start gap-2.5"
      role="group"
      aria-label="ทำงานที่ไซต์ (On Site)"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-amber-400/25 bg-amber-500/10">
        <MapPin
          className="h-4 w-4 text-amber-700 dark:text-amber-300"
          aria-hidden="true"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div
          id={`mobile-event-onsite-type-${dateStr}`}
          className="text-foreground text-sm font-bold"
        >
          ทำ On Site
        </div>
        {workMode.note && (
          <div
            id={`mobile-event-onsite-note-${dateStr}`}
            className="text-muted-foreground mt-0.5 line-clamp-2 text-xs"
          >
            {workMode.note}
          </div>
        )}
      </div>
    </div>
  );
}

interface MobileEventActionsProps {
  dateStr: string;
  workMode: CalendarEvent["workMode"];
  onRequestLeave: (dateStr: string) => void;
  onRequestWorkMode: (dateStr: string) => void;
  onCancelWorkMode: (dateStr: string) => void;
}

function MobileEventActions({
  dateStr,
  workMode,
  onRequestLeave,
  onRequestWorkMode,
  onCancelWorkMode,
}: MobileEventActionsProps) {
  return (
    <div className="mt-0.5 flex gap-2">
      <Button
        id={`mobile-event-request-leave-${dateStr}`}
        type="button"
        variant="outline"
        className="h-9 flex-1 rounded-lg text-xs font-bold"
        onClick={() => onRequestLeave(dateStr)}
      >
        แจ้งลาวันนี้
      </Button>
      {workMode?.type === "wfh" ? (
        <Button
          id={`mobile-event-cancel-wfh-${dateStr}`}
          type="button"
          variant="outline"
          className="text-destructive hover:text-destructive h-9 flex-1 rounded-lg text-xs font-bold"
          onClick={() => onCancelWorkMode(dateStr)}
        >
          <X className="mr-1 h-3.5 w-3.5" />
          ยกเลิก WFH
        </Button>
      ) : workMode?.type === "onsite" ? (
        <Button
          id={`mobile-event-cancel-onsite-${dateStr}`}
          type="button"
          variant="outline"
          className="text-destructive hover:text-destructive h-9 flex-1 rounded-lg text-xs font-bold"
          onClick={() => onCancelWorkMode(dateStr)}
        >
          <X className="mr-1 h-3.5 w-3.5" />
          ยกเลิก On Site
        </Button>
      ) : (
        <Button
          id={`mobile-event-request-wfh-${dateStr}`}
          type="button"
          variant="outline"
          className="h-9 flex-1 rounded-lg text-xs font-bold"
          onClick={() => onRequestWorkMode(dateStr)}
        >
          <Home className="mr-1 h-3.5 w-3.5" />
          ทำ WFH
        </Button>
      )}
    </div>
  );
}

interface MobileEventCardBodyProps {
  dateStr: string;
  holiday: CalendarEvent["holiday"];
  leave: CalendarEvent["leave"];
  workMode: CalendarEvent["workMode"];
  onRequestLeave: (dateStr: string) => void;
  onRequestWorkMode: (dateStr: string) => void;
  onCancelWorkMode: (dateStr: string) => void;
}

function MobileEventCardBody({
  dateStr,
  holiday,
  leave,
  workMode,
  onRequestLeave,
  onRequestWorkMode,
  onCancelWorkMode,
}: MobileEventCardBodyProps) {
  return (
    <div
      id={`mobile-event-content-${dateStr}`}
      className="space-y-2.5 p-3.5"
      role="group"
      aria-label="ข้อมูลเหตุการณ์"
    >
      {holiday && <MobileEventHolidayRow dateStr={dateStr} holiday={holiday} />}

      {leave && <MobileEventLeaveRow dateStr={dateStr} leave={leave} />}

      {workMode?.type === "wfh" && (
        <MobileEventWfhRow dateStr={dateStr} workMode={workMode} />
      )}

      {workMode?.type === "onsite" && (
        <MobileEventOnsiteRow dateStr={dateStr} workMode={workMode} />
      )}

      <MobileEventActions
        dateStr={dateStr}
        workMode={workMode}
        onRequestLeave={onRequestLeave}
        onRequestWorkMode={onRequestWorkMode}
        onCancelWorkMode={onCancelWorkMode}
      />
    </div>
  );
}

interface MobileEventCardProps {
  event: CalendarEvent;
  onRequestLeave: (dateStr: string) => void;
  onRequestWorkMode: (dateStr: string) => void;
  onCancelWorkMode: (dateStr: string) => void;
}

function MobileEventCard({
  event,
  onRequestLeave,
  onRequestWorkMode,
  onCancelWorkMode,
}: MobileEventCardProps) {
  const { date, holiday, leave, workMode, isToday } = event;
  const dayOfWeek = format(date, "EEEE", { locale: th });
  const dateStr = formatDateKey(date);
  const isMixed = hasMixedEvents(holiday, leave, workMode);

  return (
    <li
      id={`mobile-event-${dateStr}`}
      className={getMobileEventCardClasses(holiday, leave, isMixed, isToday)}
      aria-label={`${dayOfWeek}ที่ ${format(date, "d")} ${format(date, "MMMM", { locale: th })}`}
    >
      <MobileEventCardHeader
        date={date}
        dayOfWeek={dayOfWeek}
        dateStr={dateStr}
        holiday={holiday}
        leave={leave}
        isMixed={isMixed}
        isToday={isToday}
      />

      <MobileEventCardBody
        dateStr={dateStr}
        holiday={holiday}
        leave={leave}
        workMode={workMode}
        onRequestLeave={onRequestLeave}
        onRequestWorkMode={onRequestWorkMode}
        onCancelWorkMode={onCancelWorkMode}
      />
    </li>
  );
}

interface MobileEventListProps {
  events: CalendarEvent[];
  onRequestLeave: (dateStr: string) => void;
  onRequestWorkMode: (dateStr: string) => void;
  onCancelWorkMode: (dateStr: string) => void;
}

export function MobileEventList({
  events,
  onRequestLeave,
  onRequestWorkMode,
  onCancelWorkMode,
}: MobileEventListProps) {
  return (
    <ul
      id="mobile-calendar-events-list"
      className="space-y-2.5"
      role="list"
      aria-label="รายการวันที่และเหตุการณ์"
    >
      {events.map((event) => {
        if (!event) return null;

        return (
          <MobileEventCard
            key={event.date.toISOString()}
            event={event}
            onRequestLeave={onRequestLeave}
            onRequestWorkMode={onRequestWorkMode}
            onCancelWorkMode={onCancelWorkMode}
          />
        );
      })}
    </ul>
  );
}
