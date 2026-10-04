import { cn } from "@/lib/utils";
import type { CalendarFilter } from "@/features/calendar/helpers/mobile-calendar-events";

export interface MobileCalendarFilterOption {
  value: CalendarFilter;
  label: string;
  count: number;
}

interface MobileCalendarFiltersProps {
  filter: CalendarFilter;
  options: MobileCalendarFilterOption[];
  onFilterChange: (filter: CalendarFilter) => void;
}

export function MobileCalendarFilters({
  filter,
  options,
  onFilterChange,
}: MobileCalendarFiltersProps) {
  return (
    <section
      id="mobile-calendar-filters"
      aria-label="ตัวกรองรายการ"
      className="flex gap-2 overflow-x-auto pb-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          id={`mobile-calendar-filter-${option.value}`}
          type="button"
          onClick={() => onFilterChange(option.value)}
          className={cn(
            "min-h-9 shrink-0 rounded-md border px-3 text-xs font-bold transition-colors",
            filter === option.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-muted/50",
          )}
          aria-pressed={filter === option.value}
        >
          {option.label}
          <span
            className={cn(
              "ml-1.5 rounded px-1 py-px text-[10px]",
              filter === option.value
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {option.count}
          </span>
        </button>
      ))}
    </section>
  );
}
