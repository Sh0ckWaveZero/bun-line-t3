import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getYear, getMonth, isSameDay } from "date-fns";
import { th } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Download, Upload, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

function MobileCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "holidays" | "leaves">("all");

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
        const leavesRes = await fetch(`/api/leave?month=${year}-${month.toString().padStart(2, "0")}`);
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
      const response = await fetch(`/api/holidays?year=${year}&export=${format}`);
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

  const getFilteredEvents = () => {
    return days.map((date) => {
      const events = getEventsForDate(date);
      const hasEvent = events.holiday || events.leave;

      if (filter === "holidays" && !events.holiday) return null;
      if (filter === "leaves" && !events.leave) return null;
      if (filter === "all" && !hasEvent && !events.isToday) return null;

      return { date, ...events };
    }).filter(Boolean);
  };

  const filteredEvents = getFilteredEvents();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with Month Navigation */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <Button
            onClick={() => navigateMonth("prev")}
            variant="ghost"
            size="icon"
            className="h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-center">
            <h1 className="text-xl font-bold dark:text-gray-100">
              {format(currentDate, "MMMM yyyy", { locale: th })}
            </h1>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              พ.ศ. {buddhistYear}
            </p>
          </div>

          <Button
            onClick={() => navigateMonth("next")}
            variant="ghost"
            size="icon"
            className="h-10 w-10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-3 justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {holidays.length}
            </div>
            <div className="text-xs text-muted-foreground dark:text-gray-400">
              วันหยุด
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">
              {leaves.length}
            </div>
            <div className="text-xs text-muted-foreground dark:text-gray-400">
              วันลา
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {days.length - holidays.length - leaves.length}
            </div>
            <div className="text-xs text-muted-foreground dark:text-gray-400">
              วันทำงาน
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="sticky top-[140px] z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2">
        <div className="flex gap-2 overflow-x-auto">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="flex-shrink-0"
          >
            ทั้งหมด
          </Button>
          <Button
            size="sm"
            variant={filter === "holidays" ? "default" : "outline"}
            onClick={() => setFilter("holidays")}
            className="flex-shrink-0"
          >
            🎉 วันหยุด
          </Button>
          <Button
            size="sm"
            variant={filter === "leaves" ? "default" : "outline"}
            onClick={() => setFilter("leaves")}
            className="flex-shrink-0"
          >
            🏖️ วันลา
          </Button>
        </div>
      </div>

      {/* Events List - Card Layout */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground dark:text-gray-400">
              กำลังโหลด...
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="p-6 text-center dark:bg-gray-900 dark:border-gray-700">
            <p className="text-muted-foreground dark:text-gray-400">
              {filter === "all"
                ? "ไม่มีวันหยุดหรือวันลาในเดือนนี้"
                : filter === "holidays"
                ? "ไม่มีวันหยุดในเดือนนี้"
                : "ไม่มีวันลาในเดือนนี้"}
            </p>
          </Card>
        ) : (
          filteredEvents.map((event: any) => {
            if (!event) return null;

            const { date, holiday, leave, isToday } = event;
            const dayOfWeek = format(date, "EEEE", { locale: th });

            return (
              <Card
                key={date.toISOString()}
                className={cn(
                  "overflow-hidden transition-all hover:shadow-lg",
                  "dark:bg-gray-900 dark:border-gray-700",
                  isToday && "ring-2 ring-primary ring-offset-2",
                )}
              >
                {/* Date Header */}
                <div
                  className={cn(
                    "px-4 py-3 font-semibold text-white",
                    holiday && !leave
                      ? "bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800"
                      : "",
                    leave && !holiday
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800"
                      : "",
                    holiday && leave
                      ? "bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-800"
                      : "bg-gradient-to-r from-gray-500 to-gray-600 dark:from-gray-700 dark:to-gray-800",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg">
                        {format(date, "d MMMM", { locale: th })}
                      </div>
                      <div className="text-sm opacity-90">{dayOfWeek}</div>
                    </div>
                    {isToday && (
                      <div className="px-2 py-1 bg-white/20 rounded-full text-xs">
                        วันนี้
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 py-3 space-y-3">
                  {/* Holiday Info */}
                  {holiday && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <span className="text-lg">🎉</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold dark:text-gray-100">
                          {holiday.nameThai}
                        </div>
                        <div className="text-sm text-muted-foreground dark:text-gray-400">
                          {holiday.nameEnglish}
                        </div>
                        {holiday.type !== "national" && (
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded">
                              {holiday.type}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Leave Info */}
                  {leave && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-lg">🏖️</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold dark:text-gray-100">
                          {leave.type === "personal" && "ลากิจ"}
                          {leave.type === "sick" && "ลาป่วย"}
                          {leave.type === "vacation" && "ลาพักผ่อน"}
                          {!["personal", "sick", "vacation"].includes(
                            leave.type,
                          ) && leave.type}
                        </div>
                        {leave.reason && (
                          <div className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                            {leave.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => {
            const year = getYear(currentDate);
            window.open(`/api/holidays?year=${year}&export=json`, "_blank");
          }}
        >
          <Download className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/calendar/mobile")({
  component: MobileCalendarPage,
});
