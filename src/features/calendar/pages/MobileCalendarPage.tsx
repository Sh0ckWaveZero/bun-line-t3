import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  getYear,
  isSameDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { Download, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileCalendarFilters } from "@/features/calendar/components/mobile-calendar-filters";
import { MobileCalendarHeader } from "@/features/calendar/components/mobile-calendar-header";
import { MobileCalendarOverview } from "@/features/calendar/components/mobile-calendar-overview";
import {
  MobileCalendarEmptyState,
  MobileCalendarLoadingState,
  MobileEventList,
} from "@/features/calendar/components/mobile-event-list";
import {
  DayEventModal,
  type DayEventType,
} from "@/features/calendar/components/day-event-modal";
import { HolidayImport } from "@/features/calendar/components/holiday-import";
import { useCalendarMutations } from "@/features/calendar/hooks/useCalendarMutations";
import {
  useCalendarData,
  type CalendarHoliday as Holiday,
} from "@/features/calendar/hooks/useCalendarData";
import { downloadHolidaysExport } from "@/features/calendar/lib/holiday-export";
import {
  getFilteredMobileEvents,
  getMobileEventCounts,
  type MobileCalendarFilter,
} from "@/features/calendar/lib/mobile-calendar-events";

export function MobileCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { holidays, leaves, workModeDays, loading } =
    useCalendarData(currentDate);
  const [filter, setFilter] = useState<MobileCalendarFilter>("all");
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

  const handleExport = (exportFormat: "json" | "csv") => {
    void downloadHolidaysExport(getYear(currentDate), exportFormat);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const { refreshCalendarData, handleDayEventSubmit, handleWorkModeCancel } =
    useCalendarMutations(getYear(currentDate));

  const handleImport = async (importedHolidays: Holiday[]) => {
    if (importedHolidays.length > 0) {
      await refreshCalendarData();
    }
  };

  const { holidayCount, leaveCount, wfhCount, onsiteCount, totalMarkedDays } =
    getMobileEventCounts(days, holidays, leaves, workModeDays);
  const todayEvent = days.find((date) => isSameDay(date, new Date()));
  const filteredEvents = getFilteredMobileEvents(
    days,
    filter,
    holidays,
    leaves,
    workModeDays,
  );
  const filterOptions = [
    { value: "all" as const, label: "ทั้งหมด", count: totalMarkedDays },
    { value: "holidays" as const, label: "วันหยุด", count: holidayCount },
    { value: "leaves" as const, label: "วันลา", count: leaveCount },
    { value: "wfh" as const, label: "WFH", count: wfhCount },
    { value: "onsite" as const, label: "On Site", count: onsiteCount },
  ];

  const handleRequestLeave = (dateStr: string) => {
    setSelectedDate(dateStr);
    openModal("leave");
  };
  const handleRequestWorkMode = (dateStr: string) => {
    setSelectedDate(dateStr);
    openModal("wfh");
  };
  const handleCancelWorkMode = (dateStr: string) => {
    void handleWorkModeCancel(dateStr);
  };

  return (
    <div id="mobile-calendar-page" className="bg-background min-h-screen pb-28">
      <MobileCalendarHeader
        currentDate={currentDate}
        onPrevMonth={() => navigateMonth("prev")}
        onNextMonth={() => navigateMonth("next")}
      />

      <main
        id="mobile-calendar-main"
        className="space-y-4 px-4 py-4"
        aria-label="รายการวันหยุดและวันลา"
      >
        <MobileCalendarOverview
          currentDate={currentDate}
          holidayCount={holidayCount}
          leaveCount={leaveCount}
          wfhCount={wfhCount}
          onsiteCount={onsiteCount}
          todayEvent={todayEvent}
        />

        <MobileCalendarFilters
          filter={filter}
          filterOptions={filterOptions}
          onFilterChange={setFilter}
        />

        {loading ? (
          <MobileCalendarLoadingState />
        ) : filteredEvents.length === 0 ? (
          <MobileCalendarEmptyState filter={filter} />
        ) : (
          <MobileEventList
            events={filteredEvents}
            onRequestLeave={handleRequestLeave}
            onRequestWorkMode={handleRequestWorkMode}
            onCancelWorkMode={handleCancelWorkMode}
          />
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
