import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
} from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Upload,
  Plus,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HolidayImport } from "@/components/calendar/holiday-import";
import { LeaveRequestModal } from "@/components/calendar/leave-request-modal";
import { HolidayManageModal } from "@/components/calendar/holiday-manage-modal";

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

function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);

  // Fetch holidays and leaves for current month
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const year = getYear(currentDate);
      const month = getMonth(currentDate) + 1;

      try {
        // Fetch holidays
        const holidaysRes = await fetch(`/api/holidays?year=${year}`);
        if (holidaysRes.ok) {
          const holidaysData = await holidaysRes.json();
          if (holidaysData.success) {
            setHolidays(holidaysData.holidays);
          }
        }

        // Fetch leaves
        const leavesRes = await fetch(
          `/api/leave?month=${year}-${month.toString().padStart(2, "0")}`,
        );
        if (leavesRes.ok) {
          const leavesData = await leavesRes.json();
          if (leavesData.success) {
            setLeaves(leavesData.leaves);
          }
        }
      } catch (error) {
        // Error fetching calendar data
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

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getHolidayForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return holidays.find((h) => h.date === dateStr);
  };

  const getLeaveForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return leaves.find((l) => l.date === dateStr);
  };

  const buddhistYear = getYear(currentDate) + 543;
  const days = getDaysInMonth();
  const firstDayOfWeek = days[0]?.getDay() ?? 0; // 0 = Sunday
  const calendarRowCount = Math.ceil((firstDayOfWeek + days.length) / 7);
  const trailingCellCount = calendarRowCount * 7 - firstDayOfWeek - days.length;
  const holidayCount = days.filter((date) => getHolidayForDate(date)).length;
  const leaveCount = days.filter((date) => getLeaveForDate(date)).length;
  const workingDayCount = days.length - holidayCount - leaveCount;

  const weekDays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
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
        // Refresh leaves for current month
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
        alert("✅ แจ้งลาสำเร็จ!");
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (err: any) {
      alert(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const handleHolidayAdd = async (data: any) => {
    try {
      const response = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh holidays for current year
        const year = getYear(currentDate);
        const holidaysRes = await fetch(`/api/holidays?year=${year}`);
        if (holidaysRes.ok) {
          const holidaysData = await holidaysRes.json();
          if (holidaysData.success) {
            setHolidays(holidaysData.holidays);
          }
        }
        alert("✅ เพิ่มวันหยุดสำเร็จ!");
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (err: any) {
      alert(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowLeaveModal(true);
  };

  return (
    <div
      id="calendar-page"
      className="bg-background text-foreground h-[calc(100svh-3.5rem)] overflow-hidden sm:h-auto sm:min-h-screen sm:overflow-visible"
    >
      <main
        id="calendar-main"
        className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden px-2 py-2 sm:block sm:h-auto sm:min-h-screen sm:overflow-visible sm:px-5 sm:py-5 lg:px-6 lg:py-8"
      >
        <section
          id="calendar-hero"
          className="mb-2 grid gap-3 sm:mb-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
        >
          <div id="calendar-heading">
            <p
              id="calendar-eyebrow"
              className="text-primary mb-1 text-[10px] font-semibold tracking-[0.18em] uppercase sm:mb-2 sm:text-xs"
            >
              Team Calendar
            </p>
            <h1
              id="calendar-title"
              className="text-3xl leading-none font-black tracking-tight sm:text-6xl lg:text-7xl"
            >
              {format(currentDate, "MMMM", { locale: th })}
            </h1>
            <p
              id="calendar-subtitle"
              className="text-muted-foreground mt-1 text-xs font-medium sm:mt-3 sm:text-base"
            >
              {format(currentDate, "yyyy", { locale: th })} · พ.ศ.{" "}
              {buddhistYear}
            </p>
          </div>

          <div
            id="calendar-summary-cards"
            className="hidden grid-cols-3 gap-2 sm:grid sm:w-auto sm:min-w-[360px]"
          >
            <Card
              id="calendar-summary-holidays"
              className="border-border bg-card rounded-lg p-3 shadow-none"
            >
              <p className="text-muted-foreground text-xs font-medium">
                วันหยุด
              </p>
              <p className="text-destructive mt-1 text-2xl font-black">
                {holidayCount}
              </p>
            </Card>
            <Card
              id="calendar-summary-leaves"
              className="border-border bg-card rounded-lg p-3 shadow-none"
            >
              <p className="text-muted-foreground text-xs font-medium">วันลา</p>
              <p className="text-primary mt-1 text-2xl font-black">
                {leaveCount}
              </p>
            </Card>
            <Card
              id="calendar-summary-workdays"
              className="border-border bg-card rounded-lg p-3 shadow-none"
            >
              <p className="text-muted-foreground text-xs font-medium">
                วันทำงาน
              </p>
              <p className="text-foreground mt-1 text-2xl font-black">
                {workingDayCount}
              </p>
            </Card>
          </div>
        </section>

        <section
          id="calendar-toolbar"
          className="border-border bg-card mb-2 grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 rounded-lg border p-2 shadow-sm sm:mb-4 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center sm:p-3"
        >
          <Button
            id="calendar-prev-month"
            onClick={() => navigateMonth("prev")}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            ก่อน
          </Button>

          <div
            id="calendar-month-picker"
            className="bg-muted flex min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2"
          >
            <CalendarIcon className="text-muted-foreground hidden h-5 w-5 shrink-0 sm:block" />
            <label htmlFor="calendar-month-select" className="sr-only">
              เลือกเดือน
            </label>
            <select
              id="calendar-month-select"
              value={selectedMonth}
              onChange={(event) =>
                handleMonthChange(Number(event.target.value))
              }
              className="text-foreground focus-visible:ring-ring min-w-0 flex-1 cursor-pointer appearance-none bg-transparent text-center text-sm font-bold outline-none focus-visible:ring-2 sm:text-lg"
              aria-label="เลือกเดือน"
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <label htmlFor="calendar-year-select" className="sr-only">
              เลือกปี
            </label>
            <select
              id="calendar-year-select"
              value={selectedYear}
              onChange={(event) => handleYearChange(Number(event.target.value))}
              className="text-foreground focus-visible:ring-ring cursor-pointer appearance-none bg-transparent text-center text-sm font-bold outline-none focus-visible:ring-2 sm:text-lg"
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
            onClick={() => navigateMonth("next")}
            variant="outline"
            size="sm"
          >
            ถัด
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>

          <div
            id="calendar-action-buttons"
            className="col-span-3 flex justify-end sm:col-span-1"
          >
            <Button
              id="calendar-request-leave"
              onClick={() => setShowLeaveModal(true)}
              variant="default"
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-full px-3 text-xs sm:h-9 sm:w-auto"
              aria-label="แจ้งลา"
            >
              <Plus className="mr-2 h-4 w-4" />
              แจ้งลา
            </Button>
          </div>
        </section>

        <section
          id="calendar-legend"
          className="mb-4 hidden flex-wrap gap-2 text-xs sm:flex sm:text-sm"
        >
          <div
            id="calendar-legend-holiday"
            className="border-border bg-card flex items-center gap-2 rounded-lg border px-3 py-2"
          >
            <div className="bg-destructive h-3 w-3 rounded-full"></div>
            <span>วันหยุดราชการ</span>
          </div>
          <div
            id="calendar-legend-leave"
            className="border-border bg-card flex items-center gap-2 rounded-lg border px-3 py-2"
          >
            <div className="bg-primary h-3 w-3 rounded-full"></div>
            <span>วันลางาน</span>
          </div>
          <div
            id="calendar-legend-mixed"
            className="border-border bg-card flex items-center gap-2 rounded-lg border px-3 py-2"
          >
            <div className="bg-accent h-3 w-3 rounded-full"></div>
            <span>วันหยุด + วันลา</span>
          </div>
        </section>

        <Card
          id="calendar-grid-card"
          className="border-border bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg p-0 shadow-sm sm:block sm:flex-none"
        >
          {loading ? (
            <div id="calendar-loading" className="py-16 text-center">
              <div className="border-primary inline-block h-8 w-8 animate-spin rounded-full border-b-2"></div>
              <p className="text-muted-foreground mt-2 dark:text-gray-400">
                กำลังโหลดข้อมูล...
              </p>
            </div>
          ) : (
            <div
              id="calendar-grid-wrapper"
              className="flex min-h-0 flex-1 flex-col"
            >
              <div
                id="calendar-grid-inner"
                className="flex min-h-0 flex-1 flex-col"
              >
                <div
                  id="calendar-weekdays"
                  className="border-border grid shrink-0 grid-cols-7 border-b"
                >
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      id={`calendar-weekday-${day}`}
                      className="text-muted-foreground px-1 py-2 text-center text-[11px] font-black tracking-[0.08em] uppercase sm:px-3 sm:py-3 sm:text-sm"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div
                  id="calendar-days-grid"
                  className="grid min-h-0 flex-1 grid-cols-7 sm:min-h-0"
                  style={{
                    gridTemplateRows: `repeat(${calendarRowCount}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      id={`calendar-empty-cell-${i}`}
                      className="border-border bg-muted/35 h-full min-h-0 border-b sm:h-32 lg:h-36"
                    ></div>
                  ))}

                  {days.map((date) => {
                    const holiday = getHolidayForDate(date);
                    const leave = getLeaveForDate(date);
                    const isToday = isSameDay(date, new Date());

                    return (
                      <button
                        key={date.toISOString()}
                        id={`calendar-day-${format(date, "yyyy-MM-dd")}`}
                        type="button"
                        className={cn(
                          "border-border bg-card group h-full min-h-0 cursor-pointer border-b p-1 text-left transition-colors sm:h-32 sm:p-2 lg:h-36",
                          "focus-visible:ring-ring flex flex-col overflow-hidden focus-visible:ring-2 focus-visible:outline-none",
                          !isToday && "hover:bg-muted/40",
                          isToday && "bg-primary/5",
                        )}
                        onClick={() => handleDayClick(date)}
                        aria-label={`วันที่ ${format(date, "d MMMM yyyy", { locale: th })}`}
                      >
                        <div className="mb-1 flex shrink-0 items-center justify-between sm:mb-2">
                          <span
                            id={`calendar-day-number-${format(date, "yyyy-MM-dd")}`}
                            className={cn(
                              "text-foreground flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none font-black",
                              "sm:h-8 sm:w-8 sm:text-2xl lg:h-9 lg:w-9 lg:text-3xl",
                              isToday &&
                                "border-primary bg-primary/10 text-primary ring-primary/25 border shadow-none ring-4",
                            )}
                          >
                            {format(date, "d")}
                          </span>
                        </div>

                        <div className="min-h-0 flex-1 space-y-1 overflow-hidden">
                          {holiday && (
                            <div
                              id={`calendar-holiday-${format(date, "yyyy-MM-dd")}`}
                              className="bg-destructive/15 text-destructive flex min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold sm:gap-1.5 sm:px-2 sm:py-1 sm:text-xs"
                              title={`${holiday.nameThai}${holiday.type !== "national" ? ` (${holiday.type})` : ""}`}
                            >
                              <span className="bg-destructive text-destructive-foreground flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] sm:h-4 sm:w-4 sm:text-[10px]">
                                ★
                              </span>
                              <span className="min-w-0 truncate">
                                {holiday.nameThai}
                                {holiday.type !== "national" &&
                                  ` (${holiday.type})`}
                              </span>
                            </div>
                          )}

                          {leave && (
                            <div
                              id={`calendar-leave-${format(date, "yyyy-MM-dd")}`}
                              className="bg-primary/15 text-primary flex min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold sm:gap-1.5 sm:px-2 sm:py-1 sm:text-xs"
                              title={`วันลา ${leave.type}`}
                            >
                              <span className="border-primary h-3.5 w-3.5 shrink-0 rounded-full border-2 sm:h-4 sm:w-4"></span>
                              <span className="min-w-0 truncate">
                                วันลา {leave.type === "personal" && "ลากิจ"}
                                {leave.type === "sick" && "ลาป่วย"}
                                {leave.type === "vacation" && "ลาพักผ่อน"}
                                {!["personal", "sick", "vacation"].includes(
                                  leave.type,
                                ) && leave.type}
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
                      className="border-border bg-muted/35 h-full min-h-0 border-b sm:h-32 lg:h-36"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        <section
          id="calendar-statistics"
          className="mt-5 hidden grid-cols-1 gap-4 sm:grid md:grid-cols-3"
        >
          <Card
            id="calendar-stat-month"
            className="border-border bg-card rounded-lg p-4 shadow-sm"
          >
            <h3 className="mb-2 font-semibold dark:text-gray-100">
              สถิติเดือนนี้
            </h3>
            <div className="space-y-2 text-sm dark:text-gray-300">
              <div className="flex justify-between">
                <span>วันหยุดราชการ:</span>
                <span className="font-semibold">{holidayCount} วัน</span>
              </div>
              <div className="flex justify-between">
                <span>วันลางาน:</span>
                <span className="font-semibold">{leaveCount} วัน</span>
              </div>
              <div className="flex justify-between">
                <span>วันทำงาน (โดยประมาณ):</span>
                <span className="font-semibold">{workingDayCount} วัน</span>
              </div>
            </div>
          </Card>

          <Card
            id="calendar-stat-year"
            className="border-border bg-card rounded-lg p-4 shadow-sm"
          >
            <h3 className="mb-2 font-semibold dark:text-gray-100">
              วันหยุดทั้งหมดในปี {buddhistYear}
            </h3>
            <div className="text-sm dark:text-gray-300">
              <div className="flex justify-between">
                <span>วันหยุดราชการ:</span>
                <span className="font-semibold">
                  {
                    holidays.filter((h) => h.year === getYear(currentDate))
                      .length
                  }{" "}
                  วัน
                </span>
              </div>
            </div>
          </Card>

          <Card
            id="calendar-manage-holidays-card"
            className="border-border bg-card rounded-lg p-4 shadow-sm"
          >
            <h3 className="mb-2 font-semibold dark:text-gray-100">
              จัดการวันหยุด
            </h3>
            <p className="text-muted-foreground mb-3 text-xs dark:text-gray-400">
              Admin เท่านั้นที่สามารถจัดการวันหยุดได้
            </p>
            <div className="space-y-2">
              <Button
                id="calendar-import-holidays-secondary"
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setShowImportModal(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                นำเข้าวันหยุด
              </Button>
              <Button
                id="calendar-add-holiday-secondary"
                size="sm"
                variant="default"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full"
                onClick={() => setShowHolidayModal(true)}
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                เพิ่มวันหยุดใหม่
              </Button>
            </div>
          </Card>
        </section>
      </main>

      {/* Import Modal */}
      {showImportModal && (
        <div id="calendar-import-modal-wrapper">
          <HolidayImport
            onImport={handleImport}
            onClose={() => setShowImportModal(false)}
          />
        </div>
      )}

      {/* Leave Request Modal */}
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

      {/* Holiday Management Modal */}
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

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});
