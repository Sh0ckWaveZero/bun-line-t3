import { useCallback, useState } from "react";
import { format, getMonth, getYear } from "date-fns";
import { CalendarHeader } from "@/features/calendar/components/calendar-header";
import { CalendarLegend } from "@/features/calendar/components/calendar-legend";
import { CalendarMobileActions } from "@/features/calendar/components/calendar-mobile-actions";
import { CalendarMonthGrid } from "@/features/calendar/components/calendar-month-grid";
import { CalendarSkeletonGrid } from "@/features/calendar/components/calendar-skeleton";
import { CalendarToolbar } from "@/features/calendar/components/calendar-toolbar";
import { DayDetailPanel } from "@/features/calendar/components/day-detail-panel";
import { HolidayImport } from "@/features/calendar/components/holiday-import";
import { HolidayManageModal } from "@/features/calendar/components/holiday-manage-modal";
import { LeaveRequestModal } from "@/features/calendar/components/leave-request-modal";
import {
  getBuddhistYear,
  getCalendarGridMeta,
  getMonthOptions,
  getYearOptions,
} from "@/features/calendar/helpers/calendar-grid";
import {
  findHolidayForDate,
  findLeaveForDate,
  getMonthEventCounts,
} from "@/features/calendar/helpers/calendar-events";
import { useCalendarData } from "@/features/calendar/hooks/useCalendarData";
import { useCalendarMutations } from "@/features/calendar/hooks/useCalendarMutations";
import { useMonthNavigation } from "@/features/calendar/hooks/useMonthNavigation";
import { useToday } from "@/features/calendar/hooks/useToday";

export function CalendarPage() {
  const { currentDate, navigateMonth, handleMonthChange, handleYearChange } =
    useMonthNavigation();
  const today = useToday();
  const { holidays, leaves, loading } = useCalendarData(currentDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const { handleImport, handleLeaveRequest, handleHolidayAdd } =
    useCalendarMutations(currentDate);

  const { days, firstDayOfWeek, rowCount, trailingCellCount } =
    getCalendarGridMeta(currentDate);
  const { holidayCount, leaveCount, workingDayCount } = getMonthEventCounts(
    days,
    holidays,
    leaves,
  );

  const selectedMonth = getMonth(currentDate);
  const selectedYear = getYear(currentDate);
  const monthOptions = getMonthOptions(selectedYear);
  const yearOptions = getYearOptions(selectedYear);

  const handleDayClick = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      const dateStr = format(date, "yyyy-MM-dd");
      const hasHoliday = holidays.some((h) => h.date === dateStr);
      const hasLeave = leaves.some((l) => l.date === dateStr);
      if (hasHoliday || hasLeave) {
        setShowDayDetail(true);
      } else {
        setShowLeaveModal(true);
      }
    },
    [holidays, leaves],
  );

  return (
    <div id="calendar-page" className="bg-background min-h-screen">
      <div
        id="calendar-main"
        className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
      >
        <CalendarHeader
          currentDate={currentDate}
          buddhistYear={getBuddhistYear(currentDate)}
          workingDayCount={workingDayCount}
          holidayCount={holidayCount}
          leaveCount={leaveCount}
          onShowImportModal={() => setShowImportModal(true)}
          onShowHolidayModal={() => setShowHolidayModal(true)}
          onShowLeaveModal={() => setShowLeaveModal(true)}
        />

        <CalendarToolbar
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          monthOptions={monthOptions}
          yearOptions={yearOptions}
          onNavigateMonth={navigateMonth}
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
              <CalendarSkeletonGrid />
            </div>
          ) : (
            <CalendarMonthGrid
              days={days}
              firstDayOfWeek={firstDayOfWeek}
              rowCount={rowCount}
              trailingCellCount={trailingCellCount}
              holidays={holidays}
              leaves={leaves}
              today={today}
              onDayClick={handleDayClick}
            />
          )}
        </div>

        <CalendarMobileActions
          onShowLeaveModal={() => setShowLeaveModal(true)}
          onShowHolidayModal={() => setShowHolidayModal(true)}
          onShowImportModal={() => setShowImportModal(true)}
        />
      </div>

      {showDayDetail && selectedDate && (
        <DayDetailPanel
          date={selectedDate}
          holiday={findHolidayForDate(holidays, selectedDate)}
          leave={findLeaveForDate(leaves, selectedDate)}
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
