import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth/route-guard";
import { AttendanceReportPage } from "@/features/attendance/pages/AttendanceReportPage";

export const Route = createFileRoute("/attendance-report")({
  beforeLoad: requireAuth,
  component: AttendanceReportPage,
});
