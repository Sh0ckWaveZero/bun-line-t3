import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Clock, FileText, Home, MapPin, Plus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDialogExit } from "@/features/calendar/hooks/useDialogExit";
import { renderLeaveType } from "@/features/calendar/lib/calendar-format";
import type {
  CalendarHoliday as Holiday,
  CalendarLeave as Leave,
  CalendarWorkModeDay as WorkModeDay,
} from "@/features/calendar/hooks/useCalendarData";

/** สี/ข้อความของการ์ด WFH/On Site ใน Day Detail Panel — ตรงกับ badge ใน grid */
const WORK_MODE_META = {
  wfh: {
    icon: Home,
    cardBg: "bg-emerald-500/[0.05]",
    chipBg: "bg-emerald-500/10",
    iconText: "text-emerald-700 dark:text-emerald-300",
    label: "ทำงานจากที่บ้าน",
    title: "WFH",
  },
  onsite: {
    icon: MapPin,
    cardBg: "bg-amber-500/[0.05]",
    chipBg: "bg-amber-500/10",
    iconText: "text-amber-700 dark:text-amber-300",
    label: "ทำงานที่ไซต์",
    title: "On Site",
  },
} as const;

const HOLIDAY_TYPE_LABELS: Record<string, string> = {
  national: "วันหยุดราชการ",
  royal: "วันหยุดเกี่ยวกับราชวงศ์",
  religious: "วันหยุดศาสนาจาร",
  special: "วันหยุดพิเศษ",
};

