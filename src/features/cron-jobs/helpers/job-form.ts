import type { CronJobMutationInput } from "@/features/cron-jobs/hooks/useCronJobs";
import type { CronJob } from "@/features/cron-jobs/types";

const EMPTY_CRON_JOB_FORM: CronJobMutationInput = {
  key: "new-cron-job",
  name: "งานใหม่",
  method: "GET",
  endpoint: "/api/cron/new-job",
  cronExpression: "*/5 * * * *",
  scheduleLabel: "ทุก 5 นาที",
  timezone: "Asia/Bangkok",
  environment: "production",
  targetName: "Application endpoint",
  targetKind: "security",
  ownerName: "ทีมระบบ",
  ownerInitials: "SYS",
  ownerColor: "#0f9f72",
  enabled: true,
};

export function jobToForm(job: CronJob | null): CronJobMutationInput {
  if (!job) return EMPTY_CRON_JOB_FORM;

  return {
    key: job.key,
    name: job.name,
    method: job.method,
    endpoint: job.endpoint,
    cronExpression: job.cronExpression,
    scheduleLabel: job.scheduleLabel,
    timezone: job.timezone,
    environment: job.target.environment,
    targetName: job.target.name,
    targetKind: job.target.kind,
    ownerName: job.owner.name,
    ownerInitials: job.owner.initials,
    ownerColor: job.owner.color,
    enabled: job.enabled,
  };
}
