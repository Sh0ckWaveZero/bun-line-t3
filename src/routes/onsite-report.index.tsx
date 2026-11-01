import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth/route-guard";
import { OnsiteReportListPage } from "@/features/onsite-report/pages/OnsiteReportListPage";

export const Route = createFileRoute("/onsite-report/")({
  beforeLoad: requireAuth,
  component: OnsiteReportListPage,
});
