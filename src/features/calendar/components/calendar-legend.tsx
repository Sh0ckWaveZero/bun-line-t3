export function CalendarLegend() {
  return (
    <div
      id="calendar-legend"
      className="mb-3 flex flex-wrap gap-4 text-xs font-medium"
    >
      <span id="calendar-legend-holiday" className="flex items-center gap-1.5">
        <span className="bg-destructive/80 h-2 w-2 rounded-full" />
        <span className="text-muted-foreground">วันหยุดราชการ</span>
      </span>
      <span id="calendar-legend-leave" className="flex items-center gap-1.5">
        <span className="bg-primary h-2 w-2 rounded-full" />
        <span className="text-muted-foreground">วันลางาน</span>
      </span>
    </div>
  );
}
