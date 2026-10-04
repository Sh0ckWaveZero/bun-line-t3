import { useState } from "react";
import { getYear, isSameDay } from "date-fns";
import { MobileCalendarFab } from "@/features/calendar/components/mobile-calendar-fab";
import { MobileCalendarFilters } from "@/features/calendar/components/mobile-calendar-filters";
import { MobileCalendarHeader } from "@/features/calendar/components/mobile-calendar-header";
import {
  MobileCalendarEmpty,
  MobileCalendarLoading,
} from "@/features/calendar/components/mobile-calendar-states";
import { MobileCalendarOverview } from "@/features/calendar/components/mobile-calendar-overview";
import { MobileEventList } from "@/features/calendar/components/mobile-event-list";
import { HolidayManageModal } from "@/features/calendar/components/holiday-manage-modal";
import { LeaveRequestModal } from "@/features/calendar/components/leave-request-modal";
import {
  getCalendarEventsForDate,
  filterMonthEvents,
  type CalendarFilter,
} from "@/features/calendar/helpers/mobile-calendar-events";
import {
  getBuddhistYear,
  getMonthDays,
} from "@/features/calendar/helpers/calendar-grid";
import type { MobileCalendarFilterOption } from "@/features/calendar/components/mobile-calendar-filters";
import { useCalendarData } from "@/features/calendar/hooks/useCalendarData";
import { useCalendarMutations } from "@/features/calendar/hooks/useCalendarMutations";
import { useMonthNavigation } from "@/features/calendar/hooks/useMonthNavigation";

export function MobileCalendarPage() {
  const { currentDate, navigateMonth } = useMonthNavigation();
  const { holidays, leaves, loading } = useCalendarData(currentDate);
  const [filter, setFilter] = useState<CalendarFilter>("all");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { handleLeaveRequest, handleHolidayAdd } =
    useCalendarMutations(currentDate);

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
    } catch {
      // Export failures are ignored silently, same as before
    }
  };

  const days = getMonthDays(currentDate);
  const buddhistYear = getBuddhistYear(currentDate);
  const now = new Date();

  const filteredEvents = filterMonthEvents(days, holidays, leaves, filter, now);
  const holidayCount = days.filter(
    (date) => getCalendarEventsForDate(date, holidays, leaves, now).holiday,
  ).length;
  const leaveCount = days.filter(
    (date) => getCalendarEventsForDate(date, holidays, leaves, now).leave,
  ).length;
  const totalMarkedDays = days.filter((date) => {
    const events = getCalendarEventsForDate(date, holidays, leaves, now);
    return events.holiday || events.leave || events.isToday;
  }).length;
  const todayEvent = days.find((date) => isSameDay(date, now));
  const filterOptions: MobileCalendarFilterOption[] = [
    { value: "all", label: "ทั้งหมด", count: totalMarkedDays },
    { value: "holidays", label: "วันหยุด", count: holidayCount },
    { value: "leaves", label: "วันลา", count: leaveCount },
  ];

  const handleEventRequestLeave = (dateKey: string) => {
    setSelectedDate(dateKey);
    setShowLeaveModal(true);
  };

  return (
    <div id="mobile-calendar-page" className="bg-background min-h-screen pb-28">
      <MobileCalendarHeader
        currentDate={currentDate}
        buddhistYear={buddhistYear}
        onNavigateMonth={navigateMonth}
      />

      <main
        id="mobile-calendar-main"
        className="space-y-4 px-4 py-4"
        aria-label="รายการวันหยุดและวันลา"
      >
        <MobileCalendarOverview
          currentDate={currentDate}
          buddhistYear={buddhistYear}
          holidayCount={holidayCount}
          leaveCount={leaveCount}
          todayEvent={todayEvent}
        />

        <MobileCalendarFilters
          filter={filter}
          options={filterOptions}
          onFilterChange={setFilter}
        />

        {loading ? (
          <MobileCalendarLoading />
        ) : filteredEvents.length === 0 ? (
          <MobileCalendarEmpty filter={filter} />
        ) : (
          <MobileEventList
            events={filteredEvents}
            onRequestLeave={handleEventRequestLeave}
          />
        )}
      </main>

      <MobileCalendarFab
        onLeaveClick={() => {
          setSelectedDate(null);
          setShowLeaveModal(true);
        }}
        onHolidayClick={() => {
          setSelectedDate(null);
          setShowHolidayModal(true);
        }}
        onExportClick={() => handleExport("json")}
      />

      {showLeaveModal && (
        <div id="mobile-leave-modal-wrapper">
          <LeaveRequestModal
            isOpen={showLeaveModal}
            onClose={() => setShowLeaveModal(false)}
            onSubmit={handleLeaveRequest}
            selectedDate={selectedDate || undefined}
          />
        </div>
      )}

      {showHolidayModal && (
        <div id="mobile-holiday-modal-wrapper">
          <HolidayManageModal
            isOpen={showHolidayModal}
            onClose={() => setShowHolidayModal(false)}
            onSubmit={handleHolidayAdd}
            selectedDate={selectedDate || undefined}
          />
        </div>
      )}
    </div>
  );
}
