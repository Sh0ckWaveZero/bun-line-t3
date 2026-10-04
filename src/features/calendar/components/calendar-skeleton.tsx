import { WEEKDAYS } from "@/features/calendar/constants/calendar";

export function CalendarSkeletonGrid() {
  return (
    <div id="calendar-skeleton" className="flex flex-col">
      <div className="border-border grid grid-cols-7 border-b">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-muted-foreground px-3 py-3 text-center text-xs font-semibold tracking-widest uppercase"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="border-border flex h-28 flex-col gap-2 border-b p-2 lg:h-32"
          >
            <div className="bg-muted h-5 w-5 animate-pulse rounded-md" />
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
