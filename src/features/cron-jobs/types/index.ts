export type JobStatus = "healthy" | "failing" | "paused";

export type CronHttpMethod = "GET" | "POST";

export type RunStatus =
  "succeeded" | "failed" | "timed-out" | "skipped" | "pending" | "unknown";

export type JobEnvironment = "production" | "staging" | "development";

export type TargetKind =
  | "attendance"
  | "webhook"
  | "database"
  | "search"
  | "notifications"
  | "payments"
  | "fraud"
  | "reports"
  | "storage"
  | "sync"
  | "security";

export interface CronJobTarget {
  name: string;
  environment: JobEnvironment;
  kind: TargetKind;
}

export interface CronJobOwner {
  name: string;
  initials: string;
  color: string;
}

export interface CronJobLastRun {
  status: RunStatus;
  relative: string;
  duration: string;
}

export interface CronJobNextRun {
  relative: string;
  at: string;
  iso?: string;
}

export interface CronJob {
  id: string;
  key: string;
  name: string;
  command: string;
  method: CronHttpMethod;
  endpoint: string;
  scheduleLabel: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  lastRun: CronJobLastRun;
  runHistory: RunStatus[];
  nextRun: CronJobNextRun;
  target: CronJobTarget;
  owner: CronJobOwner;
}

export interface CronJobDataSource {
  scheduler: "container-cron";
  timezone: string;
  storage: "postgresql";
  readOnly: boolean;
  generatedAt: string;
}

export interface CronJobsSnapshot {
  jobs: CronJob[];
  source: CronJobDataSource;
}
