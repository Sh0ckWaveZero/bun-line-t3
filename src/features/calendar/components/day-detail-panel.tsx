import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Clock, FileText, Plus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getHolidayTypeLabel,
  getLeaveTypeLabel,
} from "@/features/calendar/helpers/calendar-events";
import type {
  CalendarHoliday as Holiday,
  CalendarLeave as Leave,
} from "@/features/calendar/hooks/useCalendarData";

interface DayDetailPanelProps {
  date: Date;
  holiday: Holiday | undefined;
  leave: Leave | undefined;
  onClose: () => void;
  onRequestLeave: () => void;
}

export function DayDetailPanel({
  date,
  holiday,
  leave,
  onClose,
  onRequestLeave,
}: DayDetailPanelProps) {
  const dayOfWeek = format(date, "EEEE", { locale: th });
  const fullDate = format(date, "d MMMM yyyy", { locale: th });
  const dateStr = format(date, "yyyy-MM-dd");
  const hasAny = holiday || leave;

  return (
    <dialog
      open
      id={`day-detail-overlay-${dateStr}`}
      className="fixed inset-0 z-40 m-0 flex max-h-none max-w-none items-center justify-center border-0 bg-transparent p-4 text-inherit shadow-none"
      aria-modal="true"
      aria-label={`รายละเอียดวันที่ ${fullDate}`}
    >
      <button
        type="button"
        className="absolute inset-0 z-0 cursor-default border-0 bg-black/30 p-0 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-inset"
        aria-label="ปิดรายละเอียดวัน"
        onClick={onClose}
      />
      <div
        id={`day-detail-panel-${dateStr}`}
        className="border-border bg-card relative z-10 w-full max-w-sm overflow-hidden rounded-xl"
      >
        <div
          id={`day-detail-header-${dateStr}`}
          className="flex items-start justify-between gap-3 px-5 pt-5 pb-4"
        >
          <div>
            <p
              id={`day-detail-day-number-${dateStr}`}
              className="text-foreground text-3xl leading-none font-black"
            >
              {format(date, "d")}
            </p>
            <p
              id={`day-detail-day-name-${dateStr}`}
              className="text-muted-foreground mt-1 text-sm font-medium"
            >
              {dayOfWeek}
            </p>
            <p
              id={`day-detail-full-date-${dateStr}`}
              className="text-muted-foreground text-xs"
            >
              {format(date, "MMMM yyyy", { locale: th })}
            </p>
          </div>
          <Button
            id={`day-detail-close-${dateStr}`}
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onClose}
            aria-label="ปิด"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div
          id={`day-detail-content-${dateStr}`}
          className="border-border border-t px-5 py-4"
        >
          {hasAny ? (
            <div className="space-y-3">
              {holiday && (
                <div
                  id={`day-detail-holiday-${dateStr}`}
                  className="space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-destructive text-destructive-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]">
                      <Star className="h-3 w-3" />
                    </span>
                    <span
                      id={`day-detail-holiday-label-${dateStr}`}
                      className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase"
                    >
                      วันหยุดราชการ
                    </span>
                  </div>
                  <div className="pl-7">
                    <p
                      id={`day-detail-holiday-name-th-${dateStr}`}
                      className="text-foreground text-sm font-bold"
                    >
                      {holiday.nameThai}
                    </p>
                    <p
                      id={`day-detail-holiday-name-en-${dateStr}`}
                      className="text-muted-foreground text-xs"
                    >
                      {holiday.nameEnglish}
                    </p>
                    {holiday.description && (
                      <p
                        id={`day-detail-holiday-desc-${dateStr}`}
                        className="text-muted-foreground mt-1 text-xs"
                      >
                        {holiday.description}
                      </p>
                    )}
                    <span
                      id={`day-detail-holiday-type-${dateStr}`}
                      className="text-muted-foreground bg-muted/60 mt-1 inline-block rounded-md px-1.5 py-px text-[10px] font-medium"
                    >
                      {getHolidayTypeLabel(holiday.type)}
                    </span>
                  </div>
                </div>
              )}

              {leave && (
                <div id={`day-detail-leave-${dateStr}`} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="border-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2">
                      <Clock className="text-primary h-2.5 w-2.5" />
                    </span>
                    <span
                      id={`day-detail-leave-label-${dateStr}`}
                      className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase"
                    >
                      วันลางาน
                    </span>
                  </div>
                  <div className="pl-7">
                    <p
                      id={`day-detail-leave-type-${dateStr}`}
                      className="text-foreground text-sm font-bold"
                    >
                      {getLeaveTypeLabel(leave.type)}
                    </p>
                    {leave.reason && (
                      <div
                        id={`day-detail-leave-reason-${dateStr}`}
                        className="mt-1 flex items-start gap-1.5"
                      >
                        <FileText className="text-muted-foreground mt-0.5 h-3 w-3 shrink-0" />
                        <p className="text-muted-foreground text-xs">
                          {leave.reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p
              id={`day-detail-empty-${dateStr}`}
              className="text-muted-foreground text-sm"
            >
              ไม่มีกิจกรรมในวันนี้
            </p>
          )}
        </div>

        <div
          id={`day-detail-actions-${dateStr}`}
          className="border-border border-t px-5 py-3"
        >
          <Button
            id={`day-detail-request-leave-${dateStr}`}
            size="sm"
            className="w-full"
            onClick={onRequestLeave}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            แจ้งลาวันนี้
          </Button>
        </div>
      </div>
    </dialog>
  );
}
