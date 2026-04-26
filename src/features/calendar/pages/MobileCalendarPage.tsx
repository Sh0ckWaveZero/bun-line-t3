"use client";

import { useState, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getYear,
  getMonth,
  isSameDay,
} from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Download,
  Plus,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

interface CalendarEvent {
  date: Date;
  holiday: Holiday | undefined;
  leave: Leave | undefined;
  isToday: boolean;
}

export function MobileCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "holidays" | "leaves">("all");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
        console.error("Error fetching calendar data:", error);
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

  const handleExport = async (format: "json" | "csv") => {
    const year = getYear(currentDate);
    try {
      const response = await fetch(
        `/api/holidays?year=${year}&export=${format}`,
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `holidays-${year}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting holidays:", error);
    }
  };

  const buddhistYear = getYear(currentDate) + 543;
  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  // Combine holidays and leaves into daily events
  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const holiday = holidays.find((h) => h.date === dateStr);
    const leave = leaves.find((l) => l.date === dateStr);
    return { holiday, leave, isToday: isSameDay(date, new Date()) };
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

  const getFilteredEvents = () => {
    return days
      .map((date) => {
        const events = getEventsForDate(date);
        const hasEvent = events.holiday || events.leave;

        if (filter === "holidays" && !events.holiday) return null;
        if (filter === "leaves" && !events.leave) return null;
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
  const totalMarkedDays = days.filter((date) => {
    const events = getEventsForDate(date);
    return events.holiday || events.leave || events.isToday;
  }).length;
  const todayEvent = days.find((date) => isSameDay(date, new Date()));
  const filterOptions = [
    { value: "all", label: "ทั้งหมด", count: totalMarkedDays },
    { value: "holidays", label: "วันหยุด", count: holidayCount },
    { value: "leaves", label: "วันลา", count: leaveCount },
  ] as const;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef6f1_42%,#fff7ed_100%)] pb-28 text-slate-950 dark:bg-[linear-gradient(180deg,#07130f_0%,#101827_54%,#17130d_100%)] dark:text-slate-50">
      <header
        id="calendar-header"
        className="sticky top-0 z-10 border-b border-white/60 bg-white/85 px-4 pt-3 pb-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80"
      >
        <nav
          className="flex items-center justify-between gap-4"
          aria-label="Calendar navigation"
        >
          <Button
            id="prev-month-btn"
            onClick={() => navigateMonth("prev")}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg border border-slate-200 bg-white/80 shadow-sm hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            aria-label="เดือนก่อนหน้า"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1 text-center">
            <h1
              id="current-month-display"
              className="text-lg leading-tight font-bold text-slate-950 dark:text-slate-50"
              aria-live="polite"
              aria-atomic="true"
            >
              {format(currentDate, "MMMM yyyy", { locale: th })}
            </h1>
            <p
              id="buddhist-year-display"
              className="mt-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
              aria-live="polite"
            >
              พ.ศ. {buddhistYear}
            </p>
          </div>

          <Button
            id="next-month-btn"
            onClick={() => navigateMonth("next")}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg border border-slate-200 bg-white/80 shadow-sm hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            aria-label="เดือนถัดไป"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </nav>
      </header>

      <main
        id="events-list"
        className="space-y-5 px-4 py-5"
        role="main"
        aria-label="รายการวันหยุดและวันลา"
      >
        <section
          className="overflow-hidden rounded-lg border border-white/70 bg-white/90 shadow-lg shadow-emerald-900/5 dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/20"
          aria-label="ภาพรวมเดือน"
        >
          <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#0f766e_0%,#16a34a_52%,#f59e0b_100%)] p-4 text-white dark:border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-white/75 uppercase">
                  ปฏิทินทีม
                </p>
                <h2 className="mt-2 text-2xl leading-tight font-black">
                  {format(currentDate, "MMMM", { locale: th })}
                </h2>
                <p className="mt-1 text-sm font-medium text-white/85">
                  วันหยุด {holidayCount} วัน · วันลา {leaveCount} วัน
                </p>
              </div>
              <div className="rounded-lg border border-white/25 bg-white/15 px-3 py-2 text-center backdrop-blur">
                <CalendarIcon className="mx-auto h-5 w-5" aria-hidden="true" />
                <p className="mt-1 text-xs font-semibold">พ.ศ.</p>
                <p className="text-lg leading-none font-black">
                  {buddhistYear}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800">
            <div className="px-3 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                วันนี้
              </p>
              <p className="mt-1 truncate text-sm font-bold text-slate-950 dark:text-slate-50">
                {todayEvent
                  ? format(todayEvent, "d MMM", { locale: th })
                  : "นอกเดือนนี้"}
              </p>
            </div>
            <div className="px-3 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                วันหยุด
              </p>
              <p className="mt-1 text-sm font-bold text-rose-700 dark:text-rose-300">
                {holidayCount} รายการ
              </p>
            </div>
            <div className="px-3 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                วันลา
              </p>
              <p className="mt-1 text-sm font-bold text-sky-700 dark:text-sky-300">
                {leaveCount} รายการ
              </p>
            </div>
          </div>
        </section>

        <section
          aria-label="ตัวกรองรายการ"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={cn(
                "min-h-10 shrink-0 rounded-lg border px-4 text-sm font-bold transition-colors",
                filter === option.value
                  ? "border-emerald-700 bg-emerald-700 text-white shadow-md shadow-emerald-900/15 dark:border-emerald-400 dark:bg-emerald-400 dark:text-slate-950"
                  : "border-slate-200 bg-white/85 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800",
              )}
              aria-pressed={filter === option.value}
            >
              {option.label}
              <span className="ml-2 rounded-md bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/15">
                {option.count}
              </span>
            </button>
          ))}
        </section>

        {loading ? (
          <div
            id="loading-indicator"
            className="rounded-lg border border-white/70 bg-white/85 py-12 text-center shadow-sm dark:border-white/10 dark:bg-slate-900/85"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div
              className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-b-emerald-700 dark:border-emerald-900 dark:border-b-emerald-300"
              aria-hidden="true"
            ></div>
            <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              กำลังโหลด...
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card
            id="no-events-message"
            className="border-dashed border-slate-300 bg-white/85 p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/85"
            role="status"
            aria-live="polite"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-2xl dark:bg-emerald-950/40">
              <CalendarIcon
                className="h-7 w-7 text-emerald-700 dark:text-emerald-300"
                aria-hidden="true"
              />
            </div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">
              {filter === "all"
                ? "ไม่มีวันหยุดหรือวันลาในเดือนนี้"
                : filter === "holidays"
                  ? "ไม่มีวันหยุดในเดือนนี้"
                  : "ไม่มีวันลาในเดือนนี้"}
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              ลองเปลี่ยนตัวกรองหรือเพิ่มรายการใหม่
            </p>
          </Card>
        ) : (
          <ul
            id="events-list-ul"
            className="space-y-3"
            role="list"
            aria-label="รายการวันที่และเหตุการณ์"
          >
            {filteredEvents.map((event) => {
              if (!event) return null;

              const { date, holiday, leave, isToday } = event;
              const dayOfWeek = format(date, "EEEE", { locale: th });
              const dateStr = format(date, "yyyy-MM-dd");
              const isMixed = holiday && leave;

              return (
                <li
                  key={date.toISOString()}
                  id={`event-${dateStr}`}
                  className={cn(
                    "overflow-hidden rounded-lg border bg-white/92 shadow-sm transition-transform duration-200 active:scale-[0.99] dark:bg-slate-900/90",
                    holiday &&
                      !leave &&
                      "border-rose-200 dark:border-rose-900/70",
                    leave &&
                      !holiday &&
                      "border-sky-200 dark:border-sky-900/70",
                    isMixed && "border-amber-300 dark:border-amber-800",
                    isToday &&
                      "ring-2 ring-emerald-600 ring-offset-2 ring-offset-transparent dark:ring-emerald-300",
                  )}
                  role="listitem"
                  aria-label={`${dayOfWeek}ที่ ${format(date, "d")} ${format(date, "MMMM", { locale: th })}`}
                >
                  <div
                    id={`event-header-${dateStr}`}
                    className={cn(
                      "flex items-center justify-between gap-3 border-b px-4 py-3 dark:border-slate-800",
                      holiday && !leave && "bg-rose-50/90 dark:bg-rose-950/25",
                      leave && !holiday && "bg-sky-50/90 dark:bg-sky-950/25",
                      isMixed && "bg-amber-50/90 dark:bg-amber-950/25",
                      !holiday && !leave && "bg-slate-50 dark:bg-slate-800/60",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="min-w-12 text-center" aria-hidden="true">
                        <p className="text-3xl leading-none font-black text-slate-950 dark:text-slate-50">
                          {format(date, "d")}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500 uppercase dark:text-slate-400">
                          {format(date, "MMM", { locale: th })}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p
                          id={`day-name-${dateStr}`}
                          className="truncate text-base font-extrabold text-slate-950 dark:text-slate-50"
                        >
                          {dayOfWeek}
                        </p>
                        <p
                          id={`full-date-${dateStr}`}
                          className="text-xs font-medium text-slate-500 dark:text-slate-400"
                        >
                          {format(date, "MMMM yyyy", { locale: th })}
                        </p>
                      </div>
                    </div>

                    {isToday && (
                      <span
                        id="today-indicator"
                        className="shrink-0 rounded-md border border-emerald-700/20 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-950 dark:text-emerald-200"
                        aria-label="วันนี้"
                      >
                        วันนี้
                      </span>
                    )}
                  </div>

                  <div
                    id={`event-content-${dateStr}`}
                    className="space-y-3 p-4"
                    role="group"
                    aria-label="ข้อมูลเหตุการณ์"
                  >
                    {holiday && (
                      <div
                        id={`holiday-${dateStr}`}
                        className="flex items-start gap-3"
                        role="group"
                        aria-label={`วันหยุด: ${holiday.nameThai}`}
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200"
                          aria-hidden="true"
                        >
                          <CalendarIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            id={`holiday-name-th-${dateStr}`}
                            className="text-base font-bold text-slate-950 dark:text-slate-50"
                          >
                            {holiday.nameThai}
                          </div>
                          <div
                            id={`holiday-name-en-${dateStr}`}
                            className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400"
                          >
                            {holiday.nameEnglish}
                          </div>
                        </div>
                      </div>
                    )}

                    {leave && (
                      <div
                        id={`leave-${dateStr}`}
                        className="flex items-start gap-3"
                        role="group"
                        aria-label={`วันลา: ${leave.type === "personal" ? "ลากิจ" : leave.type === "sick" ? "ลาป่วย" : "ลาพักผ่อน"}`}
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200"
                          aria-hidden="true"
                        >
                          <Plus className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            id={`leave-type-${dateStr}`}
                            className="text-base font-bold text-slate-950 dark:text-slate-50"
                          >
                            {leave.type === "personal" && "ลากิจ"}
                            {leave.type === "sick" && "ลาป่วย"}
                            {leave.type === "vacation" && "ลาพักผ่อน"}
                            {!["personal", "sick", "vacation"].includes(
                              leave.type,
                            ) && leave.type}
                          </div>
                          {leave.reason && (
                            <div
                              id={`leave-reason-${dateStr}`}
                              className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400"
                            >
                              {leave.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      className="mt-1 h-10 w-full rounded-lg border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setShowLeaveModal(true);
                      }}
                    >
                      แจ้งลาวันนี้
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <nav
        id="fab-buttons"
        className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 gap-2 rounded-lg border border-white/70 bg-white/92 p-2 shadow-2xl shadow-slate-900/15 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90"
        role="navigation"
        aria-label="ปุ่มดำเนินการด่วน"
      >
        <Button
          id="request-leave-fab"
          size="sm"
          className="h-12 rounded-lg bg-sky-700 text-xs font-bold hover:bg-sky-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
          onClick={() => {
            setSelectedDate(null);
            setShowLeaveModal(true);
          }}
          aria-label="แจ้งลางาน"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          ลางาน
        </Button>
        <Button
          id="add-holiday-fab"
          size="sm"
          className="h-12 rounded-lg bg-rose-700 text-xs font-bold hover:bg-rose-800 dark:bg-rose-500 dark:text-slate-950 dark:hover:bg-rose-400"
          onClick={() => {
            setSelectedDate(null);
            setShowHolidayModal(true);
          }}
          aria-label="เพิ่มวันหยุด"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          วันหยุด
        </Button>
        <Button
          id="export-holidays-fab"
          size="sm"
          className="h-12 rounded-lg bg-emerald-700 text-xs font-bold hover:bg-emerald-800 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300"
          onClick={() => handleExport("json")}
          aria-label="ส่งออกข้อมูลวันหยุด"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          ส่งออก
        </Button>
      </nav>

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div id="leave-request-modal-wrapper">
          <LeaveRequestModal
            isOpen={showLeaveModal}
            onClose={() => setShowLeaveModal(false)}
            onSubmit={handleLeaveRequest}
            selectedDate={selectedDate || undefined}
          />
        </div>
      )}

      {/* Holiday Management Modal */}
      {showHolidayModal && (
        <div id="holiday-manage-modal-wrapper">
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
