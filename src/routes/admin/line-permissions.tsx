import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/auth/route-guard";
import { LinePermissionsPage } from "@/features/line/pages/LinePermissionsPage";

export const Route = createFileRoute("/admin/line-permissions")({
  beforeLoad: requireAdmin,
  component: LinePermissionsPage,
});
