import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { DayPicker } from "react-day-picker";
export type MonthPickerProps = {
  className?: string;
  selected?: Date;
  onSelect?: (date: Date) => void;
  id?: string;
  locale?: {
    localize: {
      month: (n: number) => string;
    };
  };
};

function MonthPicker({
  className,
  selected,
  onSelect,
  id,
  locale,
}: MonthPickerProps) {
  const [currentYear, setCurrentYear] = React.useState(
    selected ? selected.getFullYear() : new Date().getFullYear(),
  );

  // Thai months
  const getMonthName = (monthIndex: number): string => {
    if (locale?.localize?.month) {
      return locale.localize.month(monthIndex);
    }
    const months = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];
    return months[monthIndex] || `เดือนที่ ${monthIndex + 1}`;
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentYear, monthIndex, 1);
    onSelect?.(newDate);
  };

  const navigateYear = (direction: "prev" | "next") => {
    setCurrentYear((prev) => (direction === "prev" ? prev - 1 : prev + 1));
  };

  const isMonthSelected = (monthIndex: number): boolean => {
    if (!selected) return false;
    return (
      selected.getFullYear() === currentYear &&
      selected.getMonth() === monthIndex
    );
  };

  const buddhistYear = currentYear + 543;

  return (
    <div id={id} className={cn("w-full max-w-sm p-4", className)}>
      {/* Year Navigation */}
      <div 
        id={id ? `${id}-year-nav` : undefined}
        className="mb-4 flex items-center justify-between"
      >
        <button
          id={id ? `${id}-prev-year` : undefined}
          onClick={() => navigateYear("prev")}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <h2 
          id={id ? `${id}-year-display` : undefined}
          className="text-lg font-semibold"
        >
          ปี {buddhistYear}
        </h2>

        <button
          id={id ? `${id}-next-year` : undefined}
          onClick={() => navigateYear("next")}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Month Grid */}
      <div 
        id={id ? `${id}-month-grid` : undefined}
        className="grid grid-cols-3 gap-2"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <button
            key={i}
            id={id ? `${id}-month-${i}` : undefined}
            onClick={() => handleMonthSelect(i)}
            className={cn(
              "rounded-md border p-3 text-sm transition-colors",
              isMonthSelected(i)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            )}
          >
            {getMonthName(i)}
          </button>
        ))}
      </div>
    </div>
  );
}

// Keep the original Calendar for backward compatibility
export type CalendarProps = React.ComponentProps<
  typeof import("react-day-picker").DayPicker
>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      mode="single"
      classNames={{
        today: `border-amber-500`,
        selected: `bg-amber-500 border-amber-500 text-white`,
        ...classNames,
      }}
      timeZone="Asia/Bangkok"
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";
MonthPicker.displayName = "MonthPicker";

export { Calendar, MonthPicker };
