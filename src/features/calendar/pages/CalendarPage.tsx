import { useState, useCallback, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  getYear,
  getMonth,
  isWeekend,
} from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Plus,
  X,
  Star,
  Clock,
  FileText,
  Home,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HolidayImport } from "@/features/calendar/components/holiday-import";
import {
  DayEventModal,
  type DayEventType,
} from "@/features/calendar/components/day-event-modal";
import {
  useCalendarData,
  type CalendarHoliday as Holiday,
  type CalendarLeave as Leave,
  type CalendarWorkModeDay as WorkModeDay,
} from "@/features/calendar/hooks/useCalendarData";
import { useDialogExit } from "@/features/calendar/hooks/useDialogExit";
import { useCalendarMutations } from "@/features/calendar/hooks/useCalendarMutations";

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] as const;

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

function DayDetailPanel({
  date,
  holiday,
  leave,
  workMode,
  onClose,
  onRequestLeave,
  onRequestWorkMode,
  onCancelWorkMode,
}: {
  date: Date;
  holiday: Holiday | undefined;
  leave: Leave | undefined;
  workMode: WorkModeDay | undefined;
  onClose: () => void;
  onRequestLeave: () => void;
  onRequestWorkMode: (type: "wfh" | "onsite") => void;
  onCancelWorkMode: () => void;
}) {
  const dayOfWeek = format(date, "EEEE", { locale: th });
  const fullDate = format(date, "d MMMM yyyy", { locale: th });
  const dateStr = format(date, "yyyy-MM-dd");
  const hasAny = holiday || leave || workMode;
  const { isClosing, requestClose } = useDialogExit(onClose);

  const renderLeaveType = (type: string) => {
    if (type === "personal") return "ลากิจ";
    if (type === "sick") return "ลาป่วย";
    if (type === "vacation") return "ลาพักผ่อน";
    return type;
  };

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
          {hasAny ? (
            <div className="space-y-2.5">
              {holiday && (
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
              )}

              {leave && (
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
                        <p className="text-muted-foreground text-xs">
                          {leave.reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {workMode && (
                <WorkModeCard dateStr={dateStr} workMode={workMode} />
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
      </div>
    </dialog>
  );
}

function SkeletonGrid() {
  return (
    <div id="calendar-skeleton" className="flex flex-col">
      <div className="border-border grid grid-cols-7 border-b">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-muted-foreground px-3 py-3 text-center text-xs font-semibold tracking-widest uppercase"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="border-border flex h-28 flex-col gap-2 border-b p-2 lg:h-32"
          >
            <div className="bg-muted h-5 w-5 animate-pulse rounded-md" />
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [today, setToday] = useState<Date | null>(null);
  const { holidays, leaves, workModeDays, loading } =
    useCalendarData(currentDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  // modal เดียวรวมทุก type (ลางาน / WFH / On Site / วันหยุด) — null = ปิด
  const [eventModal, setEventModal] = useState<DayEventType | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);

  // เปิด modal ได้ทีละหนึ่ง — เปิดอันใหม่ปิดอันอื่นทิ้ง
  const openModal = useCallback((modal: DayEventType | "import") => {
    setShowImportModal(modal === "import");
    setEventModal(modal === "import" ? null : modal);
  }, []);

  useEffect(() => {
    const updateToday = () => setToday(new Date());
    updateToday();
    const interval = window.setInterval(updateToday, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1),
    );
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getHolidayForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return holidays.find((h) => h.date === dateStr);
  };

  const getLeaveForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return leaves.find((l) => l.date === dateStr);
  };

  const getWorkModeForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return workModeDays.find((w) => w.date === dateStr);
  };

  const buddhistYear = getYear(currentDate) + 543;
  const firstDayOfWeek = days[0]?.getDay() ?? 0;
  const calendarRowCount = Math.ceil((firstDayOfWeek + days.length) / 7);
  const trailingCellCount = calendarRowCount * 7 - firstDayOfWeek - days.length;
  const holidayCount = days.filter((date) => getHolidayForDate(date)).length;
  const leaveCount = days.filter((date) => getLeaveForDate(date)).length;
  const wfhCount = days.filter(
    (date) => getWorkModeForDate(date)?.type === "wfh",
  ).length;
  const onsiteCount = days.filter(
    (date) => getWorkModeForDate(date)?.type === "onsite",
  ).length;
  const workingDayCount = days.length - holidayCount - leaveCount;

  const selectedMonth = getMonth(currentDate);
  const selectedYear = getYear(currentDate);
  const monthOptions = Array.from({ length: 12 }, (_, month) => ({
    value: month,
    label: format(new Date(selectedYear, month, 1), "MMMM", { locale: th }),
  }));
  const yearOptions = Array.from(
    { length: 11 },
    (_, index) => selectedYear - 5 + index,
  );

  const handleMonthChange = (month: number) => {
    setCurrentDate((prev) => new Date(getYear(prev), month, 1));
  };

  const handleYearChange = (year: number) => {
    setCurrentDate((prev) => new Date(year, getMonth(prev), 1));
  };

  const { refreshCalendarData, handleWorkModeCancel, handleDayEventSubmit } =
    useCalendarMutations(getYear(currentDate));

  const handleImport = async (importedHolidays: Holiday[]) => {
    if (importedHolidays.length > 0) {
      await refreshCalendarData();
    }
  };

  const handleDayClick = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      const dateStr = format(date, "yyyy-MM-dd");
      const hasHoliday = holidays.some((h) => h.date === dateStr);
      const hasLeave = leaves.some((l) => l.date === dateStr);
      const hasWorkMode = workModeDays.some((w) => w.date === dateStr);
      if (hasHoliday || hasLeave || hasWorkMode) {
        setShowDayDetail(true);
      } else {
        openModal("leave");
      }
    },
    [holidays, leaves, workModeDays, openModal],
  );

  const renderLeaveType = (type: string) => {
    if (type === "personal") return "ลากิจ";
    if (type === "sick") return "ลาป่วย";
    if (type === "vacation") return "ลาพักผ่อน";
    return type;
  };

  return (
    <div id="calendar-page" className="bg-background min-h-screen">
      <div
        id="calendar-main"
        className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
      >
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
              onClick={() => openModal("import")}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              นำเข้า
            </Button>
            <Button
              id="calendar-add-event-btn"
              size="sm"
              onClick={() => openModal("leave")}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              เพิ่มกิจกรรม
            </Button>
          </div>
        </header>

        <nav
          id="calendar-toolbar"
          className="mb-4 flex items-center gap-2"
          aria-label="เลือกเดือนและปี"
        >
          <Button
            id="calendar-prev-month"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => navigateMonth("prev")}
            aria-label="เดือนก่อนหน้า"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div
            id="calendar-month-picker"
            className="bg-muted flex flex-1 items-center justify-center gap-3 rounded-md px-3 py-2"
          >
            <label htmlFor="calendar-month-select" className="sr-only">
              เลือกเดือน
            </label>
            <select
              id="calendar-month-select"
              value={selectedMonth}
              onChange={(event) =>
                handleMonthChange(Number(event.target.value))
              }
              className="text-foreground min-w-0 cursor-pointer appearance-none bg-transparent text-center text-sm font-bold outline-none"
              aria-label="เลือกเดือน"
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <span className="text-border">/</span>
            <label htmlFor="calendar-year-select" className="sr-only">
              เลือกปี
            </label>
            <select
              id="calendar-year-select"
              value={selectedYear}
              onChange={(event) => handleYearChange(Number(event.target.value))}
              className="text-foreground cursor-pointer appearance-none bg-transparent text-center text-sm font-bold outline-none"
              aria-label="เลือกปี"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year + 543}
                </option>
              ))}
            </select>
          </div>

          <Button
            id="calendar-next-month"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => navigateMonth("next")}
            aria-label="เดือนถัดไป"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </nav>

        <div
          id="calendar-legend"
          className="mb-3 flex flex-wrap gap-4 text-xs font-medium"
        >
          <span
            id="calendar-legend-holiday"
            className="flex items-center gap-1.5"
          >
            <span className="bg-destructive/80 h-2 w-2 rounded-full" />
            <span className="text-muted-foreground">วันหยุดราชการ</span>
          </span>
          <span
            id="calendar-legend-leave"
            className="flex items-center gap-1.5"
          >
            <span className="bg-primary h-2 w-2 rounded-full" />
            <span className="text-muted-foreground">วันลางาน</span>
          </span>
          <span id="calendar-legend-wfh" className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">ทำ WFH</span>
          </span>
          <span
            id="calendar-legend-onsite"
            className="flex items-center gap-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">ทำ On Site</span>
          </span>
        </div>

        <div
          id="calendar-grid-card"
          className="border-border bg-card overflow-hidden rounded-xl border"
        >
          {loading ? (
            <div id="calendar-loading" className="p-4">
              <SkeletonGrid />
            </div>
          ) : (
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

                {days.map((date) => {
                  const holiday = getHolidayForDate(date);
                  const leave = getLeaveForDate(date);
                  const workMode = getWorkModeForDate(date);
                  const isToday = today ? isSameDay(date, today) : false;
                  const isWeekendDay = isWeekend(date);
                  const hasEvent = holiday || leave || workMode;
                  const dateStr = format(date, "yyyy-MM-dd");

                  return (
                    <button
                      key={date.toISOString()}
                      id={`calendar-day-${dateStr}`}
                      type="button"
                      className={cn(
                        "group relative flex min-h-28 cursor-pointer flex-col border-b p-1.5 text-left transition-colors lg:min-h-32 lg:p-2",
                        "border-border/50 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                        isToday && "bg-primary/[0.04]",
                        !isToday &&
                          !hasEvent &&
                          !isWeekendDay &&
                          "hover:bg-muted/30",
                        !isToday &&
                          !hasEvent &&
                          isWeekendDay &&
                          "bg-muted/15 hover:bg-muted/30",
                      )}
                      onClick={() => handleDayClick(date)}
                      aria-label={`${format(date, "d MMMM yyyy", { locale: th })}${holiday ? ` ${holiday.nameThai}` : ""}${leave ? ` วันลา${renderLeaveType(leave.type)}` : ""}${workMode ? (workMode.type === "wfh" ? " ทำ WFH" : " ทำ On Site") : ""}`}
                    >
                      <span
                        id={`calendar-day-number-${dateStr}`}
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-md text-sm leading-none font-bold",
                          "lg:h-7 lg:w-7 lg:text-base",
                          isToday &&
                            "bg-primary text-primary-foreground font-black",
                          !isToday &&
                            isWeekendDay &&
                            !holiday &&
                            "text-destructive/70",
                          !isToday &&
                            !isWeekendDay &&
                            !holiday &&
                            "text-foreground",
                          !isToday && !!holiday && "text-foreground",
                        )}
                      >
                        {format(date, "d")}
                      </span>

                      <div className="mt-0.5 min-h-0 flex-1 space-y-0.5 overflow-hidden lg:mt-1 lg:space-y-1">
                        {holiday && (
                          <div
                            id={`calendar-holiday-${dateStr}`}
                            className="bg-destructive/10 text-destructive flex items-center gap-1 rounded px-1 py-px text-[10px] leading-tight font-semibold lg:px-1.5 lg:py-0.5 lg:text-[11px]"
                            title={holiday.nameThai}
                          >
                            <span className="bg-destructive text-destructive-foreground flex h-3 w-3 shrink-0 items-center justify-center rounded-full text-[8px] lg:h-3.5 lg:w-3.5">
                              ★
                            </span>
                            <span className="min-w-0 truncate">
                              {holiday.nameThai}
                            </span>
                          </div>
                        )}

                        {leave && (
                          <div
                            id={`calendar-leave-${dateStr}`}
                            className="bg-primary/10 text-primary flex items-center gap-1 rounded px-1 py-px text-[10px] leading-tight font-semibold lg:px-1.5 lg:py-0.5 lg:text-[11px]"
                            title={`วันลา${renderLeaveType(leave.type)}`}
                          >
                            <span className="border-primary h-3 w-3 shrink-0 rounded-full border-[1.5px] lg:h-3.5 lg:w-3.5" />
                            <span className="min-w-0 truncate">
                              {renderLeaveType(leave.type)}
                            </span>
                          </div>
                        )}

                        {workMode?.type === "wfh" && (
                          <div
                            id={`calendar-wfh-${dateStr}`}
                            className="flex items-center gap-1 rounded border-emerald-400/25 bg-emerald-500/10 px-1 py-px text-[10px] leading-tight font-semibold text-emerald-700 lg:px-1.5 lg:py-0.5 lg:text-[11px] dark:text-emerald-300"
                            title="ทำงานจากที่บ้าน (WFH)"
                          >
                            <Home className="h-3 w-3 shrink-0 lg:h-3.5 lg:w-3.5" />
                            <span className="min-w-0 truncate">WFH</span>
                          </div>
                        )}

                        {workMode?.type === "onsite" && (
                          <div
                            id={`calendar-onsite-${dateStr}`}
                            className="flex items-center gap-1 rounded border-amber-400/25 bg-amber-500/10 px-1 py-px text-[10px] leading-tight font-semibold text-amber-700 lg:px-1.5 lg:py-0.5 lg:text-[11px] dark:text-amber-300"
                            title="ทำงานที่ไซต์ (On Site)"
                          >
                            <MapPin className="h-3 w-3 shrink-0 lg:h-3.5 lg:w-3.5" />
                            <span className="min-w-0 truncate">On Site</span>
                          </div>
                        )}
                      </div>
                    </button>
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
          )}
        </div>

        <div id="calendar-mobile-actions" className="mt-4 flex gap-2 sm:hidden">
          <Button
            id="calendar-mobile-add-event-btn"
            size="sm"
            className="flex-1"
            onClick={() => openModal("leave")}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            เพิ่มกิจกรรม
          </Button>
          <Button
            id="calendar-mobile-import-btn"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => openModal("import")}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            นำเข้า
          </Button>
        </div>
      </div>

      {showDayDetail && selectedDate && (
        <DayDetailPanel
          date={selectedDate}
          holiday={getHolidayForDate(selectedDate)}
          leave={getLeaveForDate(selectedDate)}
          workMode={getWorkModeForDate(selectedDate)}
          onClose={() => setShowDayDetail(false)}
          onRequestLeave={() => {
            setShowDayDetail(false);
            openModal("leave");
          }}
          onRequestWorkMode={(type) => {
            setShowDayDetail(false);
            openModal(type);
          }}
          onCancelWorkMode={() => {
            const dateStr = format(selectedDate, "yyyy-MM-dd");
            setShowDayDetail(false);
            void handleWorkModeCancel(dateStr);
          }}
        />
      )}

      {showImportModal && (
        <div id="calendar-import-modal-wrapper">
          <HolidayImport
            onImport={handleImport}
            onClose={() => setShowImportModal(false)}
          />
        </div>
      )}

      {eventModal && (
        <div id="calendar-event-modal-wrapper">
          <DayEventModal
            isOpen
            onClose={() => {
              setEventModal(null);
              setSelectedDate(null);
            }}
            onSubmit={handleDayEventSubmit}
            selectedDate={
              selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined
            }
            initialType={eventModal}
          />
        </div>
      )}
    </div>
  );
}
