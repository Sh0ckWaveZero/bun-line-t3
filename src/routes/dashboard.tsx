import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth/route-guard";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAuth,
  component: DashboardPage,
});
