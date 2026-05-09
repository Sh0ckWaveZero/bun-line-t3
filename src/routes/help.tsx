import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth/route-guard";
import { HelpPage } from "@/features/help/pages/HelpPage";

export const Route = createFileRoute("/help")({
  beforeLoad: requireAuth,
  component: HelpPage,
});
