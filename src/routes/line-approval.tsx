import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth/route-guard";
import { LineApprovalPage } from "@/features/line/pages/LineApprovalPage";

export const Route = createFileRoute("/line-approval")({
  beforeLoad: requireAuth,
  component: LineApprovalPage,
});
