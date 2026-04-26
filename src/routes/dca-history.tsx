import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth/route-guard";
import { DcaHistoryPage } from "@/features/dca/pages/DcaHistoryPage";

export const Route = createFileRoute("/dca-history")({
  beforeLoad: requireAuth,
  component: DcaHistoryPage,
});
