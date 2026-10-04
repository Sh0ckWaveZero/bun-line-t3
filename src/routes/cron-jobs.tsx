import { createFileRoute } from "@tanstack/react-router";
import { CronJobsPage } from "@/features/cron-jobs/pages";
import { requireAdmin } from "@/lib/auth/route-guard";

export const Route = createFileRoute("/cron-jobs")({
  beforeLoad: requireAdmin,
  component: CronJobsPage,
});
