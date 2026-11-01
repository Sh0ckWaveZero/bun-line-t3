import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth/route-guard";
import { OnsiteReportFormPage } from "@/features/onsite-report/pages/OnsiteReportFormPage";

export const Route = createFileRoute("/onsite-report/$id/edit")({
  beforeLoad: requireAuth,
  component: OnsiteReportFormPage,
});
