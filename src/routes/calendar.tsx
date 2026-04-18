import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getYear, getMonth } from "date-fns";
import { th } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Download, Upload, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HolidayImport } from "@/components/calendar/holiday-import";

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
  const [showHolidaysOnly, setShowHolidaysOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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
  const days = getDaysInMonth();
  const firstDayOfWeek = days[0].getDay(); // 0 = Sunday

  const weekDays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  const handleImport = async (importedHolidays: Holiday[]) => {
    setHolidays((prev) => {
      const existing = new Set(prev.map(h => h.date));
      const newHolidays = importedHolidays.filter(h => !existing.has(h.date));
      return [...prev, ...newHolidays];
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 dark:text-gray-100">ปฏิทินวันหยุดและวันลา</h1>
        <p className="text-muted-foreground dark:text-gray-400">
          ดูวันหยุดราชการและวันลางานในปฏิทิน
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Button onClick={() => navigateMonth("prev")} variant="outline">
          <ChevronLeft className="h-4 w-4 mr-2" />
          เดือนก่อนหน้า
        </Button>

        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 dark:text-gray-300" />
          <h2 className="text-xl font-semibold dark:text-gray-100">
            {format(currentDate, "MMMM yyyy", { locale: th })} ({buddhistYear})
          </h2>
        </div>

        <Button onClick={() => navigateMonth("next")} variant="outline">
          เดือนถัดไป
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>

        <div className="flex gap-2 ml-auto">
          <Button
            onClick={() => setShowImportModal(true)}
            variant="outline"
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            onClick={() => handleExport("json")}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button
            onClick={() => handleExport("csv")}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>วันหยุดราชการ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>วันลางาน</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span>วันหยุด + วันลา</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-700">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground dark:text-gray-400">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* Week day headers */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm p-2 bg-muted rounded dark:bg-gray-800 dark:text-gray-200"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2"></div>
            ))}

            {/* Days of the month */}
            {days.map((date) => {
              const holiday = getHolidayForDate(date);
              const leave = getLeaveForDate(date);
              const isToday = isSameDay(date, new Date());

              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "min-h-24 p-2 border rounded-lg transition-colors hover:bg-accent",
                    "dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800",
                    isToday && "border-primary border-2 dark:border-primary",
                    holiday && "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900",
                    leave && "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900",
                    holiday && leave && "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-900",
                  )}
                >
                  <div className="font-semibold text-sm mb-1 dark:text-gray-100">
                    {format(date, "d")}
                  </div>

                  {holiday && (
                    <div className="text-xs bg-red-500 text-white p-1 rounded mb-1 dark:bg-red-700 dark:text-red-100">
                      <div className="font-semibold">{holiday.nameThai}</div>
                      {holiday.type !== "national" && (
                        <div className="text-xs opacity-80 dark:opacity-90">({holiday.type})</div>
                      )}
                    </div>
                  )}

                  {leave && (
                    <div className="text-xs bg-blue-500 text-white p-1 rounded dark:bg-blue-700 dark:text-blue-100">
                      <div className="font-semibold">วันลา</div>
                      <div className="text-xs opacity-80 dark:opacity-90">
                        {leave.type === "personal" && "ลากิจ"}
                        {leave.type === "sick" && "ลาป่วย"}
                        {leave.type === "vacation" && "ลาพักผ่อน"}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-700">
          <h3 className="font-semibold mb-2 dark:text-gray-100">สถิติเดือนนี้</h3>
          <div className="space-y-2 text-sm dark:text-gray-300">
            <div className="flex justify-between">
              <span>วันหยุดราชการ:</span>
              <span className="font-semibold">{holidays.length} วัน</span>
            </div>
            <div className="flex justify-between">
              <span>วันลางาน:</span>
              <span className="font-semibold">{leaves.length} วัน</span>
            </div>
            <div className="flex justify-between">
              <span>วันทำงาน (โดยประมาณ):</span>
              <span className="font-semibold">
                {days.length - holidays.length - leaves.length} วัน
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 dark:bg-gray-900 dark:border-gray-700">
          <h3 className="font-semibold mb-2 dark:text-gray-100">วันหยุดทั้งหมดในปี {buddhistYear}</h3>
          <div className="text-sm dark:text-gray-300">
            <div className="flex justify-between">
              <span>วันหยุดราชการ:</span>
              <span className="font-semibold">
                {holidays.filter((h) => h.year === getYear(currentDate)).length}{" "}
                วัน
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 dark:bg-gray-900 dark:border-gray-700">
          <h3 className="font-semibold mb-2 dark:text-gray-100">จัดการวันหยุด</h3>
          <p className="text-xs text-muted-foreground mb-2 dark:text-gray-400">
            Admin เท่านั้นที่สามารถเพิ่ม/แก้ไขวันหยุดได้
          </p>
          <div className="space-y-2">
            <Button size="sm" variant="outline" className="w-full" onClick={() => setShowImportModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              นำเข้าวันหยุด
            </Button>
            <Button size="sm" variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มวันหยุด (Admin)
            </Button>
          </div>
        </Card>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <HolidayImport
          onImport={handleImport}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
}

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});
