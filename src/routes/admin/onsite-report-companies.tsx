import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/auth/route-guard";
import { OnsiteReportCompaniesPage } from "@/features/onsite-report/pages/OnsiteReportCompaniesPage";

export const Route = createFileRoute("/admin/onsite-report-companies")({
  beforeLoad: requireAdmin,
  component: OnsiteReportCompaniesPage,
});
