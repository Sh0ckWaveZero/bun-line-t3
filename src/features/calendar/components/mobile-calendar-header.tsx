import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileCalendarHeaderProps {
  currentDate: Date;
  buddhistYear: number;
  onNavigateMonth: (direction: "prev" | "next") => void;
}

export function MobileCalendarHeader({
  currentDate,
  buddhistYear,
  onNavigateMonth,
}: MobileCalendarHeaderProps) {
  return (
    <header
      id="mobile-calendar-header"
      className="border-border bg-background/90 sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-md"
    >
      <nav
        id="mobile-calendar-nav"
        className="flex items-center justify-between gap-4"
        aria-label="Calendar navigation"
      >
        <Button
          id="mobile-calendar-prev"
          onClick={() => onNavigateMonth("prev")}
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="เดือนก่อนหน้า"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div id="mobile-calendar-title" className="flex-1 text-center">
          <h1
            id="mobile-calendar-month-year"
            className="text-foreground text-base leading-tight font-bold"
            aria-live="polite"
            aria-atomic="true"
          >
            {format(currentDate, "MMMM yyyy", { locale: th })}
          </h1>
          <p
            id="mobile-calendar-buddhist-year"
            className="text-muted-foreground mt-0.5 text-xs font-medium"
            aria-live="polite"
          >
            พ.ศ. {buddhistYear}
          </p>
        </div>

        <Button
          id="mobile-calendar-next"
          onClick={() => onNavigateMonth("next")}
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="เดือนถัดไป"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    </header>
  );
}
