import { useState, useEffect, useCallback } from "react";
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
  CalendarPlus,
  X,
  Star,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HolidayImport } from "@/features/calendar/components/holiday-import";
import { LeaveRequestModal } from "@/features/calendar/components/leave-request-modal";
import { HolidayManageModal } from "@/features/calendar/components/holiday-manage-modal";

interface Holiday {
  id: string;
  date: string;
  nameEnglish: string;
  nameThai: string;
  year: number;
  type: string;
  description?: string;
}

interface Leave {
  id: string;
  date: string;
  type: string;
  reason?: string;
}

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] as const;

function DayDetailPanel({
  date,
  holiday,
  leave,
  onClose,
  onRequestLeave,
}: {
  date: Date;
  holiday: Holiday | undefined;
  leave: Leave | undefined;
  onClose: () => void;
  onRequestLeave: () => void;
}) {
  const dayOfWeek = format(date, "EEEE", { locale: th });
  const fullDate = format(date, "d MMMM yyyy", { locale: th });
  const dateStr = format(date, "yyyy-MM-dd");
  const hasAny = holiday || leave;

  const renderLeaveType = (type: string) => {
    if (type === "personal") return "ลากิจ";
    if (type === "sick") return "ลาป่วย";
    if (type === "vacation") return "ลาพักผ่อน";
    return type;
  };

  return (
    <div
      id={`day-detail-overlay-${dateStr}`}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`รายละเอียดวันที่ ${fullDate}`}
    >
      <div
        id={`day-detail-panel-${dateStr}`}
        className="border-border bg-card w-full max-w-sm overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
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
                      className="text-muted-foreground mt-1 inline-block rounded-md bg-muted/60 px-1.5 py-px text-[10px] font-medium"
                    >
                      {holiday.type === "national" && "วันหยุดราชการ"}
                      {holiday.type === "royal" && "วันหยุดเกี่ยวกับราชวงศ์"}
                      {holiday.type === "religious" && "วันหยุดศาสนาจาร"}
                      {holiday.type === "special" && "วันหยุดพิเศษ"}
                      {!["national", "royal", "religious", "special"].includes(holiday.type) && holiday.type}
                    </span>
                  </div>
                </div>
              )}

              {leave && (
                <div
                  id={`day-detail-leave-${dateStr}`}
                  className="space-y-1.5"
                >
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
    </div>
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
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showDayDetail, setShowDayDetail] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const year = getYear(currentDate);
      const month = getMonth(currentDate) + 1;

      try {
        const holidaysRes = await fetch(`/api/holidays?year=${year}`);
        if (holidaysRes.ok) {
          const holidaysData = await holidaysRes.json();
          if (holidaysData.success) {
            setHolidays(holidaysData.holidays);
          }
        }

        const leavesRes = await fetch(
          `/api/leave?month=${year}-${month.toString().padStart(2, "0")}`,
        );
        if (leavesRes.ok) {
          const leavesData = await leavesRes.json();
          if (leavesData.success) {
            setLeaves(leavesData.leaves);
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentDate]);

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

  const buddhistYear = getYear(currentDate) + 543;
  const firstDayOfWeek = days[0]?.getDay() ?? 0;
  const calendarRowCount = Math.ceil((firstDayOfWeek + days.length) / 7);
  const trailingCellCount =
    calendarRowCount * 7 - firstDayOfWeek - days.length;
  const holidayCount = days.filter((date) => getHolidayForDate(date)).length;
  const leaveCount = days.filter((date) => getLeaveForDate(date)).length;
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

  const handleImport = async (importedHolidays: Holiday[]) => {
    setHolidays((prev) => {
      const existing = new Set(prev.map((h) => h.date));
      const newHolidays = importedHolidays.filter((h) => !existing.has(h.date));
      return [...prev, ...newHolidays];
    });
  };

  const refreshLeaves = async () => {
    const year = getYear(currentDate);
    const month = getMonth(currentDate) + 1;
    const leavesRes = await fetch(
      `/api/leave?month=${year}-${month.toString().padStart(2, "0")}`,
    );
    if (leavesRes.ok) {
      const leavesData = await leavesRes.json();
      if (leavesData.success) {
        setLeaves(leavesData.leaves);
      }
    }
  };

  const refreshHolidays = async () => {
    const year = getYear(currentDate);
    const holidaysRes = await fetch(`/api/holidays?year=${year}`);
    if (holidaysRes.ok) {
      const holidaysData = await holidaysRes.json();
      if (holidaysData.success) {
        setHolidays(holidaysData.holidays);
      }
    }
  };

  const handleLeaveRequest = async (data: {
    date: string;
    type: string;
    reason?: string;
  }) => {
    try {
      const response = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        await refreshLeaves();
        alert("แจ้งลาสำเร็จ!");
      } else {
        alert(result.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      alert(message);
    }
  };

  const handleHolidayAdd = async (data: Omit<Holiday, "id">) => {
    try {
      const response = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        await refreshHolidays();
        alert("เพิ่มวันหยุดสำเร็จ!");
      } else {
        alert(result.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      alert(message);
    }
  };

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    const hasHoliday = holidays.some((h) => h.date === dateStr);
    const hasLeave = leaves.some((l) => l.date === dateStr);
    if (hasHoliday || hasLeave) {
      setShowDayDetail(true);
    } else {
      setShowLeaveModal(true);
    }
  }, [holidays, leaves]);

  const renderLeaveType = (type: string) => {
    if (type === "personal") return "ลากิจ";
    if (type === "sick") return "ลาป่วย";
    if (type === "vacation") return "ลาพักผ่อน";
    return type;
  };

  return (
    <div id="calendar-page" className="min-h-screen bg-background">
      <div
        id="calendar-main"
        className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
      >
        <header id="calendar-hero" className="mb-6 flex items-end justify-between gap-6">
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
                {leaveCount}
              </span>
            </div>
          </div>

          <div id="calendar-header-actions" className="hidden items-center gap-2 sm:flex">
            <Button
              id="calendar-import-btn"
              variant="outline"
              size="sm"
              onClick={() => setShowImportModal(true)}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              นำเข้า
            </Button>
            <Button
              id="calendar-add-holiday-btn"
              variant="outline"
              size="sm"
              onClick={() => setShowHolidayModal(true)}
            >
              <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
              เพิ่มวันหยุด
            </Button>
            <Button
              id="calendar-request-leave-btn"
              size="sm"
              onClick={() => setShowLeaveModal(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              แจ้งลา
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

        <div id="calendar-legend" className="mb-3 flex flex-wrap gap-4 text-xs font-medium">
          <span id="calendar-legend-holiday" className="flex items-center gap-1.5">
            <span className="bg-destructive/80 h-2 w-2 rounded-full" />
            <span className="text-muted-foreground">วันหยุดราชการ</span>
          </span>
          <span id="calendar-legend-leave" className="flex items-center gap-1.5">
            <span className="bg-primary h-2 w-2 rounded-full" />
            <span className="text-muted-foreground">วันลางาน</span>
          </span>
        </div>

        <div
          id="calendar-grid-card"
          className="border-border overflow-hidden rounded-xl border bg-card"
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
                      (day === "อา" || day === "ส") &&
                        "text-destructive/60",
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
                  const isToday = isSameDay(date, new Date());
                  const isWeekendDay = isWeekend(date);
                  const hasEvent = holiday || leave;
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
                        !isToday && !hasEvent && !isWeekendDay && "hover:bg-muted/30",
                        !isToday && !hasEvent && isWeekendDay && "bg-muted/15 hover:bg-muted/30",
                      )}
                      onClick={() => handleDayClick(date)}
                      aria-label={`${format(date, "d MMMM yyyy", { locale: th })}${holiday ? ` ${holiday.nameThai}` : ""}${leave ? ` วันลา${renderLeaveType(leave.type)}` : ""}`}
                    >
                      <span
                        id={`calendar-day-number-${dateStr}`}
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-md text-sm leading-none font-bold",
                          "lg:h-7 lg:w-7 lg:text-base",
                          isToday &&
                            "bg-primary text-primary-foreground font-black",
                          !isToday && isWeekendDay && !holiday && "text-destructive/70",
                          !isToday && !isWeekendDay && !holiday && "text-foreground",
                          !isToday && !!holiday && "text-foreground",
                        )}
                      >
                        {format(date, "d")}
                      </span>

                      <div className="mt-0.5 min-h-0 flex-1 space-y-0.5 overflow-hidden lg:mt-1 lg:space-y-1">
                        {holiday && (
                          <div
                            id={`calendar-holiday-${dateStr}`}
                            className="bg-destructive/10 text-destructive flex items-center gap-1 rounded px-1 py-px text-[10px] font-semibold leading-tight lg:px-1.5 lg:py-0.5 lg:text-[11px]"
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
                            className="bg-primary/10 text-primary flex items-center gap-1 rounded px-1 py-px text-[10px] font-semibold leading-tight lg:px-1.5 lg:py-0.5 lg:text-[11px]"
                            title={`วันลา${renderLeaveType(leave.type)}`}
                          >
                            <span className="border-primary h-3 w-3 shrink-0 rounded-full border-[1.5px] lg:h-3.5 lg:w-3.5" />
                            <span className="min-w-0 truncate">
                              {renderLeaveType(leave.type)}
                            </span>
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

        <div id="calendar-mobile-actions" className="mt-4 flex justify-center gap-2 sm:hidden">
          <Button
            id="calendar-mobile-leave-btn"
            size="sm"
            className="flex-1"
            onClick={() => setShowLeaveModal(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            แจ้งลา
          </Button>
          <Button
            id="calendar-mobile-holiday-btn"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowHolidayModal(true)}
          >
            <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
            เพิ่มวันหยุด
          </Button>
          <Button
            id="calendar-mobile-import-btn"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowImportModal(true)}
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
          onClose={() => setShowDayDetail(false)}
          onRequestLeave={() => {
            setShowDayDetail(false);
            setShowLeaveModal(true);
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

      {showLeaveModal && (
        <div id="calendar-leave-modal-wrapper">
          <LeaveRequestModal
            isOpen={showLeaveModal}
            onClose={() => setShowLeaveModal(false)}
            onSubmit={handleLeaveRequest}
            selectedDate={
              selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined
            }
          />
        </div>
      )}

      {showHolidayModal && (
        <div id="calendar-holiday-modal-wrapper">
          <HolidayManageModal
            isOpen={showHolidayModal}
            onClose={() => setShowHolidayModal(false)}
            onSubmit={handleHolidayAdd}
            selectedDate={
              selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
