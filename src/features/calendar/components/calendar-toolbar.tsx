import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarToolbarProps {
  selectedMonth: number;
  selectedYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export function CalendarToolbar({
  selectedMonth,
  selectedYear,
  onPrevMonth,
  onNextMonth,
  onMonthChange,
  onYearChange,
}: CalendarToolbarProps) {
  const monthOptions = Array.from({ length: 12 }, (_, month) => ({
    value: month,
    label: format(new Date(selectedYear, month, 1), "MMMM", { locale: th }),
  }));
  const yearOptions = Array.from(
    { length: 11 },
    (_, index) => selectedYear - 5 + index,
  );

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
        onClick={onPrevMonth}
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
        onClick={onNextMonth}
        aria-label="เดือนถัดไป"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
