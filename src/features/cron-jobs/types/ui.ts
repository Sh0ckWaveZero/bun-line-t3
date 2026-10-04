import type { JobEnvironment } from "@/features/cron-jobs/types/index";

export type JobFilter = "all" | "healthy" | "failing" | "paused";

export type EnvironmentFilter = "all" | JobEnvironment;

export type DisplayMode = "comfortable" | "compact";

export interface CronJobNotice {
  type: "success" | "error";
  message: string;
}
