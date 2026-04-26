import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/auth/route-guard";
import { MonitoringDashboardPage } from "@/features/monitoring/pages/MonitoringDashboardPage";

export const Route = createFileRoute("/monitoring")({
  beforeLoad: requireAdmin,
  component: MonitoringDashboardPage,
});
