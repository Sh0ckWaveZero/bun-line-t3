import { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  getYear,
} from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Download,
  Plus,
  Upload,
  Home,
  MapPin,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DayEventModal,
  type DayEventType,
} from "@/features/calendar/components/day-event-modal";
import { HolidayImport } from "@/features/calendar/components/holiday-import";
import { useCalendarMutations } from "@/features/calendar/hooks/useCalendarMutations";
import {
  useCalendarData,
  type CalendarHoliday as Holiday,
  type CalendarLeave as Leave,
  type CalendarWorkModeDay as WorkModeDay,
} from "@/features/calendar/hooks/useCalendarData";

interface CalendarEvent {
  date: Date;
  holiday: Holiday | undefined;
  leave: Leave | undefined;
  workMode: WorkModeDay | undefined;
  isToday: boolean;
}

export function MobileCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { holidays, leaves, workModeDays, loading } =
    useCalendarData(currentDate);
  const [filter, setFilter] = useState<
    "all" | "holidays" | "leaves" | "wfh" | "onsite"
  >("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  // modal เดียวรวมทุก type (ลางาน / WFH / On Site / วันหยุด) — null = ปิด
  const [eventModal, setEventModal] = useState<DayEventType | null>(null);

  // เปิด modal ได้ทีละหนึ่ง — เปิดอันใหม่ปิดอันอื่นทิ้ง
  const openModal = (modal: DayEventType) => {
    setEventModal(modal);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1),
    );
  };

  const handleExport = async (exportFormat: "json" | "csv") => {
    const year = getYear(currentDate);
    try {
      const response = await fetch(
        `/api/holidays?year=${year}&export=${exportFormat}`,
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `holidays-${year}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch {}
  };

  const buddhistYear = getYear(currentDate) + 543;
  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const holiday = holidays.find((h) => h.date === dateStr);
    const leave = leaves.find((l) => l.date === dateStr);
    const workMode = workModeDays.find((w) => w.date === dateStr);
    return { holiday, leave, workMode, isToday: isSameDay(date, new Date()) };
  };

  const { refreshCalendarData, handleDayEventSubmit, handleWorkModeCancel } =
    useCalendarMutations(getYear(currentDate));

  const handleImport = async (importedHolidays: Holiday[]) => {
    if (importedHolidays.length > 0) {
      await refreshCalendarData();
    }
  };

  const renderLeaveType = (type: string) => {
    if (type === "personal") return "ลากิจ";
    if (type === "sick") return "ลาป่วย";
    if (type === "vacation") return "ลาพักผ่อน";
    return type;
  };

  const getFilteredEvents = () => {
    return days
      .map((date) => {
        const events = getEventsForDate(date);
        const hasEvent = events.holiday || events.leave || events.workMode;

        if (filter === "holidays" && !events.holiday) return null;
        if (filter === "leaves" && !events.leave) return null;
        if (filter === "wfh" && events.workMode?.type !== "wfh") return null;
        if (filter === "onsite" && events.workMode?.type !== "onsite")
          return null;
        if (filter === "all" && !hasEvent && !events.isToday) return null;

        return { date, ...events };
      })
      .filter((event): event is CalendarEvent => Boolean(event));
  };

  const filteredEvents = getFilteredEvents();
  const holidayCount = days.filter(
    (date) => getEventsForDate(date).holiday,
  ).length;
  const leaveCount = days.filter((date) => getEventsForDate(date).leave).length;
  const wfhCount = days.filter(
    (date) => getEventsForDate(date).workMode?.type === "wfh",
  ).length;
  const onsiteCount = days.filter(
    (date) => getEventsForDate(date).workMode?.type === "onsite",
  ).length;
  const totalMarkedDays = days.filter((date) => {
    const events = getEventsForDate(date);
    return events.holiday || events.leave || events.workMode || events.isToday;
  }).length;
  const todayEvent = days.find((date) => isSameDay(date, new Date()));
  const filterOptions = [
    { value: "all" as const, label: "ทั้งหมด", count: totalMarkedDays },
    { value: "holidays" as const, label: "วันหยุด", count: holidayCount },
    { value: "leaves" as const, label: "วันลา", count: leaveCount },
    { value: "wfh" as const, label: "WFH", count: wfhCount },
    { value: "onsite" as const, label: "On Site", count: onsiteCount },
  ];

  return (
    <div id="mobile-calendar-page" className="bg-background min-h-screen pb-28">
      <header
        id="mobile-calendar-header"
        className="border-border bg-background/90 sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-md"
      >
        <nav
          id="mobile-calendar-nav"
          className="flex items-center justify-between gap-4"
          aria-label="Calendar navigation"
        >
          <Button
            id="mobile-calendar-prev"
            onClick={() => navigateMonth("prev")}
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="เดือนก่อนหน้า"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div id="mobile-calendar-title" className="flex-1 text-center">
            <h1
              id="mobile-calendar-month-year"
              className="text-foreground text-base leading-tight font-bold"
              aria-live="polite"
              aria-atomic="true"
            >
              {format(currentDate, "MMMM yyyy", { locale: th })}
            </h1>
            <p
              id="mobile-calendar-buddhist-year"
              className="text-muted-foreground mt-0.5 text-xs font-medium"
              aria-live="polite"
            >
              พ.ศ. {buddhistYear}
            </p>
          </div>

          <Button
            id="mobile-calendar-next"
            onClick={() => navigateMonth("next")}
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="เดือนถัดไป"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </nav>
      </header>

      <main
        id="mobile-calendar-main"
        className="space-y-4 px-4 py-4"
        aria-label="รายการวันหยุดและวันลา"
      >
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
                  วันหยุด {holidayCount} · วันลา {leaveCount} · WFH {wfhCount} ·
                  On Site {onsiteCount}
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
            className="divide-border grid grid-cols-5 divide-x"
          >
            <div id="mobile-calendar-stat-today" className="px-2 py-2.5">
              <p className="text-muted-foreground text-[10px] font-medium">
                วันนี้
              </p>
              <p className="text-foreground mt-0.5 truncate text-sm font-bold">
                {todayEvent
                  ? format(todayEvent, "d MMM", { locale: th })
                  : "นอกเดือนนี้"}
              </p>
            </div>
            <div id="mobile-calendar-stat-holidays" className="px-2 py-2.5">
              <p className="text-muted-foreground text-[10px] font-medium">
                วันหยุด
              </p>
              <p className="text-destructive mt-0.5 text-sm font-bold">
                {holidayCount} รายการ
              </p>
            </div>
            <div id="mobile-calendar-stat-leaves" className="px-2 py-2.5">
              <p className="text-muted-foreground text-[10px] font-medium">
                วันลา
              </p>
              <p className="text-primary mt-0.5 text-sm font-bold">
                {leaveCount} รายการ
              </p>
            </div>
            <div id="mobile-calendar-stat-wfh" className="px-2 py-2.5">
              <p className="text-muted-foreground text-[10px] font-medium">
                WFH
              </p>
              <p className="mt-0.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                {wfhCount} รายการ
              </p>
            </div>
            <div id="mobile-calendar-stat-onsite" className="px-2 py-2.5">
              <p className="text-muted-foreground text-[10px] font-medium">
                On Site
              </p>
              <p className="mt-0.5 text-sm font-bold text-amber-700 dark:text-amber-300">
                {onsiteCount} รายการ
              </p>
            </div>
          </div>
        </section>

        <section
          id="mobile-calendar-filters"
          aria-label="ตัวกรองรายการ"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {filterOptions.map((option) => (
            <button
              key={option.value}
              id={`mobile-calendar-filter-${option.value}`}
              type="button"
              onClick={() => setFilter(option.value)}
              className={cn(
                "min-h-9 shrink-0 rounded-md border px-3 text-xs font-bold transition-colors",
                filter === option.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted/50",
              )}
              aria-pressed={filter === option.value}
            >
              {option.label}
              <span
                className={cn(
                  "ml-1.5 rounded px-1 py-px text-[10px]",
                  filter === option.value
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {option.count}
              </span>
            </button>
          ))}
        </section>

        {loading ? (
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
        ) : filteredEvents.length === 0 ? (
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
                  : filter === "wfh"
                    ? "ไม่มีวัน WFH ในเดือนนี้"
                    : filter === "onsite"
                      ? "ไม่มีวัน On Site ในเดือนนี้"
                      : "ไม่มีวันลาในเดือนนี้"}
            </p>
            <p
              id="mobile-calendar-empty-hint"
              className="text-muted-foreground mt-1.5 text-xs"
            >
              ลองเปลี่ยนตัวกรองหรือเพิ่มรายการใหม่
            </p>
          </div>
        ) : (
          <ul
            id="mobile-calendar-events-list"
            className="space-y-2.5"
            role="list"
            aria-label="รายการวันที่และเหตุการณ์"
          >
            {filteredEvents.map((event) => {
              if (!event) return null;

              const { date, holiday, leave, workMode, isToday } = event;
              const dayOfWeek = format(date, "EEEE", { locale: th });
              const dateStr = format(date, "yyyy-MM-dd");
              const isMixed = Boolean(
                (holiday && leave) ||
                (holiday && workMode) ||
                (leave && workMode),
              );

              return (
                <li
                  key={date.toISOString()}
                  id={`mobile-event-${dateStr}`}
                  className={cn(
                    "border-border bg-card overflow-hidden rounded-xl border transition-transform duration-150 active:scale-[0.99]",
                    holiday && !leave && "border-destructive/30",
                    leave && !holiday && "border-primary/30",
                    isMixed && "border-accent/30",
                    isToday &&
                      "ring-primary ring-offset-background ring-2 ring-offset-1",
                  )}
                  aria-label={`${dayOfWeek}ที่ ${format(date, "d")} ${format(date, "MMMM", { locale: th })}`}
                >
                  <div
                    id={`mobile-event-header-${dateStr}`}
                    className={cn(
                      "border-border flex items-center justify-between gap-3 border-b px-3.5 py-2.5",
                      holiday && !leave && "bg-destructive/[0.04]",
                      leave && !holiday && "bg-primary/[0.04]",
                      isMixed && "bg-accent/[0.04]",
                      !holiday && !leave && "bg-muted/30",
                    )}
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
                    )}

                    {workMode?.type === "wfh" && (
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
                    )}

                    {workMode?.type === "onsite" && (
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
                    )}

                    <div className="mt-0.5 flex gap-2">
                      <Button
                        id={`mobile-event-request-leave-${dateStr}`}
                        type="button"
                        variant="outline"
                        className="h-9 flex-1 rounded-lg text-xs font-bold"
                        onClick={() => {
                          setSelectedDate(dateStr);
                          openModal("leave");
                        }}
                      >
                        แจ้งลาวันนี้
                      </Button>
                      {workMode?.type === "wfh" ? (
                        <Button
                          id={`mobile-event-cancel-wfh-${dateStr}`}
                          type="button"
                          variant="outline"
                          className="text-destructive hover:text-destructive h-9 flex-1 rounded-lg text-xs font-bold"
                          onClick={() => void handleWorkModeCancel(dateStr)}
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
                          onClick={() => void handleWorkModeCancel(dateStr)}
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
                          onClick={() => {
                            setSelectedDate(dateStr);
                            openModal("wfh");
                          }}
                        >
                          <Home className="mr-1 h-3.5 w-3.5" />
                          ทำ WFH
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <nav
        id="mobile-calendar-fab"
        className="border-border bg-card fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 gap-2 rounded-xl border p-2"
        aria-label="ปุ่มดำเนินการด่วน"
      >
        <Button
          id="mobile-fab-add-event"
          size="sm"
          className="h-11 rounded-lg text-xs font-bold"
          onClick={() => {
            setSelectedDate(null);
            openModal("leave");
          }}
          aria-label="เพิ่มกิจกรรมในปฏิทิน"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          เพิ่มกิจกรรม
        </Button>
        <Button
          id="mobile-fab-import"
          size="sm"
          variant="outline"
          className="h-11 rounded-lg text-xs font-bold"
          onClick={() => setShowImportModal(true)}
          aria-label="นำเข้าวันหยุด"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          นำเข้า
        </Button>
        <Button
          id="mobile-fab-export"
          size="sm"
          variant="outline"
          className="h-11 rounded-lg text-xs font-bold"
          onClick={() => handleExport("json")}
          aria-label="ส่งออกข้อมูลวันหยุด"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          ส่งออก
        </Button>
      </nav>

      {showImportModal && (
        <div id="mobile-import-modal-wrapper">
          <HolidayImport
            onImport={handleImport}
            onClose={() => setShowImportModal(false)}
          />
        </div>
      )}

      {eventModal && (
        <div id="mobile-event-modal-wrapper">
          <DayEventModal
            isOpen
            onClose={() => {
              setEventModal(null);
              setSelectedDate(null);
            }}
            onSubmit={handleDayEventSubmit}
            selectedDate={selectedDate || undefined}
            initialType={eventModal}
          />
        </div>
      )}
    </div>
  );
}
