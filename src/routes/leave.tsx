import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth/route-guard";
import { LeavePage } from "@/features/leave/pages/LeavePage";

export const Route = createFileRoute("/leave")({
  beforeLoad: requireAuth,
  component: LeavePage,
});
