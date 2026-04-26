import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth/route-guard";
import { CalendarPage } from "@/features/calendar/pages/CalendarPage";

export const Route = createFileRoute("/calendar")({
  beforeLoad: requireAuth,
  component: CalendarPage,
});
