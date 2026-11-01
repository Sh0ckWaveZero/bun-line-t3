import { useCallback, useEffect, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  getMonth,
  getYear,
  startOfMonth,
  subMonths,
} from "date-fns";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarHeader } from "@/features/calendar/components/calendar-header";
import { CalendarLegend } from "@/features/calendar/components/calendar-legend";
import { CalendarMonthGrid } from "@/features/calendar/components/calendar-month-grid";
import { CalendarToolbar } from "@/features/calendar/components/calendar-toolbar";
import { SkeletonGrid } from "@/features/calendar/components/calendar-skeleton";
import {
  DayEventModal,
  type DayEventType,
} from "@/features/calendar/components/day-event-modal";
import { DayDetailPanel } from "@/features/calendar/components/day-detail-panel";
import { HolidayImport } from "@/features/calendar/components/holiday-import";
import { findEventByDate, formatDateKey } from "@/features/calendar/lib/calendar-format";
import { useCalendarMutations } from "@/features/calendar/hooks/useCalendarMutations";
import {
  useCalendarData,
  type CalendarHoliday as Holiday,
} from "@/features/calendar/hooks/useCalendarData";

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

  const getHolidayForDate = (date: Date) => findEventByDate(holidays, date);
  const getLeaveForDate = (date: Date) => findEventByDate(leaves, date);
  const getWorkModeForDate = (date: Date) =>
    findEventByDate(workModeDays, date);

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
      const dateStr = formatDateKey(date);
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

  return (
    <div id="calendar-page" className="bg-background min-h-screen">
      <div
        id="calendar-main"
        className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
      >
        <CalendarHeader
          currentDate={currentDate}
          workingDayCount={workingDayCount}
          holidayCount={holidayCount}
          leaveCount={leaveCount}
          wfhCount={wfhCount}
          onsiteCount={onsiteCount}
          onOpenImport={() => openModal("import")}
          onOpenAddEvent={() => openModal("leave")}
        />

        <CalendarToolbar
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onPrevMonth={() => navigateMonth("prev")}
          onNextMonth={() => navigateMonth("next")}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
        />

        <CalendarLegend />

        <div
          id="calendar-grid-card"
          className="border-border bg-card overflow-hidden rounded-xl border"
        >
          {loading ? (
            <div id="calendar-loading" className="p-4">
              <SkeletonGrid />
            </div>
          ) : (
            <CalendarMonthGrid
              days={days}
              today={today}
              holidays={holidays}
              leaves={leaves}
              workModeDays={workModeDays}
              onDayClick={handleDayClick}
            />
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
            const dateStr = formatDateKey(selectedDate);
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
              selectedDate ? formatDateKey(selectedDate) : undefined
            }
            initialType={eventModal}
          />
        </div>
      )}
    </div>
  );
}
