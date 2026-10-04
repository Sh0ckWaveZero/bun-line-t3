import { MobileEventCard } from "@/features/calendar/components/mobile-event-card";
import type { CalendarEvent } from "@/features/calendar/helpers/mobile-calendar-events";

interface MobileEventListProps {
  events: CalendarEvent[];
  onRequestLeave: (dateKey: string) => void;
}

export function MobileEventList({
  events,
  onRequestLeave,
}: MobileEventListProps) {
  return (
    <ul
      id="mobile-calendar-events-list"
      className="space-y-2.5"
      role="list"
      aria-label="รายการวันที่และเหตุการณ์"
    >
      {events.map((event) => {
        if (!event) return null;

        return (
          <MobileEventCard
            key={event.date.toISOString()}
            event={event}
            onRequestLeave={onRequestLeave}
          />
        );
      })}
    </ul>
  );
}
