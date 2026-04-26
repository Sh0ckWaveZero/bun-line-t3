import { createFileRoute } from "@tanstack/react-router";
import { MobileCalendarPage } from "@/features/calendar/pages";

export const Route = createFileRoute("/calendar/mobile")({
  component: MobileCalendarPage,
});
