import { createFileRoute } from "@tanstack/react-router";
import { PendingApprovalPage } from "@/features/auth/pages";

export const Route = createFileRoute("/pending-approval")({
  component: PendingApprovalPage,
});
