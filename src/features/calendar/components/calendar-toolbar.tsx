import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CalendarMonthOption } from "@/features/calendar/helpers/calendar-grid";

interface CalendarToolbarProps {
  selectedMonth: number;
  selectedYear: number;
  monthOptions: CalendarMonthOption[];
  yearOptions: number[];
  onNavigateMonth: (direction: "prev" | "next") => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export function CalendarToolbar({
  selectedMonth,
  selectedYear,
  monthOptions,
  yearOptions,
  onNavigateMonth,
  onMonthChange,
  onYearChange,
}: CalendarToolbarProps) {
  return (
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
        onClick={() => onNavigateMonth("prev")}
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
          onChange={(event) => onMonthChange(Number(event.target.value))}
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
          onChange={(event) => onYearChange(Number(event.target.value))}
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
        onClick={() => onNavigateMonth("next")}
        aria-label="เดือนถัดไป"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