function WorkModeCard({
  dateStr,
  workMode,
}: {
  dateStr: string;
  workMode: WorkModeDay;
}) {
  const meta = WORK_MODE_META[workMode.type];
  const Icon = meta.icon;
  return (
    <div
      id={`day-detail-${workMode.type}-${dateStr}`}
      className={cn("rounded-lg p-3", meta.cardBg)}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
            meta.chipBg,
          )}
        >
          <Icon className={cn("h-3 w-3", meta.iconText)} />
        </span>
        <span
          id={`day-detail-${workMode.type}-label-${dateStr}`}
          className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase"
        >
          {meta.label}
        </span>
      </div>
      <div className="mt-1.5 pl-7">
        <p
          id={`day-detail-${workMode.type}-type-${dateStr}`}
          className="text-foreground text-sm font-bold"
        >
          {meta.title}
        </p>
        {workMode.note && (
          <div
            id={`day-detail-${workMode.type}-note-${dateStr}`}
            className="mt-1 flex items-start gap-1.5"
          >
            <FileText className="text-muted-foreground mt-0.5 h-3 w-3 shrink-0" />
            <p className="text-muted-foreground text-xs">{workMode.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DayDetailHolidayCard({
  dateStr,
  holiday,
}: {
  dateStr: string;
  holiday: Holiday;
}) {
  return (
    <div
      id={`day-detail-holiday-${dateStr}`}
      className="bg-destructive/[0.04] rounded-lg p-3"
    >
      <div className="flex items-center gap-2">
        <span className="bg-destructive/10 text-destructive flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
          <Star className="h-3 w-3" />
        </span>
        <span
          id={`day-detail-holiday-label-${dateStr}`}
          className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase"
        >
          วันหยุด
        </span>
        {HOLIDAY_TYPE_LABELS[holiday.type] && (
          <span
            id={`day-detail-holiday-type-${dateStr}`}
            className="bg-destructive/10 text-destructive rounded-md px-1.5 py-px text-[10px] font-semibold"
          >
            {HOLIDAY_TYPE_LABELS[holiday.type]}
          </span>
        )}
      </div>
      <div className="mt-1.5 pl-7">
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
      </div>
    </div>
  );
}

function DayDetailLeaveCard({
  dateStr,
  leave,
}: {
  dateStr: string;
  leave: Leave;
}) {
  return (
    <div
      id={`day-detail-leave-${dateStr}`}
      className="bg-primary/[0.04] rounded-lg p-3"
    >
      <div className="flex items-center gap-2">
        <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
          <Clock className="h-3 w-3" />
        </span>
        <span
          id={`day-detail-leave-label-${dateStr}`}
          className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase"
        >
          วันลางาน
        </span>
      </div>
      <div className="mt-1.5 pl-7">
        <p
          id={`day-detail-leave-type-${dateStr}`}
          className="text-foreground text-sm font-bold"
        >
          {renderLeaveType(leave.type)}
        </p>
        {leave.reason && (
          <div
            id={`day-detail-leave-reason-${dateStr}`}
            className="mt-1 flex items-start gap-1.5"
          >
            <FileText className="text-muted-foreground mt-0.5 h-3 w-3 shrink-0" />
            <p className="text-muted-foreground text-xs">{leave.reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DayDetailContent({
  dateStr,
  holiday,
  leave,
  workMode,
}: {
  dateStr: string;
  holiday: Holiday | undefined;
  leave: Leave | undefined;
  workMode: WorkModeDay | undefined;
}) {
  const hasAny = holiday || leave || workMode;

  if (!hasAny) {
    return (
      <p
        id={`day-detail-empty-${dateStr}`}
        className="text-muted-foreground text-sm"
      >
        ไม่มีกิจกรรมในวันนี้
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {holiday && <DayDetailHolidayCard dateStr={dateStr} holiday={holiday} />}
      {leave && <DayDetailLeaveCard dateStr={dateStr} leave={leave} />}
      {workMode && <WorkModeCard dateStr={dateStr} workMode={workMode} />}
    </div>
  );
}

function DayDetailActions({
  dateStr,
  workMode,
  onRequestLeave,
  onRequestWorkMode,
  onCancelWorkMode,
}: {
  dateStr: string;
  workMode: WorkModeDay | undefined;
  onRequestLeave: () => void;
  onRequestWorkMode: (type: "wfh" | "onsite") => void;
  onCancelWorkMode: () => void;
}) {
  return (
    <div
      id={`day-detail-actions-${dateStr}`}
      className="border-border space-y-2 border-t px-5 py-3"
    >
      <Button
        id={`day-detail-request-leave-${dateStr}`}
        size="sm"
        className="w-full"
        onClick={onRequestLeave}
      >
        <Plus className="h-3.5 w-3.5" />
        แจ้งลาวันนี้
      </Button>
      <div className="flex gap-2">
        {(["wfh", "onsite"] as const).map((type) => {
          const isActive = workMode?.type === type;
          const meta = WORK_MODE_META[type];
          const Icon = meta.icon;
          return isActive ? (
            <Button
              key={type}
              id={`day-detail-cancel-${type}-${dateStr}`}
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive flex-1"
              onClick={onCancelWorkMode}
            >
              <X className="h-3.5 w-3.5" />
              ยกเลิก {meta.title}
            </Button>
          ) : (
            <Button
              key={type}
              id={`day-detail-request-${type}-${dateStr}`}
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onRequestWorkMode(type)}
            >
              <Icon className="h-3.5 w-3.5" />
              ทำ {meta.title}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

interface DayDetailPanelProps {
  date: Date;
  holiday: Holiday | undefined;
  leave: Leave | undefined;
  workMode: WorkModeDay | undefined;
  onClose: () => void;
  onRequestLeave: () => void;
  onRequestWorkMode: (type: "wfh" | "onsite") => void;
  onCancelWorkMode: () => void;
}

export function DayDetailPanel({
  date,
  holiday,
  leave,
  workMode,
  onClose,
  onRequestLeave,
  onRequestWorkMode,
  onCancelWorkMode,
}: DayDetailPanelProps) {
  const dayOfWeek = format(date, "EEEE", { locale: th });
  const fullDate = format(date, "d MMMM yyyy", { locale: th });
  const dateStr = format(date, "yyyy-MM-dd");
  const { isClosing, requestClose } = useDialogExit(onClose);

  return (
    <dialog
      open
      id={`day-detail-overlay-${dateStr}`}
      className={cn(
        "t-modal-dialog fixed inset-0 z-40 m-0 flex max-h-none max-w-none items-center justify-center border-0 bg-transparent p-4 text-inherit shadow-none",
        isClosing && "is-closing",
      )}
      style={{
        /* UA ของ <dialog> บังคับ width/height: fit-content — ต้องบังคับเต็มจอ
           ไม่งั้น overlay จะยึดมุมซ้ายบนขนาดเท่าเนื้อหา */
        width: "100%",
        height: "100%",
      }}
      aria-modal="true"
      aria-label={`รายละเอียดวันที่ ${fullDate}`}
    >
      <button
        type="button"
        className="absolute inset-0 z-0 cursor-default border-0 bg-black/30 p-0 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-inset"
        aria-label="ปิดรายละเอียดวัน"
        onClick={requestClose}
      />
      <div
        id={`day-detail-panel-${dateStr}`}
        className="t-modal-card border-border bg-card relative z-10 w-full max-w-sm overflow-hidden rounded-xl"
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
            onClick={requestClose}
            aria-label="ปิด"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div
          id={`day-detail-content-${dateStr}`}
          className="border-border border-t px-5 py-4"
        >
          <DayDetailContent
            dateStr={dateStr}
            holiday={holiday}
            leave={leave}
            workMode={workMode}
          />
        </div>

        <DayDetailActions
          dateStr={dateStr}
          workMode={workMode}
          onRequestLeave={onRequestLeave}
          onRequestWorkMode={onRequestWorkMode}
          onCancelWorkMode={onCancelWorkMode}
        />
      </div>
    </dialog>
  );
}
